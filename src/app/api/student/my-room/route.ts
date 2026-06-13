import { auth } from "@/lib/auth/auth";
import { studentRepository } from "@/lib/repositories/student.repository";
import { roomRepository } from "@/lib/repositories/room.repository";
import { allocationRepository } from "@/lib/repositories/allocation.repository";
import { handleApiError } from "@/lib/utils/error-handler";
import { successResponse, unauthorizedResponse, notFoundResponse } from "@/lib/utils/api-response";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const user = session.user;
    const students = await studentRepository.findAll({
      page: 1,
      limit: 1,
      search: user.email || undefined,
    });

    const student = students.data[0];
    if (!student) return notFoundResponse("Student profile not found");

    if (!student.roomId) {
      return successResponse({
        student,
        room: null,
        roommates: [],
        allocation: null,
      });
    }

    const room = await roomRepository.findById(student.roomId);

    const allocations = await allocationRepository.findByRoomId(student.roomId);
    const roommates = allocations
      .filter((a) => a.studentId !== student.id)
      .map((a) => a.student);

    const activeAllocation = await allocationRepository.findActiveByStudentId(student.id);

    return successResponse({
      student,
      room,
      roommates,
      allocation: activeAllocation,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
