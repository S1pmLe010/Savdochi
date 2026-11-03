import {NextResponse} from 'next/server';
import {Product,Order,Notification} from '@/lib/models';
import {requireUser,checkOrigin,fail,orderJSON} from '@/lib/api';
import {AppError,checkoutInput,orderNumber} from '@/lib/commerce.mjs';
import {withOptionalTransaction} from '@/lib/transaction';
export const dynamic='force-dynamic';
export async function GET(){try{
  const user=await requireUser();
  const orders=await Order.find(user.role==='seller'?{seller:user._id}:{buyer:user._id}).sort({createdAt:-1}).lean();
  return NextResponse.json({orders:orders.map(orderJSON)});
}catch(e){return fail(e);}}
export async function POST(req){try{
  checkOrigin(req);const user=await requireUser('buyer');const data=checkoutInput(await req.json());
  // The unique index and transaction make retries safe, including multi-seller baskets.
  await Promise.all([Order.init(),Product.init()]);
  const {value}=await withOptionalTransaction(async session=>{
    const opts=session?{session}:{};
    const existing=await (session?Order.find({buyer:user._id,requestId:data.requestId}).session(session):Order.find({buyer:user._id,requestId:data.requestId}));
    if(existing.length)return {result:existing,created:false};
    const groups=new Map();const reserved=[];
    try{
      for(const item of data.items){
        const p=await Product.findOneAndUpdate({_id:item.productId,active:true,stock:{$gte:item.quantity},minOrder:{$lte:item.quantity}},{$inc:{stock:-item.quantity}},{new:true,...opts});
        if(!p) throw new AppError('Mahsulot mavjud emas, qoldiq yetmaydi yoki minimal miqdor bajarilmagan. Savatni yangilang.',409);
        reserved.push({id:p._id,quantity:item.quantity});
        const key=String(p.seller);
        if(!groups.has(key))groups.set(key,{buyer:user._id,buyerName:user.name,seller:p.seller,supplier:p.supplier,requestId:data.requestId,phone:data.phone,address:data.address,note:data.note,paymentMethod:data.paymentMethod,deliveryMethod:data.deliveryMethod,deliveryDate:data.deliveryDate,timeline:[{status:'pending',at:new Date(),by:'buyer'}],items:[],total:0});
        const group=groups.get(key);const total=p.price*item.quantity;
        if(!Number.isSafeInteger(total)||!Number.isSafeInteger(group.total+total))throw new AppError('Buyurtma summasi juda katta');
        group.items.push({productId:p._id,name:p.name,unit:p.unit,price:p.price,quantity:item.quantity});group.total+=total;
      }
      const created=await Order.create([...groups.values()],{...opts,ordered:true});
      return {result:created,created:true};
    }catch(e){
      // Tranzaksiyasiz rejimda qoldiqni qaytaramiz, aks holda stock "yo'qoladi".
      if(!session)for(const item of reserved)await Product.updateOne({_id:item.id},{$inc:{stock:item.quantity}}).catch(()=>{});
      throw e;
    }
  });
  const result=value.result;
  if(value.created && result?.length){
    try{
      await Notification.insertMany(result.map(order=>({
        user:order.seller,
        type:'order',
        title:`Yangi buyurtma #${orderNumber(order)}`,
        body:`${user.company||user.name} · ${new Intl.NumberFormat('uz-UZ').format(order.total)} so‘m`,
        link:'/seller'
      })));
    }catch(e){console.error('notification:',e.message);}
  }
  return NextResponse.json({orders:result.map(orderJSON)},{status:201});
}catch(e){return fail(e);}}
