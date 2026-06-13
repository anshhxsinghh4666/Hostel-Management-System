import { prisma } from "@/lib/db/prisma";
import { studentRepository } from "@/lib/repositories/student.repository";
import { hostelRepository } from "@/lib/repositories/hostel.repository";
import { roomRepository } from "@/lib/repositories/room.repository";
import { allocationRepository } from "@/lib/repositories/allocation.repository";
import { DashboardStats, EnhancedDashboardStats, StudentStatus } from "@/lib/types";

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const [totalStudents, activeStudents, totalHostels, totalRooms, availableBeds, occupiedBeds] =
      await Promise.all([
        studentRepository.count(),
        studentRepository.count({ status: StudentStatus.ACTIVE }),
        hostelRepository.count(),
        roomRepository.count(),
        roomRepository.getAvailableBeds(),
        roomRepository.getOccupiedBeds(),
      ]);

    return {
      totalStudents,
      activeStudents,
      totalHostels,
      totalRooms,
      availableBeds,
      occupiedBeds,
    };
  },

  async getEnhancedStats(): Promise<EnhancedDashboardStats> {
    const [baseStats, statusCounts, roomTypeCounts, recentAllocations, totalComplaints, openComplaints, totalLeaveRequests, pendingApprovals] = await Promise.all([
      this.getStats(),
      roomRepository.countByStatus(),
      roomRepository.countByRoomType(),
      allocationRepository.countRecentAllocations(30),
      prisma.complaint.count(),
      prisma.complaint.count({ where: { status: { not: "RESOLVED" } } }),
      prisma.leaveRequest.count(),
      prisma.leaveRequest.count({ where: { status: "PENDING" } }),
    ]);

    const totalRoomsCount = statusCounts.available + statusCounts.occupied + statusCounts.maintenance;
    const occupiedPercent = totalRoomsCount > 0
      ? Math.round((statusCounts.occupied / totalRoomsCount) * 100)
      : 0;

    return {
      ...baseStats,
      totalAvailableRooms: statusCounts.available,
      totalOccupiedRooms: statusCounts.occupied,
      totalMaintenanceRooms: statusCounts.maintenance,
      occupancyPercentage: occupiedPercent,
      roomTypeBreakdown: roomTypeCounts,
      recentAllocations,
      totalComplaints,
      openComplaints,
      totalLeaveRequests,
      pendingApprovals,
    };
  },
};
