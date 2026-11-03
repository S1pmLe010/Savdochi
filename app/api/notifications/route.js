import { NextResponse } from 'next/server';
import { Notification } from '@/lib/models';
import { requireUser, checkOrigin, fail, idCheck } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireUser();
    const [items, unread] = await Promise.all([
      Notification.find({ user: user._id }).sort({ createdAt: -1 }).limit(30).lean(),
      Notification.countDocuments({ user: user._id, readAt: null })
    ]);
    return NextResponse.json({
      unread,
      notifications: items.map(n => ({
        id: String(n._id),
        type: n.type,
        title: n.title,
        body: n.body,
        link: n.link,
        read: !!n.readAt,
        createdAt: n.createdAt
      }))
    });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req) {
  try {
    checkOrigin(req);
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    if (body?.id) {
      idCheck(body.id);
      await Notification.updateOne({ _id: body.id, user: user._id, readAt: null }, { $set: { readAt: new Date() } });
    } else {
      await Notification.updateMany({ user: user._id, readAt: null }, { $set: { readAt: new Date() } });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
