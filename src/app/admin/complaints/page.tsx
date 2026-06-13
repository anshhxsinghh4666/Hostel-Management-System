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
import { AlertTriangle, Clock, CheckCircle, Search, MessageSquare } from "lucide-react";
import { format } from "date-fns";

const CATEGORY_LABELS: Record<string, string> = {
  ELECTRICAL: "Electrical",
  PLUMBING: "Plumbing",
  INTERNET: "Internet",
  FURNITURE: "Furniture",
  CLEANING: "Cleaning",
  OTHER: "Other",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  HIGH: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  RESOLVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

export default function AdminComplaintsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState<Record<string, unknown> | null>(null);
  const [updateData, setUpdateData] = useState({ status: "", adminRemark: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-complaints", search, statusFilter, categoryFilter, priorityFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      if (priorityFilter) params.set("priority", priorityFilter);
      const res = await fetch(`/api/admin/complaints?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data: update }: { id: string; data: typeof updateData }) => {
      const res = await fetch(`/api/admin/complaints/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-complaints"] });
      setSelectedComplaint(null);
      setUpdateData({ status: "", adminRemark: "" });
    },
  });

  const complaints = data?.data || [];
  const pendingCount = complaints.filter((c: any) => c.status === "PENDING").length;
  const inProgressCount = complaints.filter((c: any) => c.status === "IN_PROGRESS").length;
  const resolvedCount = complaints.filter((c: any) => c.status === "RESOLVED").length;

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    const updateBody: Record<string, string> = {};
    if (updateData.status) updateBody.status = updateData.status;
    if (updateData.adminRemark) updateBody.adminRemark = updateData.adminRemark;
    updateMutation.mutate({ id: selectedComplaint.id as string, data: updateBody as { status: string; adminRemark: string } });
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
          <h1 className="text-3xl font-bold font-heading">Complaint Management</h1>
          <p className="text-muted-foreground">View and manage all student complaints</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{complaints.length}</p>
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
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <AlertTriangle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{resolvedCount}</p>
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
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>

        {complaints.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="h-8 w-8" />}
            title="No complaints found"
            description="No complaints match your search criteria"
          />
        ) : (
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 text-sm font-medium">Student</th>
                  <th className="text-left p-3 text-sm font-medium">Category</th>
                  <th className="text-left p-3 text-sm font-medium">Subject</th>
                  <th className="text-left p-3 text-sm font-medium">Priority</th>
                  <th className="text-left p-3 text-sm font-medium">Status</th>
                  <th className="text-left p-3 text-sm font-medium">Date</th>
                  <th className="text-left p-3 text-sm font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((complaint: Record<string, unknown>) => {
                  const student = complaint.student as Record<string, unknown> | undefined;
                  return (
                    <tr key={complaint.id as string} className="border-b hover:bg-muted/30">
                      <td className="p-3">
                        <p className="text-sm font-medium">{student ? `${student.firstName as string} ${student.lastName as string}` : "N/A"}</p>
                        <p className="text-xs text-muted-foreground">{student?.registrationNumber as string}</p>
                      </td>
                      <td className="p-3 text-sm">{CATEGORY_LABELS[complaint.category as string] || complaint.category as string}</td>
                      <td className="p-3 text-sm max-w-[200px] truncate">{complaint.subject as string}</td>
                      <td className="p-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_COLORS[complaint.priority as string] || ""}`}>
                          {complaint.priority as string}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[complaint.status as string] || ""}`}>
                          {complaint.status === "IN_PROGRESS" ? "In Progress" : complaint.status as string}
                        </span>
                      </td>
                      <td className="p-3 text-sm">{format(new Date(complaint.createdAt as string), "MMM d, yyyy")}</td>
                      <td className="p-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedComplaint(complaint);
                            setUpdateData({ status: complaint.status as string, adminRemark: (complaint.adminRemark as string) || "" });
                          }}
                        >
                          Update
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Dialog open={!!selectedComplaint} onOpenChange={(o) => { if (!o) setSelectedComplaint(null); }}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Update Complaint</DialogTitle>
            </DialogHeader>
            {selectedComplaint && (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Subject: {selectedComplaint.subject as string}</p>
                  <p className="text-sm text-muted-foreground">{selectedComplaint.description as string}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Student</p>
                    <p className="font-medium">
                      {selectedComplaint.student
                        ? `${(selectedComplaint.student as Record<string, unknown>).firstName as string} ${(selectedComplaint.student as Record<string, unknown>).lastName as string}`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Category / Priority</p>
                    <p className="font-medium">{CATEGORY_LABELS[selectedComplaint.category as string]} - {selectedComplaint.priority as string}</p>
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
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Admin Remark</label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={updateData.adminRemark}
                    onChange={(e) => setUpdateData({ ...updateData, adminRemark: e.target.value })}
                    placeholder="Add admin remark..."
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setSelectedComplaint(null)}>Cancel</Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Updating..." : "Update Complaint"}
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
