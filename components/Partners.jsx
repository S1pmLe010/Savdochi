'use client';
import {useEffect,useState} from 'react';
import {Store,Building2,MessageSquare,Search,MapPin} from 'lucide-react';
import {api} from '@/lib/client';
import {useLiveRefresh} from '@/lib/useLiveRefresh';
export default function Partners({user,onChat,busy}){
 const [partners,setPartners]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[query,setQuery]=useState('');
 async function load(){setError('');try{setPartners((await api('/api/partners')).partners);}catch(e){setError(e.message);}finally{setLoading(false);}}
 useLiveRefresh(load,10000);
 const filtered=partners.filter(p=>p.name.toLowerCase().includes(query.toLowerCase()));
 return <section><div className="eyebrow">BIZNES ALOQALARI</div><div className="panelTitle"><h1>Hamkorlarim</h1><button className="secondary" onClick={load} disabled={loading}>Yangilash</button></div><p className="muted">{user.role==='seller'?'Sizdan buyurtma bergan yoki biznes suhbatini boshlagan do‘konlar.':'Siz buyurtma bergan yoki suhbat boshlagan kompaniyalar.'}</p><label className="partnerSearch"><Search size={18}/><input aria-label="Hamkor qidirish" placeholder="Hamkor nomi bilan qidiring" value={query} onChange={e=>setQuery(e.target.value)}/></label>
 {loading?<p className="empty">Hamkorlar yuklanmoqda…</p>:error&&!partners.length?<p className="errorBox" role="alert">{error}</p>:!filtered.length?<div className="empty"><Store size={32}/><p>{partners.length?'Qidiruvga mos hamkor topilmadi.':'Hali hamkor yo‘q. Birinchi buyurtma yoki suhbatdan keyin hamkoringiz shu yerda ko‘rinadi.'}</p></div>:<div className="partnerGrid">{filtered.map(p=><article className="partnerCard" key={p.id}><div className="partnerAvatar">{p.role==='buyer'?<Store/>:<Building2/>}</div><span className="eyebrow">{p.role==='buyer'?'DO‘KON':'KOMPANIYA'}</span><h2>{p.name}</h2><div className="partnerMetrics"><span><b>{p.orderCount}</b> buyurtma</span><span><b>{new Intl.NumberFormat('uz-UZ').format(p.total)}</b> so‘m</span></div>{p.orderCount>0&&<div className="partnerAddress"><p>{p.phone}</p><p>{p.address}</p>{p.location&&<a target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps?q=${p.location.lat},${p.location.lng}`}><MapPin size={14}/> Xaritada ochish</a>}</div>}<button className="primary wide" disabled={busy} onClick={()=>onChat(p.id)}><MessageSquare size={16}/> Biznes chat</button></article>)}</div>}
 </section>;
}
