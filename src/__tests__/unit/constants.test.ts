import { describe, it, expect, vi, beforeEach } from "vitest";
import { PASSWORD_RULES, ROLE_LABELS, PAGINATION, SESSION, PASSWORD_RESET } from "@/lib/constants";
import { Role } from "@/lib/types";

describe("Constants", () => {
  describe("PASSWORD_RULES", () => {
    it("requires minimum 8 characters", () => {
      expect(PASSWORD_RULES.minLength).toBe(8);
    });

    it("requires uppercase, lowercase, number, and special", () => {
      expect(PASSWORD_RULES.requireUppercase).toBe(true);
      expect(PASSWORD_RULES.requireLowercase).toBe(true);
      expect(PASSWORD_RULES.requireNumber).toBe(true);
      expect(PASSWORD_RULES.requireSpecial).toBe(true);
    });
  });

  describe("ROLE_LABELS", () => {
    it("has labels for all roles", () => {
      expect(ROLE_LABELS[Role.SUPER_ADMIN]).toBe("Super Admin");
      expect(ROLE_LABELS[Role.HOSTEL_ADMIN]).toBe("Hostel Admin");
      expect(ROLE_LABELS[Role.STAFF]).toBe("Staff");
      expect(ROLE_LABELS[Role.STUDENT]).toBe("Student");
    });
  });

  describe("PAGINATION", () => {
    it("has sensible defaults", () => {
      expect(PAGINATION.DEFAULT_PAGE).toBe(1);
      expect(PAGINATION.DEFAULT_LIMIT).toBe(10);
      expect(PAGINATION.MAX_LIMIT).toBe(100);
    });
  });

  describe("SESSION", () => {
    it("has 30 day max age", () => {
      expect(SESSION.MAX_AGE).toBe(30 * 24 * 60 * 60);
    });
  });

  describe("PASSWORD_RESET", () => {
    it("has 1 hour expiry", () => {
      expect(PASSWORD_RESET.EXPIRY_HOURS).toBe(1);
    });

    it("uses 32 byte tokens", () => {
      expect(PASSWORD_RESET.TOKEN_BYTES).toBe(32);
    });
  });
});
