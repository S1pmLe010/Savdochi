import {Chat} from '@/lib/models';
import {AppError} from '@/lib/commerce.mjs';
import {idCheck} from '@/lib/api';
export const participantFilter=user=>user.role==='seller'?{seller:user._id}:{buyer:user._id};
export async function ownedChat(id,user){idCheck(id);const chat=await Chat.findOne({_id:id,...participantFilter(user)});if(!chat)throw new AppError('Suhbat topilmadi',404);return chat;}
export const messageJSON=m=>({id:String(m._id),senderId:String(m.sender),text:m.text,createdAt:m.createdAt,clientId:m.clientId});
