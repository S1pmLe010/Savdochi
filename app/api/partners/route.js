import {NextResponse} from 'next/server';
import {Order,Chat,User} from '@/lib/models';
import {requireUser,fail} from '@/lib/api';
import {participantFilter} from '@/lib/chat';
export const dynamic='force-dynamic';
export async function GET(){try{
 const user=await requireUser();const filter=participantFilter(user);const other=user.role==='seller'?'buyer':'seller';
 const [orders,chats]=await Promise.all([Order.find(filter).sort({createdAt:-1}).lean(),Chat.find(filter).lean()]);
 const map=new Map();
 for(const o of orders){const id=String(o[other]);if(!map.has(id))map.set(id,{id,orderCount:0,total:0,lastOrderAt:o.createdAt,phone:o.phone,address:o.address,location:o.location||null});const p=map.get(id);p.orderCount++;if(o.status!=='cancelled')p.total+=o.total;}
 for(const c of chats){const id=String(c[other]);if(!map.has(id))map.set(id,{id,orderCount:0,total:0});map.get(id).chatId=String(c._id);}
 const people=await User.find({_id:{$in:[...map.keys()]}}).select('name role').lean();
 const partners=people.map(p=>({...map.get(String(p._id)),name:p.name,role:p.role}));
 // Buyer receives only their own submitted delivery details; sellers see only their own partners.
 return NextResponse.json({partners:partners.sort((a,b)=>b.orderCount-a.orderCount)});
}catch(e){return fail(e);}}
