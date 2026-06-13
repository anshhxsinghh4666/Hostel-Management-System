import { z } from "zod";
import { HostelType } from "@/lib/types";

export const createHostelSchema = z.object({
  hostelName: z.string().min(1, "Hostel name is required").max(200),
  hostelType: z.nativeEnum(HostelType),
  totalRooms: z.number().int().positive("Must have at least 1 room"),
  totalCapacity: z.number().int().positive("Capacity must be positive"),
});

export const updateHostelSchema = z.object({
  hostelName: z.string().min(1).max(200).optional(),
  hostelType: z.nativeEnum(HostelType).optional(),
  totalRooms: z.number().int().positive().optional(),
  totalCapacity: z.number().int().positive().optional(),
});

export const hostelQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  hostelType: z.nativeEnum(HostelType).optional(),
});

export type CreateHostelInput = z.infer<typeof createHostelSchema>;
export type UpdateHostelInput = z.infer<typeof updateHostelSchema>;
