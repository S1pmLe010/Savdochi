
import { NextResponse } from 'next/server';
import {
  Product,
  Order,
  Reservation,
  User,
  Notification,
} from '@/lib/models';

import {
  requireUser,
  checkOrigin,
  fail,
  orderJSON,
} from '@/lib/api';

import {
  AppError,
  checkoutInput,
  orderNumber,
} from '@/lib/commerce.mjs';

import { releaseExpired } from '@/lib/reservations';
import { withOptionalTransaction } from '@/lib/transaction';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireUser();

    const orders = await Order.find(
      user.role === 'seller'
        ? { seller: user._id }
        : { buyer: user._id }
    )
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      orders: orders.map(orderJSON),
    });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req) {
  try {
    checkOrigin(req);

    const user = await requireUser('buyer');
    const data = checkoutInput(await req.json());

    await releaseExpired();

    await Promise.all([
      Order.init(),
      Product.init(),
      Reservation.init(),
    ]);

    const { value } = await withOptionalTransaction(async (session) => {
      const opts = session ? { session } : {};

      // Xaridor savatidagi o'zgarishlarni ketma-ketlashtirish.
      await User.updateOne(
        { _id: user._id },
        { $inc: { cartVersion: 1 } },
        opts
      );

      // Takroriy checkout so'rovini tekshirish.
      const existingQuery = Order.find({
        buyer: user._id,
        requestId: data.requestId,
      });

      if (session) existingQuery.session(session);

      const existing = await existingQuery;

      if (existing.length) {
        return {
          result: existing,
          created: false,
        };
      }

      const groups = new Map();

      // Savatdagi har bir mahsulot uchun amaldagi rezervni tekshirish.
      for (const item of data.items) {
        const holdQuery = Reservation.findOne({
          buyer: user._id,
          product: item.productId,
          quantity: item.quantity,
          expiresAt: { $gt: new Date() },
        });

        if (session) holdQuery.session(session);

        const hold = await holdQuery;

        if (!hold) {
          throw new AppError(
            'Savatdagi band qilish muddati tugagan yoki miqdor o‘zgargan. Savatni yangilang.',
            409
          );
        }

        const productQuery = Product.findOne({
          _id: item.productId,
          active: true,
          minOrder: { $lte: item.quantity },
        });

        if (session) productQuery.session(session);

        const product = await productQuery;

        if (!product) {
          throw new AppError(
            'Mahsulot mavjud emas yoki minimal miqdor bajarilmagan. Savatni yangilang.',
            409
          );
        }

        // Rezervni buyurtmaga o'tkazamiz.
        // Ombor qoldig'ini yana kamaytirmaymiz.
        await Reservation.deleteOne(
          { _id: hold._id },
          opts
        );

        const key = String(product.seller);

        if (!groups.has(key)) {
          groups.set(key, {
            buyer: user._id,
            buyerName: user.name,
            seller: product.seller,
            supplier: product.supplier,
            requestId: data.requestId,
            phone: data.phone,
            address: data.address,
            note: data.note,
            location: data.location || null,
            paymentMethod: data.paymentMethod,
            deliveryMethod: data.deliveryMethod,
            deliveryDate: data.deliveryDate,
            timeline: [
              {
                status: 'pending',
                at: new Date(),
                by: 'buyer',
              },
            ],
            items: [],
            total: 0,
          });
        }

        const group = groups.get(key);
        const total = product.price * item.quantity;

        if (
          !Number.isSafeInteger(total) ||
          !Number.isSafeInteger(group.total + total)
        ) {
          throw new AppError('Buyurtma summasi juda katta');
        }

        group.items.push({
          productId: product._id,
          name: product.name,
          unit: product.unit,
          price: product.price,
          quantity: item.quantity,
        });

        group.total += total;
      }

      const created = await Order.create(
        [...groups.values()],
        session ? { session, ordered: true } : { ordered: true }
      );

      return {
        result: created,
        created: true,
      };
    });

    const result = value.result;

    // Sotuvchilarga yangi buyurtma haqida xabar berish.
    if (value.created && result?.length) {
      try {
        await Notification.insertMany(
          result.map((order) => ({
            user: order.seller,
            type: 'order',
            title: `Yangi buyurtma #${orderNumber(order)}`,
            body: `${user.company || user.name} · ${new Intl.NumberFormat('uz-UZ').format(order.total)} so‘m`,
            link: '/seller',
          }))
        );
      } catch (e) {
        console.error('notification:', e.message);
      }
    }

    return NextResponse.json(
      { orders: result.map(orderJSON) },
      { status: 201 }
    );
  } catch (e) {
    return fail(e);
  }
}
