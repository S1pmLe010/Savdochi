import mongoose from 'mongoose';
import {Product,Reservation,User} from '@/lib/models';
import {productJSON} from '@/lib/api';
import {AppError} from '@/lib/commerce.mjs';
export const HOLD_MS=3*24*60*60*1000;
// Expired holds are released transactionally before inventory is read or changed.
// No TTL deletion: deleting a hold without returning stock would lose inventory.
export async function releaseExpired(){
 await Reservation.init();
 while(true){
  const expired=await Reservation.find({expiresAt:{$lte:new Date()}}).select('_id').limit(100).lean();
  if(!expired.length)return;
  const session=await mongoose.startSession();
  try{await session.withTransaction(async()=>{
   const rows=await Reservation.find({_id:{$in:expired.map(r=>r._id)},expiresAt:{$lte:new Date()}}).session(session);
   for(const r of rows){await Product.updateOne({_id:r.product},{$inc:{stock:r.quantity}},{session});await Reservation.deleteOne({_id:r._id},{session});}
  });}finally{await session.endSession();}
 }
}
export async function cartJSON(buyer){
 const rows=await Reservation.find({buyer,expiresAt:{$gt:new Date()}}).sort({createdAt:1}).lean();
 return {items:rows.map(r=>({id:String(r.product),quantity:r.quantity,expiresAt:r.expiresAt}))};
}
export async function reserveItem(buyer,productId,quantity){
 await releaseExpired();const session=await mongoose.startSession();
 try{await session.withTransaction(async()=>{
  // Serializes this buyer's cart mutations and checkout, including different products.
  await User.updateOne({_id:buyer},{$inc:{cartVersion:1}},{session});
  const hold=await Reservation.findOne({buyer,product:productId}).session(session);
  if(quantity===0){if(hold){await Product.updateOne({_id:productId},{$inc:{stock:hold.quantity}},{session});await Reservation.deleteOne({_id:hold._id},{session});}return;}
  if(!hold&&await Reservation.countDocuments({buyer}).session(session)>=50)throw new AppError('Savatda ko‘pi bilan 50 turdagi mahsulot bo‘lsin');
  const delta=quantity-(hold?.quantity||0);
  const product=await Product.findOneAndUpdate({_id:productId,active:true,minOrder:{$lte:quantity},...(delta>0?{stock:{$gte:delta}}:{})},{$inc:{stock:-delta}},{new:true,session});
  if(!product)throw new AppError('Qoldiq yetmaydi yoki minimal miqdor bajarilmagan. Savatni yangilang.',409);
  if(hold){hold.quantity=quantity;await hold.save({session});}
  else await Reservation.create([{buyer,product:productId,quantity,expiresAt:new Date(Date.now()+HOLD_MS)}],{session});
 });}finally{await session.endSession();}
 const [cart,product]=await Promise.all([cartJSON(buyer),Product.findById(productId).lean()]);
 return {...cart,product:product?productJSON(product):null};
}
