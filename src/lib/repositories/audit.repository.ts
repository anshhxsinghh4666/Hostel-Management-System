import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import { AuditLogEntry, AuditLogQuery } from "@/lib/types";

export const auditRepository = {
  async create(input: {
    userId: string;
    action: string;
    entity: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }) {
    const { userId, action, entity, entityId, metadata } = input;
    const createArgs = {
      userId,
      action,
      entity,
      entityId: entityId ?? null,
      ...(metadata !== undefined ? { metadata } : {}),
    };
    await prisma.auditLog.create({ data: createArgs as Parameters<typeof prisma.auditLog.create>[0]['data'] });
  },

  async findAll(params: AuditLogQuery) {
    const { page, limit, userId, action, entity, from, to } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (userId) where.userId = userId;
    if (action) where.action = { contains: action, mode: "insensitive" };
    if (entity) where.entity = { contains: entity, mode: "insensitive" };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, fullName: true, email: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs as unknown as AuditLogEntry[],
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};
