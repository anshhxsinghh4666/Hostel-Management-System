import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { handleApiError } from "@/lib/utils/error-handler";
import { successResponse, unauthorizedResponse, notFoundResponse, errorResponse } from "@/lib/utils/api-response";

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
    const hostelId = searchParams.get("hostelId");
    const studentSearch = searchParams.get("student");
    const status = searchParams.get("status");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status === "inside") {
      where.checkInTime = { not: null };
      where.checkOutTime = null;
    } else if (status === "exited") {
      where.checkOutTime = { not: null };
    }

    const gatePassWhere: Record<string, unknown> = {};
    const requestWhere: Record<string, unknown> = {};
    if (hostelId) requestWhere.student = { hostelId };
    if (studentSearch) {
      requestWhere.student = {
        ...(requestWhere.student as object || {}),
        OR: [
          { firstName: { contains: studentSearch, mode: "insensitive" } },
          { lastName: { contains: studentSearch, mode: "insensitive" } },
          { registrationNumber: { contains: studentSearch, mode: "insensitive" } },
        ],
      };
    }
    if (Object.keys(requestWhere).length > 0) {
      gatePassWhere.request = requestWhere;
    }
    if (Object.keys(gatePassWhere).length > 0) {
      where.gatePass = gatePassWhere;
    }

    const [logs, total] = await Promise.all([
      prisma.visitorLog.findMany({
        where: where as any,
        include: {
          gatePass: {
            include: {
              request: {
                include: {
                  visitor: true,
                  student: {
                    include: { hostel: true, room: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.visitorLog.count({ where: where as any }),
    ]);

    return successResponse(logs, undefined, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const role = session.user.role;
    if (role !== "SUPER_ADMIN" && role !== "HOSTEL_ADMIN" && role !== "STAFF") {
      return unauthorizedResponse("Access denied");
    }

    const body = await request.json();
    const { gatePassId, action } = body;

    if (!gatePassId || !action) {
      return errorResponse("Gate pass ID and action are required", 400);
    }

    const gatePass = await prisma.gatePass.findUnique({
      where: { id: gatePassId },
    });
    if (!gatePass) return notFoundResponse("Gate pass not found");

    if (action === "check-in") {
      const existingLog = await prisma.visitorLog.findFirst({
        where: { gatePassId, checkOutTime: null },
      });
      if (existingLog) {
        return errorResponse("Visitor already checked in", 400);
      }

      const log = await prisma.visitorLog.create({
        data: {
          gatePassId,
          checkInTime: new Date(),
        },
        include: {
          gatePass: {
            include: {
              request: {
                include: { visitor: true, student: true },
              },
            },
          },
        },
      });

      await prisma.gatePass.update({
        where: { id: gatePassId },
        data: { status: "USED" },
      });

      return successResponse(log, "Check-in recorded successfully", 201);
    } else if (action === "check-out") {
      const log = await prisma.visitorLog.findFirst({
        where: { gatePassId, checkOutTime: null },
      });
      if (!log) {
        return errorResponse("No active check-in found for this gate pass", 400);
      }

      const updated = await prisma.visitorLog.update({
        where: { id: log.id },
        data: { checkOutTime: new Date() },
        include: {
          gatePass: {
            include: {
              request: {
                include: { visitor: true, student: true },
              },
            },
          },
        },
      });

      return successResponse(updated, "Check-out recorded successfully");
    } else {
      return errorResponse("Invalid action. Use 'check-in' or 'check-out'.", 400);
    }
  } catch (error) {
    return handleApiError(error);
  }
}
