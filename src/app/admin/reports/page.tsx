"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { LoadingState } from "@/components/shared/loading-state";
import {
  FileText, Printer, Search,
  Filter, Building2, Users, MessageSquare, Wallet, UserCheck, CalendarClock,
  FileSpreadsheet, FileDown
} from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

type ReportType = "occupancy" | "students" | "complaints" | "payments" | "visitors" | "leaves";

const reportTabs = [
  { value: "occupancy" as ReportType, label: "Occupancy", icon: <Building2 className="h-4 w-4" /> },
  { value: "students" as ReportType, label: "Students", icon: <Users className="h-4 w-4" /> },
  { value: "complaints" as ReportType, label: "Complaints", icon: <MessageSquare className="h-4 w-4" /> },
  { value: "payments" as ReportType, label: "Payments", icon: <Wallet className="h-4 w-4" /> },
  { value: "visitors" as ReportType, label: "Visitors", icon: <UserCheck className="h-4 w-4" /> },
  { value: "leaves" as ReportType, label: "Leave Apps", icon: <CalendarClock className="h-4 w-4" /> },
];

const statusOptions: Record<string, string[]> = {
  students: ["__all__", "ACTIVE", "INACTIVE"],
  complaints: ["__all__", "PENDING", "IN_PROGRESS", "RESOLVED"],
  payments: ["__all__", "PENDING", "COMPLETED", "FAILED", "REFUNDED"],
  leaves: ["__all__", "PENDING", "APPROVED", "REJECTED"],
};

function getStatusVariant(status: string) {
  switch (status) {
    case "PENDING":
    case "IN_PROGRESS": return "warning";
    case "RESOLVED":
    case "COMPLETED":
    case "APPROVED": return "success";
    case "REJECTED":
    case "FAILED": return "destructive";
    default: return "secondary";
  }
}

function getReportColumns(type: ReportType): { key: string; label: string }[] {
  const columnMap: Record<ReportType, { key: string; label: string }[]> = {
    occupancy: [
      { key: "roomNumber", label: "Room No." },
      { key: "hostelName", label: "Hostel" },
      { key: "floorNumber", label: "Floor" },
      { key: "roomType", label: "Type" },
      { key: "capacity", label: "Capacity" },
      { key: "occupiedBeds", label: "Occupied" },
      { key: "availableBeds", label: "Available" },
      { key: "status", label: "Status" },
    ],
    students: [
      { key: "registrationNumber", label: "Reg No." },
      { key: "firstName", label: "First Name" },
      { key: "lastName", label: "Last Name" },
      { key: "course", label: "Course" },
      { key: "year", label: "Year" },
      { key: "hostelName", label: "Hostel" },
      { key: "roomNumber", label: "Room" },
      { key: "status", label: "Status" },
    ],
    complaints: [
      { key: "complaintId", label: "ID" },
      { key: "category", label: "Category" },
      { key: "subject", label: "Subject" },
      { key: "studentName", label: "Student" },
      { key: "priority", label: "Priority" },
      { key: "status", label: "Status" },
      { key: "createdAt", label: "Date" },
    ],
    payments: [
      { key: "studentName", label: "Student" },
      { key: "registrationNumber", label: "Reg No." },
      { key: "amount", label: "Amount" },
      { key: "paymentDate", label: "Date" },
      { key: "paymentMethod", label: "Method" },
      { key: "status", label: "Status" },
    ],
    visitors: [
      { key: "visitorName", label: "Visitor" },
      { key: "studentName", label: "Student Visited" },
      { key: "visitDate", label: "Visit Date" },
      { key: "entryTime", label: "Entry Time" },
      { key: "exitTime", label: "Exit Time" },
    ],
    leaves: [
      { key: "studentName", label: "Student" },
      { key: "registrationNumber", label: "Reg No." },
      { key: "fromDate", label: "From" },
      { key: "toDate", label: "To" },
      { key: "reason", label: "Reason" },
      { key: "status", label: "Status" },
    ],
  };
  return columnMap[type];
}

function formatCellValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return "N/A";
  if (key === "amount") return `₹${Number(value).toLocaleString()}`;
  if (key === "createdAt" || key === "paymentDate" || key === "updatedAt" || key === "visitDate") {
    return format(new Date(value as string), "MMM d, yyyy");
  }
  if (key === "entryTime" || key === "exitTime") {
    if (value) return format(new Date(value as string), "MMM d, yyyy h:mm a");
    return "N/A";
  }
  if (key === "fromDate" || key === "toDate") {
    return format(new Date(value as string), "MMM d, yyyy");
  }
  if (typeof value === "string" && key !== "studentName" && key !== "firstName" && key !== "lastName" &&
      key !== "subject" && key !== "reason" && key !== "roomNumber" && key !== "hostelName" &&
      key !== "course" && key !== "registrationNumber" && key !== "complaintId" && key !== "visitorName" &&
      key !== "passNumber") {
    return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return String(value);
}

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportType>("occupancy");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const queryKey = ["reports", activeTab, search, statusFilter, startDate, endDate];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const res = await fetch(`/api/reports/${activeTab}?${params}`);
      if (!res.ok) throw new Error("Failed to fetch report");
      return res.json();
    },
  });

  const records = useMemo(() => data?.data || [], [data?.data]);
  const columns = getReportColumns(activeTab);

  const exportPDF = useCallback(() => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const title = `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report`;
    doc.setFontSize(16);
    doc.text(title, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), "MMM d, yyyy h:mm a")}`, 14, 22);

    const tableData = records.map((row: Record<string, unknown>) =>
      columns.map((col) => formatCellValue(col.key, row[col.key]))
    );
    const headers = columns.map((col) => col.label);

    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 28,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    doc.save(`${activeTab}-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  }, [activeTab, records, columns]);

  const exportExcel = useCallback(() => {
    const tableData = records.map((row: Record<string, unknown>) => {
      const obj: Record<string, string> = {};
      columns.forEach((col) => {
        obj[col.label] = formatCellValue(col.key, row[col.key]);
      });
      return obj;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(tableData);
    XLSX.utils.book_append_sheet(wb, ws, activeTab.charAt(0).toUpperCase() + activeTab.slice(1));
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buf], { type: "application/octet-stream" });
    saveAs(blob, `${activeTab}-report-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  }, [activeTab, records, columns]);

  const printReport = useCallback(() => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const title = `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report`;
    const tableRows = records.map((row: Record<string, unknown>) =>
      `<tr>${columns.map((col) => `<td style="padding:6px 10px;border:1px solid #ddd;font-size:12px">${formatCellValue(col.key, row[col.key])}</td>`).join("")}</tr>`
    ).join("");

    printWindow.document.write(`
      <html><head><title>${title}</title>
      <style>body{font-family:Arial,sans-serif;padding:20px}
      h1{font-size:20px;color:#333}
      table{width:100%;border-collapse:collapse;margin-top:10px}
      th{background:#3b82f6;color:white;padding:8px 10px;text-align:left;font-size:12px}
      tr:nth-child(even){background:#f5f7fa}
      .date{color:#666;font-size:12px;margin-bottom:10px}
      </style></head><body>
      <h1>${title}</h1>
      <div class="date">Generated: ${format(new Date(), "MMM d, yyyy h:mm a")}</div>
      <table><thead><tr>${columns.map((c) => `<th>${c.label}</th>`).join("")}</tr></thead>
      <tbody>${tableRows}</tbody></table>
      <script>window.print();window.close();</script>
      </body></html>
    `);
    printWindow.document.close();
  }, [activeTab, records, columns]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setStartDate("");
    setEndDate("");
  };

  const hasFilters = search || statusFilter || startDate || endDate;
  const hasStatusFilter = activeTab === "students" || activeTab === "complaints" || activeTab === "payments" || activeTab === "leaves";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-heading">Reports</h1>
            <p className="text-muted-foreground">Generate and export hostel reports</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={printReport} disabled={records.length === 0}>
              <Printer className="h-4 w-4 mr-1" /> Print
            </Button>
            <Button variant="outline" size="sm" onClick={exportPDF} disabled={records.length === 0}>
              <FileDown className="h-4 w-4 mr-1" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={exportExcel} disabled={records.length === 0}>
              <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as ReportType); clearFilters(); }}>
          <TabsList className="grid grid-cols-3 md:grid-cols-6">
            {reportTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-1 text-xs md:text-sm">
                {tab.icon} <span className="hidden md:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {reportTabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Filter className="h-4 w-4" /> Filters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-xs text-muted-foreground mb-1 block">Search</label>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name, room, ID..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="pl-8 text-sm"
                        />
                      </div>
                    </div>
                    {hasStatusFilter && (
                      <div className="w-[160px]">
                        <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === "__all__" ? "" : v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__all__">All Statuses</SelectItem>
                            {statusOptions[activeTab]?.filter((s) => s !== "__all__").map((s) => (
                              <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="w-[160px]">
                      <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
                      <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-sm" />
                    </div>
                    <div className="w-[160px]">
                      <label className="text-xs text-muted-foreground mb-1 block">End Date</label>
                      <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-sm" />
                    </div>
                    {hasFilters && (
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                        Clear
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4" /> {tab.label} Report
                    <Badge variant="secondary" className="ml-2 text-xs">{records.length} records</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="p-6"><LoadingState rows={5} /></div>
                  ) : records.length === 0 ? (
                    <div className="p-12 text-center">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">No records found</p>
                      <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {columns.map((col) => (
                              <TableHead key={col.key} className="text-xs whitespace-nowrap">{col.label}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {records.map((row: Record<string, unknown>, idx: number) => (
                            <TableRow key={row.id as string || idx}>
                              {columns.map((col) => (
                                <TableCell key={col.key} className="text-xs whitespace-nowrap">
                                  {col.key === "status" ? (
                                    <Badge variant={getStatusVariant(row[col.key] as string)} className="text-[10px] px-1.5 py-0">
                                      {(row[col.key] as string)?.replace(/_/g, " ") || "N/A"}
                                    </Badge>
                                  ) : col.key === "amount" ? (
                                    <span className="font-medium">₹{Number(row[col.key]).toLocaleString()}</span>
                                  ) : (
                                    formatCellValue(col.key, row[col.key])
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
