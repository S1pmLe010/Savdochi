import {Suspense} from 'react';
import {notFound} from 'next/navigation';
import Storefront from '@/components/Storefront';
import {readRoute} from '@/lib/routes.mjs';
export default async function Page({params}) {
 const {route=[]}=await params;
 if(!readRoute('/'+route.join('/')))notFound();
 return <Suspense fallback={<main className="wrap empty">Yuklanmoqda…</main>}><Storefront/></Suspense>;
}
