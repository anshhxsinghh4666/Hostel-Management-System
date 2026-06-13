import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { handleApiError } from "@/lib/utils/error-handler";
import { successResponse, unauthorizedResponse, forbiddenResponse } from "@/lib/utils/api-response";
import { canManageStudents } from "@/lib/permissions/permissions";
import { Role } from "@/lib/types";
import { z } from "zod";

const createPaymentSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  amount: z.number().positive("Amount must be positive"),
  paymentMethod: z.enum(["CASH", "CARD", "UPI", "BANK_TRANSFER", "CHEQUE"]),
  status: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED"]).default("COMPLETED"),
  transactionId: z.string().optional(),
  remarks: z.string().optional(),
  paymentDate: z.string().optional(),
});

const paymentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const query = paymentQuerySchema.parse(Object.fromEntries(searchParams));

    const where: Record<string, unknown> = {};
    if (query.status && query.status !== "__all__") where.status = query.status;
    if (query.search) {
      where.student = {
        OR: [
          { firstName: { contains: query.search, mode: "insensitive" } },
          { lastName: { contains: query.search, mode: "insensitive" } },
          { registrationNumber: { contains: query.search, mode: "insensitive" } },
        ],
      };
    }
    if (query.startDate || query.endDate) {
      where.paymentDate = {};
      if (query.startDate) (where.paymentDate as Record<string, unknown>).gte = new Date(query.startDate);
      if (query.endDate) (where.paymentDate as Record<string, unknown>).lte = new Date(query.endDate);
    }

    const skip = (query.page - 1) * query.limit;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: where as any,
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true, registrationNumber: true, course: true, year: true },
          },
        },
        orderBy: { paymentDate: "desc" },
        skip,
        take: query.limit,
      }),
      prisma.payment.count({ where: where as any }),
    ]);

    return successResponse(payments, undefined, 200, {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const actorRole = session.user.role as Role;
    if (!canManageStudents(actorRole)) {
      return forbiddenResponse("You do not have permission to create payments");
    }

    const body = await request.json();
    const data = createPaymentSchema.parse(body);

    const student = await prisma.student.findUnique({ where: { id: data.studentId } });
    if (!student) throw new Error("Student not found");

    const payment = await prisma.payment.create({
      data: {
        studentId: data.studentId,
        amount: data.amount,
        paymentMethod: data.paymentMethod as any,
        status: data.status as any,
        transactionId: data.transactionId,
        remarks: data.remarks,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, registrationNumber: true },
        },
      },
    });

    const user = await prisma.user.findFirst({ where: { email: student.email } });
    if (user) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: data.status === "COMPLETED" ? "Payment Received" : "Payment Recorded",
          message: `₹${data.amount.toLocaleString()} payment for ${student.firstName} ${student.lastName} has been recorded as ${data.status}.`,
        },
      });
    }

    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: "Payment Recorded",
        message: `Payment of ₹${data.amount.toLocaleString()} for ${student.firstName} ${student.lastName} has been recorded.`,
      },
    });

    return successResponse(payment, "Payment recorded successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
