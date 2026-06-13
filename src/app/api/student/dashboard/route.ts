import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { studentRepository } from "@/lib/repositories/student.repository";
import { roomRepository } from "@/lib/repositories/room.repository";
import { allocationRepository } from "@/lib/repositories/allocation.repository";
import { handleApiError } from "@/lib/utils/error-handler";
import { successResponse, unauthorizedResponse, notFoundResponse } from "@/lib/utils/api-response";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const students = await studentRepository.findAll({
      page: 1,
      limit: 1,
      search: session.user.email || undefined,
    });

    const student = students.data[0];
    if (!student) return notFoundResponse("Student profile not found");

    let room = null;
    let roommates: unknown[] = [];
    let activeAllocation = null;

    if (student.roomId) {
      room = await roomRepository.findById(student.roomId);
      const allocations = await allocationRepository.findByRoomId(student.roomId);
      roommates = allocations
        .filter((a) => a.studentId !== student.id)
        .map((a) => a.student);
      activeAllocation = await allocationRepository.findActiveByStudentId(student.id);
    }

    const [totalComplaints, pendingComplaints, resolvedComplaints, totalLeaveRequests, approvedLeaves, pendingLeaves] = await Promise.all([
      prisma.complaint.count({ where: { studentId: student.id } }),
      prisma.complaint.count({ where: { studentId: student.id, status: "PENDING" } }),
      prisma.complaint.count({ where: { studentId: student.id, status: "RESOLVED" } }),
      prisma.leaveRequest.count({ where: { studentId: student.id } }),
      prisma.leaveRequest.count({ where: { studentId: student.id, status: "APPROVED" } }),
      prisma.leaveRequest.count({ where: { studentId: student.id, status: "PENDING" } }),
    ]);

    return successResponse({
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      },
      student,
      room,
      roommates,
      pendingComplaintsCount: pendingComplaints,
      totalComplaints,
      resolvedComplaints,
      totalNotices: 0,
      totalLeaveRequests,
      approvedLeaves,
      pendingLeaves,
      recentAllocation: activeAllocation,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
