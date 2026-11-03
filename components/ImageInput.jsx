'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Link2, Loader2, X } from 'lucide-react';

async function compress(file) {
  if (file.size > 8 * 1024 * 1024) throw new Error('Fayl 8 MB dan kichik bo‘lishi kerak');
  const bitmap = await createImageBitmap(file);
  const max = 800;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  return canvas.toDataURL('image/jpeg', 0.72);
}

export default function ImageInput({ value, onChange, label = 'Rasm', busy }) {
  const inputRef = useRef(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  const pick = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    setWorking(true);
    try {
      const data = await compress(file);
      if (data.length > 400000) throw new Error('Rasm juda katta. Kichikroq rasm tanlang.');
      onChange(data);
    } catch (err) {
      setError(err.message || 'Rasmni o‘qib bo‘lmadi');
    } finally {
      setWorking(false);
    }
  };

  const isUpload = value?.startsWith('data:');

  return (
    <div className="imageInput">
      <span className="imageInputLabel">{label}</span>
      <div className="imageInputRow">
        <div className="imagePreview">
          {value ? <img src={value} alt="Ko‘rinish" /> : <ImagePlus size={22} />}
        </div>
        <div className="imageInputControls">
          <input ref={inputRef} type="file" accept="image/*" hidden onChange={pick} />
          <button
            type="button"
            className="secondary"
            onClick={() => inputRef.current?.click()}
            disabled={busy || working}
          >
            {working ? <><Loader2 size={15} className="authSpin" /> Yuklanmoqda…</> : 'Fayl tanlash'}
          </button>
          <div className="imageUrlRow">
            <Link2 size={15} />
            <input
              type="text"
              inputMode="url"
              placeholder="yoki rasm URL manzili"
              value={isUpload ? '' : value || ''}
              onChange={event => onChange(event.target.value)}
            />
          </div>
          {value && (
            <button type="button" className="imageRemove" onClick={() => onChange('')}>
              O‘chirish <X size={14} />
            </button>
          )}
          {error && <small className="errorText">{error}</small>}
        </div>
      </div>
    </div>
  );
}
