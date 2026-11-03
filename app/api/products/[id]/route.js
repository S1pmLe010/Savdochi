import {NextResponse} from 'next/server';
import {Notification,Product} from '@/lib/models';
import {requireUser,checkOrigin,fail,productJSON,idCheck} from '@/lib/api';
import {AppError,productInput} from '@/lib/commerce.mjs';

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
  } catch (e) {
    console.error('stock-notification:', e.message);
  }
}

export async function PATCH(req,{params}){try{
  checkOrigin(req);const user=await requireUser('seller');const {id}=await params;idCheck(id);
  const data=productInput(await req.json());
  const product=await Product.findOneAndUpdate({_id:id,seller:user._id,active:true},{$set:data},{new:true,runValidators:true});
  if(!product) throw new AppError('Mahsulot topilmadi',404);
  await notifyLowStock(user._id, product);
  return NextResponse.json({product:productJSON(product)});
}catch(e){return fail(e);}}
export async function DELETE(req,{params}){try{
  checkOrigin(req);const user=await requireUser('seller');const {id}=await params;idCheck(id);
  const product=await Product.findOneAndUpdate({_id:id,seller:user._id,active:true},{$set:{active:false}});
  if(!product) throw new AppError('Mahsulot topilmadi',404);
  return NextResponse.json({ok:true});
}catch(e){return fail(e);}}
