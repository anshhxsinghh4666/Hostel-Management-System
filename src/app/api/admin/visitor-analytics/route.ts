import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { handleApiError } from "@/lib/utils/error-handler";
import { successResponse, unauthorizedResponse } from "@/lib/utils/api-response";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const role = session.user.role;
    if (role !== "SUPER_ADMIN" && role !== "HOSTEL_ADMIN") {
      return unauthorizedResponse("Access denied");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const totalVisitors = await prisma.visitorRequest.count();
    const visitorsToday = await prisma.visitorRequest.count({
      where: { visitDate: { gte: today } },
    });
    const visitorsThisMonth = await prisma.visitorRequest.count({
      where: { visitDate: { gte: startOfMonth } },
    });
    const totalRequests = await prisma.visitorRequest.count();
    const pendingRequests = await prisma.visitorRequest.count({ where: { status: "PENDING" } });
    const approvedRequests = await prisma.visitorRequest.count({ where: { status: "APPROVED" } });
    const rejectedRequests = await prisma.visitorRequest.count({ where: { status: "REJECTED" } });

    const [requestsByDate, monthlyRequests, topStudents] = await Promise.all([
      prisma.visitorRequest.groupBy({
        by: ["visitDate"],
        _count: { id: true },
        where: { visitDate: { gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) } },
        orderBy: { visitDate: "asc" },
      }),
      prisma.visitorRequest.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.visitorRequest.groupBy({
        by: ["studentId"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
    ]);

    const topStudentDetails = await Promise.all(
      (topStudents || []).map(async (s: { studentId: string; _count: { id: number } }) => {
        const student = await prisma.student.findUnique({
          where: { id: s.studentId },
          include: { hostel: true },
        });
        return {
          student,
          requestCount: s._count.id,
        };
      })
    );

    const hostelCountMap: Record<string, number> = {};
    for (const item of topStudentDetails) {
      const name = item.student?.hostel?.hostelName || "Unknown";
      hostelCountMap[name] = (hostelCountMap[name] || 0) + item.requestCount;
    }

    const approvalVsRejection = {
      approved: approvedRequests,
      rejected: rejectedRequests,
      pending: pendingRequests,
    };

    return successResponse({
      overview: {
        totalVisitors,
        visitorsToday,
        visitorsThisMonth,
        totalRequests,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
      },
      dailyVisitors: requestsByDate.map((r: { visitDate: Date; _count: { id: number } }) => ({
        date: r.visitDate,
        count: r._count.id,
      })),
      monthlyRequests,
      approvalVsRejection,
      mostVisitedHostel: hostelCountMap,
      topActiveStudents: topStudentDetails,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
