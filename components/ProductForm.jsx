'use client';
import {useState} from 'react';
import {categories} from '@/lib/commerce.mjs';
import ImageInput from '@/components/ImageInput';
export default function ProductForm({product,onSave,onCancel,busy}){
 const [form,setForm]=useState(product||{name:'',category:categories[0],price:'',unit:'1 dona',stock:'',minOrder:1,description:'',image:''});
 const field=(key,value)=>setForm(p=>({...p,[key]:value}));
 return <form className="productForm" onSubmit={e=>{e.preventDefault();onSave({...form,price:Number(form.price),stock:Number(form.stock),minOrder:Number(form.minOrder)});}}>
  <h3>{product?'Mahsulotni tahrirlash':'Yangi mahsulot'}</h3>
  <ImageInput value={form.image||''} onChange={value=>field('image',value)} label="Mahsulot rasmi" busy={busy}/>
  <div className="formGrid">
   <label>Mahsulot nomi<input required minLength={2} maxLength={120} value={form.name} onChange={e=>field('name',e.target.value)}/></label>
   <label>Kategoriya<select value={form.category} onChange={e=>field('category',e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
   <label>Bir birlik narxi (so‘m)<input type="number" required min={1} max={1000000000} step={1} value={form.price} onChange={e=>field('price',e.target.value)}/></label>
   <label>Birlik (masalan, 50 kg qop)<input required maxLength={40} value={form.unit} onChange={e=>field('unit',e.target.value)}/></label>
   <label>Sotuv uchun qoldiq (birlik)<input type="number" required min={0} max={1000000} step={1} value={form.stock} onChange={e=>field('stock',e.target.value)}/></label>
   <label>Minimal buyurtma (birlik)<input type="number" required min={1} max={100000} step={1} value={form.minOrder} onChange={e=>field('minOrder',e.target.value)}/></label>
  </div>
  <label>Tavsif<textarea rows={3} maxLength={2000} value={form.description} onChange={e=>field('description',e.target.value)}/></label>
  <div className="actions"><button className="primary" disabled={busy}>{busy?'Saqlanmoqda…':'Saqlash'}</button><button type="button" className="secondary" onClick={onCancel} disabled={busy}>Bekor qilish</button></div>
 </form>;
}
