"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import {
  Users, Building2, DoorOpen, Hotel, UserCheck, MessageSquare,
  AlertTriangle, CheckCircle, Wallet, TrendingUp, CalendarDays, Clock,
  BarChart3, PieChart, Activity, ArrowUpRight, ArrowDownRight,
  UserPlus, FileText, BellRing, ClipboardList
} from "lucide-react";
import { LoadingState } from "@/components/shared/loading-state";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import dynamic from "next/dynamic";
import Link from "next/link";

const Doughnut = dynamic(() => import("react-chartjs-2").then((mod) => mod.Doughnut), { ssr: false });
const Bar = dynamic(() => import("react-chartjs-2").then((mod) => mod.Bar), { ssr: false });
const Line = dynamic(() => import("react-chartjs-2").then((mod) => mod.Line), { ssr: false });

import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement,
  Title, PointElement, LineElement, Filler,
} from "chart.js";

if (typeof window !== "undefined") {
  ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement, Filler);
}

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: string; isUp: boolean };
  color: string;
  onClick?: () => void;
}

function KpiCard({ title, value, icon, trend, color, onClick }: KpiCardProps) {
  return (
    <Card
      variant="elevated"
      className={`relative overflow-hidden cursor-pointer group border-l-[3px] ${color}`}
      onClick={onClick}
    >
      <div className="absolute top-0 right-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-gradient-to-br from-primary/5 to-transparent group-hover:scale-150 transition-transform duration-500" />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold font-heading">{value}</p>
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            {trend.isUp ? (
              <ArrowUpRight className="h-3 w-3 text-green-500" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-500" />
            )}
            <span className={`text-xs ${trend.isUp ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{trend.value}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CircularProgress({ percentage, size = 120, strokeWidth = 8 }: { percentage: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="currentColor"
          strokeWidth={strokeWidth} className="text-muted"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-blue-500 transition-all duration-1000"
        />
      </svg>
      <span className="absolute text-2xl font-bold">{percentage}%</span>
    </div>
  );
}

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case "PENDING": return "warning";
    case "IN_PROGRESS": return "info";
    case "RESOLVED":
    case "COMPLETED":
    case "APPROVED": return "success";
    case "REJECTED":
    case "FAILED": return "destructive";
    default: return "secondary";
  }
};

export default function AdminDashboardPage() {
  const { data: session } = useSession();

  const { data: enhStats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-enhanced-stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/enhanced-stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const { data: analyticsData } = useQuery({
    queryKey: ["dashboard-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/analytics");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
  });

  const { data: recentActivity } = useQuery({
    queryKey: ["dashboard-recent-activity"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/recent-activity");
      if (!res.ok) throw new Error("Failed to fetch activity");
      return res.json();
    },
  });

  const { data: notifSummary } = useQuery({
    queryKey: ["dashboard-notification-summary"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/notification-summary");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
  });

  const s = enhStats?.data;
  const analytics = analyticsData?.data;
  const activity = recentActivity?.data;
  const notif = notifSummary?.data;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" as const, labels: { boxWidth: 12, padding: 16, usePointStyle: true } },
      tooltip: {
        backgroundColor: "var(--card)",
        titleColor: "var(--card-foreground)",
        bodyColor: "var(--muted-foreground)",
        borderColor: "var(--border)",
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        boxPadding: 4,
      },
    },
  };

  const roomOccupancyData = {
    labels: ["Occupied", "Vacant"],
    datasets: [{
      data: [analytics?.roomOccupancy?.occupied || 0, analytics?.roomOccupancy?.vacant || 0],
      backgroundColor: ["#EF4444", "#22C55E"],
      borderColor: ["#DC2626", "#16A34A"],
      borderWidth: 2,
      hoverOffset: 8,
    }],
  };

  const revenueData = {
    labels: analytics?.monthlyRevenue?.map((m: { month: string }) => m.month) || [],
    datasets: [{
      label: "Revenue (₹)",
      data: analytics?.monthlyRevenue?.map((m: { revenue: number }) => m.revenue) || [],
      backgroundColor: "rgba(99, 102, 241, 0.6)",
      borderColor: "#6366F1",
      borderWidth: 2,
      borderRadius: 6,
      hoverBackgroundColor: "rgba(99, 102, 241, 0.8)",
    }],
  };

  const revenueOptions = {
    ...chartOptions,
    scales: {
      y: { beginAtZero: true, ticks: { callback: (v: string | number) => `₹${(Number(v) / 1000).toFixed(0)}k` }, grid: { color: "var(--border)" } },
      x: { grid: { display: false } },
    },
  };

  const complaintChartData = {
    labels: ["Open", "In Progress", "Resolved"],
    datasets: [{
      label: "Complaints",
      data: [
        analytics?.complaintAnalytics?.open || 0,
        analytics?.complaintAnalytics?.inProgress || 0,
        analytics?.complaintAnalytics?.resolved || 0,
      ],
      backgroundColor: ["#F59E0B", "#06B6D4", "#22C55E"],
      borderRadius: 6,
      maxBarThickness: 40,
    }],
  };

  const registrationTrendData = {
    labels: analytics?.studentRegistrationTrend?.map((m: { month: string }) => m.month) || [],
    datasets: [{
      label: "New Registrations",
      data: analytics?.studentRegistrationTrend?.map((m: { count: number }) => m.count) || [],
      borderColor: "#8B5CF6",
      backgroundColor: "rgba(139, 92, 246, 0.08)",
      fill: true,
      tension: 0.4,
      pointBackgroundColor: "#8B5CF6",
      pointBorderColor: "#fff",
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    }],
  };

  if (statsLoading) {
    return (
      <DashboardLayout>
        <LoadingState rows={6} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight font-heading">Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {session?.user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 md:mt-0">
            <Badge variant="info" className="text-xs px-3 py-1">
              <Clock className="h-3 w-3 mr-1 inline" />
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </Badge>
          </div>
        </div>

        {/* Row 1: KPI Cards - 12 cards in 4 rows of 3 on large, 2 on medium */}
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <KpiCard
            title="Total Students"
            value={s?.totalStudents ?? 0}
            icon={<Users className="h-4 w-4 text-blue-500" />}
            trend={{ value: `${s?.activeStudents ?? 0} active`, isUp: true }}
            color="border-l-blue-500"
          />
          <KpiCard
            title="Active Students"
            value={s?.activeStudents ?? 0}
            icon={<UserCheck className="h-4 w-4 text-green-500" />}
            trend={{ value: `${((s?.activeStudents / (s?.totalStudents || 1)) * 100).toFixed(0)}% of total`, isUp: true }}
            color="border-l-green-500"
          />
          <KpiCard
            title="Occupied Rooms"
            value={s?.totalOccupiedRooms ?? 0}
            icon={<DoorOpen className="h-4 w-4 text-red-500" />}
            trend={{ value: `${((s?.totalOccupiedRooms / (s?.totalRooms || 1)) * 100).toFixed(0)}% occupied`, isUp: false }}
            color="border-l-red-500"
          />
          <KpiCard
            title="Vacant Rooms"
            value={s?.totalAvailableRooms ?? 0}
            icon={<Building2 className="h-4 w-4 text-green-500" />}
            trend={{ value: `${s?.totalAvailableRooms} available`, isUp: true }}
            color="border-l-green-500"
          />
          <KpiCard
            title="Total Rooms"
            value={s?.totalRooms ?? 0}
            icon={<Hotel className="h-4 w-4 text-purple-500" />}
            trend={{ value: `${s?.totalMaintenanceRooms ?? 0} in maintenance`, isUp: false }}
            color="border-l-purple-500"
          />
          <KpiCard
            title="Pending Applications"
            value={notif?.pendingApplications ?? 0}
            icon={<FileText className="h-4 w-4 text-orange-500" />}
            trend={{ value: "Room allocations", isUp: true }}
            color="border-l-orange-500"
          />
          <KpiCard
            title="Approved Applications"
            value={(s?.recentAllocations ?? 0)}
            icon={<CheckCircle className="h-4 w-4 text-green-500" />}
            trend={{ value: "Last 30 days", isUp: true }}
            color="border-l-green-500"
          />
          <KpiCard
            title="Open Complaints"
            value={notif?.openComplaints ?? 0}
            icon={<AlertTriangle className="h-4 w-4 text-yellow-500" />}
            trend={{ value: "Pending resolution", isUp: false }}
            color="border-l-yellow-500"
          />
          <KpiCard
            title="Resolved Complaints"
            value={analytics?.complaintAnalytics?.resolved ?? 0}
            icon={<MessageSquare className="h-4 w-4 text-blue-500" />}
            trend={{ value: "Resolved", isUp: true }}
            color="border-l-blue-500"
          />
          <KpiCard
            title="Pending Payments"
            value={notif?.pendingPayments ?? 0}
            icon={<Wallet className="h-4 w-4 text-red-500" />}
            trend={{ value: "Awaiting collection", isUp: false }}
            color="border-l-red-500"
          />
          <KpiCard
            title="Total Revenue"
            value={`₹${(analytics?.monthlyRevenue?.reduce((a: number, m: { revenue: number }) => a + m.revenue, 0) || 0).toLocaleString()}`}
            icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
            trend={{ value: "Last 6 months", isUp: true }}
            color="border-l-emerald-500"
          />
          <KpiCard
            title="Visitor Entries Today"
            value={activity?.recentPayments?.length ?? 0}
            icon={<ClipboardList className="h-4 w-4 text-cyan-500" />}
            trend={{ value: "Today's entries", isUp: true }}
            color="border-l-cyan-500"
          />
        </div>

        {/* Row 2: Charts - 5 charts */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          <Card variant="elevated" className="xl:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <PieChart className="h-4 w-4 text-red-500" /> Room Occupancy
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="w-full max-w-[220px]">
                <Doughnut data={roomOccupancyData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="xl:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4 text-blue-500" /> Monthly Revenue Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[200px] sm:h-[220px] md:h-[250px]">
              <Bar data={revenueData} options={revenueOptions} />
            </CardContent>
          </Card>

          <Card variant="elevated" className="xl:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4 text-yellow-500" /> Complaint Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[180px] sm:h-[200px] md:h-[220px]">
              <Bar data={complaintChartData} options={{ ...chartOptions, indexAxis: 'y' as const }} />
            </CardContent>
          </Card>

          <Card variant="elevated" className="xl:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-purple-500" /> Registration Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[180px] sm:h-[200px] md:h-[220px]">
              <Line data={registrationTrendData} options={chartOptions} />
            </CardContent>
          </Card>

          <Card variant="elevated" className="xl:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-blue-500" /> Hostel Utilization
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-3 pt-4 min-h-[180px] sm:min-h-[220px]">
              <CircularProgress percentage={analytics?.hostelUtilization?.percentage || s?.occupancyPercentage || 0} size={120} />
              <div className="flex gap-6 text-sm">
                <div className="text-center">
                  <p className="text-muted-foreground text-xs">Capacity</p>
                  <p className="font-bold">{analytics?.hostelUtilization?.totalCapacity || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground text-xs">Occupied</p>
                  <p className="font-bold">{analytics?.hostelUtilization?.totalOccupied || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 3: Recent Activity + Notification Summary */}
        <div className="grid gap-6 grid-cols-1 xl:grid-cols-4">
          <Card variant="elevated" className="xl:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4" /> Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <UserPlus className="h-4 w-4 text-blue-500" />
                    <h4 className="text-sm font-semibold">Recent Admissions</h4>
                  </div>
                  <div className="space-y-3">
                    {(activity?.recentAdmissions?.length > 0 ? activity.recentAdmissions : []).map((item: { id: string; studentName: string; roomNumber: string; hostelName: string; date: string }) => (
                      <div key={item.id} className="flex items-start gap-2 text-xs">
                        <div className="h-2 w-2 rounded-full bg-blue-500 mt-1 shrink-0" />
                        <div>
                          <p className="font-medium">{item.studentName}</p>
                          <p className="text-muted-foreground">Room {item.roomNumber} - {item.hostelName}</p>
                          <p className="text-muted-foreground">{format(new Date(item.date), "MMM d, yyyy")}</p>
                        </div>
                      </div>
                    ))}
                    {(!activity?.recentAdmissions || activity.recentAdmissions.length === 0) && (
                      <p className="text-xs text-muted-foreground">No recent admissions</p>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="h-4 w-4 text-yellow-500" />
                    <h4 className="text-sm font-semibold">Recent Complaints</h4>
                  </div>
                  <div className="space-y-3">
                    {(activity?.recentComplaints?.length > 0 ? activity.recentComplaints : []).map((item: { id: string; subject: string; studentName: string; status: string; createdAt: string }) => (
                      <div key={item.id} className="flex items-start gap-2 text-xs">
                        <div className="h-2 w-2 rounded-full bg-yellow-500 mt-1 shrink-0" />
                        <div>
                          <p className="font-medium truncate max-w-[180px]">{item.subject}</p>
                          <p className="text-muted-foreground">{item.studentName}</p>
                          <Badge variant={statusBadgeVariant(item.status)} className="text-[10px] px-1.5 py-0">{item.status.replace("_", " ")}</Badge>
                        </div>
                      </div>
                    ))}
                    {(!activity?.recentComplaints || activity.recentComplaints.length === 0) && (
                      <p className="text-xs text-muted-foreground">No recent complaints</p>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Wallet className="h-4 w-4 text-green-500" />
                    <h4 className="text-sm font-semibold">Recent Payments</h4>
                  </div>
                  <div className="space-y-3">
                    {(activity?.recentPayments?.length > 0 ? activity.recentPayments : []).map((item: { id: string; studentName: string; amount: number; status: string; date: string }) => (
                      <div key={item.id} className="flex items-start gap-2 text-xs">
                        <div className="h-2 w-2 rounded-full bg-green-500 mt-1 shrink-0" />
                        <div>
                          <p className="font-medium">{item.studentName}</p>
                          <p className="font-semibold text-green-600">₹{item.amount?.toLocaleString()}</p>
                          <Badge variant={statusBadgeVariant(item.status)} className="text-[10px] px-1.5 py-0">{item.status}</Badge>
                        </div>
                      </div>
                    ))}
                    {(!activity?.recentPayments || activity.recentPayments.length === 0) && (
                      <p className="text-xs text-muted-foreground">No recent payments</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="xl:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BellRing className="h-4 w-4" /> Pending Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/admin/room-allocations" className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-orange-500/5 to-transparent hover:from-orange-500/10 transition-all duration-200 border border-transparent hover:border-orange-500/20">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-sm font-medium">Pending Allocations</span>
                </div>
                <Badge variant="warning" className="text-xs">{notif?.pendingApplications ?? 0}</Badge>
              </Link>
              <Link href="/admin/complaints" className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-yellow-500/5 to-transparent hover:from-yellow-500/10 transition-all duration-200 border border-transparent hover:border-yellow-500/20">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <span className="text-sm font-medium">Open Complaints</span>
                </div>
                <Badge variant="warning" className="text-xs">{notif?.openComplaints ?? 0}</Badge>
              </Link>
              <Link href="/admin/visitors/requests" className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-500/5 to-transparent hover:from-purple-500/10 transition-all duration-200 border border-transparent hover:border-purple-500/20">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <UserCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-sm font-medium">Visitor Requests</span>
                </div>
                <Badge variant="info" className="text-xs">{notif?.pendingVisitors ?? 0}</Badge>
              </Link>
              <Link href="/admin/leave-requests" className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-blue-500/5 to-transparent hover:from-blue-500/10 transition-all duration-200 border border-transparent hover:border-blue-500/20">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <CalendarDays className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-medium">Leave Requests</span>
                </div>
                <Badge variant="info" className="text-xs">{notif?.pendingLeaves ?? 0}</Badge>
              </Link>
              <Link href="/admin/rooms" className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-500/5 to-transparent hover:from-emerald-500/10 transition-all duration-200 border border-transparent hover:border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-sm font-medium">Vacant Rooms</span>
                </div>
                <Badge variant="success" className="text-xs">{s?.totalAvailableRooms ?? 0}</Badge>
              </Link>
              <Link href="/admin/payments" className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-red-500/5 to-transparent hover:from-red-500/10 transition-all duration-200 border border-transparent hover:border-red-500/20">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <Wallet className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <span className="text-sm font-medium">Pending Payments</span>
                </div>
                <Badge variant="warning" className="text-xs">{notif?.pendingPayments ?? 0}</Badge>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
