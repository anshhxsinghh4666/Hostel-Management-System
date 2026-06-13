"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { LogIn, LogOut, Search, Users } from "lucide-react";
import { format } from "date-fns";

const VISITOR_STATUS_COLORS: Record<string, string> = {
  inside: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  exited: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export default function AdminVisitorLogsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [checkInData, setCheckInData] = useState({ passNumber: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-visitor-logs", search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("student", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/visitor-logs?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: gatePassesData } = useQuery({
    queryKey: ["admin-gate-passes-for-checkin"],
    queryFn: async () => {
      const res = await fetch("/api/admin/gate-passes?status=ACTIVE&limit=50");
      if (!res.ok) return { data: [] };
      return res.json();
    },
  });

  const logMutation = useMutation({
    mutationFn: async ({ gatePassId, action }: { gatePassId: string; action: string }) => {
      const res = await fetch("/api/admin/visitor-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gatePassId, action }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to record");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-visitor-logs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-gate-passes-for-checkin"] });
    },
  });

  const logs = data?.data || [];
  const gatePasses = gatePassesData?.data || [];

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingState rows={4} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading">Visitor Entry/Exit Logs</h1>
            <p className="text-muted-foreground">Track visitor check-ins and check-outs</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{logs.length}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Inside Hostel</CardTitle>
              <LogIn className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">
                {(logs as Array<Record<string, unknown>>).filter((l: Record<string, unknown>) => l.checkInTime && !l.checkOutTime).length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-gray-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Exited</CardTitle>
              <LogOut className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-600">
                {(logs as Array<Record<string, unknown>>).filter((l: Record<string, unknown>) => l.checkOutTime).length}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Check-In / Check-Out</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="Search pass number or visitor..."
                      value={checkInData.passNumber}
                      onChange={(e) => setCheckInData({ passNumber: e.target.value })}
                    />
                  </div>
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {gatePasses
                .filter((gp: Record<string, unknown>) => {
                    if (!checkInData.passNumber) return true;
                    const req = gp.request as Record<string, unknown> | undefined;
                    const visitor = req?.visitor as Record<string, unknown> | undefined;
                    return (
                      (gp.passNumber as string)?.toLowerCase().includes(checkInData.passNumber.toLowerCase()) ||
                      (visitor?.name as string)?.toLowerCase().includes(checkInData.passNumber.toLowerCase())
                    );
                  })
                  .slice(0, 10)
                  .map((gp: Record<string, unknown>) => {
                    const req = gp.request as Record<string, unknown> | undefined;
                    const visitor = req?.visitor as Record<string, unknown> | undefined;
                    const logsArr = gp.logs as Array<Record<string, unknown>> | undefined;
                    const hasLog = logsArr && logsArr.length > 0;
                    const lastLog = hasLog ? logsArr![0] : null;
                    const isInside = lastLog && !lastLog.checkOutTime;
                      return (
                        <div key={gp.id as string} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div>
                            <p className="text-sm font-medium font-mono">{gp.passNumber as string}</p>
                            <p className="text-xs text-muted-foreground">{visitor?.name as string} - {req?.purpose as string}</p>
                          </div>
                          {isInside ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => logMutation.mutate({ gatePassId: gp.id as string, action: "check-out" })}
                            >
                              <LogOut className="h-3 w-3 mr-1" /> Check Out
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => logMutation.mutate({ gatePassId: gp.id as string, action: "check-in" })}
                            >
                              <LogIn className="h-3 w-3 mr-1" /> Check In
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  {(gatePasses as Array<Record<string, unknown>>).filter((gp: Record<string, unknown>) => {
                    if (!checkInData.passNumber) return true;
                    const req = gp.request as Record<string, unknown> | undefined;
                    const visitor = req?.visitor as Record<string, unknown> | undefined;
                    return (
                      (gp.passNumber as string)?.toLowerCase().includes(checkInData.passNumber.toLowerCase()) ||
                      (visitor?.name as string)?.toLowerCase().includes(checkInData.passNumber.toLowerCase())
                    );
                  }).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No active gate passes found</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search by student..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="inside">Inside Hostel</option>
                <option value="exited">Exited</option>
              </select>
            </CardContent>
          </Card>
        </div>

        {logs.length === 0 ? (
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="No visitor logs yet"
            description="Visitor check-in/check-out logs will appear here"
          />
        ) : (
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 text-sm font-medium">Visitor</th>
                  <th className="text-left p-3 text-sm font-medium">Student</th>
                  <th className="text-left p-3 text-sm font-medium">Pass Number</th>
                  <th className="text-left p-3 text-sm font-medium">Check-In</th>
                  <th className="text-left p-3 text-sm font-medium">Check-Out</th>
                  <th className="text-left p-3 text-sm font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: Record<string, unknown>) => {
                  const gp = log.gatePass as Record<string, unknown> | undefined;
                  const req = gp?.request as Record<string, unknown> | undefined;
                  const visitor = req?.visitor as Record<string, unknown> | undefined;
                  const student = req?.student as Record<string, unknown> | undefined;
                  const isInside = log.checkInTime && !log.checkOutTime;
                  return (
                    <tr key={log.id as string} className="border-b hover:bg-muted/30">
                      <td className="p-3">
                        <p className="text-sm font-medium">{visitor?.name as string}</p>
                      </td>
                      <td className="p-3 text-sm">
                        {student ? `${student.firstName as string} ${student.lastName as string}` : "N/A"}
                      </td>
                      <td className="p-3 text-sm font-mono">{gp?.passNumber as string}</td>
                      <td className="p-3 text-sm">
                        {log.checkInTime ? format(new Date(log.checkInTime as string), "MMM d, h:mm a") : "--"}
                      </td>
                      <td className="p-3 text-sm">
                        {log.checkOutTime ? format(new Date(log.checkOutTime as string), "MMM d, h:mm a") : "--"}
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${isInside ? VISITOR_STATUS_COLORS.inside : VISITOR_STATUS_COLORS.exited}`}>
                          {isInside ? "Inside Hostel" : "Exited"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
