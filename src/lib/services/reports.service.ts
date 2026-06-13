import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";

export const reportsService = {
  async getOccupancyReport(params: { search?: string; startDate?: string; endDate?: string }) {
    const { search } = params;

    const where: Prisma.RoomWhereInput = {};
    if (search) {
      where.OR = [
        { roomNumber: { contains: search, mode: "insensitive" as const } },
        { hostel: { hostelName: { contains: search, mode: "insensitive" as const } } },
      ];
    }

    const rooms = await prisma.room.findMany({
      where,
      include: { hostel: true },
      orderBy: [{ hostelId: "asc" }, { roomNumber: "asc" }],
    });

    return rooms.map((room) => ({
      id: room.id,
      roomNumber: room.roomNumber,
      hostelName: room.hostel.hostelName,
      floorNumber: room.floorNumber,
      roomType: room.roomType,
      capacity: room.capacity,
      occupiedBeds: room.occupiedBeds,
      availableBeds: room.capacity - room.occupiedBeds,
      status: room.roomStatus,
    }));
  },

  async getStudentReport(params: { startDate?: string; endDate?: string; search?: string; status?: string }) {
    const { startDate, endDate, search, status } = params;

    const where: Prisma.StudentWhereInput = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" as const } },
        { lastName: { contains: search, mode: "insensitive" as const } },
        { registrationNumber: { contains: search, mode: "insensitive" as const } },
      ];
    }
    if (status) {
      where.status = status as "ACTIVE" | "INACTIVE";
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const students = await prisma.student.findMany({
      where,
      include: { hostel: true, room: true },
      orderBy: { createdAt: "desc" },
    });

    return students.map((s) => ({
      id: s.id,
      registrationNumber: s.registrationNumber,
      firstName: s.firstName,
      lastName: s.lastName,
      course: s.course,
      year: s.year,
      gender: s.gender,
      email: s.email,
      phone: s.phone,
      hostelName: s.hostel?.hostelName || "N/A",
      roomNumber: s.room?.roomNumber || "N/A",
      status: s.status,
      checkInDate: s.checkInDate,
      createdAt: s.createdAt,
    }));
  },

  async getComplaintReport(params: { startDate?: string; endDate?: string; search?: string; status?: string }) {
    const { startDate, endDate, search, status } = params;

    const where: Prisma.ComplaintWhereInput = {};
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: "insensitive" as const } },
        { student: { firstName: { contains: search, mode: "insensitive" as const } } },
        { student: { lastName: { contains: search, mode: "insensitive" as const } } },
      ];
    }
    if (status) {
      where.status = status as "PENDING" | "IN_PROGRESS" | "RESOLVED";
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const complaints = await prisma.complaint.findMany({
      where,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, registrationNumber: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return complaints.map((c) => ({
      id: c.id,
      complaintId: c.id.slice(0, 8),
      category: c.category,
      subject: c.subject,
      priority: c.priority,
      studentName: `${c.student.firstName} ${c.student.lastName}`,
      registrationNumber: c.student.registrationNumber,
      status: c.status,
      adminRemark: c.adminRemark,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  },

  async getPaymentReport(params: { startDate?: string; endDate?: string; search?: string; status?: string }) {
    const { startDate, endDate, search, status } = params;

    const where: Prisma.PaymentWhereInput = {};
    if (search) {
      where.student = {
        OR: [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
          { registrationNumber: { contains: search, mode: "insensitive" as const } },
        ],
      };
    }
    if (status) {
      where.status = status as "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
    }
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate);
      if (endDate) where.paymentDate.lte = new Date(endDate);
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, registrationNumber: true } },
      },
      orderBy: { paymentDate: "desc" },
    });

    return payments.map((p) => ({
      id: p.id,
      studentName: `${p.student.firstName} ${p.student.lastName}`,
      registrationNumber: p.student.registrationNumber,
      amount: Number(p.amount),
      paymentDate: p.paymentDate,
      paymentMethod: p.paymentMethod,
      status: p.status,
      transactionId: p.transactionId,
      remarks: p.remarks,
    }));
  },

  async getVisitorReport(params: { startDate?: string; endDate?: string; search?: string }) {
    const { startDate, endDate, search } = params;

    const where: Prisma.VisitorLogWhereInput = {};
    if (startDate || endDate) {
      where.checkInTime = {};
      if (startDate) where.checkInTime.gte = new Date(startDate);
      if (endDate) where.checkInTime.lte = new Date(endDate);
    }

    const logs = await prisma.visitorLog.findMany({
      where,
      include: {
        gatePass: {
          include: {
            request: {
              include: {
                visitor: true,
                student: { select: { id: true, firstName: true, lastName: true } },
              },
            },
          },
        },
      },
      orderBy: { checkInTime: "desc" },
    });

    let results = logs.map((log) => ({
      id: log.id,
      visitorName: log.gatePass?.request?.visitor?.name || "N/A",
      studentName: log.gatePass?.request?.student
        ? `${log.gatePass.request.student.firstName} ${log.gatePass.request.student.lastName}`
        : "N/A",
      purpose: log.gatePass?.request?.purpose || "N/A",
      visitDate: log.gatePass?.request?.visitDate || null,
      entryTime: log.checkInTime,
      exitTime: log.checkOutTime,
      passNumber: log.gatePass?.passNumber || "N/A",
    }));

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        (r) =>
          r.visitorName.toLowerCase().includes(q) ||
          r.studentName.toLowerCase().includes(q) ||
          r.passNumber.toLowerCase().includes(q)
      );
    }

    return results;
  },

  async getLeaveReport(params: { startDate?: string; endDate?: string; search?: string; status?: string }) {
    const { startDate, endDate, search, status } = params;

    const where: Prisma.LeaveRequestWhereInput = {};
    if (search) {
      where.student = {
        OR: [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
        ],
      };
    }
    if (status) {
      where.status = status as "PENDING" | "APPROVED" | "REJECTED";
    }
    if (startDate || endDate) {
      where.fromDate = {};
      if (startDate) where.fromDate.gte = new Date(startDate);
      if (endDate) where.toDate = { lte: new Date(endDate) };
    }

    const leaves = await prisma.leaveRequest.findMany({
      where,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, registrationNumber: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return leaves.map((l) => ({
      id: l.id,
      studentName: `${l.student.firstName} ${l.student.lastName}`,
      registrationNumber: l.student.registrationNumber,
      fromDate: l.fromDate,
      toDate: l.toDate,
      reason: l.reason,
      status: l.status,
      adminComment: l.adminComment,
      createdAt: l.createdAt,
    }));
  },
};
