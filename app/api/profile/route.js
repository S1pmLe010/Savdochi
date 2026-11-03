import { NextResponse } from 'next/server';
import { Product } from '@/lib/models';
import { requireUser, checkOrigin, fail, profileJSON } from '@/lib/api';
import { profileInput } from '@/lib/commerce.mjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({ user: profileJSON(user) });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req) {
  try {
    checkOrigin(req);
    const user = await requireUser();
    const data = profileInput(await req.json());
    const oldCompany = user.company || '';
    Object.assign(user, data);
    await user.save();
    if (data.company && data.company !== oldCompany) {
      await Product.updateMany({ seller: user._id, active: true }, { $set: { supplier: data.company } });
    }
    return NextResponse.json({ user: profileJSON(user) });
  } catch (e) {
    return fail(e);
  }
}
