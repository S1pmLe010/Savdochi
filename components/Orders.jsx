
'use client';

import { useMemo, useState } from 'react';
import { Printer, Search, MapPin, MessageSquare } from 'lucide-react';
import {
  statusLabels,
  transitions,
  paymentLabels,
  deliveryLabels
} from '@/lib/commerce.mjs';

const money = n => new Intl.NumberFormat('uz-UZ').format(n) + ' so‘m';

const verbs = {
  confirmed: 'Tasdiqlash',
  shipped: 'Jo‘natish',
  delivered: 'Yetkazildi',
  cancelled: 'Bekor qilish'
};

const filters = ['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const esc = value =>
  String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));

function printInvoice(order) {
  const w = window.open('', '_blank', 'width=820,height=900');
  if (!w) return;

  const rows = (order.items || []).map(i =>
    `<tr><td>${esc(i.name)}</td><td>${i.quantity} ${esc(i.unit)}</td><td>${money(i.price)}</td><td>${money(i.price * i.quantity)}</td></tr>`
  ).join('');

  const title = `Buyurtma ${esc(order.number || order.id.slice(-8).toUpperCase())}`;

  w.document.write(`<!doctype html>
<html lang="uz">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
*{box-sizing:border-box}
body{font-family:Arial,sans-serif;color:#17221d;margin:36px;font-size:13px}
h1{font-size:22px;margin:0 0 4px}
.muted{color:#68766d}
.row{display:flex;justify-content:space-between;gap:24px;margin-bottom:18px}
table{width:100%;border-collapse:collapse;margin-top:18px}
th,td{padding:9px 8px;border-bottom:1px solid #e4e9e2;text-align:left}
th{background:#f0f2ed;font-size:12px;text-transform:uppercase}
td:last-child,th:last-child,td:nth-child(3),th:nth-child(3){text-align:right}
.total{margin-top:16px;text-align:right;font-size:16px;font-weight:700}
.print{margin-top:28px;padding:10px 18px;border:0;border-radius:8px;background:#176b4b;color:#fff;font-weight:600;cursor:pointer}
@media print{.print{display:none}body{margin:0}}
</style>
</head>
<body>
<div class="row">
  <div><h1>Savdochi</h1><div class="muted">B2B ulgurji savdo platformasi</div></div>
  <div style="text-align:right"><b>${title}</b><div class="muted">${esc(new Date(order.createdAt).toLocaleString('uz-UZ'))}</div></div>
</div>
<div class="row">
  <div><div class="muted">Sotuvchi</div><b>${esc(order.supplier)}</b></div>
  <div><div class="muted">Xaridor</div><b>${esc(order.buyerName)}</b><div>${esc(order.phone)}</div><div>${esc(order.address)}</div></div>
</div>
<div class="row">
  <div><div class="muted">To‘lov</div><b>${esc(paymentLabels[order.paymentMethod] || order.paymentMethod)}</b></div>
  <div><div class="muted">Yetkazish</div><b>${esc(deliveryLabels[order.deliveryMethod] || order.deliveryMethod)}</b>${order.deliveryDate ? `<div>${esc(order.deliveryDate)}</div>` : ''}</div>
  <div><div class="muted">Holat</div><b>${esc(statusLabels[order.status] || order.status)}</b></div>
</div>
<table>
<thead><tr><th>Mahsulot</th><th>Miqdor</th><th>Narx</th><th>Summa</th></tr></thead>
<tbody>${rows}</tbody>
</table>
<div class="total">Jami: ${money(order.total)}</div>
${order.note ? `<p class="muted">Izoh: ${esc(order.note)}</p>` : ''}
<button class="print" onclick="window.print()">Chop etish</button>
</body>
</html>`);

  w.document.close();
  w.focus();
}

export default function Orders({
  orders = [],
  role,
  onStatus,
  busy,
  loading,
  error,
  onRefresh,
  preview = false,
  onChat
}) {
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');

  const counts = useMemo(() => {
    const map = { all: orders.length };
    for (const key of filters.slice(1)) map[key] = 0;
    for (const order of orders) {
      map[order.status] = (map[order.status] || 0) + 1;
    }
    return map;
  }, [orders]);

  const visible = useMemo(() => {
    if (preview) return orders;

    const q = query.trim().toLowerCase();

    return orders.filter(o => {
      if (status !== 'all' && o.status !== status) return false;
      if (!q) return true;

      const hay = [
        o.number,
        o.supplier,
        o.buyerName,
        o.phone,
        o.address,
        ...(o.items || []).map(i => i.name)
      ].join(' ').toLowerCase();

      return hay.includes(q);
    });
  }, [orders, status, query, preview]);

  return (
    <section>
      <div className="panelTitle">
        <h2>
          {preview
            ? 'So‘nggi buyurtmalar'
            : role === 'seller' ? 'Kelgan buyurtmalar' : 'Buyurtmalarim'}
        </h2>
        <button className="secondary" onClick={onRefresh} disabled={loading || busy}>
          Yangilash
        </button>
      </div>

      {!preview && (
        <div className="orderFilters">
          <div className="orderFilterChips" role="tablist" aria-label="Buyurtma holati">
            {filters.map(key => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={status === key}
                className={status === key ? 'chip active' : 'chip'}
                onClick={() => setStatus(key)}
              >
                {key === 'all' ? 'Barchasi' : statusLabels[key]}
                <sup>{counts[key] || 0}</sup>
              </button>
            ))}
          </div>

          <label className="orderSearch">
            <Search size={16} />
            <input
              aria-label="Buyurtmalarni qidirish"
              placeholder="Raqam, kompaniya yoki mahsulot…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </label>
        </div>
      )}

      {error ? (
        <p role="alert" className="errorBox">{error}</p>
      ) : loading ? (
        <p className="empty">Buyurtmalar yuklanmoqda…</p>
      ) : !orders.length ? (
        <p className="empty">Hali buyurtma yo‘q.</p>
      ) : !visible.length ? (
        <p className="empty">Filtr bo‘yicha buyurtma topilmadi.</p>
      ) : (
        visible.map(o => (
          <article className="orderCard" key={o.id}>
            <div className="orderHeading">
              <div>
                <b>#{o.number || o.id.slice(-8).toUpperCase()}</b>
                <small>{new Date(o.createdAt).toLocaleString('uz-UZ')}</small>
              </div>
              <span className={'badge ' + o.status}>
                {statusLabels[o.status] || o.status}
              </span>
            </div>

            <p>
              {role === 'seller'
                ? 'Xaridor: ' + o.buyerName
                : 'Yetkazib beruvchi: ' + o.supplier}
            </p>

            <p className="muted orderMeta">
              To‘lov: {paymentLabels[o.paymentMethod] || o.paymentMethod}
              {' · '}
              {deliveryLabels[o.deliveryMethod] || o.deliveryMethod}
              {o.deliveryDate ? ' · ' + o.deliveryDate : ''}
            </p>

            <ul className="orderItems">
              {(o.items || []).map(i => (
                <li key={i.productId}>
                  <span>{i.name} · {i.quantity} × {i.unit}</span>
                  <b>{money(i.price * i.quantity)}</b>
                </li>
              ))}
            </ul>

            <p><b>Jami: {money(o.total)}</b></p>

            <p className="muted">
              Telefon: {o.phone}
              <br />
              {o.address ? <>Manzil: {o.address}</> : 'Olib ketish'}
              {o.note && <><br />Izoh: {o.note}</>}
            </p>

            {o.location && (
              <a
                className="mapLink"
                target="_blank"
                rel="noopener noreferrer"
                href={`https://www.google.com/maps?q=${o.location.lat},${o.location.lng}`}
              >
                <MapPin size={16} /> Yetkazib berish nuqtasini ochish
              </a>
            )}

            {o.timeline?.length > 0 && (
              <div className="orderTimeline" aria-label="Buyurtma tarixi">
                {o.timeline.map((x, i) => (
                  <span key={x.status + '-' + i} className={'tlStep ' + x.status}>
                    <b>{statusLabels[x.status] || x.status}</b>
                    <small>
                      {x.at ? new Date(x.at).toLocaleString('uz-UZ') : ''}
                    </small>
                  </span>
                ))}
              </div>
            )}

            <div className="actions">
              <button
                className="secondary"
                onClick={() => printInvoice(o)}
                disabled={busy}
              >
                <Printer size={15} /> Chek
              </button>

              {onChat && (
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() => onChat(role === 'seller' ? o.buyerId : o.sellerId)}
                >
                  <MessageSquare size={16} /> Hamkorga yozish
                </button>
              )}

              {(role === 'seller'
                ? transitions[o.status] || []
                : o.status === 'pending' ? ['cancelled'] : []
              ).map(s => (
                <button
                  key={s}
                  disabled={busy}
                  className={s === 'cancelled' ? 'secondary danger' : 'primary'}
                  onClick={() => {
                    if (s !== 'cancelled' || window.confirm('Buyurtmani bekor qilasizmi?')) {
                      onStatus?.(o.id, s);
                    }
                  }}
                >
                  {verbs[s] || s}
                </button>
              ))}
            </div>
          </article>
        ))
      )}
    </section>
  );
}
