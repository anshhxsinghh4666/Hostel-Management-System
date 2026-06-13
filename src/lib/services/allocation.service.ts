import { studentRepository } from "@/lib/repositories/student.repository";
import { roomRepository } from "@/lib/repositories/room.repository";
import { hostelRepository } from "@/lib/repositories/hostel.repository";
import { allocationRepository } from "@/lib/repositories/allocation.repository";
import { auditService } from "./audit.service";
import { prisma } from "@/lib/db/prisma";
import { Role } from "@/lib/types";
import { canManageStudents } from "@/lib/permissions/permissions";

export const allocationService = {
  async allocateRoom(
    actorRole: Role,
    actorId: string,
    studentId: string,
    roomId: string
  ) {
    if (!canManageStudents(actorRole)) {
      throw new Error("You do not have permission to allocate rooms");
    }

    const student = await studentRepository.findById(studentId);
    if (!student) throw new Error("Student not found");

    if (student.status === "INACTIVE") {
      throw new Error("Cannot allocate room to an inactive student");
    }

    if (student.hostelId) {
      throw new Error("Student already has a room allocated");
    }

    const room = await roomRepository.findById(roomId);
    if (!room) throw new Error("Room not found");

    if (room.roomStatus === "MAINTENANCE") {
      throw new Error("Room is under maintenance");
    }

    if (room.occupiedBeds >= room.capacity) {
      throw new Error("Room is full");
    }

    const hostel = await hostelRepository.findById(room.hostelId);
    if (!hostel) throw new Error("Hostel not found");

    const studentGender = student.gender.toLowerCase();
    if (
      (hostel.hostelType === "BOYS" && studentGender !== "male") ||
      (hostel.hostelType === "GIRLS" && studentGender !== "female")
    ) {
      throw new Error("Gender mismatch: student gender does not match hostel type");
    }

    const updatedStudent = await studentRepository.assignRoom(studentId, room.hostelId, roomId);

    await roomRepository.updateOccupiedBeds(roomId, 1);
    await hostelRepository.updateOccupancy(room.hostelId, 1);

    await allocationRepository.create({ studentId, roomId });

    const studentUser = await prisma.user.findFirst({ where: { email: student.email } });
    if (studentUser) {
      await prisma.notification.create({
        data: {
          userId: studentUser.id,
          title: "Room Allocated",
          message: `Your room has been allocated: Room ${room.roomNumber}, ${hostel.hostelName}. Check-in date: ${new Date().toLocaleDateString()}.`,
        },
      });
    }
    await prisma.notification.create({
      data: {
        userId: actorId,
        title: "Room Allocated",
        message: `Room ${room.roomNumber} (${hostel.hostelName}) allocated to ${student.firstName} ${student.lastName}.`,
      },
    });

    await auditService.log({
      userId: actorId,
      action: "ROOM_ALLOCATED",
      entity: "STUDENT",
      entityId: studentId,
      metadata: { roomId, hostelId: room.hostelId },
    });

    return updatedStudent;
  },

  async transferRoom(
    actorRole: Role,
    actorId: string,
    studentId: string,
    newRoomId: string
  ) {
    if (!canManageStudents(actorRole)) {
      throw new Error("You do not have permission to transfer rooms");
    }

    const student = await studentRepository.findById(studentId);
    if (!student) throw new Error("Student not found");
    if (!student.hostelId || !student.roomId) {
      throw new Error("Student does not have a room allocated");
    }

    const newRoom = await roomRepository.findById(newRoomId);
    if (!newRoom) throw new Error("New room not found");

    if (newRoom.roomStatus === "MAINTENANCE") {
      throw new Error("New room is under maintenance");
    }

    if (newRoom.occupiedBeds >= newRoom.capacity) {
      throw new Error("New room is full");
    }

    const oldRoomId = student.roomId;
    const oldHostelId = student.hostelId;

    await studentRepository.assignRoom(studentId, newRoom.hostelId, newRoomId);

    await roomRepository.updateOccupiedBeds(oldRoomId, -1);
    await hostelRepository.updateOccupancy(oldHostelId, -1);

    await roomRepository.updateOccupiedBeds(newRoomId, 1);
    await hostelRepository.updateOccupancy(newRoom.hostelId, 1);

    const activeAllocation = await allocationRepository.findActiveByStudentId(studentId);
    if (activeAllocation) {
      await allocationRepository.markTransferred(activeAllocation.id, newRoomId);
    }
    await allocationRepository.create({ studentId, roomId: newRoomId });

    await auditService.log({
      userId: actorId,
      action: "ROOM_TRANSFERRED",
      entity: "STUDENT",
      entityId: studentId,
      metadata: { oldRoomId, newRoomId },
    });

    const updatedStudent = await studentRepository.findById(studentId);
    return updatedStudent;
  },

  async vacateRoom(actorRole: Role, actorId: string, studentId: string) {
    if (!canManageStudents(actorRole)) {
      throw new Error("You do not have permission to vacate rooms");
    }

    const student = await studentRepository.findById(studentId);
    if (!student) throw new Error("Student not found");
    if (!student.hostelId || !student.roomId) {
      throw new Error("Student does not have a room allocated");
    }

    const roomId = student.roomId;
    const hostelId = student.hostelId;

    await roomRepository.updateOccupiedBeds(roomId, -1);
    await hostelRepository.updateOccupancy(hostelId, -1);
    await studentRepository.removeRoom(studentId);

    const activeAllocation = await allocationRepository.findActiveByStudentId(studentId);
    if (activeAllocation) {
      await allocationRepository.markVacated(activeAllocation.id);
    }

    await auditService.log({
      userId: actorId,
      action: "ROOM_VACATED",
      entity: "STUDENT",
      entityId: studentId,
      metadata: { roomId, hostelId },
    });

    const updatedStudent = await studentRepository.findById(studentId);
    return updatedStudent;
  },

  async deallocateRoom(actorRole: Role, actorId: string, studentId: string) {
    if (!canManageStudents(actorRole)) {
      throw new Error("You do not have permission to deallocate rooms");
    }

    const student = await studentRepository.findById(studentId);
    if (!student) throw new Error("Student not found");
    if (!student.hostelId || !student.roomId) {
      throw new Error("Student does not have a room allocated");
    }

    await roomRepository.updateOccupiedBeds(student.roomId, -1);
    await hostelRepository.updateOccupancy(student.hostelId, -1);
    await studentRepository.removeRoom(studentId);

    const activeAllocation = await allocationRepository.findActiveByStudentId(studentId);
    if (activeAllocation) {
      await allocationRepository.markVacated(activeAllocation.id);
    }

    await auditService.log({
      userId: actorId,
      action: "ROOM_DEALLOCATED",
      entity: "STUDENT",
      entityId: studentId,
    });

    const updatedStudent = await studentRepository.findById(studentId);
    return updatedStudent;
  },

  async getAllocations(
    actorRole: Role,
    params: { page: number; limit: number; status?: string; search?: string }
  ) {
    if (!canManageStudents(actorRole)) {
      throw new Error("You do not have permission to view allocations");
    }
    return allocationRepository.findAll({
      page: params.page,
      limit: params.limit,
      status: params.status,
      search: params.search,
    });
  },

  async getStudentAllocation(studentId: string) {
    return allocationRepository.findActiveByStudentId(studentId);
  },
};
