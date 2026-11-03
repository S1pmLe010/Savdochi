import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import AuthBrandPanel from "@/components/AuthBrandPanel";
import "../auth.css";

export default function AuthLayout({ children }) {
  return (
    <div className="authScreen">
      <main className="authFormPane">
        <div className="authPaneTop">
          <Link href="/" className="authBack">
            <ArrowLeft size={15} aria-hidden="true" />
            Back to Savdochi
          </Link>
          <span className="authSecure">
            <ShieldCheck size={14} aria-hidden="true" />
            Secure session
          </span>
        </div>

        <div className="authMobileBrand">
          <span className="authBrandMark" aria-hidden="true">
            ⬡
          </span>
          SAVDOCHI
        </div>

        <div className="authFormStage">{children}</div>

        <p className="authLegal">
          SAVDOCHI <span aria-hidden="true">·</span> B2B commerce platform
        </p>
      </main>

      <AuthBrandPanel />
    </div>
  );
}
