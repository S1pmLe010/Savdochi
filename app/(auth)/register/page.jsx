import AuthForm from "@/components/AuthForm";

export const metadata = {
  title: "Create Account — Savdochi",
  description:
    "Create a Savdochi company or seller account and join the B2B network.",
};

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}
