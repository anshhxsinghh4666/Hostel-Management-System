import { describe, it, expect } from "vitest";
import {
  canCreateUser,
  canEditUser,
  canDeleteUser,
  canSuspendUser,
  canRestoreUser,
  canAssignRole,
  canManageStudents,
  canManageStaff,
  canViewAuditLogs,
  getCreatableRoles,
  getDashboardRoute,
  hasRole,
} from "@/lib/permissions/permissions";
import { Role } from "@/lib/types";

describe("RBAC Permissions", () => {
  describe("canCreateUser", () => {
    it("allows SUPER_ADMIN to create users", () => {
      expect(canCreateUser(Role.SUPER_ADMIN)).toBe(true);
    });

    it("allows HOSTEL_ADMIN to create users", () => {
      expect(canCreateUser(Role.HOSTEL_ADMIN)).toBe(true);
    });

    it("denies STAFF to create users", () => {
      expect(canCreateUser(Role.STAFF)).toBe(false);
    });

    it("denies STUDENT to create users", () => {
      expect(canCreateUser(Role.STUDENT)).toBe(false);
    });
  });

  describe("canDeleteUser", () => {
    it("allows only SUPER_ADMIN to delete users", () => {
      expect(canDeleteUser(Role.SUPER_ADMIN)).toBe(true);
      expect(canDeleteUser(Role.HOSTEL_ADMIN)).toBe(false);
      expect(canDeleteUser(Role.STAFF)).toBe(false);
      expect(canDeleteUser(Role.STUDENT)).toBe(false);
    });
  });

  describe("canViewAuditLogs", () => {
    it("allows only SUPER_ADMIN to view audit logs", () => {
      expect(canViewAuditLogs(Role.SUPER_ADMIN)).toBe(true);
      expect(canViewAuditLogs(Role.HOSTEL_ADMIN)).toBe(false);
      expect(canViewAuditLogs(Role.STAFF)).toBe(false);
      expect(canViewAuditLogs(Role.STUDENT)).toBe(false);
    });
  });

  describe("getCreatableRoles", () => {
    it("returns HOSTEL_ADMIN, STAFF, STUDENT for SUPER_ADMIN", () => {
      const roles = getCreatableRoles(Role.SUPER_ADMIN);
      expect(roles).toEqual([Role.HOSTEL_ADMIN, Role.STAFF, Role.STUDENT]);
    });

    it("returns STAFF, STUDENT for HOSTEL_ADMIN", () => {
      const roles = getCreatableRoles(Role.HOSTEL_ADMIN);
      expect(roles).toEqual([Role.STAFF, Role.STUDENT]);
    });

    it("returns empty array for STAFF", () => {
      expect(getCreatableRoles(Role.STAFF)).toEqual([]);
    });

    it("returns empty array for STUDENT", () => {
      expect(getCreatableRoles(Role.STUDENT)).toEqual([]);
    });
  });

  describe("getDashboardRoute", () => {
    it("returns correct route for each role", () => {
      expect(getDashboardRoute(Role.SUPER_ADMIN)).toBe("/admin/dashboard");
      expect(getDashboardRoute(Role.HOSTEL_ADMIN)).toBe("/hostel-admin/dashboard");
      expect(getDashboardRoute(Role.STAFF)).toBe("/staff/dashboard");
      expect(getDashboardRoute(Role.STUDENT)).toBe("/student/dashboard");
    });
  });

  describe("hasRole", () => {
    it("returns true when role is in allowed list", () => {
      expect(hasRole(Role.SUPER_ADMIN, [Role.SUPER_ADMIN])).toBe(true);
    });

    it("returns false when role is not in allowed list", () => {
      expect(hasRole(Role.STUDENT, [Role.SUPER_ADMIN, Role.STAFF])).toBe(false);
    });
  });

  describe("cross-role permissions", () => {
    it("SUPER_ADMIN can manage everything", () => {
      expect(canEditUser(Role.SUPER_ADMIN)).toBe(true);
      expect(canSuspendUser(Role.SUPER_ADMIN)).toBe(true);
      expect(canRestoreUser(Role.SUPER_ADMIN)).toBe(true);
      expect(canAssignRole(Role.SUPER_ADMIN)).toBe(true);
      expect(canManageStudents(Role.SUPER_ADMIN)).toBe(true);
      expect(canManageStaff(Role.SUPER_ADMIN)).toBe(true);
    });

    it("HOSTEL_ADMIN can manage students and staff but cannot assign roles", () => {
      expect(canManageStudents(Role.HOSTEL_ADMIN)).toBe(true);
      expect(canManageStaff(Role.HOSTEL_ADMIN)).toBe(true);
      expect(canAssignRole(Role.HOSTEL_ADMIN)).toBe(false);
      expect(canSuspendUser(Role.HOSTEL_ADMIN)).toBe(false);
    });

    it("STAFF has minimal permissions", () => {
      expect(canCreateUser(Role.STAFF)).toBe(false);
      expect(canEditUser(Role.STAFF)).toBe(false);
      expect(canDeleteUser(Role.STAFF)).toBe(false);
    });

    it("STUDENT has no management permissions", () => {
      expect(canCreateUser(Role.STUDENT)).toBe(false);
      expect(canEditUser(Role.STUDENT)).toBe(false);
      expect(canDeleteUser(Role.STUDENT)).toBe(false);
      expect(canManageStudents(Role.STUDENT)).toBe(false);
      expect(canViewAuditLogs(Role.STUDENT)).toBe(false);
    });
  });
});
