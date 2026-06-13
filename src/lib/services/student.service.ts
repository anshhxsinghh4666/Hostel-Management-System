import { studentRepository } from "@/lib/repositories/student.repository";
import { auditService } from "./audit.service";
import { Role, StudentStatus } from "@/lib/types";
import { canManageStudents } from "@/lib/permissions/permissions";

export const studentService = {
  async createStudent(
    actorRole: Role,
    actorId: string,
    data: {
      registrationNumber: string;
      firstName: string;
      lastName: string;
      gender: string;
      email: string;
      phone: string;
      course: string;
      year: number;
      guardianName: string;
      guardianPhone: string;
      address: string;
    }
  ) {
    if (!canManageStudents(actorRole)) {
      throw new Error("You do not have permission to create students");
    }

    const existingReg = await studentRepository.findByRegistrationNumber(data.registrationNumber);
    if (existingReg) {
      throw new Error("A student with this registration number already exists");
    }

    const existingEmail = await studentRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new Error("A student with this email already exists");
    }

    const existingPhone = await studentRepository.findByPhone(data.phone);
    if (existingPhone) {
      throw new Error("A student with this phone number already exists");
    }

    const student = await studentRepository.create(data);

    await auditService.log({
      userId: actorId,
      action: "STUDENT_CREATED",
      entity: "STUDENT",
      entityId: student.id,
      metadata: { registrationNumber: data.registrationNumber },
    });

    return student;
  },

  async updateStudent(
    actorRole: Role,
    actorId: string,
    targetId: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      course?: string;
      year?: number;
      guardianName?: string;
      guardianPhone?: string;
      address?: string;
      status?: StudentStatus;
    }
  ) {
    if (!canManageStudents(actorRole)) {
      throw new Error("You do not have permission to edit students");
    }

    const existing = await studentRepository.findById(targetId);
    if (!existing) {
      throw new Error("Student not found");
    }

    if (data.email && data.email !== existing.email) {
      const emailExists = await studentRepository.findByEmail(data.email);
      if (emailExists) throw new Error("This email is already in use");
    }

    if (data.phone && data.phone !== existing.phone) {
      const phoneExists = await studentRepository.findByPhone(data.phone);
      if (phoneExists) throw new Error("This phone number is already in use");
    }

    const student = await studentRepository.update(targetId, data);

    await auditService.log({ userId: actorId, action: "STUDENT_UPDATED", entity: "STUDENT", entityId: targetId });

    return student;
  },

  async deactivateStudent(actorRole: Role, actorId: string, targetId: string) {
    if (!canManageStudents(actorRole)) {
      throw new Error("You do not have permission to deactivate students");
    }

    const existing = await studentRepository.findById(targetId);
    if (!existing) throw new Error("Student not found");
    if (existing.status === StudentStatus.INACTIVE) {
      throw new Error("Student is already inactive");
    }

    const student = await studentRepository.deactivate(targetId);

    await auditService.log({ userId: actorId, action: "STUDENT_DEACTIVATED", entity: "STUDENT", entityId: targetId });

    return student;
  },

  async getStudents(params: {
    page: number;
    limit: number;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    hostelId?: string;
    roomId?: string;
    status?: StudentStatus;
  }) {
    return studentRepository.findAll(params);
  },

  async getStudentById(id: string) {
    const student = await studentRepository.findById(id);
    if (!student) throw new Error("Student not found");
    return student;
  },
};
