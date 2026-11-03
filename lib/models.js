import mongoose from "mongoose";

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
    logo: { type: String, default: "" }
  },
  { timestamps: true }
);
export const User =
  mongoose.models.SavdochiUser || mongoose.model("SavdochiUser", UserSchema);

const ProductSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SavdochiUser",
      required: true,
      index: true
    },
    supplier: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true, min: 1 },
    unit: { type: String, required: true },
    stock: { type: Number, required: true, min: 0 },
    minOrder: { type: Number, default: 1, min: 1 },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    active: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);
export const Product =
  mongoose.models.SavdochiProduct || mongoose.model("SavdochiProduct", ProductSchema);

const OrderSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SavdochiUser",
      required: true,
      index: true
    },
    buyerName: String,
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SavdochiUser",
      required: true,
      index: true
    },
    supplier: String,
    requestId: { type: String, required: true },
    phone: String,
    address: String,
    note: String,
    paymentMethod: {
      type: String,
      enum: ["cash", "bank", "credit"],
      default: "cash"
    },
    deliveryMethod: {
      type: String,
      enum: ["delivery", "pickup"],
      default: "delivery"
    },
    deliveryDate: { type: String, default: "" },
    timeline: [
      {
        _id: false,
        status: String,
        at: Date,
        by: String
      }
    ],
    items: [
      {
        _id: false,
        productId: mongoose.Schema.Types.ObjectId,
        name: String,
        unit: String,
        price: Number,
        quantity: Number
      }
    ],
    total: Number,
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending"
    }
  },
  { timestamps: true }
);
OrderSchema.index({ buyer: 1, requestId: 1, seller: 1 }, { unique: true });
export const Order =
  mongoose.models.SavdochiOrder || mongoose.model("SavdochiOrder", OrderSchema);

const NotificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SavdochiUser",
      required: true,
      index: true
    },
    type: { type: String, default: "info" },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    link: { type: String, default: "" },
    readAt: { type: Date, default: null }
  },
  { timestamps: true }
);
NotificationSchema.index({ user: 1, readAt: 1, createdAt: -1 });
export const Notification =
  mongoose.models.SavdochiNotification ||
  mongoose.model("SavdochiNotification", NotificationSchema);
