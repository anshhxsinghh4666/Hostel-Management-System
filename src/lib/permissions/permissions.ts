import { Role } from "@/lib/types";

export function hasRole(userRole: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole);
}

export function canCreateUser(role: Role): boolean {
  return [Role.SUPER_ADMIN, Role.HOSTEL_ADMIN].includes(role);
}

export function canEditUser(role: Role): boolean {
  return [Role.SUPER_ADMIN, Role.HOSTEL_ADMIN].includes(role);
}

export function canDeleteUser(role: Role): boolean {
  return role === Role.SUPER_ADMIN;
}

export function canSuspendUser(role: Role): boolean {
  return role === Role.SUPER_ADMIN;
}

export function canRestoreUser(role: Role): boolean {
  return role === Role.SUPER_ADMIN;
}

export function canAssignRole(role: Role): boolean {
  return role === Role.SUPER_ADMIN;
}

export function canManageStudents(role: Role): boolean {
  return [Role.SUPER_ADMIN, Role.HOSTEL_ADMIN].includes(role);
}

export function canManageStaff(role: Role): boolean {
  return [Role.SUPER_ADMIN, Role.HOSTEL_ADMIN].includes(role);
}

export function canViewAuditLogs(role: Role): boolean {
  return role === Role.SUPER_ADMIN;
}

export function canManageUsers(role: Role): boolean {
  return [Role.SUPER_ADMIN, Role.HOSTEL_ADMIN, Role.STAFF].includes(role);
}

export function canAccessAllDashboards(role: Role): boolean {
  return role === Role.SUPER_ADMIN;
}

export function canViewHostelData(role: Role): boolean {
  return [Role.SUPER_ADMIN, Role.HOSTEL_ADMIN, Role.STAFF].includes(role);
}

export function getCreatableRoles(role: Role): Role[] {
  switch (role) {
    case Role.SUPER_ADMIN:
      return [Role.HOSTEL_ADMIN, Role.STAFF, Role.STUDENT];
    case Role.HOSTEL_ADMIN:
      return [Role.STAFF, Role.STUDENT];
    default:
      return [];
  }
}

export function getDashboardRoute(role: Role): string {
  switch (role) {
    case Role.SUPER_ADMIN:
      return "/admin/dashboard";
    case Role.HOSTEL_ADMIN:
      return "/hostel-admin/dashboard";
    case Role.STAFF:
      return "/staff/dashboard";
    case Role.STUDENT:
      return "/student/dashboard";
  }
}
