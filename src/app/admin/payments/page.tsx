"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";

import { Wallet, Plus, DollarSign, TrendingUp, Clock, XCircle, FileSpreadsheet, FileDown } from "lucide-react";
import { format } from "date-fns";
import { StudentPublic } from "@/lib/types";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  CARD: "Card",
  UPI: "UPI",
  BANK_TRANSFER: "Bank Transfer",
  CHEQUE: "Cheque",
};

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  REFUNDED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

interface CreatePaymentInput {
  studentId: string;
  amount: number;
  paymentMethod: string;
  status: string;
  transactionId?: string;
  remarks?: string;
  paymentDate?: string;
}

export default function PaymentManagementPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const queryParams = new URLSearchParams({
    page: String(page),
    limit: "10",
    ...(search && { search }),
    ...(statusFilter && { status: statusFilter }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["payments", page, search, statusFilter, startDate, endDate],
    queryFn: async () => {
      const res = await fetch(`/api/payments?${queryParams}`);
      if (!res.ok) throw new Error("Failed to fetch payments");
      return res.json();
    },
  });

  const { data: studentsData } = useQuery({
    queryKey: ["students-all"],
    queryFn: async () => {
      const res = await fetch("/api/students?limit=200");
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    },
    enabled: showCreateDialog,
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreatePaymentInput) => {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to record payment");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      setShowCreateDialog(false);
    },
  });

  const payments = data?.data || [];
  const meta = data?.meta || { page: 1, totalPages: 1, total: 0 };
  const students: StudentPublic[] = studentsData?.data || [];

  const totalAmount = payments.reduce((sum: number, p: any) => {
    return p.status === "COMPLETED" ? sum + Number(p.amount) : sum;
  }, 0);

  const completedCount = payments.filter((p: any) => p.status === "COMPLETED").length;
  const pendingCount = payments.filter((p: any) => p.status === "PENDING").length;
  const failedCount = payments.filter((p: any) => p.status === "FAILED").length;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setStartDate("");
    setEndDate("");
  };

  const hasFilters = search || statusFilter || startDate || endDate;

  const exportCSV = () => {
    const headers = ["Student Name", "Reg No", "Amount", "Date", "Method", "Transaction ID", "Status", "Remarks"];
    const rows = payments.map((p: any) => [
      `${p.student?.firstName || ""} ${p.student?.lastName || ""}`,
      p.student?.registrationNumber || "",
      Number(p.amount).toFixed(2),
      p.paymentDate ? format(new Date(p.paymentDate), "yyyy-MM-dd") : "",
      p.paymentMethod,
      p.transactionId || "",
      p.status,
      p.remarks || "",
    ]);
    const csv = [headers.join(","), ...rows.map((r: string[]) => r.map((c: string) => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `payments-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heading">Fee Management</h1>
              <p className="text-sm text-muted-foreground">Record and manage student payments</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={payments.length === 0}>
              <FileSpreadsheet className="h-4 w-4 mr-1" /> CSV
            </Button>
            <Button variant="premium" onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card variant="elevated" className="border-l-[3px] border-l-emerald-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Revenue</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-heading text-emerald-600 dark:text-emerald-400">₹{totalAmount.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-0.5">From completed payments</p>
            </CardContent>
          </Card>
          <Card variant="elevated" className="border-l-[3px] border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Completed</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-heading">{completedCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">All completed payments</p>
            </CardContent>
          </Card>
          <Card variant="elevated" className="border-l-[3px] border-l-amber-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-heading text-amber-600 dark:text-amber-400">{pendingCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Awaiting payment</p>
            </CardContent>
          </Card>
          <Card variant="elevated" className="border-l-[3px] border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Failed</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-heading text-red-600 dark:text-red-400">{failedCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Failed transactions</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <SearchInput
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder="Search by student name or reg no..."
            />
          </div>
          <div className="w-[160px]">
            <Label className="text-xs text-muted-foreground mb-1 block">Status</Label>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Status</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-[160px]">
            <Label className="text-xs text-muted-foreground mb-1 block">Start Date</Label>
            <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} className="text-sm" />
          </div>
          <div className="w-[160px]">
            <Label className="text-xs text-muted-foreground mb-1 block">End Date</Label>
            <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} className="text-sm" />
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
              Clear
            </Button>
          )}
        </div>

        {isLoading ? (
          <LoadingState rows={5} />
        ) : isError ? (
          <EmptyState
            title="Error loading payments"
            description="Failed to fetch payments. Please try again."
          />
        ) : payments.length === 0 ? (
          <EmptyState
            title="No payments found"
            description="No payments match your search criteria."
            icon={<Wallet className="h-8 w-8 text-muted-foreground" />}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Reg No</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment: any) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    {payment.student?.firstName} {payment.student?.lastName}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{payment.student?.registrationNumber}</TableCell>
                  <TableCell className="font-bold">₹{Number(payment.amount).toLocaleString()}</TableCell>
                  <TableCell className="text-sm">{format(new Date(payment.paymentDate), "MMM d, yyyy")}</TableCell>
                  <TableCell>{PAYMENT_METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod}</TableCell>
                  <TableCell className="font-mono text-xs">{payment.transactionId || "-"}</TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[payment.status]}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                    {payment.remarks || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
        <p className="text-sm text-muted-foreground">Total: {meta.total} payments</p>
      </div>

      <CreatePaymentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        students={students.filter((s: StudentPublic) => s.status === "ACTIVE")}
        onSubmit={(data) => createMutation.mutate(data)}
        isPending={createMutation.isPending}
        error={createMutation.error?.message}
      />
    </DashboardLayout>
  );
}

function CreatePaymentDialog({
  open,
  onOpenChange,
  students,
  onSubmit,
  isPending,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: StudentPublic[];
  onSubmit: (data: CreatePaymentInput) => void;
  isPending: boolean;
  error?: string;
}) {
  const [formData, setFormData] = useState({
    studentId: "",
    amount: "",
    paymentMethod: "CASH",
    status: "COMPLETED",
    transactionId: "",
    remarks: "",
    paymentDate: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const selectedStudent = students.find((s) => s.id === formData.studentId);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.studentId) errors.studentId = "Select a student";
    if (!formData.amount || parseFloat(formData.amount) <= 0) errors.amount = "Enter a valid amount";
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setFormErrors({});
    onSubmit({
      studentId: formData.studentId,
      amount: parseFloat(formData.amount),
      paymentMethod: formData.paymentMethod,
      status: formData.status,
      transactionId: formData.transactionId || undefined,
      remarks: formData.remarks || undefined,
      paymentDate: formData.paymentDate || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>Record a fee payment for a student</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>
          )}

          <div className="space-y-2">
            <Label>Student</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
            >
              <option value="">Select student</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} ({s.registrationNumber}) - {s.course} Year {s.year}
                </option>
              ))}
            </select>
            {formErrors.studentId && <p className="text-sm text-destructive">{formErrors.studentId}</p>}
          </div>

          {selectedStudent && (
            <div className="bg-muted/50 p-3 rounded-lg text-sm">
              <p><span className="text-muted-foreground">Student:</span> <strong>{selectedStudent.firstName} {selectedStudent.lastName}</strong></p>
              <p><span className="text-muted-foreground">Course:</span> {selectedStudent.course} - Year {selectedStudent.year}</p>
              <p><span className="text-muted-foreground">Hostel:</span> {selectedStudent.hostel?.hostelName || "Not allocated"}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input id="amount" type="number" min="1" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="e.g. 8000" />
            {formErrors.amount && <p className="text-sm text-destructive">{formErrors.amount}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              >
                {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="txn-id">Transaction ID (optional)</Label>
              <Input id="txn-id" value={formData.transactionId} onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })} placeholder="e.g. TXN001" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-date">Payment Date</Label>
              <Input id="pay-date" type="date" value={formData.paymentDate} onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks (optional)</Label>
            <textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Any notes about this payment"
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
