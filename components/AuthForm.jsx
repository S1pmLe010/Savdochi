"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  Store,
  UserRound,
} from "lucide-react";

const emptyForm = { name: "", email: "", password: "" };

export default function AuthForm({ mode }) {
  const isLogin = mode === "login";
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [role, setRole] = useState("buyer");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState("");
  const switchTimer = useRef(null);

  useEffect(() => () => clearTimeout(switchTimer.current), []);

  useEffect(() => {
    router.prefetch(isLogin ? "/register" : "/login");
  }, [isLogin, router]);

  const field = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (error) setError("");
  };

  const switchMode = () => {
    if (busy || leaving) return;
    setLeaving(true);
    switchTimer.current = setTimeout(
      () => router.push(isLogin ? "/register" : "/login"),
      170
    );
  };

  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      const response = await fetch(
        "/api/auth/" + (isLogin ? "login" : "register"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isLogin
              ? { email: form.email.trim(), password: form.password }
              : {
                  name: form.name.trim(),
                  email: form.email.trim(),
                  password: form.password,
                  role,
                }
          ),
        }
      );
      const data = await response
        .json()
        .catch(() => ({ message: "Server javobini o‘qib bo‘lmadi" }));
      if (!response.ok) throw new Error(data.message || "So‘rov bajarilmadi");
      try {
        sessionStorage.setItem("savdochi:post-auth", data.user.role);
      } catch {}
      router.replace("/");
    } catch (err) {
      setError(err.message || "So‘rov bajarilmadi");
      setBusy(false);
    }
  };

  return (
    <div className={`authFormInner${leaving ? " is-leaving" : ""}`}>
      <div className="authHeading">
        <span className="authKicker">
          {isLogin ? "HISOBGA KIRISH" : "YANGI HISOB"}
        </span>
        <h1>{isLogin ? "Xush kelibsiz" : "Hisob yaratish"}</h1>
        <p>
          {isLogin
            ? "Kabinetga kirib, buyurtma va mahsulotlaringizni boshqaring."
            : "Tarmoqqa qo‘shiling va ulgurji savdoni boshlang."}
        </p>
      </div>

      <form className="authForm" onSubmit={submit} aria-busy={busy}>
        {!isLogin && (
          <div
            className="authRoles"
            role="radiogroup"
            aria-label="Hisob turi"
          >
            <button
              type="button"
              role="radio"
              aria-checked={role === "buyer"}
              aria-label="Xaridor hisobi"
              className={`authRole${role === "buyer" ? " is-selected" : ""}`}
              onClick={() => {
                setRole("buyer");
                if (error) setError("");
              }}
            >
              <span className="authRoleIcon">
                <Building2 size={17} aria-hidden="true" />
              </span>
              <span className="authRoleText">
                <b>Xaridor</b>
                <small>Biznes uchun xarid</small>
              </span>
              <span className="authRoleRadio" aria-hidden="true" />
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={role === "seller"}
              aria-label="Sotuvchi hisobi"
              className={`authRole${role === "seller" ? " is-selected" : ""}`}
              onClick={() => {
                setRole("seller");
                if (error) setError("");
              }}
            >
              <span className="authRoleIcon">
                <Store size={17} aria-hidden="true" />
              </span>
              <span className="authRoleText">
                <b>Sotuvchi</b>
                <small>Mahsulotlaringizni soting</small>
              </span>
              <span className="authRoleRadio" aria-hidden="true" />
            </button>
          </div>
        )}

        {!isLogin && (
          <label className="authField" htmlFor="auth-name">
            <span className="authFieldLabel">To‘liq ism yoki kompaniya</span>
            <span className="authInput">
              <UserRound
                size={16}
                className="authInputIcon"
                aria-hidden="true"
              />
              <input
                id="auth-name"
                name="name"
                type="text"
                required
                minLength={2}
                maxLength={120}
                autoComplete="organization"
                placeholder="Kompaniya nomi"
                value={form.name}
                onChange={(event) => field("name", event.target.value)}
              />
            </span>
          </label>
        )}

        <label className="authField" htmlFor="auth-email">
          <span className="authFieldLabel">Email</span>
          <span className="authInput">
            <Mail size={16} className="authInputIcon" aria-hidden="true" />
            <input
              id="auth-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="email@kompaniya.uz"
              value={form.email}
              onChange={(event) => field("email", event.target.value)}
            />
          </span>
        </label>

        <label className="authField" htmlFor="auth-password">
          <span className="authFieldLabel">Parol</span>
          <span className="authInput">
            <LockKeyhole
              size={16}
              className="authInputIcon"
              aria-hidden="true"
            />
            <input
              id="auth-password"
              name="password"
              type={visible ? "text" : "password"}
              required
              minLength={isLogin ? undefined : 8}
              autoComplete={isLogin ? "current-password" : "new-password"}
              placeholder={isLogin ? "Parolingiz" : "Kamida 8 belgi"}
              value={form.password}
              onChange={(event) => field("password", event.target.value)}
            />
            <button
              type="button"
              className="authEye"
              aria-label={visible ? "Parolni yashirish" : "Parolni ko‘rsatish"}
              aria-pressed={visible}
              onClick={() => setVisible((current) => !current)}
            >
              {visible ? (
                <EyeOff size={17} aria-hidden="true" />
              ) : (
                <Eye size={17} aria-hidden="true" />
              )}
            </button>
          </span>
        </label>

        {error && (
          <div className="authError" role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <button
          className="authSubmit"
          type="submit"
          disabled={busy || leaving}
        >
          {busy ? (
            <>
              <Loader2 size={17} className="authSpin" aria-hidden="true" />
              {isLogin ? "Kirilmoqda…" : "Yaratilmoqda…"}
            </>
          ) : (
            <>
              {isLogin ? "Kirish" : "Ro‘yxatdan o‘tish"}
              <ArrowRight size={17} aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      <p className="authSwitch">
        {isLogin ? "Hisobingiz yo‘qmi?" : "Allaqachon hisobingiz bormi?"}{" "}
        <button type="button" onClick={switchMode} disabled={busy || leaving}>
          {isLogin ? "Ro‘yxatdan o‘tish" : "Kirish"}
        </button>
      </p>
    </div>
  );
}
