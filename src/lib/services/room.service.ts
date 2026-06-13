import { roomRepository } from "@/lib/repositories/room.repository";
import { hostelRepository } from "@/lib/repositories/hostel.repository";
import { auditService } from "./audit.service";
import { Role, RoomStatus, RoomType } from "@/lib/types";
import { canManageStudents } from "@/lib/permissions/permissions";

export const roomService = {
  async createRoom(
    actorRole: Role,
    actorId: string,
    data: {
      hostelId: string;
      roomNumber: string;
      floorNumber: number;
      capacity: number;
      roomType?: RoomType;
    }
  ) {
    if (!canManageStudents(actorRole)) {
      throw new Error("You do not have permission to create rooms");
    }

    const hostel = await hostelRepository.findById(data.hostelId);
    if (!hostel) throw new Error("Hostel not found");

    const existing = await roomRepository.findByRoomNumber(data.hostelId, data.roomNumber);
    if (existing) {
      throw new Error("A room with this number already exists in this hostel");
    }

    const room = await roomRepository.create({
      hostelId: data.hostelId,
      roomNumber: data.roomNumber,
      floorNumber: data.floorNumber,
      capacity: data.capacity,
      roomType: data.roomType,
    });

    await auditService.log({
      userId: actorId,
      action: "ROOM_CREATED",
      entity: "ROOM",
      entityId: room.id,
      metadata: { hostelId: data.hostelId, roomNumber: data.roomNumber },
    });

    return room;
  },

  async updateRoom(
    actorRole: Role,
    actorId: string,
    targetId: string,
    data: {
      roomNumber?: string;
      floorNumber?: number;
      capacity?: number;
      roomStatus?: RoomStatus;
    }
  ) {
    if (!canManageStudents(actorRole)) {
      throw new Error("You do not have permission to edit rooms");
    }

    const existing = await roomRepository.findById(targetId);
    if (!existing) throw new Error("Room not found");

    const room = await roomRepository.update(targetId, data);

    await auditService.log({ userId: actorId, action: "ROOM_UPDATED", entity: "ROOM", entityId: targetId });

    return room;
  },

  async getRooms(params: {
    page: number;
    limit: number;
    hostelId?: string;
    status?: RoomStatus;
    roomType?: RoomType;
    search?: string;
  }) {
    return roomRepository.findAll(params);
  },

  async getAvailableRooms(params: {
    page?: number;
    limit?: number;
    hostelId?: string;
    roomType?: RoomType;
    search?: string;
  }) {
    return roomRepository.findAvailable(params);
  },

  async getRoomById(id: string) {
    const room = await roomRepository.findById(id);
    if (!room) throw new Error("Room not found");
    return room;
  },
};
