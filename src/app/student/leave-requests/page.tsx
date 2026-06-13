"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { CalendarDays, Plus, CheckCircle, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const STATUS_ICONS: Record<string, React.ReactNode | undefined> = {
  PENDING: <Clock className="h-4 w-4" />,
  APPROVED: <CheckCircle className="h-4 w-4" />,
  REJECTED: <XCircle className="h-4 w-4" />,
};

export default function StudentLeaveRequestsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [formData, setFormData] = useState({
    fromDate: "",
    toDate: "",
    reason: "",
    emergencyContact: "",
    parentName: "",
  });

  const { data: leavesData, isLoading } = useQuery({
    queryKey: ["student-leave-requests"],
    queryFn: async () => {
      const res = await fetch("/api/student/leave-requests");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/student/leave-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to submit");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-leave-requests"] });
      setOpen(false);
      setFormData({ fromDate: "", toDate: "", reason: "", emergencyContact: "", parentName: "" });
    },
  });

  const leaves = leavesData?.data || [];
  const totalLeaves = leavesData?.meta?.total || leaves.length;
  const approvedCount = leaves.filter((l: any) => l.status === "APPROVED").length;
  const pendingCount = leaves.filter((l: any) => l.status === "PENDING").length;

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
            <h1 className="text-3xl font-bold font-heading">Leave Requests</h1>
            <p className="text-muted-foreground">Apply for and track your leave requests</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Leave Request
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Apply for Leave</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createMutation.mutate(formData);
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>From Date</Label>
                    <Input
                      type="date"
                      value={formData.fromDate}
                      onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>To Date</Label>
                    <Input
                      type="date"
                      value={formData.toDate}
                      onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <textarea
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Reason for leave"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Emergency Contact Number</Label>
                  <Input
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    placeholder="Emergency contact number"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Parent Name</Label>
                  <Input
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    placeholder="Parent/Guardian name"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Submitting..." : "Submit Request"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalLeaves}</p>
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
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </CardContent>
          </Card>
        </div>

        {leaves.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="h-8 w-8" />}
            title="No leave requests yet"
            description="Submit your first leave request using the button above"
          />
        ) : (
          <div className="space-y-4">
            {leaves.map((leave: any) => (
              <Card
                key={leave.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedLeave(leave)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold">
                        {format(new Date(leave.fromDate), "MMM d, yyyy")} - {format(new Date(leave.toDate), "MMM d, yyyy")}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{leave.reason}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Contact: {leave.emergencyContact}</span>
                        <span>Parent: {leave.parentName}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Submitted: {format(new Date(leave.createdAt), "MMM d, yyyy h:mm a")}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[leave.status] || ""}`}>
                      {STATUS_ICONS[leave.status]}
                      {leave.status}
                    </span>
                  </div>
                  {leave.adminComment && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Admin Comment:</p>
                      <p className="text-sm">{leave.adminComment}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!selectedLeave} onOpenChange={(o) => { if (!o) setSelectedLeave(null); }}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Leave Request Details</DialogTitle>
            </DialogHeader>
            {selectedLeave && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[selectedLeave.status] || ""}`}>
                    {STATUS_ICONS[selectedLeave.status]}
                    {selectedLeave.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">From Date</p>
                    <p className="font-medium">{format(new Date(selectedLeave.fromDate), "MMM d, yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">To Date</p>
                    <p className="font-medium">{format(new Date(selectedLeave.toDate), "MMM d, yyyy")}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reason</p>
                  <p className="text-sm mt-1">{selectedLeave.reason}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Emergency Contact</p>
                    <p className="font-medium">{selectedLeave.emergencyContact}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Parent Name</p>
                    <p className="font-medium">{selectedLeave.parentName}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p className="text-sm font-medium">{format(new Date(selectedLeave.createdAt), "MMM d, yyyy h:mm a")}</p>
                </div>
                {selectedLeave.adminComment && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Admin Comment:</p>
                    <p className="text-sm">{selectedLeave.adminComment}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
