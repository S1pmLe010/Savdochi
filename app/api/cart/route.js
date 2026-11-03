import {NextResponse} from 'next/server';
import {requireUser,checkOrigin,fail,idCheck} from '@/lib/api';
import {AppError} from '@/lib/commerce.mjs';
import {releaseExpired,cartJSON,reserveItem} from '@/lib/reservations';
export const dynamic='force-dynamic';
export async function GET(){try{const user=await requireUser('buyer');await releaseExpired();return NextResponse.json(await cartJSON(user._id));}catch(e){return fail(e);}}
export async function PUT(req){try{
 checkOrigin(req);const user=await requireUser('buyer');const {productId,quantity}=await req.json();idCheck(productId);
 if(!Number.isSafeInteger(quantity)||quantity<0||quantity>100000)throw new AppError('Miqdor 0–100000 oralig‘ida butun son bo‘lsin');
 return NextResponse.json(await reserveItem(user._id,productId,quantity));
}catch(e){return fail(e);}}
