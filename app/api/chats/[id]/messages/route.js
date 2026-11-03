import {NextResponse} from 'next/server';
import {Message,Chat} from '@/lib/models';
import {requireUser,checkOrigin,fail,idCheck} from '@/lib/api';
import {messageInput} from '@/lib/commerce.mjs';
import {ownedChat,messageJSON} from '@/lib/chat';
export const dynamic='force-dynamic';
export async function GET(req,{params}){try{
 const user=await requireUser();const {id}=await params;await ownedChat(id,user);
 const before=new URL(req.url).searchParams.get('before');if(before)idCheck(before);
 const rows=await Message.find({chat:id,...(before?{_id:{$lt:before}}:{})}).sort({_id:-1}).limit(51).lean();
 const hasMore=rows.length>50;const page=rows.slice(0,50).reverse();
 return NextResponse.json({messages:page.map(messageJSON),hasMore,nextBefore:hasMore?String(page[0]._id):null});
}catch(e){return fail(e);}}
export async function POST(req,{params}){try{
 checkOrigin(req);const user=await requireUser();const {id}=await params;await ownedChat(id,user);const data=messageInput(await req.json());
 await Message.init();let message;
 try{message=await Message.findOneAndUpdate({chat:id,sender:user._id,clientId:data.clientId},{$setOnInsert:{chat:id,sender:user._id,...data}},{upsert:true,new:true,runValidators:true});}catch(e){if(e.code!==11000)throw e;message=await Message.findOne({chat:id,sender:user._id,clientId:data.clientId});}
 await Chat.updateOne({_id:id,$or:[{lastMessageAt:{$exists:false}},{lastMessageAt:{$lte:message.createdAt}}]},{$set:{lastMessage:message.text.slice(0,140),lastMessageAt:message.createdAt}});
 return NextResponse.json({message:messageJSON(message)},{status:201});
}catch(e){return fail(e);}}
