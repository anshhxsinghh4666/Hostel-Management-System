"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { CalendarDays, CheckCircle, Clock, XCircle, Search } from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function AdminLeaveRequestsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedLeave, setSelectedLeave] = useState<Record<string, unknown> | null>(null);
  const [updateData, setUpdateData] = useState({ status: "", adminComment: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-leave-requests", search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/leave-requests?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data: update }: { id: string; data: typeof updateData }) => {
      const res = await fetch(`/api/admin/leave-requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-leave-requests"] });
      setSelectedLeave(null);
      setUpdateData({ status: "", adminComment: "" });
    },
  });

  const leaves = data?.data || [];
  const pendingCount = leaves.filter((l: any) => l.status === "PENDING").length;
  const approvedCount = leaves.filter((l: any) => l.status === "APPROVED").length;
  const rejectedCount = leaves.filter((l: any) => l.status === "REJECTED").length;

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeave) return;
    const updateBody: Record<string, string> = {};
    if (updateData.status) updateBody.status = updateData.status;
    if (updateData.adminComment) updateBody.adminComment = updateData.adminComment;
    updateMutation.mutate({ id: selectedLeave.id as string, data: updateBody as { status: string; adminComment: string } });
  };

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
        <div>
          <h1 className="text-3xl font-bold font-heading">Leave Management</h1>
          <p className="text-muted-foreground">View and manage student leave requests</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{leaves.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by student name or roll no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {leaves.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="h-8 w-8" />}
            title="No leave requests found"
            description="No leave requests match your search criteria"
          />
        ) : (
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 text-sm font-medium">Student</th>
                  <th className="text-left p-3 text-sm font-medium">Duration</th>
                  <th className="text-left p-3 text-sm font-medium">Reason</th>
                  <th className="text-left p-3 text-sm font-medium">Contact</th>
                  <th className="text-left p-3 text-sm font-medium">Status</th>
                  <th className="text-left p-3 text-sm font-medium">Date</th>
                  <th className="text-left p-3 text-sm font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave: Record<string, unknown>) => {
                  const student = leave.student as Record<string, unknown> | undefined;
                  return (
                    <tr key={leave.id as string} className="border-b hover:bg-muted/30">
                      <td className="p-3">
                        <p className="text-sm font-medium">{student ? `${student.firstName as string} ${student.lastName as string}` : "N/A"}</p>
                        <p className="text-xs text-muted-foreground">{student?.registrationNumber as string}</p>
                      </td>
                      <td className="p-3 text-sm">
                        {format(new Date(leave.fromDate as string), "MMM d")} - {format(new Date(leave.toDate as string), "MMM d, yyyy")}
                      </td>
                      <td className="p-3 text-sm max-w-[200px] truncate">{leave.reason as string}</td>
                      <td className="p-3 text-sm">{leave.emergencyContact as string}</td>
                      <td className="p-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[leave.status as string] || ""}`}>
                          {leave.status as string}
                        </span>
                      </td>
                      <td className="p-3 text-sm">{format(new Date(leave.createdAt as string), "MMM d, yyyy")}</td>
                      <td className="p-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedLeave(leave);
                            setUpdateData({ status: leave.status as string, adminComment: (leave.adminComment as string) || "" });
                          }}
                        >
                          Review
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Dialog open={!!selectedLeave} onOpenChange={(o) => { if (!o) setSelectedLeave(null); }}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Review Leave Request</DialogTitle>
            </DialogHeader>
            {selectedLeave && (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {format(new Date(selectedLeave.fromDate as string), "MMM d, yyyy")} - {format(new Date(selectedLeave.toDate as string), "MMM d, yyyy")}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedLeave.reason as string}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Student</p>
                    <p className="font-medium">
                      {selectedLeave.student
                        ? `${(selectedLeave.student as Record<string, unknown>).firstName as string} ${(selectedLeave.student as Record<string, unknown>).lastName as string}`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Parent</p>
                    <p className="font-medium">{selectedLeave.parentName as string}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Emergency Contact</p>
                    <p className="font-medium">{selectedLeave.emergencyContact as string}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={updateData.status}
                    onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approve</option>
                    <option value="REJECTED">Reject</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Admin Comment</label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={updateData.adminComment}
                    onChange={(e) => setUpdateData({ ...updateData, adminComment: e.target.value })}
                    placeholder="Add admin comment..."
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setSelectedLeave(null)}>Cancel</Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Updating..." : "Update Request"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
