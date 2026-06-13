"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Download, Printer, Ticket } from "lucide-react";
import { format } from "date-fns";
import QRCode from "qrcode";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  USED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  EXPIRED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  REVOKED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function StudentGatePassesPage() {
  const [selectedPass, setSelectedPass] = useState<Record<string, unknown> | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["student-gate-passes"],
    queryFn: async () => {
      const res = await fetch("/api/student/gate-passes");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const handleViewPass = async (pass: Record<string, unknown>) => {
    try {
      const qrData = JSON.stringify({
        passId: pass.id,
        passNumber: pass.passNumber,
        qrToken: pass.qrToken,
      });
      const url = await QRCode.toDataURL(qrData, { width: 200, margin: 2 });
      setQrDataUrl(url);
      setSelectedPass(pass);
    } catch {
      setSelectedPass(pass);
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl || !selectedPass) return;
    const link = document.createElement("a");
    link.download = `gate-pass-${selectedPass.passNumber}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handlePrint = () => {
    if (!qrDataUrl || !selectedPass) return;
    const pw = window.open("", "_blank");
    if (!pw) return;
    const req = selectedPass.request as Record<string, unknown> | undefined;
    const visitor = req?.visitor as Record<string, unknown> | undefined;
    pw.document.write(`
      <html><head><title>Gate Pass</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;text-align:center}h1{color:#1a365d}.pass{border:2px solid #333;padding:30px;max-width:400px;margin:0 auto}table{width:100%}td{padding:6px 10px;border-bottom:1px solid #ddd;text-align:left}</style>
      </head><body>
      <div class="pass"><h1>Gate Pass</h1><p><strong>${selectedPass.passNumber}</strong></p>
      <img src="${qrDataUrl}" style="width:180px;height:180px" />
      <table><tr><td>Student:</td><td><strong>${req?.studentName || "N/A"}</strong></td></tr>
      <tr><td>Visitor:</td><td><strong>${visitor?.name || "N/A"}</strong></td></tr>
      <tr><td>Date:</td><td><strong>${req?.visitDate ? format(new Date(req.visitDate as string), "MMM d, yyyy") : "N/A"}</strong></td></tr>
      <tr><td>Valid:</td><td><strong>${selectedPass.validFrom ? format(new Date(selectedPass.validFrom as string), "h:mm a") : ""} - ${selectedPass.validTo ? format(new Date(selectedPass.validTo as string), "h:mm a") : ""}</strong></td></tr>
      </table><p style="margin-top:30px;font-size:12px;color:#666">Valid only on the date and time mentioned above.</p>
      </div></body></html>
    `);
    pw.document.close();
    pw.focus();
    pw.print();
  };

  const passes = data?.data || [];

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
          <h1 className="text-3xl font-bold font-heading">My Gate Passes</h1>
          <p className="text-muted-foreground">View and download your digital gate passes</p>
        </div>

        {passes.length === 0 ? (
          <EmptyState
            icon={<Ticket className="h-8 w-8" />}
            title="No gate passes yet"
            description="Gate passes will appear here once your visitor requests are approved"
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {passes.map((pass: Record<string, unknown>) => {
              const req = pass.request as Record<string, unknown> | undefined;
              const visitor = req?.visitor as Record<string, unknown> | undefined;
              const logs = pass.logs as Record<string, unknown>[] | undefined;
              const latestLog = logs && logs.length > 0 ? logs[0] : null;
              return (
                <Card key={pass.id as string} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-mono">{pass.passNumber as string}</CardTitle>
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[pass.status as string] || ""}`}>
                        {pass.status as string}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Visitor:</span>
                        <span className="font-medium">{visitor?.name as string}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <span>{req?.visitDate ? format(new Date(req.visitDate as string), "MMM d, yyyy") : "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valid:</span>
                        <span>{pass.validFrom ? format(new Date(pass.validFrom as string), "h:mm a") : ""} - {pass.validTo ? format(new Date(pass.validTo as string), "h:mm a") : ""}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span>{latestLog ? (latestLog.checkOutTime ? "Exited" : "Inside") : "Not checked in"}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => handleViewPass(pass)}
                    >
                      <Ticket className="mr-1 h-3 w-3" /> View Gate Pass
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={!!selectedPass} onOpenChange={(o) => { if (!o) { setSelectedPass(null); setQrDataUrl(null); } }}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Gate Pass Details</DialogTitle>
            </DialogHeader>
            {selectedPass && (
              <div className="space-y-4">
                {qrDataUrl && (
                  <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg">
                    <img src={qrDataUrl} alt="QR Code" className="w-40 h-40" />
                    <p className="text-xs text-muted-foreground">Scan to verify gate pass</p>
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" onClick={handleDownload}>
                        <Download className="mr-1 h-3 w-3" /> Download
                      </Button>
                      <Button variant="outline" size="sm" onClick={handlePrint}>
                        <Printer className="mr-1 h-3 w-3" /> Print
                      </Button>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Pass Number</p>
                    <p className="font-medium font-mono text-xs">{selectedPass.passNumber as string}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[selectedPass.status as string] || ""}`}>
                      {selectedPass.status as string}
                    </span>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Valid From</p>
                    <p className="font-medium">{selectedPass.validFrom ? format(new Date(selectedPass.validFrom as string), "MMM d, yyyy h:mm a") : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Valid To</p>
                    <p className="font-medium">{selectedPass.validTo ? format(new Date(selectedPass.validTo as string), "MMM d, yyyy h:mm a") : "N/A"}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
