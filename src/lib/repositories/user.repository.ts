import { prisma } from "@/lib/db/prisma";
import { Prisma, Role } from "@prisma/client";
import { UserPublic, PaginationParams } from "@/lib/types";

function toPublic(user: {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  profileImage: string | null;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
}): UserPublic {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role as unknown as import("@/lib/types").Role,
    profileImage: user.profileImage,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
  };
}

export const userRepository = {
  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  async findByPhone(phone: string) {
    return prisma.user.findUnique({ where: { phone } });
  },

  async findAll(params: PaginationParams) {
    const { page, limit, search, sortBy, sortOrder, role, isActive } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;

    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    if (sortBy) {
      (orderBy as Record<string, string>)[sortBy] = sortOrder || "desc";
    } else {
      orderBy.createdAt = "desc";
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users.map(toPublic),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async create(data: {
    fullName: string;
    email: string;
    phone: string;
    passwordHash: string;
    role: Role;
  }) {
    const user = await prisma.user.create({ data });
    return toPublic(user);
  },

  async update(
    id: string,
    data: {
      fullName?: string;
      phone?: string;
      role?: Role;
      isActive?: boolean;
      profileImage?: string;
      lastLogin?: Date;
      passwordHash?: string;
    }
  ) {
    const user = await prisma.user.update({ where: { id }, data });
    return toPublic(user);
  },

  async softDelete(id: string) {
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
    return toPublic(user);
  },

  async restore(id: string) {
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: true },
    });
    return toPublic(user);
  },

  async count() {
    return prisma.user.count();
  },
};
