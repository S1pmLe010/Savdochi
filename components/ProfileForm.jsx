'use client';

import { useState } from 'react';
import { Building2, Save } from 'lucide-react';
import ImageInput from '@/components/ImageInput';

export default function ProfileForm({ user, onSave, busy }) {
  const [form, setForm] = useState({
    company: user.company || '',
    phone: user.phone || '',
    address: user.address || '',
    inn: user.inn || '',
    about: user.about || '',
    logo: user.logo || ''
  });
  const field = (key, value) => setForm(current => ({ ...current, [key]: value }));

  return (
    <form
      className="productForm profileForm"
      onSubmit={event => {
        event.preventDefault();
        onSave(form);
      }}
    >
      <div className="profileFormHead">
        <span className="profileAvatar">
          {form.logo ? <img src={form.logo} alt="" /> : <Building2 size={22} />}
        </span>
        <div>
          <h2>{user.role === 'seller' ? 'Sotuvchi profili' : 'Kompaniya profili'}</h2>
          <p className="muted">{user.email} · {user.role === 'seller' ? 'Sotuvchi' : 'Xaridor'}</p>
        </div>
      </div>

      <ImageInput value={form.logo} onChange={value => field('logo', value)} label="Logo yoki avatar" busy={busy} />

      <div className="formGrid">
        <label>
          {user.role === 'seller' ? 'Kompaniya nomi' : 'Do‘kon / kompaniya nomi'}
          <input maxLength={120} value={form.company} onChange={event => field('company', event.target.value)} placeholder="Masalan, Orient Savdo MChJ" />
        </label>
        <label>
          Telefon
          <input type="tel" maxLength={25} value={form.phone} onChange={event => field('phone', event.target.value)} placeholder="+998 90 123 45 67" />
        </label>
        <label>
          INN (ixtiyoriy)
          <input inputMode="numeric" maxLength={12} value={form.inn} onChange={event => field('inn', event.target.value)} placeholder="123456789" />
        </label>
      </div>

      <label>
        Manzil
        <input maxLength={240} value={form.address} onChange={event => field('address', event.target.value)} placeholder="Toshkent, Chilonzor tumani, ..." />
      </label>

      <label>
        Kompaniya haqida
        <textarea rows={3} maxLength={600} value={form.about} onChange={event => field('about', event.target.value)} placeholder="Faoliyat yo‘nalishi, yetkazib berish shartlari..." />
      </label>

      <div className="actions">
        <button className="primary" disabled={busy}>
          <Save size={16} /> {busy ? 'Saqlanmoqda…' : 'Profilni saqlash'}
        </button>
      </div>
    </form>
  );
}
