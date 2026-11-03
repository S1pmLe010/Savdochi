'use client';
import {useEffect,useRef,useState} from 'react';
import {LocateFixed,MapPin} from 'lucide-react';
export default function LocationPicker({value,onChange,disabled}){
 const host=useRef(null),mapRef=useRef(null),marker=useRef(null),lib=useRef(null),change=useRef(onChange),currentValue=useRef(value),live=useRef(true),disabledRef=useRef(disabled);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[tileError,setTileError]=useState(false),[coords,setCoords]=useState({lat:'',lng:''});
 currentValue.current=value;change.current=onChange;disabledRef.current=disabled;
 useEffect(()=>{live.current=true;let cancelled=false,observer;
  import('leaflet').then(module=>{if(cancelled||!host.current)return;const L=module.default;lib.current=L;
   const map=L.map(host.current,{scrollWheelZoom:false}).setView([41.3111,69.2797],11);mapRef.current=map;
   L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).on('tileerror',()=>{if(!cancelled)setTileError(true);}).addTo(map);
   map.on('click',e=>{if(!disabledRef.current){setError('');const point=e.latlng.wrap();change.current({lat:Number(point.lat.toFixed(6)),lng:Number(point.lng.toFixed(6))});}});
   observer=new ResizeObserver(()=>map.invalidateSize());observer.observe(host.current);
   if(currentValue.current)draw(currentValue.current);
  }).catch(()=>setError('Xarita yuklanmadi. Koordinatalarni qo‘lda kiritishingiz mumkin.'));
  return()=>{cancelled=true;live.current=false;observer?.disconnect();mapRef.current?.remove();mapRef.current=null;marker.current=null;};
 },[]);
 function draw(point){const L=lib.current,map=mapRef.current;if(!L||!map)return;
  if(!point){marker.current?.remove();marker.current=null;return;}
  const pos=[point.lat,point.lng];
  if(marker.current)marker.current.setLatLng(pos);else marker.current=L.marker(pos,{icon:L.divIcon({className:'deliveryPin',html:'<span></span>',iconSize:[26,26],iconAnchor:[13,26]})}).addTo(map);
  map.setView(pos,Math.max(map.getZoom(),15));
 }
 useEffect(()=>{draw(value);setCoords(value?{lat:String(value.lat),lng:String(value.lng)}:{lat:'',lng:''});},[value]);
 function locate(){setError('');if(!navigator.geolocation){setError('Qurilmada joylashuv olish mavjud emas. Xaritadan nuqta tanlang.');return;}setBusy(true);
 navigator.geolocation.getCurrentPosition(p=>{if(!live.current)return;setBusy(false);change.current({lat:p.coords.latitude,lng:p.coords.longitude});if(p.coords.accuracy>150)setError('Joylashuv taxminiy olindi. Xaritadagi nuqtani aniqlashtiring.');},e=>{if(!live.current)return;setBusy(false);setError(e.code===1?'Joylashuvga ruxsat berilmadi. Xaritadan nuqta tanlang yoki koordinata kiriting.':'Joylashuv aniqlanmadi. Xaritadan nuqta tanlang.');},{enableHighAccuracy:true,timeout:15000,maximumAge:60000});}
 return <section className="locationPicker"><div className="panelTitle"><h3><MapPin size={16}/> Yetkazib berish nuqtasi</h3><span>Ixtiyoriy</span></div><button type="button" className="secondary locateButton" disabled={disabled||busy} onClick={locate}><LocateFixed size={16}/>{busy?'Aniqlanmoqda…':'Joylashuvimni olish'}</button><p className="mapHint">Ruxsat berganingizdan keyin qurilma joylashuvi olinadi. Nuqtani xaritada bosib o‘zgartiring. Buyurtma yuborilganda nuqta sotuvchiga ko‘rinadi.</p><div ref={host} className="deliveryMap" aria-label="Yetkazib berish xaritasi"/>{tileError&&<p className="mapHint">Xarita tasviri yuklanmayapti. Joylashuv tugmasi yoki koordinatalar orqali nuqtani belgilash mumkin.</p>}{error&&<p role="status" className="fieldError">{error}</p>}
 <details><summary>Koordinatalarni qo‘lda kiritish</summary><div className="coordinateFields"><label>Kenglik<input type="number" step="any" min={-90} max={90} value={coords.lat} disabled={disabled} onChange={e=>setCoords({...coords,lat:e.target.value})}/></label><label>Uzunlik<input type="number" step="any" min={-180} max={180} value={coords.lng} disabled={disabled} onChange={e=>setCoords({...coords,lng:e.target.value})}/></label></div><button className="secondary" type="button" disabled={disabled} onClick={()=>{const lat=Number(coords.lat),lng=Number(coords.lng);if(!coords.lat||!coords.lng||!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180){setError('Koordinatalarni tekshiring');return;}setError('');change.current({lat,lng});}}>Nuqtani belgilash</button></details>
 {value&&<div className="selectedLocation"><MapPin size={15}/><span>{value.lat.toFixed(5)}, {value.lng.toFixed(5)}</span><button type="button" disabled={disabled} onClick={()=>change.current(null)}>Olib tashlash</button></div>}</section>;
}
