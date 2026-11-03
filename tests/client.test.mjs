import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../lib/client.js',import.meta.url),'utf8');
test('GET requests coalesce, mutations invalidate inflight reads, failures can retry',async()=>{
 const original=globalThis.fetch,requests=[];
 globalThis.fetch=(path,options)=>new Promise(resolve=>requests.push({path,options,resolve}));
 try{
  const {api}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  const first=api('/cart'),duplicate=api('/cart');assert.equal(first,duplicate);assert.equal(requests.length,1);
  const write=api('/cart','PUT',{quantity:3}),fresh=api('/cart');assert.equal(requests.length,3);assert.notEqual(first,fresh);
  requests[0].resolve({ok:true,json:async()=>({old:true})});await first;
  assert.equal(api('/cart'),fresh,'old read cannot remove a newer request');
  requests[1].resolve({ok:true,json:async()=>({saved:true})});requests[2].resolve({ok:true,json:async()=>({quantity:3})});
  await write;assert.deepEqual(await fresh,{quantity:3});
  const failed=api('/cart');requests[3].resolve({ok:false,json:async()=>({message:'Try again'})});await assert.rejects(failed,/Try again/);
  const retry=api('/cart');assert.equal(requests.length,5);requests[4].resolve({ok:true,json:async()=>({quantity:3})});await retry;
 }finally{globalThis.fetch=original;}
});
