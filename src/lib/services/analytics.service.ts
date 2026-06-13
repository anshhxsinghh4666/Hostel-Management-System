import { prisma } from "@/lib/db/prisma";

export const analyticsService = {
  async getAnalyticsData() {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      roomOccupancy,
      monthlyRevenue,
      complaintAnalytics,
      studentRegistrationTrend,
      hostelUtilization,
    ] = await Promise.all([
      this.getRoomOccupancy(),
      this.getMonthlyRevenue(sixMonthsAgo),
      this.getComplaintAnalytics(),
      this.getStudentRegistrationTrend(sixMonthsAgo),
      this.getHostelUtilization(),
    ]);

    return {
      roomOccupancy,
      monthlyRevenue,
      complaintAnalytics,
      studentRegistrationTrend,
      hostelUtilization,
    };
  },

  async getRoomOccupancy() {
    const [occupied, vacant] = await Promise.all([
      prisma.room.count({ where: { roomStatus: "FULL" } }),
      prisma.room.count({ where: { roomStatus: "AVAILABLE" } }),
    ]);

    return { occupied, vacant };
  },

  async getMonthlyRevenue(since: Date) {
    const payments = await prisma.payment.findMany({
      where: {
        status: "COMPLETED",
        paymentDate: { gte: since },
      },
      select: { amount: true, paymentDate: true },
      orderBy: { paymentDate: "asc" },
    });

    const months: Record<string, number> = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (let i = 0; i < 6; i++) {
      const d = new Date(since.getFullYear(), since.getMonth() + i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      months[key] = 0;
    }

    for (const payment of payments) {
      const key = `${monthNames[payment.paymentDate.getMonth()]} ${payment.paymentDate.getFullYear()}`;
      if (months[key] !== undefined) {
        months[key] += Number(payment.amount);
      }
    }

    return Object.entries(months).map(([month, revenue]) => ({
      month,
      revenue,
    }));
  },

  async getComplaintAnalytics() {
    const [open, resolved, inProgress] = await Promise.all([
      prisma.complaint.count({ where: { status: "PENDING" } }),
      prisma.complaint.count({ where: { status: "RESOLVED" } }),
      prisma.complaint.count({ where: { status: "IN_PROGRESS" } }),
    ]);

    return { open, resolved, inProgress };
  },

  async getStudentRegistrationTrend(since: Date) {
    const students = await prisma.student.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const months: Record<string, number> = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (let i = 0; i < 6; i++) {
      const d = new Date(since.getFullYear(), since.getMonth() + i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      months[key] = 0;
    }

    for (const student of students) {
      const key = `${monthNames[student.createdAt.getMonth()]} ${student.createdAt.getFullYear()}`;
      if (months[key] !== undefined) {
        months[key]++;
      }
    }

    return Object.entries(months).map(([month, count]) => ({
      month,
      count,
    }));
  },

  async getHostelUtilization() {
    const rooms = await prisma.room.findMany({
      select: { capacity: true, occupiedBeds: true },
    });

    const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
    const totalOccupied = rooms.reduce((sum, r) => sum + r.occupiedBeds, 0);

    const percentage = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

    return {
      totalCapacity,
      totalOccupied,
      percentage,
    };
  },

  async getRecentActivity() {
    const [recentAdmissions, recentComplaints, recentPayments] = await Promise.all([
      this.getRecentAdmissions(),
      this.getRecentComplaints(),
      this.getRecentPayments(),
    ]);

    return {
      recentAdmissions,
      recentComplaints,
      recentPayments,
    };
  },

  async getRecentAdmissions() {
    const allocations = await prisma.roomAllocation.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, registrationNumber: true } },
        room: { select: { id: true, roomNumber: true, hostel: { select: { hostelName: true } } } },
      },
    });

    return allocations.map((a) => ({
      id: a.id,
      studentName: `${a.student.firstName} ${a.student.lastName}`,
      registrationNumber: a.student.registrationNumber,
      roomNumber: a.room.roomNumber,
      hostelName: a.room.hostel.hostelName,
      date: a.createdAt,
    }));
  },

  async getRecentComplaints() {
    const complaints = await prisma.complaint.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return complaints.map((c) => ({
      id: c.id,
      subject: c.subject,
      category: c.category,
      status: c.status,
      priority: c.priority,
      studentName: `${c.student.firstName} ${c.student.lastName}`,
      createdAt: c.createdAt,
    }));
  },

  async getRecentPayments() {
    const payments = await prisma.payment.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, registrationNumber: true } },
      },
    });

    return payments.map((p) => ({
      id: p.id,
      studentName: `${p.student.firstName} ${p.student.lastName}`,
      registrationNumber: p.student.registrationNumber,
      amount: Number(p.amount),
      paymentMethod: p.paymentMethod,
      status: p.status,
      date: p.createdAt,
    }));
  },

  async getNotificationSummary() {
    const [pendingApplications, openComplaints, pendingPayments, pendingLeaves, pendingVisitors] =
      await Promise.all([
        prisma.roomAllocation.count({ where: { allocationStatus: "ACTIVE" } }),
        prisma.complaint.count({ where: { status: "PENDING" } }),
        prisma.payment.count({ where: { status: "PENDING" } }),
        prisma.leaveRequest.count({ where: { status: "PENDING" } }),
        prisma.visitorRequest.count({ where: { status: "PENDING" } }),
      ]);

    return {
      pendingApplications,
      openComplaints,
      pendingPayments,
      pendingLeaves,
      pendingVisitors,
    };
  },
};
