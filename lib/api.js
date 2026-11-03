
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/lib/models';
import { AppError, orderNumber } from '@/lib/commerce.mjs';

export async function requireUser(role) {
  const session = verifySession(
    (await cookies()).get('savdochi_session')?.value
  );

  if (!session || !/^[a-f\d]{24}$/i.test(session.id)) {
    throw new AppError('Hisobingizga kiring', 401);
  }

  await connectDB();

  const user = await User.findById(session.id).select(
    'name email role company phone address inn about logo'
  );

  if (!user) throw new AppError('Hisobingizga kiring', 401);

  if (role && user.role !== role) {
    throw new AppError('Bu amal uchun ruxsat yo‘q', 403);
  }

  return user;
}

export function checkOrigin(req) {
  const origin = req.headers.get('origin');
  const host = req.headers.get('host');

  if (origin && new URL(origin).host !== host) {
    throw new AppError('So‘rov manbasi noto‘g‘ri', 403);
  }
}

export function idCheck(id) {
  if (!/^[a-f\d]{24}$/i.test(id)) {
    throw new AppError('Topilmadi', 404);
  }
}

export function fail(e) {
  if (e instanceof AppError) {
    return NextResponse.json(
      { message: e.message },
      { status: e.status }
    );
  }

  if (e instanceof SyntaxError) {
    return NextResponse.json(
      { message: 'So‘rov formati noto‘g‘ri' },
      { status: 400 }
    );
  }

  console.error(
    'commerce:',
    e.name,
    e.code || '',
    String(e.message || '')
      .replace(/mongodb(?:\+srv)?:\/\/[^\s]+/gi, '[database URI]')
      .slice(0, 700)
  );

  return NextResponse.json(
    { message: 'So‘rov bajarilmadi. Birozdan keyin qayta urinib ko‘ring.' },
    { status: 503 }
  );
}

function sellerProfile(seller) {
  if (!seller || typeof seller !== 'object' || !seller._id) {
    return null;
  }

  return {
    id: String(seller._id),
    name: seller.name || '',
    company: seller.company || '',
    phone: seller.phone || '',
    address: seller.address || '',
    about: seller.about || '',
    logo: seller.logo || '',
  };
}

export function productJSON(p) {
  const profile = sellerProfile(p.seller);

  return {
    id: String(p._id),
    sellerId: profile ? profile.id : String(p.seller),
    sellerProfile: profile,
    supplier: p.supplier,
    name: p.name,
    category: p.category,
    price: p.price,
    unit: p.unit,
    stock: p.stock,
    minOrder: p.minOrder,
    description: p.description,
    image: p.image || '',
  };
}

export function orderJSON(o) {
  const timeline = (o.timeline || []).map((x) => ({
    status: x.status,
    at: x.at,
    by: x.by || '',
  }));

  return {
    id: String(o._id),
    number: orderNumber(o),
    buyerId: String(o.buyer),
    sellerId: String(o.seller),
    supplier: o.supplier,
    buyerName: o.buyerName,
    phone: o.phone,
    address: o.address,
    note: o.note,
    paymentMethod: o.paymentMethod || 'cash',
    deliveryMethod: o.deliveryMethod || 'delivery',
    deliveryDate: o.deliveryDate || '',
    timeline: timeline.length
      ? timeline
      : [{ status: 'pending', at: o.createdAt, by: 'buyer' }],
    items: o.items.map((x) => ({
      productId: String(x.productId),
      name: x.name,
      unit: x.unit,
      price: x.price,
      quantity: x.quantity,
    })),
    total: o.total,
    status: o.status,
    createdAt: o.createdAt,
  };
}

export function profileJSON(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    company: user.company || '',
    phone: user.phone || '',
    address: user.address || '',
    inn: user.inn || '',
    about: user.about || '',
    logo: user.logo || '',
  };
}
