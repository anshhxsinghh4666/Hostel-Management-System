import { prisma } from "@/lib/db/prisma";
import { Prisma, RoomStatus, RoomType } from "@prisma/client";
import { RoomPublic, HostelType } from "@/lib/types";

type RoomWithHostel = Prisma.RoomGetPayload<{
  include: { hostel: true };
}>;

function toPublic(room: RoomWithHostel): RoomPublic {
  return {
    id: room.id,
    hostelId: room.hostelId,
    roomNumber: room.roomNumber,
    floorNumber: room.floorNumber,
    capacity: room.capacity,
    occupiedBeds: room.occupiedBeds,
    roomType: room.roomType as RoomPublic["roomType"],
    roomStatus: room.roomStatus as RoomPublic["roomStatus"],
    createdAt: room.createdAt,
    hostel: room.hostel
      ? { id: room.hostel.id, hostelName: room.hostel.hostelName, hostelType: room.hostel.hostelType as HostelType }
      : undefined,
  };
}

export const roomRepository = {
  async findById(id: string) {
    const room = await prisma.room.findUnique({
      where: { id },
      include: { hostel: true },
    });
    return room ? toPublic(room) : null;
  },

  async findByRoomNumber(hostelId: string, roomNumber: string) {
    return prisma.room.findUnique({
      where: { hostelId_roomNumber: { hostelId, roomNumber } },
    });
  },

  async findAll(params: {
    page: number;
    limit: number;
    hostelId?: string;
    status?: RoomStatus;
    roomType?: RoomType;
    search?: string;
  }) {
    const { page, limit, hostelId, status, roomType, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.RoomWhereInput = {};

    if (hostelId) where.hostelId = hostelId;
    if (status) where.roomStatus = status;
    if (roomType) where.roomType = roomType;
    if (search) {
      where.OR = [
        { roomNumber: { contains: search, mode: "insensitive" } },
        { hostel: { hostelName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ floorNumber: "asc" }, { roomNumber: "asc" }],
        include: { hostel: true },
      }),
      prisma.room.count({ where }),
    ]);

    return {
      data: rooms.map(toPublic),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findByHostel(hostelId: string) {
    return prisma.room.findMany({
      where: { hostelId },
      orderBy: [{ floorNumber: "asc" }, { roomNumber: "asc" }],
    });
  },

  async create(data: {
    hostelId: string;
    roomNumber: string;
    floorNumber: number;
    capacity: number;
    roomType?: RoomType;
  }) {
    const room = await prisma.room.create({
      data,
      include: { hostel: true },
    });
    return toPublic(room);
  },

  async update(
    id: string,
    data: {
      roomNumber?: string;
      floorNumber?: number;
      capacity?: number;
      roomStatus?: RoomStatus;
      occupiedBeds?: number;
    }
  ) {
    await prisma.room.update({
      where: { id },
      data,
    });

    if (data.occupiedBeds !== undefined || data.capacity !== undefined) {
      const updated = await prisma.room.findUnique({ where: { id } });
      if (updated && updated.roomStatus !== "MAINTENANCE") {
        const newStatus: RoomStatus =
          updated.occupiedBeds >= updated.capacity ? "FULL" : "AVAILABLE";
        if (newStatus !== updated.roomStatus) {
          await prisma.room.update({
            where: { id },
            data: { roomStatus: newStatus },
          });
        }
      }
    }

    const final = await prisma.room.findUnique({
      where: { id },
      include: { hostel: true },
    });
    return final ? toPublic(final) : null;
  },

  async updateOccupiedBeds(id: string, delta: number) {
    const room = await prisma.room.update({
      where: { id },
      data: { occupiedBeds: { increment: delta } },
      include: { hostel: true },
    });

    if (room.roomStatus !== "MAINTENANCE") {
      const newStatus: RoomStatus =
        room.occupiedBeds >= room.capacity ? "FULL" : "AVAILABLE";
      if (newStatus !== room.roomStatus) {
        await prisma.room.update({
          where: { id },
          data: { roomStatus: newStatus },
        });
      }
    }

    const final = await prisma.room.findUnique({
      where: { id },
      include: { hostel: true },
    });
    return final ? toPublic(final) : null;
  },

  async count() {
    return prisma.room.count();
  },

  async getAvailableBeds() {
    const rooms = await prisma.room.findMany({
      where: { roomStatus: { not: "MAINTENANCE" } },
      select: { capacity: true, occupiedBeds: true },
    });
    return rooms.reduce((sum, r) => sum + (r.capacity - r.occupiedBeds), 0);
  },

  async getOccupiedBeds() {
    const result = await prisma.room.aggregate({
      _sum: { occupiedBeds: true },
    });
    return result._sum.occupiedBeds || 0;
  },

  async findAvailable(params: {
    page?: number;
    limit?: number;
    hostelId?: string;
    roomType?: RoomType;
    search?: string;
  }) {
    const { page = 1, limit = 20, hostelId, roomType, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.RoomWhereInput = {
      roomStatus: { not: "MAINTENANCE" },
      occupiedBeds: { lt: prisma.room.fields.capacity },
    };

    if (hostelId) where.hostelId = hostelId;
    if (roomType) where.roomType = roomType;
    if (search) {
      where.OR = [
        { roomNumber: { contains: search, mode: "insensitive" } },
        { hostel: { hostelName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ floorNumber: "asc" }, { roomNumber: "asc" }],
        include: { hostel: true },
      }),
      prisma.room.count({ where }),
    ]);

    return {
      data: rooms.map(toPublic),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async countByStatus() {
    const [available, occupied, maintenance] = await Promise.all([
      prisma.room.count({ where: { roomStatus: "AVAILABLE" } }),
      prisma.room.count({ where: { roomStatus: "FULL" } }),
      prisma.room.count({ where: { roomStatus: "MAINTENANCE" } }),
    ]);
    return { available, occupied, maintenance };
  },

  async countByRoomType() {
    const [single, double, triple, dormitory] = await Promise.all([
      prisma.room.count({ where: { roomType: "SINGLE" } }),
      prisma.room.count({ where: { roomType: "DOUBLE" } }),
      prisma.room.count({ where: { roomType: "TRIPLE" } }),
      prisma.room.count({ where: { roomType: "DORMITORY" } }),
    ]);
    return { single, double, triple, dormitory };
  },
};
