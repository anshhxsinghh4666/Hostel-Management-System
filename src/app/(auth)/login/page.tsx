import { Suspense } from "react";
import { AuthCard } from "@/components/shared/auth-card";
import { LoginForm } from "@/components/forms/login-form";

function LoginFormWrapper() {
  return (
    <AuthCard
      title="Welcome Back"
      description="Sign in to your account to continue"
    >
      <LoginForm />
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginFormWrapper />
    </Suspense>
  );
}
