import { z } from "zod";
import { RoomStatus, RoomType, AllocationStatus } from "@/lib/types";

export const createRoomSchema = z.object({
  hostelId: z.string().uuid("Invalid hostel"),
  roomNumber: z.string().min(1, "Room number is required"),
  floorNumber: z.number().int().min(0, "Floor must be 0 or more"),
  capacity: z.number().int().positive("Capacity must be positive"),
  roomType: z.nativeEnum(RoomType).optional(),
});

export const updateRoomSchema = z.object({
  roomNumber: z.string().min(1).optional(),
  floorNumber: z.number().int().min(0).optional(),
  capacity: z.number().int().positive().optional(),
  roomStatus: z.nativeEnum(RoomStatus).optional(),
  roomType: z.nativeEnum(RoomType).optional(),
});

export const roomQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  hostelId: z.string().optional(),
  status: z.nativeEnum(RoomStatus).optional(),
  roomType: z.nativeEnum(RoomType).optional(),
  search: z.string().optional(),
});

export const allocateRoomSchema = z.object({
  studentId: z.string().uuid("Invalid student"),
  roomId: z.string().uuid("Invalid room"),
});

export const transferRoomSchema = z.object({
  studentId: z.string().uuid("Invalid student"),
  newRoomId: z.string().uuid("Invalid room"),
});

export const allocationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.nativeEnum(AllocationStatus).optional(),
  search: z.string().optional(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type AllocateRoomInput = z.infer<typeof allocateRoomSchema>;
export type TransferRoomInput = z.infer<typeof transferRoomSchema>;
