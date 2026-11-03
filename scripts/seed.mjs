#!/usr/bin/env node
/**
 * Savdochi — demo ma'lumotlar (seed).
 *
 * Ishlatish:
 *   npm run seed          # mavjud demo yozuvlarni yangilaydi, yetishmaganini qo'shadi
 *   npm run seed:reset    # faqat demo yozuvlarni o'chirib, boshidan yaratadi
 *
 * MONGODB_URI `.env.local`, `.env` yoki muhit o'zgaruvchisidan olinadi.
 * Skript faqat quyidagi demo hisoblarga tegadi:
 *   seller1@savdochi.uz, seller2@savdochi.uz, buyer@savdochi.uz
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const RESET = process.argv.includes("--reset");
const PASSWORD = process.env.SEED_PASSWORD || "Savdochi123!";
const PASSWORD_ROUNDS = 12;

/* -------------------------------------------------------------------------
 * 1. Muhit
 * ---------------------------------------------------------------------- */

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    let value = rawValue.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

const root = process.cwd();
loadEnvFile(path.join(root, ".env.local"));
loadEnvFile(path.join(root, ".env"));

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error(
    "\n✖ MONGODB_URI topilmadi.\n" +
      "  `.env.local` yoki `.env` fayliga qo'shing:\n" +
      "  MONGODB_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/savdochi\n",
  );
  process.exit(1);
}

/** Logga parol tushmasligi uchun URI'ni niqoblaymiz. */
function maskUri(value) {
  return value.replace(/\/\/([^@/]+)@/, (_, credentials) => {
    const user = credentials.split(":")[0];
    return `//${user}:***@`;
  });
}

/* -------------------------------------------------------------------------
 * 2. Modellar (lib/models.js bilan bir xil kolleksiyalar)
 * ---------------------------------------------------------------------- */

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["buyer", "seller"], required: true },
    company: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    inn: { type: String, default: "", trim: true },
    about: { type: String, default: "", trim: true },
    logo: { type: String, default: "" },
  },
  { timestamps: true },
);
const User = mongoose.models.SavdochiUser || mongoose.model("SavdochiUser", UserSchema);

const ProductSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "SavdochiUser", required: true, index: true },
    supplier: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true, min: 1 },
    unit: { type: String, required: true },
    stock: { type: Number, required: true, min: 0 },
    minOrder: { type: Number, default: 1, min: 1 },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);
const Product =
  mongoose.models.SavdochiProduct || mongoose.model("SavdochiProduct", ProductSchema);

const OrderSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "SavdochiUser", required: true, index: true },
    buyerName: String,
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "SavdochiUser", required: true, index: true },
    supplier: String,
    requestId: { type: String, required: true },
    phone: String,
    address: String,
    note: String,
    paymentMethod: {
      type: String,
      enum: ["cash", "bank", "credit"],
      default: "cash",
    },
    deliveryMethod: {
      type: String,
      enum: ["delivery", "pickup"],
      default: "delivery",
    },
    deliveryDate: { type: String, default: "" },
    timeline: [
      {
        _id: false,
        status: String,
        at: Date,
        by: String,
      },
    ],
    items: [
      {
        _id: false,
        productId: mongoose.Schema.Types.ObjectId,
        name: String,
        unit: String,
        price: Number,
        quantity: Number,
      },
    ],
    total: Number,
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true },
);
OrderSchema.index({ buyer: 1, requestId: 1, seller: 1 }, { unique: true });
const Order = mongoose.models.SavdochiOrder || mongoose.model("SavdochiOrder", OrderSchema);

const NotificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SavdochiUser",
      required: true,
      index: true,
    },
    type: { type: String, default: "info" },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    link: { type: String, default: "" },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);
NotificationSchema.index({ user: 1, readAt: 1, createdAt: -1 });
const Notification =
  mongoose.models.SavdochiNotification ||
  mongoose.model("SavdochiNotification", NotificationSchema);

/* -------------------------------------------------------------------------
 * 3. Demo ma'lumotlar
 * ---------------------------------------------------------------------- */

const DEMO_ACCOUNTS = {
  seller1: {
    name: "Alfa Savdo",
    email: "seller1@savdochi.uz",
    role: "seller",
    company: "Alfa Savdo MChJ",
    phone: "+998 71 200 11 22",
    address: "Toshkent sh., Sergeli tumani, 4-mavze, 18-uy",
    inn: "301234567",
    about:
      "Oziq-ovqat va qurilish materiallari ulgurji savdosi. Ombordan yetkazib berish, naqd va bank o'tkazmasi.",
    logo: "/brand/alfa.png",
  },
  seller2: {
    name: "Baraka Optom",
    email: "seller2@savdochi.uz",
    role: "seller",
    company: "Baraka Optom MChJ",
    phone: "+998 90 555 44 33",
    address: "Toshkent sh., Yakkasaroy tumani, Shota Rustaveli 45",
    inn: "302345678",
    about:
      "Ichimliklar, maishiy kimyo va elektronika ulgurji savdosi. Shahar bo'ylab tezkor yetkazib berish.",
    logo: "/brand/baraka.png",
  },
  buyer: {
    name: "Demo Do'kon",
    email: "buyer@savdochi.uz",
    role: "buyer",
    company: "Demo Do'kon",
    phone: "+998 90 123 45 67",
    address: "Toshkent sh., Chilonzor 9-mavze, 12-uy",
    inn: "",
    about: "Demo xaridor hisobi.",
    logo: "/brand/demo.png",
  },
};

const DEMO_EMAILS = Object.values(DEMO_ACCOUNTS).map((account) => account.email);

/**
 * stock — bazadagi "sotuv uchun mavjud qoldiq". Quyida berilgan buyurtmalar
 * hisobga olinib, skript oxirida avtomatik kamaytiriladi.
 */
const PRODUCTS = [
  {
    seller: "seller1",
    name: "Guruch Lazer, 25 kg",
    category: "Oziq-ovqat",
    price: 285000,
    unit: "25 kg qop",
    stock: 120,
    minOrder: 2,
    description: "Oliy navli lazer guruch. Qop 25 kg, donasi yirik va toza.",
  },
  {
    seller: "seller1",
    name: "Un Oliy nav, 50 kg",
    category: "Oziq-ovqat",
    price: 320000,
    unit: "50 kg qop",
    stock: 80,
    minOrder: 1,
    description: "Tegirmon un, oqligi yuqori. Nonvoyxonalar uchun mos.",
  },
  {
    seller: "seller1",
    name: "Paxta yog'i, 5 l",
    category: "Oziq-ovqat",
    price: 95000,
    unit: "5 l",
    stock: 200,
    minOrder: 6,
    description: "Tozalangan paxta yog'i, 5 litrlik idishda.",
  },
  {
    seller: "seller1",
    name: "Shakar, 50 kg",
    category: "Oziq-ovqat",
    price: 610000,
    unit: "50 kg qop",
    stock: 40,
    minOrder: 1,
    description: "Oq kristall shakar, qandolat sexlari uchun.",
  },
  {
    seller: "seller1",
    name: "Makaron Yalla, 400 g",
    category: "Oziq-ovqat",
    price: 8500,
    unit: "400 g",
    stock: 1500,
    minOrder: 20,
    description: "Yuqori navli makaron, 24 dona karobkada.",
  },
  {
    seller: "seller1",
    name: "Choy Ahmad, 100 paket",
    category: "Oziq-ovqat",
    price: 42000,
    unit: "100 paket",
    stock: 300,
    minOrder: 5,
    description: "Qora choy, ingichka pishirilgan, 100 ta paket.",
  },
  {
    seller: "seller2",
    name: "Coca-Cola, 1.5 l",
    category: "Ichimliklar",
    price: 12500,
    unit: "1.5 l",
    stock: 600,
    minOrder: 12,
    description: "Gazlangan ichimlik, 1.5 litr, 6 dona paketda.",
  },
  {
    seller: "seller2",
    name: "Suv Hydrolife, 19 l",
    category: "Ichimliklar",
    price: 18000,
    unit: "19 l",
    stock: 150,
    minOrder: 10,
    description: "Ichimlik suvi, qaytariladigan 19 litrlik ballon.",
  },
  {
    seller: "seller2",
    name: "Energetik Flash, 0.5 l",
    category: "Ichimliklar",
    price: 9500,
    unit: "0.5 l",
    stock: 800,
    minOrder: 24,
    description: "Energetik ichimlik, 24 dona karobkada.",
  },
  {
    seller: "seller2",
    name: "Ariel, 3 kg",
    category: "Maishiy kimyo",
    price: 78000,
    unit: "3 kg",
    stock: 90,
    minOrder: 4,
    description: "Avtomat kir yuvish kukuni, 3 kg.",
  },
  {
    seller: "seller2",
    name: "Fairy, 900 ml",
    category: "Maishiy kimyo",
    price: 32000,
    unit: "900 ml",
    stock: 120,
    minOrder: 6,
    description: "Idish yuvish vositasi, limon hidi.",
  },
  {
    seller: "seller2",
    name: "Sovun Dove, 100 g",
    category: "Maishiy kimyo",
    price: 11000,
    unit: "100 g",
    stock: 500,
    minOrder: 20,
    description: "Namlovchi sovun, 100 gramm.",
  },
  {
    seller: "seller1",
    name: "Sement M400, 50 kg",
    category: "Qurilish materiallari",
    price: 62000,
    unit: "50 kg qop",
    stock: 200,
    minOrder: 20,
    description: "Portlandsement M400, qurilish uchun.",
  },
  {
    seller: "seller1",
    name: "Gipsokarton 1.2 x 2.5 m",
    category: "Qurilish materiallari",
    price: 85000,
    unit: "dona",
    stock: 70,
    minOrder: 10,
    description: "Standart gipsokarton list, 12.5 mm.",
  },
  {
    seller: "seller1",
    name: "Bo'yoq oq, 15 l",
    category: "Qurilish materiallari",
    price: 190000,
    unit: "15 l",
    stock: 45,
    minOrder: 2,
    description: "Suv asosidagi oq bo'yoq, ichki ishlar uchun.",
  },
  {
    seller: "seller1",
    name: "Kabel VVG 3x2.5",
    category: "Qurilish materiallari",
    price: 14500,
    unit: "metr",
    stock: 2000,
    minOrder: 50,
    description: "Mis kabel, 3x2.5 mm, metr bilan sotiladi.",
  },
  {
    seller: "seller2",
    name: "Smartfon Redmi 15, 128 GB",
    category: "Elektronika",
    price: 2150000,
    unit: "dona",
    stock: 25,
    minOrder: 1,
    description: "6.9\" displey, 128 GB xotira, 8 GB RAM.",
  },
  {
    seller: "seller2",
    name: "Quloqchin TWS AirBuds",
    category: "Elektronika",
    price: 320000,
    unit: "dona",
    stock: 60,
    minOrder: 2,
    description: "Simsiz quloqchin, keys bilan.",
  },
  {
    seller: "seller2",
    name: "Power bank 20000 mAh",
    category: "Elektronika",
    price: 245000,
    unit: "dona",
    stock: 80,
    minOrder: 3,
    description: "Tez quvvatlash, 2 ta USB chiqish.",
  },
  {
    seller: "seller2",
    name: "LED lampa 12W",
    category: "Elektronika",
    price: 18000,
    unit: "dona",
    stock: 400,
    minOrder: 10,
    description: "E27 sokol, 6500K sovuq oq yorug'lik.",
  },
];

/** Har bir demo mahsulot uchun `public/` ichidagi rasm. */
const PRODUCT_IMAGES = {
  "Guruch Lazer, 25 kg": "/products/guruch.png",
  "Un Oliy nav, 50 kg": "/products/un.png",
  "Paxta yog'i, 5 l": "/products/paxta-yogi.png",
  "Shakar, 50 kg": "/products/shakar.png",
  "Makaron Yalla, 400 g": "/products/makaron.png",
  "Choy Ahmad, 100 paket": "/products/choy.png",
  "Coca-Cola, 1.5 l": "/products/coca-cola.png",
  "Suv Hydrolife, 19 l": "/products/suv.png",
  "Energetik Flash, 0.5 l": "/products/energetik.png",
  "Ariel, 3 kg": "/products/ariel.png",
  "Fairy, 900 ml": "/products/fairy.png",
  "Sovun Dove, 100 g": "/products/sovun.png",
  "Sement M400, 50 kg": "/products/sement.png",
  "Gipsokarton 1.2 x 2.5 m": "/products/gipsokarton.png",
  "Bo'yoq oq, 15 l": "/products/boyoq.png",
  "Kabel VVG 3x2.5": "/products/kabel.png",
  "Smartfon Redmi 15, 128 GB": "/products/smartfon.png",
  "Quloqchin TWS AirBuds": "/products/quloqchin.png",
  "Power bank 20000 mAh": "/products/powerbank.png",
  "LED lampa 12W": "/products/led-lampa.png",
};

const ORDERS = [
  {
    key: "seed-order-0001",
    seller: "seller1",
    status: "pending",
    daysAgo: 0,
    note: "Ertaga 10:00 gacha yetkazib bering.",
    items: [
      ["Guruch Lazer, 25 kg", 3],
      ["Paxta yog'i, 5 l", 6],
    ],
  },
  {
    key: "seed-order-0002",
    seller: "seller2",
    status: "confirmed",
    daysAgo: 1,
    note: "",
    items: [
      ["Coca-Cola, 1.5 l", 24],
      ["Suv Hydrolife, 19 l", 10],
    ],
  },
  {
    key: "seed-order-0003",
    seller: "seller1",
    status: "shipped",
    daysAgo: 3,
    note: "Ombor eshigida tushirish kerak.",
    items: [["Sement M400, 50 kg", 20]],
  },
  {
    key: "seed-order-0004",
    seller: "seller2",
    status: "delivered",
    daysAgo: 9,
    note: "",
    items: [
      ["Ariel, 3 kg", 4],
      ["Fairy, 900 ml", 6],
    ],
  },
  {
    key: "seed-order-0005",
    seller: "seller1",
    status: "cancelled",
    daysAgo: 12,
    note: "Narx bo'yicha kelisha olmadik.",
    items: [["Choy Ahmad, 100 paket", 5]],
  },
  {
    key: "seed-order-0006",
    seller: "seller2",
    status: "delivered",
    daysAgo: 15,
    note: "Kuryer bilan bog'laning.",
    items: [["Smartfon Redmi 15, 128 GB", 1]],
  },
];

const ORDER_EXTRAS = {
  "seed-order-0001": { paymentMethod: "cash", deliveryMethod: "delivery" },
  "seed-order-0002": { paymentMethod: "bank", deliveryMethod: "delivery" },
  "seed-order-0003": { paymentMethod: "bank", deliveryMethod: "delivery" },
  "seed-order-0004": { paymentMethod: "cash", deliveryMethod: "pickup" },
  "seed-order-0005": { paymentMethod: "credit", deliveryMethod: "delivery" },
  "seed-order-0006": { paymentMethod: "bank", deliveryMethod: "delivery" },
};

const BUYER_CONTACT = {
  phone: "+998 90 123 45 67",
  address: "Toshkent sh., Chilonzor 9-mavze, 12-uy",
};

/* -------------------------------------------------------------------------
 * 4. Yordamchilar
 * ---------------------------------------------------------------------- */

const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

function money(value) {
  return new Intl.NumberFormat("uz-UZ").format(value) + " so'm";
}

function stockRequiredByName() {
  /** Har bir mahsulot uchun demo buyurtmalarda band qilingan miqdor. */
  const reserved = new Map();
  for (const order of ORDERS) {
    if (order.status === "cancelled") continue;
    for (const [name, quantity] of order.items) {
      reserved.set(name, (reserved.get(name) || 0) + quantity);
    }
  }
  return reserved;
}

/** Buyurtma holatiga mos tarix (timeline) yaratadi. */
function timelineFor(status, createdAt) {
  const flow =
    status === "cancelled"
      ? ["pending", "confirmed", "cancelled"]
      : ["pending", "confirmed", "shipped", "delivered"].slice(
          0,
          ["pending", "confirmed", "shipped", "delivered"].indexOf(status) + 1,
        );
  return flow.map((step, index) => ({
    status: step,
    at: new Date(new Date(createdAt).getTime() + index * 6 * 60 * 60 * 1000),
    by: step === "pending" || step === "cancelled" ? "buyer" : "seller",
  }));
}

/* -------------------------------------------------------------------------
 * 5. Asosiy oqim
 * ---------------------------------------------------------------------- */

async function main() {
  console.log(`\n→ MongoDB: ${maskUri(uri)}`);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log("→ Ulandi\n");

  await Promise.all([User.init(), Product.init(), Order.init(), Notification.init()]);

  if (RESET) {
    const demoUsers = await User.find({ email: { $in: DEMO_EMAILS } }).select("_id");
    const ids = demoUsers.map((user) => user._id);
    const removedOrders = await Order.deleteMany({ buyer: { $in: ids } });
    const removedProducts = await Product.deleteMany({ seller: { $in: ids } });
    const removedNotifications = await Notification.deleteMany({ user: { $in: ids } });
    const removedUsers = await User.deleteMany({ _id: { $in: ids } });
    console.log(
      `→ Reset: ${removedUsers.deletedCount} hisob, ` +
        `${removedProducts.deletedCount} mahsulot, ` +
        `${removedOrders.deletedCount} buyurtma, ` +
        `${removedNotifications.deletedCount} bildirishnoma o'chirildi\n`,
    );
  }

  /* 5.1 Hisoblar */
  const passwordHash = await bcrypt.hash(PASSWORD, PASSWORD_ROUNDS);
  const users = {};

  for (const [key, account] of Object.entries(DEMO_ACCOUNTS)) {
    const user = await User.findOneAndUpdate(
      { email: account.email },
      { $set: { ...account, passwordHash } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    users[key] = user;
  }
  console.log(`→ Hisoblar tayyor: ${Object.keys(users).length}`);

  /* 5.2 Mahsulotlar */
  const reserved = stockRequiredByName();
  const products = new Map();

  for (const item of PRODUCTS) {
    const seller = users[item.seller];
    const available = Math.max(0, item.stock - (reserved.get(item.name) || 0));

    const product = await Product.findOneAndUpdate(
      { seller: seller._id, name: item.name },
      {
        $set: {
          supplier: seller.company || seller.name,
          category: item.category,
          price: item.price,
          unit: item.unit,
          stock: available,
          minOrder: item.minOrder,
          description: item.description,
          image: PRODUCT_IMAGES[item.name] || "",
          active: true,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    products.set(item.name, product);
  }
  console.log(`→ Mahsulotlar tayyor: ${products.size}`);

  /* 5.3 Buyurtmalar */
  let createdOrders = 0;
  let existingOrders = 0;

  for (const order of ORDERS) {
    const seller = users[order.seller];
    const extras = ORDER_EXTRAS[order.key] || {};
    const createdAt = daysAgo(order.daysAgo);
    const timeline = timelineFor(order.status, createdAt);
    const supplier = seller.company || seller.name;
    const existing = await Order.findOne({
      buyer: users.buyer._id,
      requestId: order.key,
      seller: seller._id,
    });

    if (existing) {
      await Order.updateOne(
        { _id: existing._id },
        { $set: { ...extras, supplier, timeline } },
      );
      existingOrders += 1;
      continue;
    }

    const items = order.items.map(([name, quantity]) => {
      const product = products.get(name);
      if (!product) throw new Error(`Seed mahsuloti topilmadi: ${name}`);
      return {
        productId: product._id,
        name: product.name,
        unit: product.unit,
        price: product.price,
        quantity,
      };
    });

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const created = await Order.create({
      buyer: users.buyer._id,
      buyerName: users.buyer.name,
      seller: seller._id,
      supplier,
      requestId: order.key,
      ...BUYER_CONTACT,
      ...extras,
      deliveryDate: "",
      timeline,
      note: order.note,
      items,
      total,
      status: order.status,
    });

    // Demo tarix tabiiy ko'rinishi uchun yaratilgan sanani orqaga surib qo'yamiz.
    await Order.updateOne(
      { _id: created._id },
      { $set: { createdAt: daysAgo(order.daysAgo), updatedAt: daysAgo(order.daysAgo) } },
      { timestamps: false },
    );
    createdOrders += 1;
  }

  console.log(`→ Buyurtmalar: ${createdOrders} yangi, ${existingOrders} mavjud`);

  /* 5.4 Demo bildirishnomalar (takrorlanmaydi) */
  const demoNotifications = [
    {
      user: users.seller1._id,
      type: "order",
      title: "Yangi buyurtma #SV-DEMO-0001",
      body: "Demo Do'kon · Guruch va paxta yog'i",
      link: "/orders",
      readAt: null,
    },
    {
      user: users.seller1._id,
      type: "stock",
      title: "Kam qoldiq: Shakar, 50 kg",
      body: "Ombordagi qoldiq minimal buyurtma darajasiga yaqin.",
      link: "/seller",
      readAt: null,
    },
    {
      user: users.seller2._id,
      type: "order",
      title: "Buyurtma tasdiqlandi #SV-DEMO-0002",
      body: "Coca-Cola va suv buyurtmasi tasdiqlandi.",
      link: "/orders",
      readAt: null,
    },
    {
      user: users.buyer._id,
      type: "order",
      title: "Buyurtma #SV-DEMO-0004 yetkazildi",
      body: "Baraka Optom buyurtmani yetkazdi.",
      link: "/orders",
      readAt: daysAgo(1),
    },
  ];

  let addedNotifications = 0;
  for (const notification of demoNotifications) {
    const exists = await Notification.exists({
      user: notification.user,
      title: notification.title,
    });
    if (exists) continue;
    await Notification.create(notification);
    addedNotifications += 1;
  }
  console.log(`→ Bildirishnomalar: ${addedNotifications} yangi`);

  /* 5.4 Hisobot */
  const statusCounts = await Order.aggregate([
    { $match: { buyer: users.buyer._id } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  console.log("\n──────── Demo hisoblar ────────");
  for (const [key, account] of Object.entries(DEMO_ACCOUNTS)) {
    console.log(
      `${account.role.padEnd(6)} ${account.email.padEnd(24)} ${key === "buyer" ? "savat va buyurtma" : account.name}`,
    );
    console.log(`       parol: ${PASSWORD}`);
  }

  console.log("\n──────── Buyurtmalar holati ────────");
  for (const row of statusCounts) {
    console.log(`${row._id.padEnd(10)} ${row.count}`);
  }

  const totalStockValue = await Product.aggregate([
    { $match: { seller: { $in: [users.seller1._id, users.seller2._id] }, active: true } },
    { $group: { _id: null, value: { $sum: { $multiply: ["$price", "$stock"] } } } },
  ]);
  if (totalStockValue[0]) {
    console.log(`\nOmbor qiymati (demo): ${money(totalStockValue[0].value)}`);
  }

  console.log("\n✔ Seed muvaffaqiyatli yakunlandi.\n");
}

main()
  .catch((error) => {
    console.error("\n✖ Seed xatosi:", error.message);
    if (error.name === "MongooseServerSelectionError") {
      console.error("  MongoDB manzilini va tarmoq/Atlas ruxsatlarini tekshiring.");
    }
    if (error.code === 11000) {
      console.error("  Takroriy kalit: avval `npm run seed:reset` bilan urinib ko'ring.");
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
