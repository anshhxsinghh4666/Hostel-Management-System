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
import { Users, Clock, CheckCircle, XCircle, Plus, Search, Download, Printer } from "lucide-react";
import { format } from "date-fns";
import QRCode from "qrcode";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  EXPIRED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  PENDING: <Clock className="h-4 w-4" />,
  APPROVED: <CheckCircle className="h-4 w-4" />,
  REJECTED: <XCircle className="h-4 w-4" />,
  EXPIRED: <Clock className="h-4 w-4" />,
};

export default function StudentVisitorsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Record<string, unknown> | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    relation: "",
    purpose: "",
    visitDate: "",
    arrivalTime: "",
    departureTime: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["student-visitor-requests", search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/student/visitor-requests?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/student/visitor-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit request");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-visitor-requests"] });
      setOpen(false);
      setFormData({ name: "", mobile: "", relation: "", purpose: "", visitDate: "", arrivalTime: "", departureTime: "" });
    },
  });

  const handleViewGatePass = async (request: Record<string, unknown>) => {
    const gatePass = request.gatePass as Record<string, unknown> | undefined;
    if (!gatePass) return;
    try {
      const qrData = JSON.stringify({
        passId: gatePass.id,
        passNumber: gatePass.passNumber,
        qrToken: gatePass.qrToken,
      });
      const url = await QRCode.toDataURL(qrData, { width: 200, margin: 2 });
      setQrDataUrl(url);
      setSelectedRequest(request);
    } catch {
      setSelectedRequest(request);
    }
  };

  const handleDownloadPass = async () => {
    if (!qrDataUrl || !selectedRequest) return;
    const link = document.createElement("a");
    link.download = `gate-pass-${(selectedRequest.gatePass as Record<string, unknown>)?.passNumber || "download"}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handlePrintPass = () => {
    if (!qrDataUrl || !selectedRequest) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const req = selectedRequest;
    const visitor = req.visitor as Record<string, unknown> | undefined;
    const gp = req.gatePass as Record<string, unknown> | undefined;
    printWindow.document.write(`
      <html><head><title>Gate Pass</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;text-align:center}h1{color:#1a365d}.pass{border:2px solid #333;padding:30px;max-width:400px;margin:0 auto}.details{text-align:left;margin:20px 0}table{width:100%}td{padding:6px 10px;border-bottom:1px solid #ddd}.footer{margin-top:30px;font-size:12px;color:#666}</style>
      </head><body>
      <div class="pass"><h1>Gate Pass</h1>
      <p><strong>${gp?.passNumber || "N/A"}</strong></p>
      <img src="${qrDataUrl}" style="width:180px;height:180px" />
      <div class="details"><table>
      <tr><td>Student:</td><td><strong>${req.studentName || "N/A"}</strong></td></tr>
      <tr><td>Visitor:</td><td><strong>${visitor?.name || "N/A"}</strong></td></tr>
      <tr><td>Date:</td><td><strong>${req.visitDate ? format(new Date(req.visitDate as string), "MMM d, yyyy") : "N/A"}</strong></td></tr>
      <tr><td>Time:</td><td><strong>${req.arrivalTime || "N/A"} - ${req.departureTime || "N/A"}</strong></td></tr>
      <tr><td>Purpose:</td><td><strong>${req.purpose || "N/A"}</strong></td></tr>
      </table></div>
      <p class="footer">Valid only on the date and time mentioned above.</p>
      </div></body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const requests = data?.data?.requests || [];
  const stats = data?.data?.stats || { total: 0, pending: 0, approved: 0, rejected: 0 };

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
            <h1 className="text-3xl font-bold font-heading">Visitor Management</h1>
            <p className="text-muted-foreground">Register visitors and track requests</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Visitor Request
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Register a Visitor</DialogTitle>
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
                    <Label>Full Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Visitor full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mobile Number</Label>
                    <Input
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      placeholder="Visitor mobile number"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Relation</Label>
                    <Input
                      value={formData.relation}
                      onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                      placeholder="e.g. Father, Mother, Friend"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Purpose of Visit</Label>
                    <Input
                      value={formData.purpose}
                      onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                      placeholder="Purpose of visit"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Date of Visit</Label>
                  <Input
                    type="date"
                    value={formData.visitDate}
                    onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Expected Arrival Time</Label>
                    <Input
                      type="time"
                      value={formData.arrivalTime}
                      onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expected Departure Time</Label>
                    <Input
                      type="time"
                      value={formData.departureTime}
                      onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                      required
                    />
                  </div>
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

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
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
              placeholder="Search by visitor name..."
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
            <option value="EXPIRED">Expired</option>
          </select>
        </div>

        {requests.length === 0 ? (
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="No visitor requests yet"
            description="Submit your first visitor request using the button above"
          />
        ) : (
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 text-sm font-medium">Visitor Name</th>
                  <th className="text-left p-3 text-sm font-medium">Date</th>
                  <th className="text-left p-3 text-sm font-medium">Purpose</th>
                  <th className="text-left p-3 text-sm font-medium">Status</th>
                  <th className="text-left p-3 text-sm font-medium">Gate Pass</th>
                  <th className="text-left p-3 text-sm font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req: Record<string, unknown>) => {
                  const visitor = req.visitor as Record<string, unknown> | undefined;
                  const gatePass = req.gatePass as Record<string, unknown> | undefined;
                  return (
                    <tr key={req.id as string} className="border-b hover:bg-muted/30">
                      <td className="p-3">
                        <p className="text-sm font-medium">{visitor?.name as string}</p>
                        <p className="text-xs text-muted-foreground">{visitor?.mobile as string}</p>
                      </td>
                      <td className="p-3 text-sm">
                        {req.visitDate ? format(new Date(req.visitDate as string), "MMM d, yyyy") : "N/A"}
                        <p className="text-xs text-muted-foreground">{req.arrivalTime as string} - {req.departureTime as string}</p>
                      </td>
                      <td className="p-3 text-sm max-w-[150px] truncate">{req.purpose as string}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[req.status as string] || ""}`}>
                          {STATUS_ICONS[req.status as string]}
                          {req.status as string}
                        </span>
                      </td>
                      <td className="p-3 text-sm">
                        {gatePass ? (
                          <span className="text-green-600 font-medium">Available</span>
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </td>
                      <td className="p-3">
                        {gatePass && req.status === "APPROVED" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewGatePass(req)}
                          >
                            View Pass
                          </Button>
                        ) : req.status === "PENDING" ? (
                          <span className="text-xs text-muted-foreground">Awaiting Approval</span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Dialog open={!!selectedRequest} onOpenChange={(o) => { if (!o) { setSelectedRequest(null); setQrDataUrl(null); } }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Digital Gate Pass</DialogTitle>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                {qrDataUrl && (
                  <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg">
                    <img src={qrDataUrl} alt="Gate Pass QR Code" className="w-40 h-40" />
                    <p className="text-xs text-muted-foreground">Scan to verify gate pass</p>
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" onClick={handleDownloadPass}>
                        <Download className="mr-1 h-3 w-3" /> Download
                      </Button>
                      <Button variant="outline" size="sm" onClick={handlePrintPass}>
                        <Printer className="mr-1 h-3 w-3" /> Print
                      </Button>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Pass Number</p>
                    <p className="font-medium font-mono text-xs">
                      {(selectedRequest.gatePass as Record<string, unknown>)?.passNumber as string || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[selectedRequest.status as string] || ""}`}>
                      {selectedRequest.status as string}
                    </span>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Visitor</p>
                    <p className="font-medium">{(selectedRequest.visitor as Record<string, unknown>)?.name as string}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Visit Date</p>
                    <p className="font-medium">{selectedRequest.visitDate ? format(new Date(selectedRequest.visitDate as string), "MMM d, yyyy") : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Valid Time</p>
                    <p className="font-medium">{selectedRequest.arrivalTime as string} - {selectedRequest.departureTime as string}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Purpose</p>
                    <p className="font-medium">{selectedRequest.purpose as string}</p>
                  </div>
                </div>
                {(selectedRequest.remarks as string) && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Remarks:</p>
                    <p className="text-sm">{selectedRequest.remarks as string}</p>
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
