import { AuthCard } from "@/components/shared/auth-card";
import { RegisterForm } from "@/components/forms/register-form";

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create Account"
      description="Register for a new account"
    >
      <RegisterForm />
    </AuthCard>
  );
}
