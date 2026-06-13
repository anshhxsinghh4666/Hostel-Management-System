"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/shared/loading-state";
import { Users, Calendar, BarChart3, TrendingUp, Activity } from "lucide-react";
import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function AdminVisitorAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-visitor-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/visitor-analytics");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const analytics = data?.data;
  const overview = analytics?.overview || {};

  const approvalChartData = useMemo(() => {
    const d = (analytics?.approvalVsRejection as Record<string, number>) || {};
    return {
      labels: ["Approved", "Rejected", "Pending"],
      datasets: [
        {
          data: [d.approved || 0, d.rejected || 0, d.pending || 0],
          backgroundColor: ["#22c55e", "#ef4444", "#eab308"],
          borderWidth: 0,
        },
      ],
    };
  }, [analytics]);

  const dailyChartData = useMemo(() => {
    const days = (analytics?.dailyVisitors as Array<Record<string, unknown>>) || [];
    return {
      labels: days.map((d: Record<string, unknown>) => new Date(d.date as string).toLocaleDateString("en-US", { weekday: "short" })),
      datasets: [
        {
          label: "Visitors",
          data: days.map((d: Record<string, unknown>) => d.count as number),
          backgroundColor: "#3b82f6",
          borderRadius: 4,
        },
      ],
    };
  }, [analytics]);

  const topStudents = analytics?.topActiveStudents || [];

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingState rows={6} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-heading">Visitor Analytics</h1>
          <p className="text-muted-foreground">Comprehensive analytics for visitor management</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{overview.totalVisitors || 0}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{overview.visitorsToday || 0}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-600">{overview.visitorsThisMonth || 0}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{overview.totalRequests || 0}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" /> Daily Visitors (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {(analytics?.dailyVisitors || []).length > 0 ? (
                <Bar
                  data={dailyChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { beginAtZero: true, ticks: { stepSize: 1 } },
                      x: { grid: { display: false } },
                    },
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No data available yet
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" /> Approval vs Rejection
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              {(analytics?.approvalVsRejection?.approved || 0) +
                (analytics?.approvalVsRejection?.rejected || 0) +
                (analytics?.approvalVsRejection?.pending || 0) > 0 ? (
                <div className="w-[250px] h-[250px]">
                  <Doughnut
                    data={approvalChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "bottom",
                          labels: { padding: 16, usePointStyle: true },
                        },
                      },
                      cutout: "60%",
                    }}
                  />
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">No data available yet</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Request Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pending</span>
                  <span className="text-sm font-bold text-yellow-600">{overview.pendingRequests || 0}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${overview.totalRequests ? ((overview.pendingRequests || 0) / overview.totalRequests) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Approved</span>
                  <span className="text-sm font-bold text-green-600">{overview.approvedRequests || 0}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${overview.totalRequests ? ((overview.approvedRequests || 0) / overview.totalRequests) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Rejected</span>
                  <span className="text-sm font-bold text-red-600">{overview.rejectedRequests || 0}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${overview.totalRequests ? ((overview.rejectedRequests || 0) / overview.totalRequests) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Most Active Students</CardTitle>
            </CardHeader>
            <CardContent>
              {topStudents.length > 0 ? (
                <div className="space-y-3">
                  {topStudents.map((item: Record<string, unknown>, i: number) => {
                    const student = item.student as Record<string, unknown> | undefined;
                    const hostel = student?.hostel as Record<string, unknown> | undefined;
                    return (
                      <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}.</span>
                          <div>
                            <p className="text-sm font-medium">
                              {student?.firstName as string} {student?.lastName as string}
                            </p>
                            <p className="text-xs text-muted-foreground">{hostel?.hostelName as string || "N/A"}</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold">{item.requestCount as number} visits</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">No data available yet</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
