import { hostelRepository } from "@/lib/repositories/hostel.repository";
import { auditService } from "./audit.service";
import { Role, HostelType } from "@/lib/types";
import { canManageStudents } from "@/lib/permissions/permissions";

export const hostelService = {
  async createHostel(
    actorRole: Role,
    actorId: string,
    data: {
      hostelName: string;
      hostelType: HostelType;
      totalRooms: number;
      totalCapacity: number;
    }
  ) {
    if (!canManageStudents(actorRole)) {
      throw new Error("You do not have permission to create hostels");
    }

    const existing = await hostelRepository.findByNameAndType(data.hostelName, data.hostelType);
    if (existing) {
      throw new Error("A hostel with this name and type already exists");
    }

    const hostel = await hostelRepository.create(data);

    await auditService.log({
      userId: actorId,
      action: "HOSTEL_CREATED",
      entity: "HOSTEL",
      entityId: hostel.id,
      metadata: { hostelName: data.hostelName, hostelType: data.hostelType },
    });

    return hostel;
  },

  async updateHostel(
    actorRole: Role,
    actorId: string,
    targetId: string,
    data: {
      hostelName?: string;
      hostelType?: HostelType;
      totalRooms?: number;
      totalCapacity?: number;
    }
  ) {
    if (!canManageStudents(actorRole)) {
      throw new Error("You do not have permission to edit hostels");
    }

    const existing = await hostelRepository.findById(targetId);
    if (!existing) throw new Error("Hostel not found");

    const hostel = await hostelRepository.update(targetId, data);

    await auditService.log({ userId: actorId, action: "HOSTEL_UPDATED", entity: "HOSTEL", entityId: targetId });

    return hostel;
  },

  async getHostels(params: {
    page: number;
    limit: number;
    search?: string;
    hostelType?: HostelType;
  }) {
    return hostelRepository.findAll(params);
  },

  async getHostelById(id: string) {
    const hostel = await hostelRepository.findById(id);
    if (!hostel) throw new Error("Hostel not found");
    return hostel;
  },

  async getAllHostels() {
    return hostelRepository.findAllSimple();
  },
};
