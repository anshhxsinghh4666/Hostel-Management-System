import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { handleApiError } from "@/lib/utils/error-handler";
import { successResponse, unauthorizedResponse, notFoundResponse, errorResponse } from "@/lib/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const student = await prisma.student.findFirst({
      where: { email: session.user.email! },
    });
    if (!student) return notFoundResponse("Student profile not found");

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { studentId: student.id };
    if (status) where.status = status;
    if (search) {
      where.visitor = {
        name: { contains: search, mode: "insensitive" },
      };
    }

    const [requests, total] = await Promise.all([
      prisma.visitorRequest.findMany({
        where: where as any,
        include: {
          visitor: true,
          gatePass: true,
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.visitorRequest.count({ where: where as any }),
    ]);

    const stats = {
      total: await prisma.visitorRequest.count({ where: { studentId: student.id } }),
      pending: await prisma.visitorRequest.count({ where: { studentId: student.id, status: "PENDING" } }),
      approved: await prisma.visitorRequest.count({ where: { studentId: student.id, status: "APPROVED" } }),
      rejected: await prisma.visitorRequest.count({ where: { studentId: student.id, status: "REJECTED" } }),
    };

    return successResponse({ requests, stats }, undefined, 200, {
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

    const student = await prisma.student.findFirst({
      where: { email: session.user.email! },
    });
    if (!student) return notFoundResponse("Student profile not found");

    const body = await request.json();
    const { name, mobile, relation, purpose, visitDate, arrivalTime, departureTime } = body;

    if (!name || !mobile || !relation || !purpose || !visitDate || !arrivalTime || !departureTime) {
      return errorResponse("All fields are required", 400);
    }

    const mobileRegex = /^\+?[\d\s-()]{7,20}$/;
    if (!mobileRegex.test(mobile)) {
      return errorResponse("Invalid mobile number", 400);
    }

    const visitDateObj = new Date(visitDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (visitDateObj < today) {
      return errorResponse("Visit date cannot be in the past", 400);
    }

    const existingActive = await prisma.visitorRequest.findFirst({
      where: {
        studentId: student.id,
        status: { in: ["PENDING", "APPROVED"] },
        visitDate: visitDateObj,
        visitor: { name, mobile },
      },
      include: { visitor: true },
    });
    if (existingActive) {
      return errorResponse("An active request already exists for this visitor on this date", 400);
    }

    let visitor = await prisma.visitor.findFirst({
      where: { name, mobile },
    });

    if (!visitor) {
      visitor = await prisma.visitor.create({
        data: { name, mobile, relation },
      });
    }

    const visitorRequest = await prisma.visitorRequest.create({
      data: {
        studentId: student.id,
        visitorId: visitor.id,
        purpose,
        visitDate: visitDateObj,
        arrivalTime,
        departureTime,
      },
      include: { visitor: true },
    });

    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: "Visitor Request Submitted",
        message: `Visitor request for ${name} on ${visitDate} has been submitted successfully.`,
      },
    });

    return successResponse(visitorRequest, "Visitor request submitted successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
