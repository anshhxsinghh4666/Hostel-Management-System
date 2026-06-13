import { prisma } from "@/lib/db/prisma";
import { Prisma, StudentStatus } from "@prisma/client";
import { StudentPublic, HostelType, RoomType, RoomStatus } from "@/lib/types";

type StudentWithRelations = Prisma.StudentGetPayload<{
  include: { hostel: true; room: true };
}>;

function toPublic(student: StudentWithRelations): StudentPublic {
  return {
    id: student.id,
    registrationNumber: student.registrationNumber,
    firstName: student.firstName,
    lastName: student.lastName,
    gender: student.gender,
    email: student.email,
    phone: student.phone,
    course: student.course,
    year: student.year,
    guardianName: student.guardianName,
    guardianPhone: student.guardianPhone,
    address: student.address,
    hostelId: student.hostelId,
    roomId: student.roomId,
    checkInDate: student.checkInDate,
    status: student.status as StudentPublic["status"],
    createdAt: student.createdAt,
    hostel: student.hostel
      ? { id: student.hostel.id, hostelName: student.hostel.hostelName, hostelType: student.hostel.hostelType as HostelType }
      : null,
    room: student.room
      ? { id: student.room.id, roomNumber: student.room.roomNumber, floorNumber: student.room.floorNumber, roomType: student.room.roomType as RoomType, capacity: student.room.capacity, occupiedBeds: student.room.occupiedBeds, roomStatus: student.room.roomStatus as RoomStatus }
      : null,
  };
}

export const studentRepository = {
  async findById(id: string) {
    const student = await prisma.student.findUnique({
      where: { id },
      include: { hostel: true, room: true },
    });
    return student ? toPublic(student) : null;
  },

  async findByRegistrationNumber(registrationNumber: string) {
    return prisma.student.findUnique({ where: { registrationNumber } });
  },

  async findByEmail(email: string) {
    return prisma.student.findUnique({ where: { email } });
  },

  async findByPhone(phone: string) {
    return prisma.student.findUnique({ where: { phone } });
  },

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    hostelId?: string;
    roomId?: string;
    status?: StudentStatus;
  }) {
    const { page, limit, search, sortBy, sortOrder, hostelId, roomId, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.StudentWhereInput = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { registrationNumber: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    if (hostelId) where.hostelId = hostelId;
    if (roomId) where.roomId = roomId;
    if (status) where.status = status;

    const orderBy: Prisma.StudentOrderByWithRelationInput = {};
    if (sortBy) {
      (orderBy as Record<string, string>)[sortBy] = sortOrder || "desc";
    } else {
      orderBy.createdAt = "desc";
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: { hostel: true, room: true },
      }),
      prisma.student.count({ where }),
    ]);

    return {
      data: students.map(toPublic),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async create(data: {
    registrationNumber: string;
    firstName: string;
    lastName: string;
    gender: string;
    email: string;
    phone: string;
    course: string;
    year: number;
    guardianName: string;
    guardianPhone: string;
    address: string;
  }) {
    const student = await prisma.student.create({
      data: {
        registrationNumber: data.registrationNumber,
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        email: data.email,
        phone: data.phone,
        course: data.course,
        year: data.year,
        guardianName: data.guardianName,
        guardianPhone: data.guardianPhone,
        address: data.address,
      },
      include: { hostel: true, room: true },
    });
    return toPublic(student);
  },

  async update(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      course?: string;
      year?: number;
      guardianName?: string;
      guardianPhone?: string;
      address?: string;
      status?: StudentStatus;
    }
  ) {
    const student = await prisma.student.update({
      where: { id },
      data,
      include: { hostel: true, room: true },
    });
    return toPublic(student);
  },

  async assignRoom(id: string, hostelId: string, roomId: string) {
    const student = await prisma.student.update({
      where: { id },
      data: {
        hostelId,
        roomId,
        checkInDate: new Date(),
        status: "ACTIVE",
      },
      include: { hostel: true, room: true },
    });
    return toPublic(student);
  },

  async removeRoom(id: string) {
    const student = await prisma.student.update({
      where: { id },
      data: {
        hostelId: null,
        roomId: null,
        checkInDate: null,
      },
      include: { hostel: true, room: true },
    });
    return toPublic(student);
  },

  async deactivate(id: string) {
    const student = await prisma.student.update({
      where: { id },
      data: {
        status: "INACTIVE",
        hostelId: null,
        roomId: null,
        checkInDate: null,
      },
      include: { hostel: true, room: true },
    });
    return toPublic(student);
  },

  async count(where?: Prisma.StudentWhereInput) {
    return prisma.student.count({ where });
  },
};
