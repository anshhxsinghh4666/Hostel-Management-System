import { prisma } from "@/lib/db/prisma";

export const passwordResetRepository = {
  async create(data: {
    token: string;
    userId: string;
    expiresAt: Date;
  }) {
    return prisma.passwordResetToken.create({ data });
  },

  async findByToken(token: string) {
    return prisma.passwordResetToken.findUnique({ where: { token } });
  },

  async deleteByUserId(userId: string) {
    await prisma.passwordResetToken.deleteMany({ where: { userId } });
  },

  async delete(id: string) {
    await prisma.passwordResetToken.delete({ where: { id } });
  },
};
