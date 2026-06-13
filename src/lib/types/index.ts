export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  HOSTEL_ADMIN = "HOSTEL_ADMIN",
  STAFF = "STAFF",
  STUDENT = "STUDENT",
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: Role;
  profileImage: string | null;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPublic {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  profileImage: string | null;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  name: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  role?: Role;
  isActive?: boolean;
}

export interface AuditLogQuery {
  page: number;
  limit: number;
  userId?: string;
  action?: string;
  entity?: string;
  from?: string;
  to?: string;
}

export enum HostelType {
  BOYS = "BOYS",
  GIRLS = "GIRLS",
}

export enum RoomStatus {
  AVAILABLE = "AVAILABLE",
  FULL = "FULL",
  MAINTENANCE = "MAINTENANCE",
}

export enum RoomType {
  SINGLE = "SINGLE",
  DOUBLE = "DOUBLE",
  TRIPLE = "TRIPLE",
  DORMITORY = "DORMITORY",
}

export enum AllocationStatus {
  ACTIVE = "ACTIVE",
  TRANSFERRED = "TRANSFERRED",
  VACATED = "VACATED",
}

export enum StudentStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export interface StudentPublic {
  id: string;
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
  hostelId: string | null;
  roomId: string | null;
  checkInDate: Date | null;
  status: StudentStatus;
  createdAt: Date;
  hostel?: { id: string; hostelName: string; hostelType: HostelType } | null;
  room?: { id: string; roomNumber: string; floorNumber: number; roomType: RoomType; capacity: number; occupiedBeds: number; roomStatus: RoomStatus } | null;
}

export interface HostelPublic {
  id: string;
  hostelName: string;
  hostelType: HostelType;
  totalRooms: number;
  totalCapacity: number;
  occupiedCapacity: number;
  createdAt: Date;
  rooms?: RoomPublic[];
}

export interface RoomPublic {
  id: string;
  hostelId: string;
  roomNumber: string;
  floorNumber: number;
  capacity: number;
  occupiedBeds: number;
  roomType: RoomType;
  roomStatus: RoomStatus;
  createdAt: Date;
  hostel?: { id: string; hostelName: string; hostelType: HostelType };
}

export interface RoomAllocationPublic {
  id: string;
  studentId: string;
  roomId: string;
  allocatedDate: Date;
  allocationStatus: AllocationStatus;
  transferredDate: Date | null;
  vacatedDate: Date | null;
  createdAt: Date;
  student?: StudentPublic | null;
  room?: RoomPublic | null;
}

export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalHostels: number;
  totalRooms: number;
  availableBeds: number;
  occupiedBeds: number;
}

export interface EnhancedDashboardStats extends DashboardStats {
  totalAvailableRooms: number;
  totalOccupiedRooms: number;
  totalMaintenanceRooms: number;
  occupancyPercentage: number;
  roomTypeBreakdown: {
    single: number;
    double: number;
    triple: number;
    dormitory: number;
  };
  recentAllocations: number;
  totalComplaints: number;
  openComplaints: number;
  totalLeaveRequests: number;
  pendingApprovals: number;
}

export enum ComplaintCategory {
  ELECTRICAL = "ELECTRICAL",
  PLUMBING = "PLUMBING",
  INTERNET = "INTERNET",
  FURNITURE = "FURNITURE",
  CLEANING = "CLEANING",
  OTHER = "OTHER",
}

export enum ComplaintPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export enum ComplaintStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
}

export enum LeaveStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export interface ComplaintPublic {
  id: string;
  studentId: string;
  category: ComplaintCategory;
  subject: string;
  description: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  adminRemark: string | null;
  createdAt: Date;
  updatedAt: Date;
  student?: StudentPublic;
}

export interface LeaveRequestPublic {
  id: string;
  studentId: string;
  fromDate: Date;
  toDate: Date;
  reason: string;
  emergencyContact: string;
  parentName: string;
  status: LeaveStatus;
  adminComment: string | null;
  createdAt: Date;
  student?: StudentPublic;
}

export interface NotificationPublic {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export enum VisitorRequestStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
}

export enum GatePassStatus {
  ACTIVE = "ACTIVE",
  USED = "USED",
  EXPIRED = "EXPIRED",
  REVOKED = "REVOKED",
}

export enum StayExtensionStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export interface VisitorPublic {
  id: string;
  name: string;
  mobile: string;
  relation: string;
  createdAt: Date;
}

export interface VisitorRequestPublic {
  id: string;
  studentId: string;
  visitorId: string;
  purpose: string;
  visitDate: Date;
  arrivalTime: string;
  departureTime: string;
  status: VisitorRequestStatus;
  remarks: string | null;
  createdAt: Date;
  visitor?: VisitorPublic | null;
  student?: StudentPublic | null;
  gatePass?: GatePassPublic | null;
}

export interface GatePassPublic {
  id: string;
  requestId: string;
  passNumber: string;
  qrToken: string;
  validFrom: Date;
  validTo: Date;
  status: GatePassStatus;
  createdAt: Date;
  request?: VisitorRequestPublic | null;
  logs?: VisitorLogPublic[];
  stayExtension?: StayExtensionPublic | null;
}

export interface VisitorLogPublic {
  id: string;
  gatePassId: string;
  checkInTime: Date | null;
  checkOutTime: Date | null;
  createdAt: Date;
  gatePass?: GatePassPublic | null;
}

export interface StayExtensionPublic {
  id: string;
  gatePassId: string;
  requestedDepartureTime: string;
  reason: string;
  status: StayExtensionStatus;
  createdAt: Date;
  gatePass?: GatePassPublic | null;
}

export interface StudentDashboardData {
  user: UserPublic;
  student: StudentPublic;
  room: (RoomPublic & { hostel: { hostelName: string; hostelType: HostelType } }) | null;
  roommates: StudentPublic[];
  pendingComplaintsCount: number;
  totalComplaints: number;
  resolvedComplaints: number;
  totalNotices: number;
  totalLeaveRequests: number;
  approvedLeaves: number;
  pendingLeaves: number;
  recentAllocation: RoomAllocationPublic | null;
}
