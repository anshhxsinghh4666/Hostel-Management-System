import { prisma } from "@/lib/db/prisma";
import { Prisma, HostelType } from "@prisma/client";
import type { HostelPublic } from "@/lib/types";

type HostelWithRooms = Prisma.HostelGetPayload<{
  include: { rooms: true };
}>;

function toPublic(hostel: HostelWithRooms): HostelPublic {
  return hostel as unknown as HostelPublic;
}

export const hostelRepository = {
  async findById(id: string) {
    const hostel = await prisma.hostel.findUnique({
      where: { id },
      include: { rooms: true },
    });
    return hostel ? toPublic(hostel) : null;
  },

  async findByNameAndType(hostelName: string, hostelType: HostelType) {
    return prisma.hostel.findUnique({
      where: { hostelName_hostelType: { hostelName, hostelType } },
    });
  },

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    hostelType?: HostelType;
  }) {
    const { page, limit, search, hostelType } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.HostelWhereInput = {};

    if (search) {
      where.OR = [
        { hostelName: { contains: search, mode: "insensitive" } },
      ];
    }

    if (hostelType) where.hostelType = hostelType;

    const [hostels, total] = await Promise.all([
      prisma.hostel.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { rooms: true },
      }),
      prisma.hostel.count({ where }),
    ]);

    return {
      data: hostels.map(toPublic),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findAllSimple() {
    return prisma.hostel.findMany({ orderBy: { hostelName: "asc" } });
  },

  async create(data: {
    hostelName: string;
    hostelType: HostelType;
    totalRooms: number;
    totalCapacity: number;
  }) {
    const hostel = await prisma.hostel.create({
      data,
      include: { rooms: true },
    });
    return toPublic(hostel);
  },

  async update(
    id: string,
    data: {
      hostelName?: string;
      hostelType?: HostelType;
      totalRooms?: number;
      totalCapacity?: number;
    }
  ) {
    const hostel = await prisma.hostel.update({
      where: { id },
      data,
      include: { rooms: true },
    });
    return toPublic(hostel);
  },

  async updateOccupancy(id: string, delta: number) {
    const hostel = await prisma.hostel.update({
      where: { id },
      data: { occupiedCapacity: { increment: delta } },
      include: { rooms: true },
    });
    return toPublic(hostel);
  },

  async count() {
    return prisma.hostel.count();
  },

  async getTotalCapacity() {
    const result = await prisma.hostel.aggregate({
      _sum: { totalCapacity: true, occupiedCapacity: true },
    });
    return {
      totalCapacity: result._sum.totalCapacity || 0,
      occupiedCapacity: result._sum.occupiedCapacity || 0,
    };
  },
};
