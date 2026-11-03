import {NextResponse} from 'next/server';
import {Order,Product,Notification} from '@/lib/models';
import {requireUser,checkOrigin,fail,orderJSON,idCheck} from '@/lib/api';
import {AppError,nextStatus,statusLabels,orderNumber} from '@/lib/commerce.mjs';
import {withOptionalTransaction} from '@/lib/transaction';
export async function PATCH(req,{params}){try{
  checkOrigin(req);const user=await requireUser();const {id}=await params;idCheck(id);const {status}=await req.json();
  const {value}=await withOptionalTransaction(async session=>{
    const opts=session?{session}:{};
    const order=await (session?Order.findOne({_id:id,...(user.role==='seller'?{seller:user._id}:{buyer:user._id})}).session(session):Order.findOne({_id:id,...(user.role==='seller'?{seller:user._id}:{buyer:user._id})}));
    if(!order)throw new AppError('Buyurtma topilmadi',404);
    if(order.status===status)return {result:order,changed:false};
    nextStatus(order.status,status,user.role);
    if(status==='cancelled')for(const item of order.items)await Product.updateOne({_id:item.productId},{$inc:{stock:item.quantity}},{...opts});
    order.status=status;
    order.timeline=[...(order.timeline||[]),{status,at:new Date(),by:user.role}];
    await (session?order.save({session}):order.save());
    return {result:order,changed:true};
  });
  const result=value.result;
  if(value.changed && result){
    try{
      const number=orderNumber(result);
      if(user.role==='seller'){
        await Notification.create({user:result.buyer,type:'order',title:`Buyurtma #${number}: ${statusLabels[result.status]}`,body:`${result.supplier||'Sotuvchi'} buyurtma holatini yangiladi.`,link:'/orders'});
      }else{
        await Notification.create({user:result.seller,type:'order',title:`Buyurtma #${number} bekor qilindi`,body:`${result.buyerName||'Xaridor'} buyurtmani bekor qildi.`,link:'/orders'});
      }
    }catch(e){console.error('notification:',e.message);}
  }
  return NextResponse.json({order:orderJSON(result)});
}catch(e){return fail(e);}}
