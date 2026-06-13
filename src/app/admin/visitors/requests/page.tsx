"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { CheckCircle, XCircle, Clock, Search, Users, Eye } from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  EXPIRED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export default function AdminVisitorRequestsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [hostelFilter, setHostelFilter] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<Record<string, unknown> | null>(null);
  const [showDetail, setShowDetail] = useState<Record<string, unknown> | null>(null);
  const [remarks, setRemarks] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-visitor-requests", search, statusFilter, hostelFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("student", search);
      if (statusFilter) params.set("status", statusFilter);
      if (hostelFilter) params.set("hostelId", hostelFilter);
      const res = await fetch(`/api/admin/visitor-requests?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: hostelsData } = useQuery({
    queryKey: ["hostels"],
    queryFn: async () => {
      const res = await fetch("/api/hostels");
      if (!res.ok) return { data: [] };
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, remarks: r }: { id: string; status: string; remarks?: string }) => {
      const res = await fetch(`/api/admin/visitor-requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, remarks: r || undefined }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-visitor-requests"] });
      setSelectedRequest(null);
      setRemarks("");
    },
  });

  const requests = data?.data || [];
  const hostels = hostelsData?.data || [];

  const stats = {
    total: requests.length,
    pending: requests.filter((r: any) => r.status === "PENDING").length,
    approved: requests.filter((r: any) => r.status === "APPROVED").length,
    rejected: requests.filter((r: any) => r.status === "REJECTED").length,
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
          <h1 className="text-3xl font-bold font-heading">Visitor Request Approval Panel</h1>
          <p className="text-muted-foreground">Review and manage visitor requests from students</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by student name or ID..."
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
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={hostelFilter}
            onChange={(e) => setHostelFilter(e.target.value)}
          >
            <option value="">All Hostels</option>
            {hostels.map((h: Record<string, unknown>) => (
              <option key={h.id as string} value={h.id as string}>{h.hostelName as string}</option>
            ))}
          </select>
        </div>

        {requests.length === 0 ? (
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="No visitor requests found"
            description="No requests match your search criteria"
          />
        ) : (
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 text-sm font-medium">Student</th>
                  <th className="text-left p-3 text-sm font-medium">Room</th>
                  <th className="text-left p-3 text-sm font-medium">Visitor</th>
                  <th className="text-left p-3 text-sm font-medium">Date</th>
                  <th className="text-left p-3 text-sm font-medium">Purpose</th>
                  <th className="text-left p-3 text-sm font-medium">Status</th>
                  <th className="text-left p-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req: Record<string, unknown>) => {
                  const student = req.student as Record<string, unknown> | undefined;
                  const visitor = req.visitor as Record<string, unknown> | undefined;
                  const room = student?.room as Record<string, unknown> | undefined;
                  return (
                    <tr key={req.id as string} className="border-b hover:bg-muted/30">
                      <td className="p-3">
                        <p className="text-sm font-medium">{student ? `${student.firstName as string} ${student.lastName as string}` : "N/A"}</p>
                        <p className="text-xs text-muted-foreground">{student?.registrationNumber as string}</p>
                      </td>
                      <td className="p-3 text-sm">
                        {room ? `Room ${room.roomNumber as string}` : "N/A"}
                        <p className="text-xs text-muted-foreground">{student?.hostel ? (student.hostel as Record<string, unknown>).hostelName as string : ""}</p>
                      </td>
                      <td className="p-3">
                        <p className="text-sm font-medium">{visitor?.name as string}</p>
                        <p className="text-xs text-muted-foreground">{visitor?.mobile as string} ({visitor?.relation as string})</p>
                      </td>
                      <td className="p-3 text-sm">
                        {req.visitDate ? format(new Date(req.visitDate as string), "MMM d, yyyy") : "N/A"}
                        <p className="text-xs text-muted-foreground">{req.arrivalTime as string} - {req.departureTime as string}</p>
                      </td>
                      <td className="p-3 text-sm max-w-[120px] truncate">{req.purpose as string}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[req.status as string] || ""}`}>
                          {req.status as string}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDetail(req)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          {req.status === "PENDING" && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => updateMutation.mutate({ id: req.id as string, status: "APPROVED" })}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" /> Approve
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setSelectedRequest(req);
                                  setRemarks("");
                                }}
                              >
                                <XCircle className="h-3 w-3 mr-1" /> Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Dialog open={!!selectedRequest} onOpenChange={(o) => { if (!o) setSelectedRequest(null); }}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Reject Visitor Request</DialogTitle>
            </DialogHeader>
            {selectedRequest && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateMutation.mutate({ id: selectedRequest.id as string, status: "REJECTED", remarks });
                }}
                className="space-y-4"
              >
                <div>
                  <p className="text-sm text-muted-foreground">Visitor:</p>
                  <p className="font-medium">{(selectedRequest.visitor as Record<string, unknown>)?.name as string}</p>
                </div>
                <div className="space-y-2">
                  <Label>Remarks (optional)</Label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Reason for rejection..."
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setSelectedRequest(null)}>Cancel</Button>
                  <Button type="submit" variant="destructive" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Rejecting..." : "Reject Request"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!showDetail} onOpenChange={(o) => { if (!o) setShowDetail(null); }}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Visitor Request Details</DialogTitle>
            </DialogHeader>
            {showDetail && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Student</p>
                    <p className="font-medium">
                      {`${(showDetail.student as Record<string, unknown>)?.firstName as string || ""} ${(showDetail.student as Record<string, unknown>)?.lastName as string || ""}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Registration No</p>
                    <p className="font-medium">{(showDetail.student as Record<string, unknown>)?.registrationNumber as string}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Room</p>
                    <p className="font-medium">
                      {((showDetail.student as Record<string, unknown>)?.room as Record<string, unknown>)?.roomNumber as string || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Hostel</p>
                    <p className="font-medium">
                      {((showDetail.student as Record<string, unknown>)?.hostel as Record<string, unknown>)?.hostelName as string || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Visitor</p>
                    <p className="font-medium">{(showDetail.visitor as Record<string, unknown>)?.name as string}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Mobile</p>
                    <p className="font-medium">{(showDetail.visitor as Record<string, unknown>)?.mobile as string}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Relation</p>
                    <p className="font-medium">{(showDetail.visitor as Record<string, unknown>)?.relation as string}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Visit Date</p>
                    <p className="font-medium">{showDetail.visitDate ? format(new Date(showDetail.visitDate as string), "MMM d, yyyy") : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Time</p>
                    <p className="font-medium">{showDetail.arrivalTime as string} - {showDetail.departureTime as string}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Purpose</p>
                    <p className="font-medium">{showDetail.purpose as string}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[showDetail.status as string] || ""}`}>
                    {showDetail.status as string}
                  </span>
                </div>
                {(showDetail.remarks as string) && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Remarks:</p>
                    <p className="text-sm">{showDetail.remarks as string}</p>
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
