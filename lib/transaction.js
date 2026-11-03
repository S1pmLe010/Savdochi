import mongoose from "mongoose";

/**
 * MongoDB tranzaksiyalari faqat replica set yoki Atlas klasterida ishlaydi.
 * Lokal standalone MongoDB'da tranzaksiya ochilmasa, amalni tranzaksiyasiz
 * (ketma-ket) bajarib, demo muhitda ham buyurtma oqimi ishlashini ta'minlaymiz.
 */
export function isTransactionUnsupported(error) {
  const message = String(error?.message || "");
  return (
    /Transaction numbers are only allowed on a replica set member or mongos/i.test(message) ||
    /does not support transactions/i.test(message) ||
    (/replica set/i.test(message) && error?.code === 20)
  );
}

export async function withOptionalTransaction(work) {
  let session;
  try {
    session = await mongoose.startSession();
    let value;
    await session.withTransaction(async () => {
      value = await work(session);
    });
    return { value, transactional: true };
  } catch (error) {
    if (!isTransactionUnsupported(error)) throw error;
    if (session) {
      await session.endSession().catch(() => {});
      session = null;
    }
    const value = await work(null);
    return { value, transactional: false };
  } finally {
    if (session) await session.endSession().catch(() => {});
  }
}
