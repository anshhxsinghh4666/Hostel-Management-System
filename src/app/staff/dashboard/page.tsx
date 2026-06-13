"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/shared/loading-state";
import { Users, ClipboardList, Mail, Shield } from "lucide-react";
import { Role } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/constants";

export default function StaffDashboardPage() {
  const { data: session } = useSession();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["staff-stats"],
    queryFn: async () => {
      const [studentsRes, profileRes] = await Promise.all([
        fetch("/api/users?role=STUDENT&limit=1"),
        session?.user?.id ? fetch(`/api/users/${session.user.id}`) : Promise.resolve(null),
      ]);
      const studentsData = await studentsRes.json();
      const profileData = profileRes ? await profileRes.json() : null;
      return {
        totalStudents: studentsData?.meta?.total ?? 0,
        profile: profileData?.data,
      };
    },
    enabled: !!session?.user?.id,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingState rows={3} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-heading">Staff Dashboard</h1>
          <p className="text-muted-foreground">Welcome, {session?.user?.name}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats?.totalStudents ?? "--"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">My Role</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {stats?.profile?.role ? ROLE_LABELS[stats.profile.role as Role] : "Staff"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Email</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold truncate">{stats?.profile?.email || "--"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-muted-foreground mt-1">Module 2</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
