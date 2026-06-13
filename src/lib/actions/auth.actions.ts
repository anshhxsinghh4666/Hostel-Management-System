"use server";

import { auth, signIn, signOut } from "@/lib/auth/auth";
import { authService } from "@/lib/services/auth.service";
import { userService } from "@/lib/services/user.service";
import { auditService } from "@/lib/services/audit.service";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth.schema";
import {
  createUserSchema,
  updateUserSchema,
} from "@/lib/validations/user.schema";
import {
  changePasswordSchema,
  updateProfileSchema,
} from "@/lib/validations/profile.schema";
import { Role } from "@/lib/types";

export async function registerAction(formData: FormData) {
  const data = registerSchema.parse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  await authService.register(data);
}

export async function loginAction(formData: FormData) {
  const data = loginSchema.parse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  await signIn("credentials", {
    email: data.email,
    password: data.password,
    redirect: false,
  });
}

export async function logoutAction() {
  const session = await auth();
  if (session?.user?.id) {
    await authService.logout(session.user.id);
  }
  await signOut({ redirect: false });
}

export async function forgotPasswordAction(formData: FormData) {
  const data = forgotPasswordSchema.parse({
    email: formData.get("email"),
  });

  await authService.forgotPassword(data.email);
}

export async function resetPasswordAction(formData: FormData) {
  const data = resetPasswordSchema.parse({
    token: formData.get("token"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  await authService.resetPassword(data.token, data.newPassword);
}

export async function createUserAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const data = createUserSchema.parse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  await userService.createUser(
    session.user.role as Role,
    session.user.id,
    data
  );
}

export async function updateUserAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  if (!id) throw new Error("User ID is required");

  const data = updateUserSchema.parse({
    fullName: formData.get("fullName") || undefined,
    phone: formData.get("phone") || undefined,
    role: formData.get("role") || undefined,
    isActive: formData.get("isActive") === "true" ? true : formData.get("isActive") === "false" ? false : undefined,
  });

  await userService.updateUser(
    session.user.role as Role,
    session.user.id,
    id,
    data
  );
}

export async function changePasswordAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const data = changePasswordSchema.parse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  await authService.changePassword(
    session.user.id,
    data.currentPassword,
    data.newPassword
  );
}

export async function updateProfileAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const data = updateProfileSchema.parse({
    fullName: formData.get("fullName") || undefined,
    phone: formData.get("phone") || undefined,
  });

  await userService.updateUser(
    session.user.role as Role,
    session.user.id,
    session.user.id,
    data
  );

  await auditService.logProfileUpdate(session.user.id);
}
