import AuthForm from "@/components/AuthForm";

export const metadata = {
  title: "Sign In — Savdochi",
  description:
    "Sign in to your Savdochi business workspace and continue trading.",
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
