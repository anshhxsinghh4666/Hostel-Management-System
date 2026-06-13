import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import type { RoomAllocationPublic } from "@/lib/types";

type AllocationWithRelations = Prisma.RoomAllocationGetPayload<{
  include: {
    student: { include: { hostel: true; room: true } };
    room: { include: { hostel: true } };
  };
}>;

function toPublic(allocation: AllocationWithRelations): RoomAllocationPublic {
  const a = allocation as unknown as RoomAllocationPublic;
  return a;
}

export const allocationRepository = {
  async findById(id: string) {
    const allocation = await prisma.roomAllocation.findUnique({
      where: { id },
      include: {
        student: { include: { hostel: true, room: true } },
        room: { include: { hostel: true } },
      },
    });
    return allocation ? toPublic(allocation) : null;
  },

  async findByStudentId(studentId: string) {
    const allocations = await prisma.roomAllocation.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      include: {
        student: { include: { hostel: true, room: true } },
        room: { include: { hostel: true } },
      },
    });
    return allocations.map(toPublic);
  },

  async findActiveByStudentId(studentId: string) {
    const allocation = await prisma.roomAllocation.findFirst({
      where: { studentId, allocationStatus: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      include: {
        student: { include: { hostel: true, room: true } },
        room: { include: { hostel: true } },
      },
    });
    return allocation ? toPublic(allocation) : null;
  },

  async findByRoomId(roomId: string) {
    const allocations = await prisma.roomAllocation.findMany({
      where: { roomId, allocationStatus: "ACTIVE" },
      include: {
        student: { include: { hostel: true, room: true } },
        room: { include: { hostel: true } },
      },
    });
    return allocations.map(toPublic);
  },

  async findAll(params: {
    page: number;
    limit: number;
    status?: string;
    search?: string;
  }) {
    const { page, limit, status, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.RoomAllocationWhereInput = {};

    if (status) where.allocationStatus = status as "ACTIVE" | "TRANSFERRED" | "VACATED";
    if (search) {
      where.OR = [
        { student: { firstName: { contains: search, mode: "insensitive" } } },
        { student: { lastName: { contains: search, mode: "insensitive" } } },
        { student: { registrationNumber: { contains: search, mode: "insensitive" } } },
        { room: { roomNumber: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [allocations, total] = await Promise.all([
      prisma.roomAllocation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          student: { include: { hostel: true, room: true } },
          room: { include: { hostel: true } },
        },
      }),
      prisma.roomAllocation.count({ where }),
    ]);

    return {
      data: allocations.map(toPublic),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async create(data: { studentId: string; roomId: string }) {
    const allocation = await prisma.roomAllocation.create({
      data: {
        studentId: data.studentId,
        roomId: data.roomId,
        allocationStatus: "ACTIVE",
        allocatedDate: new Date(),
      },
      include: {
        student: { include: { hostel: true, room: true } },
        room: { include: { hostel: true } },
      },
    });
    return toPublic(allocation);
  },

  async markTransferred(id: string, newRoomId: string) {
    const allocation = await prisma.roomAllocation.update({
      where: { id },
      data: {
        allocationStatus: "TRANSFERRED",
        transferredDate: new Date(),
        roomId: newRoomId,
      },
      include: {
        student: { include: { hostel: true, room: true } },
        room: { include: { hostel: true } },
      },
    });
    return toPublic(allocation);
  },

  async markVacated(id: string) {
    const allocation = await prisma.roomAllocation.update({
      where: { id },
      data: {
        allocationStatus: "VACATED",
        vacatedDate: new Date(),
      },
      include: {
        student: { include: { hostel: true, room: true } },
        room: { include: { hostel: true } },
      },
    });
    return toPublic(allocation);
  },

  async countActiveByRoomId(roomId: string) {
    return prisma.roomAllocation.count({
      where: { roomId, allocationStatus: "ACTIVE" },
    });
  },

  async countRecentAllocations(days: number = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    return prisma.roomAllocation.count({
      where: { createdAt: { gte: since } },
    });
  },
};
