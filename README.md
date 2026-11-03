# Savdochi

Next.js + MongoDB wholesale ordering MVP.

## Run

1. `npm ci`
2. Copy `.env.example` to `.env.local` and configure `MONGODB_URI` and `AUTH_SECRET`.
3. `npm run dev`

MongoDB must support transactions (Atlas or a replica set). Existing users are preserved. Product and order collections are created automatically. Never commit environment secrets.

## Demo ma'lumotlar

```bash
npm run seed         # demo hisob, mahsulot va buyurtmalarni qo'shadi/yangilaydi
npm run seed:reset   # faqat demo yozuvlarni o'chirib, boshidan yaratadi
```

Skript `MONGODB_URI` ni `.env.local` yoki `.env` dan o'qiydi. Parolni
`SEED_PASSWORD=...` bilan almashtirish mumkin.

| Rol | Email | Parol |
| --- | --- | --- |
| Sotuvchi | `seller1@savdochi.uz` | `Savdochi123!` |
| Sotuvchi | `seller2@savdochi.uz` | `Savdochi123!` |
| Xaridor | `buyer@savdochi.uz` | `Savdochi123!` |

Seed 20 ta mahsulot va 6 ta buyurtma (pending, confirmed, shipped, delivered,
cancelled) yaratadi. `seed:reset` faqat shu uchta demo hisobga tegishli
yozuvlarni o'chiradi; haqiqiy foydalanuvchilar saqlanadi. Demo hisoblar bilan
haqiqiy buyurtma bersangiz, seed'ni qayta ishga tushirish ularning qoldig'ini
boshlang'ich holatga qaytarishini unutmang.

## MVP

- Cookie login and buyer/seller roles.
- Public catalog with category, supplier and text filters.
- Seller-owned product create/edit/archive, unit price, available stock and minimum quantity.
- Browser-persisted cart, quantity controls and address/phone checkout.
- Atomic multi-seller checkout: authoritative database prices, stock reservation and idempotent request IDs.
- Seller statuses: pending → confirmed → shipped → delivered; cancellation before shipping restores stock once.
- Buyer cancellation while pending and private order history. Order item snapshots survive product edits/deletion.
- Profile autofill at checkout; pickup without required address; order status filters and search.
- In-app notifications with deep links; low-stock alerts when sellers save inventory.
- SPA page restored via `#hash` / session after refresh.

Stock shown in the seller form is available stock, excluding already reserved orders. Removing a product archives it. Payment and delivery are agreed directly with the seller; online payments and chat are not implemented.

## Verification

- `npm test` checks validation and allowed status transitions.
- `npm run build` checks production compilation.
- `SAVDOCHI_TEST_URL=<url> npm run test:integration` runs actual registration, product and order requests. **Use only a disposable database**: it creates test accounts/orders/products. It covers seller isolation, buyer permissions, transaction rollback, concurrent stock reservations, idempotent checkout, cancellation, price snapshots and session recovery.
