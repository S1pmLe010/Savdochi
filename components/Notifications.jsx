'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, Info, Package, X } from 'lucide-react';

const time = value => {
  try {
    return new Date(value).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

export default function Notifications({ user, onNavigate }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [busy, setBusy] = useState(false);
  const boxRef = useRef(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/notifications', { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      setItems(Array.isArray(data.notifications) ? data.notifications : []);
      setUnread(Number(data.unread) || 0);
    } catch {}
  }, [user]);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setUnread(0);
      setOpen(false);
      return;
    }
    load();
    const timer = setInterval(load, 20000);
    return () => clearInterval(timer);
  }, [user, load]);

  useEffect(() => {
    if (!open) return;
    const close = event => {
      if (boxRef.current && !boxRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  if (!user) return null;

  const markAll = async () => {
    if (!unread || busy) return;
    setBusy(true);
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      setItems(current => current.map(item => ({ ...item, read: true })));
      setUnread(0);
    } catch {} finally {
      setBusy(false);
    }
  };

  const pageFromLink = link => {
    const path = String(link || '').replace(/^\/+/, '').split(/[?#]/)[0];
    if (path === 'seller' || path === 'buyer' || path === 'profile' || path === 'catalog' || path === 'cart' || path === 'orders') return path;
    return 'orders';
  };

  const openItem = async item => {
    setOpen(false);
    if (!item.read) {
      setItems(current => current.map(x => (x.id === item.id ? { ...x, read: true } : x)));
      setUnread(current => Math.max(0, current - 1));
      fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id })
      }).catch(() => {});
    }
    if (onNavigate) onNavigate(pageFromLink(item.link));
  };

  return (
    <div className="notifWrap" ref={boxRef}>
      <button
        type="button"
        aria-label="Bildirishnomalar"
        className={open ? 'iconbtn active' : 'iconbtn'}
        onClick={() => setOpen(current => !current)}
      >
        <Bell size={19} />
        <sup>{unread || ''}</sup>
      </button>
      {open && (
        <div className="notifPanel" role="dialog" aria-label="Bildirishnomalar">
          <div className="notifHead">
            <b>Bildirishnomalar</b>
            <div>
              {unread > 0 && (
                <button type="button" className="notifMark" onClick={markAll} disabled={busy}>
                  <CheckCheck size={14} /> O‘qildi
                </button>
              )}
              <button type="button" className="notifClose" aria-label="Yopish" onClick={() => setOpen(false)}>
                <X size={16} />
              </button>
            </div>
          </div>
          <div className="notifList">
            {!items.length && (
              <div className="notifEmpty">
                <Info size={18} />
                <span>Hozircha bildirishnoma yo‘q.</span>
              </div>
            )}
            {items.map(item => (
              <button
                type="button"
                key={item.id}
                className={item.read ? 'notifItem' : 'notifItem is-unread'}
                onClick={() => openItem(item)}
              >
                <span className="notifIcon">
                  <Package size={16} />
                </span>
                <span className="notifText">
                  <b>{item.title}</b>
                  {item.body && <small>{item.body}</small>}
                  <time>{time(item.createdAt)}</time>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
