
import { NextResponse } from 'next/server';
import { releaseExpired } from '@/lib/reservations';
import { Notification, Product } from '@/lib/models';
import {
  requireUser,
  checkOrigin,
  fail,
  productJSON,
  idCheck
} from '@/lib/api';
import { AppError, productInput } from '@/lib/commerce.mjs';

async function notifyLowStock(userId, product) {
  if (product.stock > product.minOrder) return;

  try {
    await Notification.create({
      user: userId,
      type: 'stock',
      title: `Kam qoldiq: ${product.name}`,
      body: `Qoldiq: ${product.stock} ${product.unit}. Minimal buyurtma: ${product.minOrder}.`,
      link: '/seller'
    });
  } catch (error) {
    console.error('stock-notification:', error.message);
  }
}

export async function PATCH(req, { params }) {
  try {
    checkOrigin(req);

    const user = await requireUser('seller');
    const { id } = await params;

    idCheck(id);

    const data = productInput(await req.json());

    await releaseExpired();

    const product = await Product.findOneAndUpdate(
      {
        _id: id,
        seller: user._id,
        active: true
      },
      {
        $set: data
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!product) {
      throw new AppError('Mahsulot topilmadi', 404);
    }

    await notifyLowStock(user._id, product);

    return NextResponse.json({
      product: productJSON(product)
    });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(req, { params }) {
  try {
    checkOrigin(req);

    const user = await requireUser('seller');
    const { id } = await params;

    idCheck(id);

    await releaseExpired();

    const product = await Product.findOneAndUpdate(
      {
        _id: id,
        seller: user._id,
        active: true
      },
      {
        $set: { active: false }
      },
      {
        new: true
      }
    );

    if (!product) {
      throw new AppError('Mahsulot topilmadi', 404);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
