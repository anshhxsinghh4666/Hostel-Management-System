"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/shared/loading-state";
import { User, Hash, Building2, Home, DoorOpen, Shield, AlertTriangle, Bell, Users, Info, CheckCircle, Clock, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const ROOM_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  FULL: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  MAINTENANCE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

const ROOM_TYPE_LABELS: Record<string, string> = {
  SINGLE: "Single",
  DOUBLE: "Double",
  TRIPLE: "Triple",
  DORMITORY: "Dormitory",
};

export default function StudentDashboardPage() {
  const { data: session } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ["student-dashboard", session?.user?.id],
    queryFn: async () => {
      const res = await fetch("/api/student/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return res.json();
    },
    enabled: !!session?.user?.id,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingState rows={4} />
      </DashboardLayout>
    );
  }

  const dashboardData = data?.data;
  const student = dashboardData?.student;
  const room = dashboardData?.room;
  const roommates = dashboardData?.roommates || [];
  const pendingComplaints = dashboardData?.pendingComplaintsCount || 0;
  const totalComplaints = dashboardData?.totalComplaints || 0;
  const resolvedComplaints = dashboardData?.resolvedComplaints || 0;
  const totalLeaveRequests = dashboardData?.totalLeaveRequests || 0;
  const approvedLeaves = dashboardData?.approvedLeaves || 0;
  const pendingLeaves = dashboardData?.pendingLeaves || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-heading">Student Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {dashboardData?.user?.name || session?.user?.name}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card variant="elevated" className="border-l-[3px] border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Student Name</CardTitle>
              <User className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold truncate">{student?.firstName} {student?.lastName}</p>
              <p className="text-xs text-muted-foreground">{student?.email}</p>
            </CardContent>
          </Card>
          <Card variant="elevated" className="border-l-[3px] border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Student ID</CardTitle>
              <Hash className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold">{student?.registrationNumber || "--"}</p>
              <p className="text-xs text-muted-foreground">{student?.course} - Year {student?.year}</p>
            </CardContent>
          </Card>
          <Card variant="elevated" className="border-l-[3px] border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Hostel Block</CardTitle>
              <Building2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold">{room?.hostel?.hostelName || "Not Allocated"}</p>
              <p className="text-xs text-muted-foreground">{room?.hostel?.hostelType === "BOYS" ? "Boys Hostel" : "Girls Hostel"}</p>
            </CardContent>
          </Card>
          <Card variant="elevated" className="border-l-[3px] border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Room Number</CardTitle>
              <DoorOpen className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold">{room ? `Room ${room.roomNumber}` : "N/A"}</p>
              <p className="text-xs text-muted-foreground">{room ? `Floor ${room.floorNumber} · ${ROOM_TYPE_LABELS[room.roomType] || room.roomType}` : ""}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card variant="elevated" className="border-l-[3px] border-l-amber-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Room Type</CardTitle>
              <Home className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{room ? ROOM_TYPE_LABELS[room.roomType] || room.roomType : "--"}</p>
            </CardContent>
          </Card>
          <Card variant="elevated" className="border-l-[3px] border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Current Status</CardTitle>
              <Shield className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              {room ? (
                <Badge className={ROOM_STATUS_COLORS[room.roomStatus]}>{room.roomStatus}</Badge>
              ) : (
                <p className="text-2xl font-bold text-muted-foreground">--</p>
              )}
            </CardContent>
          </Card>
          <Card variant="elevated" className="border-l-[3px] border-l-cyan-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Room Capacity</CardTitle>
              <Users className="h-4 w-4 text-cyan-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{room ? `${room.occupiedBeds} / ${room.capacity}` : "--"}</p>
              <p className="text-xs text-muted-foreground">Occupied / Total beds</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card variant="elevated" className="border-l-[3px] border-l-amber-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Complaints</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">{pendingComplaints}</p>
              <p className="text-xs text-muted-foreground">out of {totalComplaints} total</p>
            </CardContent>
          </Card>
          <Card variant="elevated" className="border-l-[3px] border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Resolved Complaints</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{resolvedComplaints}</p>
            </CardContent>
          </Card>
          <Card variant="elevated" className="border-l-[3px] border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Leave Requests</CardTitle>
              <CalendarDays className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{totalLeaveRequests}</p>
              <p className="text-xs text-muted-foreground">{approvedLeaves} approved</p>
            </CardContent>
          </Card>
          <Card variant="elevated" className="border-l-[3px] border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-600">{pendingLeaves}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" /> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Full Name:</span>
                <span className="font-medium">{student?.firstName} {student?.lastName}</span>
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{student?.email}</span>
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-medium">{student?.phone}</span>
                <span className="text-muted-foreground">Course:</span>
                <span className="font-medium">{student?.course}</span>
                <span className="text-muted-foreground">Year:</span>
                <span className="font-medium">{student?.year}</span>
                <span className="text-muted-foreground">Registration No:</span>
                <span className="font-medium">{student?.registrationNumber}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" /> Room Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {room ? (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Room Number:</span>
                  <span className="font-medium">{room.roomNumber}</span>
                  <span className="text-muted-foreground">Block:</span>
                  <span className="font-medium">{room.hostel?.hostelName || "--"}</span>
                  <span className="text-muted-foreground">Floor:</span>
                  <span className="font-medium">{room.floorNumber}</span>
                  <span className="text-muted-foreground">Room Type:</span>
                  <span className="font-medium">{ROOM_TYPE_LABELS[room.roomType] || room.roomType}</span>
                  <span className="text-muted-foreground">Capacity:</span>
                  <span className="font-medium">{room.occupiedBeds} / {room.capacity} occupied</span>
                  <span className="text-muted-foreground">Status:</span>
                  <span><Badge className={ROOM_STATUS_COLORS[room.roomStatus]}>{room.roomStatus}</Badge></span>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Home className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No room allocated yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> Roommates ({roommates.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {roommates.length > 0 ? (
                <div className="space-y-2">
                  {roommates.map((rm: Record<string, unknown>, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {(rm.firstName as string)?.charAt(0)}{(rm.lastName as string)?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{String(rm.firstName || "")} {String(rm.lastName || "")}</p>
                        <p className="text-xs text-muted-foreground">{String(rm.course || "")} - Year {String(rm.year || "")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  {room ? "No roommates in this room" : "No room allocated"}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" /> Hostel Announcements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No announcements at this time</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4">
          <Link href="/student/my-room">
            <Button variant="default">
              <Home className="mr-2 h-4 w-4" />
              View My Room
            </Button>
          </Link>
          <Link href="/student/profile">
            <Button variant="outline">
              <User className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
