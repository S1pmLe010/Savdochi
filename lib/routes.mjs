const pages=new Set(['catalog','suppliers','cart','login','register','buyer','seller','orders','partners','chat']);
export function readRoute(pathname) {
 const path=pathname.replace(/\/$/,'')||'/';
 if(path==='/')return {page:'home'};
 if(pages.has(path.slice(1)))return {page:path.slice(1)};
 const product=path.match(/^\/products\/([a-f\d]{24})$/i);
 return product?{page:'detail',productId:product[1]}:null;
}
export function routeURL(page,query={}) {
 if(page==='home')return '/';
 if(page==='detail') {
  if(!/^[a-f\d]{24}$/i.test(query.id))throw new Error('Mahsulot topilmadi');
  return '/products/'+query.id;
 }
 if(!pages.has(page))throw new Error('Sahifa topilmadi');
 const params=new URLSearchParams();
 for(const [key,value] of Object.entries(query))if(value&&value!=='Barchasi')params.set(key,value);
 return '/'+page+(params.size?'?'+params:'');
}
