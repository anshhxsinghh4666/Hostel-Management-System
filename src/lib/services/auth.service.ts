import bcrypt from "bcryptjs";
import crypto from "crypto";
import { userRepository } from "@/lib/repositories/user.repository";
import { passwordResetRepository } from "@/lib/repositories/password-reset.repository";
import { auditService } from "./audit.service";
import { PASSWORD_RESET } from "@/lib/constants";

const SALT_ROUNDS = 12;

export const authService = {
  async register(data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  }) {
    const existingEmail = await userRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new Error("A user with this email already exists");
    }

    const existingPhone = await userRepository.findByPhone(data.phone);
    if (existingPhone) {
      throw new Error("A user with this phone number already exists");
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = await userRepository.create({
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      passwordHash,
      role: "STUDENT",
    });

    await auditService.logRegistration(user.id, {
      email: data.email,
      role: "STUDENT",
    });

    return user;
  },

  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (!user.isActive) {
      throw new Error("Your account has been suspended. Contact an administrator.");
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    await userRepository.update(user.id, { lastLogin: new Date() });
    await auditService.logLogin(user.id);

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.fullName,
    };
  },

  async logout(userId: string) {
    await auditService.logLogout(userId);
  },

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error("User not found");

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new Error("Current password is incorrect");
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await userRepository.update(userId, { passwordHash });

    await auditService.logProfileUpdate(userId, {
      action: "PASSWORD_CHANGED",
    });
  },

  async forgotPassword(email: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return;
    }

    await passwordResetRepository.deleteByUserId(user.id);

    const token = crypto.randomBytes(PASSWORD_RESET.TOKEN_BYTES).toString("hex");
    const expiresAt = new Date(Date.now() + PASSWORD_RESET.EXPIRY_HOURS * 60 * 60 * 1000);

    await passwordResetRepository.create({
      token,
      userId: user.id,
      expiresAt,
    });

    return { token };
  },

  async resetPassword(token: string, newPassword: string) {
    const resetToken = await passwordResetRepository.findByToken(token);
    if (!resetToken) {
      throw new Error("Invalid or expired reset token");
    }

    if (new Date() > resetToken.expiresAt) {
      await passwordResetRepository.delete(resetToken.id);
      throw new Error("Reset token has expired");
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await userRepository.update(resetToken.userId, { passwordHash });
    await passwordResetRepository.delete(resetToken.id);

    await auditService.logPasswordReset(resetToken.userId);
  },
};
