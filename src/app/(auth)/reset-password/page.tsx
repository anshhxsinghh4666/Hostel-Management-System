import { Suspense } from "react";
import { AuthCard } from "@/components/shared/auth-card";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";

function ResetPasswordFormWrapper() {
  return (
    <AuthCard
      title="Reset Password"
      description="Enter your reset token and new password"
    >
      <ResetPasswordForm />
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordFormWrapper />
    </Suspense>
  );
}
