import { AuthCard } from "@/components/shared/auth-card";
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Forgot Password"
      description="Enter your email to get a reset token"
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
