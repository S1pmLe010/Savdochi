import Link from "next/link";
import { Building2, Check, Store } from "lucide-react";

export default function AuthBrandPanel() {
  return (
    <aside className="authBrandPanel" aria-label="Savdochi">
      <div className="authBrandGlow" aria-hidden="true" />
      <div className="authBrandDots" aria-hidden="true" />

      <header className="authBrandHeader  ">
        <Link href="/" className="authBrandLogo" aria-label="Savdochi bosh sahifasi">
          <span className="authBrandMark">⬡</span>
          <span>SAVDOCHI</span>
        </Link>
        <span className="authBrandPill">B2B ULGURJI</span>
      </header>

      <div className="authBrandContent">
        <p className="authBrandEyebrow">
          <span aria-hidden="true" />
          YAGONA PLATFORM
        </p>
        <h2>
          Biznesingiz
          <br />
          <em>o‘sadi.</em>
        </h2>
        <p className="authBrandLead">
          Kompaniyalar va yetkazib beruvchilarni bitta aqlli platformada
          birlashtiramiz.
        </p>
        <ul className="authBrandFeatures">
          <li>
            <Check size={14} aria-hidden="true" /> Ishonchli hamkorlar
          </li>
          <li>
            <Check size={14} aria-hidden="true" /> Ulgurji narxlar
          </li>
          <li>
            <Check size={14} aria-hidden="true" /> Yagona buyurtma oqimi
          </li>
        </ul>
      </div>

      <div className="authBrandVisual" aria-hidden="true">
        <svg viewBox="0 0 600 320" preserveAspectRatio="none" focusable="false">
          <g fill="none" stroke="rgba(216,198,163,0.24)" strokeWidth="1">
            <path d="M52 246 C 168 246, 176 96, 300 96 S 432 246, 548 246" />
            <path
              d="M52 246 C 192 246, 236 26, 300 26 S 408 246, 548 246"
              strokeDasharray="3 8"
            />
          </g>
          <g fill="rgba(216,198,163,0.55)">
            <circle cx="52" cy="246" r="4" />
            <circle cx="300" cy="96" r="5" />
            <circle cx="548" cy="246" r="4" />
          </g>
        </svg>
        <span className="authNode authNodeCompanies">
          <Building2 size={15} aria-hidden="true" />
          KOMPANIYALAR
        </span>
        <span className="authNodeCore">⬡</span>
        <span className="authNode authNodeSuppliers">
          <Store size={15} aria-hidden="true" />
          SOTUVCHILAR
        </span>
      </div>

      <footer className="authBrandFooter">
        <span>Savdochi — biznes tarmog‘i</span>
        <span className="authBrandLine" aria-hidden="true" />
        <small>Kompaniyalar · Sotuvchilar · Buyurtmalar</small>
      </footer>
    </aside>
  );
}
