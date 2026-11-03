import test from 'node:test';
import assert from 'node:assert/strict';
import {productInput,checkoutInput,nextStatus} from '../lib/commerce.mjs';
const product={name:'Guruch',category:'Oziq-ovqat',price:12000,unit:'1 kg',stock:50,minOrder:5,description:''};
const order={items:[{productId:'a'.repeat(24),quantity:5}],requestId:'request-id-123456789',phone:'+998 90 123 45 67',address:'Toshkent, 12-uy'};
test('Product validation rejects negative, fractional and nonnumeric money or stock',()=>{
 for(const price of [-1,0,1.5,NaN,'12000',Infinity])assert.throws(()=>productInput({...product,price}));
 assert.throws(()=>productInput({...product,stock:-1}));assert.throws(()=>productInput({...product,minOrder:0}));
 assert.equal(productInput(product).minOrder,5);
});
test('Checkout rejects duplicate products, invalid IDs and fractional amounts',()=>{
 assert.throws(()=>checkoutInput({...order,items:[...order.items,...order.items]}));
 assert.throws(()=>checkoutInput({...order,items:[{productId:'bad',quantity:1}]}));
 assert.throws(()=>checkoutInput({...order,items:[{...order.items[0],quantity:.5}]}));
 assert.throws(()=>checkoutInput({...order,phone:'abcdefghijk'}));
 assert.throws(()=>checkoutInput({...order,phone:''}));
 assert.equal(checkoutInput(order).items.length,1);
});
test('Pickup checkout allows empty address; delivery still requires it',()=>{
 assert.equal(checkoutInput({...order,deliveryMethod:'pickup',address:''}).address,'');
 assert.throws(()=>checkoutInput({...order,deliveryMethod:'delivery',address:'abc'}));
 assert.equal(checkoutInput({...order,deliveryMethod:'pickup',address:'Ombor 3'}).deliveryMethod,'pickup');
});
test('Server ignores client supplied seller, price, status and total',()=>{
 const p=productInput({...product,seller:'attacker',active:false});assert.equal(p.seller,undefined);assert.equal(p.active,undefined);
 const o=checkoutInput({...order,total:1,status:'delivered',items:[{...order.items[0],price:1}]});assert.equal(o.total,undefined);assert.equal(o.items[0].price,undefined);
});
test('Buyer can only cancel a pending order; terminal states never transition',()=>{
 assert.equal(nextStatus('pending','cancelled','buyer'),'cancelled');
 assert.throws(()=>nextStatus('pending','confirmed','buyer'));
 assert.throws(()=>nextStatus('confirmed','cancelled','buyer'));
 assert.throws(()=>nextStatus('pending','delivered','seller'));
 assert.throws(()=>nextStatus('cancelled','confirmed','seller'));
 assert.throws(()=>nextStatus('delivered','cancelled','seller'));
 assert.equal(nextStatus('confirmed','shipped','seller'),'shipped');
});
