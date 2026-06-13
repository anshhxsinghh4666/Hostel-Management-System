import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validations/auth.schema";
import { createUserSchema, updateUserSchema, userQuerySchema } from "@/lib/validations/user.schema";
import { updateProfileSchema, changePasswordSchema } from "@/lib/validations/profile.schema";
import { Role } from "@/lib/types";

describe("Validation Schemas", () => {
  describe("registerSchema", () => {
    it("validates correct registration data", () => {
      const result = registerSchema.safeParse({
        fullName: "John Doe",
        email: "john@example.com",
        phone: "+1-555-123-4567",
        password: "Test@1234",
        confirmPassword: "Test@1234",
      });
      expect(result.success).toBe(true);
    });

    it("rejects weak password", () => {
      const result = registerSchema.safeParse({
        fullName: "John Doe",
        email: "john@example.com",
        phone: "+1-555-123-4567",
        password: "weak",
        confirmPassword: "weak",
      });
      expect(result.success).toBe(false);
    });

    it("rejects mismatched passwords", () => {
      const result = registerSchema.safeParse({
        fullName: "John Doe",
        email: "john@example.com",
        phone: "+1-555-123-4567",
        password: "Test@1234",
        confirmPassword: "Different@1234",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid email", () => {
      const result = registerSchema.safeParse({
        fullName: "John Doe",
        email: "not-an-email",
        phone: "+1-555-123-4567",
        password: "Test@1234",
        confirmPassword: "Test@1234",
      });
      expect(result.success).toBe(false);
    });

    it("rejects short full name", () => {
      const result = registerSchema.safeParse({
        fullName: "J",
        email: "john@example.com",
        phone: "+1-555-123-4567",
        password: "Test@1234",
        confirmPassword: "Test@1234",
      });
      expect(result.success).toBe(false);
    });

    it("rejects password without uppercase", () => {
      const result = registerSchema.safeParse({
        fullName: "John Doe",
        email: "john@example.com",
        phone: "+1-555-123-4567",
        password: "test@1234",
        confirmPassword: "test@1234",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("loginSchema", () => {
    it("validates correct login data", () => {
      const result = loginSchema.safeParse({
        email: "john@example.com",
        password: "Test@1234",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty email", () => {
      const result = loginSchema.safeParse({
        email: "",
        password: "Test@1234",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty password", () => {
      const result = loginSchema.safeParse({
        email: "john@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("forgotPasswordSchema", () => {
    it("validates correct email", () => {
      const result = forgotPasswordSchema.safeParse({ email: "john@example.com" });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const result = forgotPasswordSchema.safeParse({ email: "invalid" });
      expect(result.success).toBe(false);
    });
  });

  describe("resetPasswordSchema", () => {
    it("validates correct reset data", () => {
      const result = resetPasswordSchema.safeParse({
        token: "valid-token",
        newPassword: "NewPass@123",
        confirmPassword: "NewPass@123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects mismatched passwords", () => {
      const result = resetPasswordSchema.safeParse({
        token: "valid-token",
        newPassword: "NewPass@123",
        confirmPassword: "Different@123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createUserSchema", () => {
    it("validates correct create user data", () => {
      const result = createUserSchema.safeParse({
        fullName: "Jane Smith",
        email: "jane@example.com",
        phone: "+1-555-987-6543",
        password: "Pass@1234",
        role: Role.STAFF,
      });
      expect(result.success).toBe(true);
    });

    it("validates all valid roles", () => {
      for (const role of [Role.SUPER_ADMIN, Role.HOSTEL_ADMIN, Role.STAFF, Role.STUDENT]) {
        const result = createUserSchema.safeParse({
          fullName: "Test User",
          email: `test-${role}@example.com`,
          phone: `+1-555-${Math.random().toString().slice(2, 6)}`,
          password: "Pass@1234",
          role,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("updateUserSchema", () => {
    it("validates partial update data", () => {
      const result = updateUserSchema.safeParse({ fullName: "Updated Name" });
      expect(result.success).toBe(true);
    });

    it("validates empty object", () => {
      const result = updateUserSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe("changePasswordSchema", () => {
    it("validates correct password change", () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: "OldPass@123",
        newPassword: "NewPass@456",
        confirmPassword: "NewPass@456",
      });
      expect(result.success).toBe(true);
    });

    it("rejects weak new password", () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: "OldPass@123",
        newPassword: "weak",
        confirmPassword: "weak",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateProfileSchema", () => {
    it("validates profile update", () => {
      const result = updateProfileSchema.safeParse({ phone: "+1-555-111-2222" });
      expect(result.success).toBe(true);
    });

    it("validates empty update", () => {
      const result = updateProfileSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe("userQuerySchema", () => {
    it("provides defaults when no params given", () => {
      const result = userQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
        expect(result.data.sortBy).toBe("createdAt");
        expect(result.data.sortOrder).toBe("desc");
      }
    });

    it("parses string numbers correctly", () => {
      const result = userQuerySchema.safeParse({ page: "3", limit: "25" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.limit).toBe(25);
      }
    });

    it("rejects limit over 100", () => {
      const result = userQuerySchema.safeParse({ limit: "200" });
      expect(result.success).toBe(false);
    });
  });
});
