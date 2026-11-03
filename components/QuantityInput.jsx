'use client';
import {useEffect,useState} from 'react';
export default function QuantityInput({value,min=1,max=100000,name,onChange,onValidity,disabled,commitOnBlur=false}){
 const [draft,setDraft]=useState(String(value));
 useEffect(()=>setDraft(String(value)),[value]);
 const valid=/^\d+$/.test(draft)&&Number.isSafeInteger(Number(draft))&&Number(draft)>=min&&Number(draft)<=max;
 useEffect(()=>{onValidity(valid&&(!commitOnBlur||Number(draft)===value));},[valid,onValidity,commitOnBlur,draft,value]);
 function edit(raw){if(!/^\d*$/.test(raw))return;setDraft(raw);const n=Number(raw);if(raw&&Number.isSafeInteger(n)&&n>=min&&n<=max&&!commitOnBlur)onChange(n);}
 function step(n){const next=Math.min(max,Math.max(min,n));setDraft(String(next));onChange(next);}
 return <div className="quantityField"><div className={'quantity '+(!valid?'invalid':'')}><button type="button" aria-label="Miqdorni kamaytirish" disabled={disabled||Number(draft)<=min} onClick={()=>step(Number(draft||min)-1)}>−</button><input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} aria-label={name+' miqdori'} aria-invalid={!valid} value={draft} disabled={disabled} onFocus={e=>e.target.select()} onChange={e=>edit(e.target.value)} onBlur={()=>{if(commitOnBlur&&valid&&Number(draft)!==value)onChange(Number(draft));}} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur();}}}/><button type="button" aria-label="Miqdorni oshirish" disabled={disabled||Number(draft)>=max} onClick={()=>step(Number(draft||0)+1)}>+</button></div>{!valid&&<small className="fieldError">{min}–{max} oralig‘ida son kiriting</small>}</div>;
}
