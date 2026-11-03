const pending=new Map();
export function api(path,method='GET',body){
 if(method==='GET'&&pending.has(path))return pending.get(path);
 if(method!=='GET')pending.clear();
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
 let request;request=(async()=>{try{
  const res=await fetch(path,{method,signal:controller.signal,cache:'no-store',...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
  const data=await res.json().catch(()=>({message:'Server javobini o‘qib bo‘lmadi'}));
  if(!res.ok)throw new Error(data.message||'So‘rov bajarilmadi');return data;
 }catch(e){if(e.name==='AbortError')throw new Error('Ulanish sekin. Qayta urinib ko‘ring.');throw e;}
 finally{clearTimeout(timer);if(pending.get(path)===request)pending.delete(path);}})();
 if(method==='GET')pending.set(path,request);return request;
}
