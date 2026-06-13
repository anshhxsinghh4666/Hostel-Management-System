import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { handleApiError } from "@/lib/utils/error-handler";
import { successResponse, unauthorizedResponse } from "@/lib/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const role = session.user.role;
    if (role !== "SUPER_ADMIN" && role !== "HOSTEL_ADMIN" && role !== "STAFF") {
      return unauthorizedResponse("Access denied");
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const hostelId = searchParams.get("hostelId");
    const studentSearch = searchParams.get("student");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (dateFrom) where.visitDate = { ...(where.visitDate as object || {}), gte: new Date(dateFrom) };
    if (dateTo) where.visitDate = { ...(where.visitDate as object || {}), lte: new Date(dateTo) };

    const studentWhere: Record<string, unknown> = {};
    if (hostelId) studentWhere.hostelId = hostelId;
    if (studentSearch) {
      studentWhere.OR = [
        { firstName: { contains: studentSearch, mode: "insensitive" } },
        { lastName: { contains: studentSearch, mode: "insensitive" } },
        { registrationNumber: { contains: studentSearch, mode: "insensitive" } },
      ];
    }
    if (Object.keys(studentWhere).length > 0) {
      where.student = studentWhere;
    }

    const [requests, total] = await Promise.all([
      prisma.visitorRequest.findMany({
        where: where as any,
        include: {
          visitor: true,
          student: {
            include: {
              hostel: true,
              room: true,
            },
          },
          gatePass: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.visitorRequest.count({ where: where as any }),
    ]);

    return successResponse(requests, undefined, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
