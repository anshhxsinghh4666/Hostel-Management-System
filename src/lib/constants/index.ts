import { Role } from "@/lib/types";

export const ROLES = {
  SUPER_ADMIN: Role.SUPER_ADMIN,
  HOSTEL_ADMIN: Role.HOSTEL_ADMIN,
  STAFF: Role.STAFF,
  STUDENT: Role.STUDENT,
} as const;

export const ROLE_LABELS: Record<Role, string> = {
  [Role.SUPER_ADMIN]: "Super Admin",
  [Role.HOSTEL_ADMIN]: "Hostel Admin",
  [Role.STAFF]: "Staff",
  [Role.STUDENT]: "Student",
};

export const ROLE_COLORS: Record<Role, string> = {
  [Role.SUPER_ADMIN]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  [Role.HOSTEL_ADMIN]: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  [Role.STAFF]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  [Role.STUDENT]: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

export const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

export const SESSION = {
  MAX_AGE: 30 * 24 * 60 * 60,
  UPDATE_AGE: 24 * 60 * 60,
};

export const PASSWORD_RESET = {
  EXPIRY_HOURS: 1,
  TOKEN_BYTES: 32,
};
