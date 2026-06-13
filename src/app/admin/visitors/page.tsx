"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function AdminVisitorDashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-heading">Visitor Management</h1>
          <p className="text-muted-foreground">Manage visitor requests, gate passes, and logs</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/admin/visitors/requests">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-yellow-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-yellow-600">View & Approve</p>
                <p className="text-xs text-muted-foreground">Manage visitor approvals</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/visitors/requests">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">All Requests</CardTitle>
                <Users className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">View All</p>
                <p className="text-xs text-muted-foreground">All visitor requests</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/visitors/logs">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Visitor Logs</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">Entry/Exit</p>
                <p className="text-xs text-muted-foreground">Track visitor movement</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/visitors/analytics">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Analytics</CardTitle>
                <Users className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-purple-600">Insights</p>
                <p className="text-xs text-muted-foreground">Visitor analytics dashboard</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/visitors/requests">
                <Button className="w-full justify-start" variant="outline">
                  <Clock className="mr-2 h-4 w-4" />
                  Review Pending Visitor Requests
                </Button>
              </Link>
              <Link href="/admin/visitors/requests?status=APPROVED">
                <Button className="w-full justify-start" variant="outline">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  View Approved Requests
                </Button>
              </Link>
              <Link href="/admin/visitors/logs">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Visitor Entry/Exit Logs
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Visitor Status Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">PENDING</span>
                <span className="text-sm text-muted-foreground">Awaiting warden approval</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">APPROVED</span>
                <span className="text-sm text-muted-foreground">Approved with gate pass</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">REJECTED</span>
                <span className="text-sm text-muted-foreground">Request was rejected</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">Inside</span>
                <span className="text-sm text-muted-foreground">Visitor currently in hostel</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">Exited</span>
                <span className="text-sm text-muted-foreground">Visitor has left the hostel</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
