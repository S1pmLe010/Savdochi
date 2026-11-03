export const categories = ['Oziq-ovqat', 'Ichimliklar', 'Maishiy kimyo', 'Qurilish materiallari', 'Elektronika'];
export const statusLabels = {pending:'Kutilmoqda', confirmed:'Tasdiqlangan', shipped:'Yo‘lda', delivered:'Yetkazilgan', cancelled:'Bekor qilingan'};
export const transitions = {pending:['confirmed','cancelled'], confirmed:['shipped','cancelled'], shipped:['delivered'], delivered:[], cancelled:[]};
export const paymentLabels = {cash:'Naqd pul', bank:'Bank o‘tkazmasi', credit:'Muddatli to‘lov'};
export const deliveryLabels = {delivery:'Yetkazib berish', pickup:'Olib ketish'};
export const paymentMethods = Object.keys(paymentLabels);
export const deliveryMethods = Object.keys(deliveryLabels);
export class AppError extends Error { constructor(message, status=400) { super(message); this.status=status; } }
const text = (v, min, max, label) => { if(typeof v !== 'string' || v.trim().length<min || v.trim().length>max) throw new AppError(`${label}: ${min}–${max} belgi kiriting`); return v.trim(); };
const integer = (v, min, max, label) => { if(typeof v!=='number'||!Number.isSafeInteger(v)||v<min||v>max) throw new AppError(`${label}: ${min}–${max} oralig‘ida butun son kiriting`); return v; };
const optional = (v, max, label) => (v === undefined || v === null || v === '') ? '' : text(v, 0, max, label);

function image(value) {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value !== 'string' || value.length > 400000) throw new AppError('Rasm hajmi juda katta (maks. 400 KB)');
  if (/^https?:\/\/\S+$/i.test(value) && value.length <= 2000) return value;
  if (/^\/[A-Za-z0-9/_.-]+$/.test(value) && value.length <= 200) return value;
  if (/^data:image\/(?:png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(value)) return value;
  throw new AppError('Rasm URL manzili yoki yuklangan fayl bo‘lishi kerak');
}

function phone(value) {
  if (value === undefined || value === null || value === '') return '';
  const clean = text(value, 9, 25, 'Telefon');
  if (!/^\+?[\d ()-]+$/.test(clean) || clean.replace(/\D/g, '').length < 9) throw new AppError('Telefon raqamini tekshiring');
  return clean;
}

export function productInput(b) {
  if(!b || typeof b!=='object') throw new AppError('Mahsulot ma’lumotlari kerak');
  if(!categories.includes(b.category)) throw new AppError('Kategoriyani tanlang');
  const minOrder=integer(b.minOrder,1,100000,'Minimal buyurtma');
  return {name:text(b.name,2,120,'Mahsulot nomi'),category:b.category,price:integer(b.price,1,1000000000,'Narx'),unit:text(b.unit,1,40,'O‘lchov'),stock:integer(b.stock,0,1000000,'Qoldiq'),minOrder,description:optional(b.description,2000,'Tavsif'),image:image(b.image)};
}

export function checkoutInput(b) {
  if(!b || !Array.isArray(b.items)||!b.items.length||b.items.length>50) throw new AppError('Savatda 1–50 turdagi mahsulot bo‘lsin');
  const seen=new Set();
  const items=b.items.map(x=>{
    if(!/^[a-f\d]{24}$/i.test(x?.productId)||seen.has(x.productId)) throw new AppError('Savatdagi mahsulotlarni tekshiring');
    seen.add(x.productId);
    return {productId:x.productId,quantity:integer(x.quantity,1,100000,'Miqdor')};
  });
  if(!/^[a-zA-Z0-9-]{16,80}$/.test(b.requestId)) throw new AppError('Buyurtma identifikatori noto‘g‘ri');
  const paymentMethod=paymentMethods.includes(b.paymentMethod)?b.paymentMethod:'cash';
  const deliveryMethod=deliveryMethods.includes(b.deliveryMethod)?b.deliveryMethod:'delivery';
  const deliveryDate=(b.deliveryDate===undefined||b.deliveryDate==='')?'':text(b.deliveryDate,10,10,'Yetkazish sanasi');
  if(deliveryDate && !/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate)) throw new AppError('Yetkazish sanasini YYYY-MM-DD ko‘rinishida kiriting');
  const phoneValue=phone(b.phone);
  if(!phoneValue) throw new AppError('Telefon raqamini kiriting');
  const address=deliveryMethod==='pickup'?optional(b.address,400,'Manzil'):text(b.address,5,400,'Manzil');
  return {items,requestId:b.requestId,phone:phoneValue,address,note:optional(b.note,1000,'Izoh'),paymentMethod,deliveryMethod,deliveryDate};
}

export function profileInput(b) {
  if (!b || typeof b !== 'object') throw new AppError('Profil ma’lumotlari kerak');
  const inn = b.inn === undefined || b.inn === null || b.inn === '' ? '' : text(b.inn, 9, 12, 'INN');
  if (inn && !/^\d+$/.test(inn)) throw new AppError('INN faqat raqamlardan iborat bo‘lishi kerak');
  return {
    company: optional(b.company, 120, 'Kompaniya nomi'),
    phone: phone(b.phone),
    address: optional(b.address, 240, 'Manzil'),
    inn,
    about: optional(b.about, 600, 'Kompaniya haqida'),
    logo: image(b.logo)
  };
}

export function orderNumber(order) {
  const date = new Date(order?.createdAt || Date.now());
  const stamp = `${String(date.getFullYear()).slice(-2)}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  return `SV-${stamp}-${String(order?._id || '').slice(-5).toUpperCase()}`;
}

export function nextStatus(current, next, role) {
  if(!transitions[current]?.includes(next) || (role==='buyer' && !(current==='pending'&&next==='cancelled'))) throw new AppError('Bu holatga o‘tkazib bo‘lmaydi',409);
  return next;
}
