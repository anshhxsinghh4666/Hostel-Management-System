import { z } from "zod";
import { StudentStatus } from "@/lib/types";

export const createStudentSchema = z.object({
  registrationNumber: z.string().min(1, "Registration number is required"),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  gender: z.enum(["male", "female"]),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\+?[\d\s-()]{7,20}$/, "Invalid phone number"),
  course: z.string().min(1, "Course is required"),
  year: z.number().int().positive("Year must be positive"),
  guardianName: z.string().min(1, "Guardian name is required"),
  guardianPhone: z.string().regex(/^\+?[\d\s-()]{7,20}$/, "Invalid guardian phone number"),
  address: z.string().min(1, "Address is required"),
});

export const updateStudentSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().regex(/^\+?[\d\s-()]{7,20}$/, "Invalid phone number").optional(),
  course: z.string().min(1).optional(),
  year: z.number().int().positive().optional(),
  guardianName: z.string().min(1).optional(),
  guardianPhone: z.string().regex(/^\+?[\d\s-()]{7,20}$/, "Invalid guardian phone number").optional(),
  address: z.string().min(1).optional(),
  status: z.nativeEnum(StudentStatus).optional(),
});

export const studentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  hostelId: z.string().optional(),
  roomId: z.string().optional(),
  status: z.nativeEnum(StudentStatus).optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type StudentQueryInput = z.infer<typeof studentQuerySchema>;
