"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { RoomAllocationPublic, RoomPublic, StudentPublic } from "@/lib/types";
import { DoorOpen, Plus, ArrowRight, XCircle } from "lucide-react";
import { format } from "date-fns";

const ALLOCATION_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  TRANSFERRED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  VACATED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export default function RoomAllocationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [showAllocateDialog, setShowAllocateDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showVacateDialog, setShowVacateDialog] = useState(false);

  const [allocateStudentId, setAllocateStudentId] = useState("");
  const [allocateRoomId, setAllocateRoomId] = useState("");
  const [transferStudentId, setTransferStudentId] = useState("");
  const [transferNewRoomId, setTransferNewRoomId] = useState("");
  const [vacateStudentId, setVacateStudentId] = useState("");

  const queryParams = new URLSearchParams({
    page: String(page),
    limit: "10",
    ...(search && { search }),
    ...(statusFilter && { status: statusFilter }),
  });

  const { data: allocationsData, isLoading } = useQuery({
    queryKey: ["room-allocations", page, search, statusFilter],
    queryFn: async () => {
      const res = await fetch(`/api/admin/room-allocations?${queryParams}`);
      if (!res.ok) throw new Error("Failed to fetch allocations");
      return res.json();
    },
  });

  const { data: studentsData } = useQuery({
    queryKey: ["students-unallocated"],
    queryFn: async () => {
      const res = await fetch("/api/students?limit=200");
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    },
    enabled: showAllocateDialog || showTransferDialog,
  });

  const { data: roomsData } = useQuery({
    queryKey: ["rooms-available"],
    queryFn: async () => {
      const res = await fetch("/api/rooms/available?limit=100");
      if (!res.ok) throw new Error("Failed to fetch rooms");
      return res.json();
    },
    enabled: showAllocateDialog || showTransferDialog,
  });

  const allocateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/allocations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: allocateStudentId, roomId: allocateRoomId }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-allocations"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setShowAllocateDialog(false);
      setAllocateStudentId("");
      setAllocateRoomId("");
    },
  });

  const transferMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/allocations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "transfer", studentId: transferStudentId, newRoomId: transferNewRoomId }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-allocations"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setShowTransferDialog(false);
      setTransferStudentId("");
      setTransferNewRoomId("");
    },
  });

  const vacateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/allocations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "vacate", studentId: vacateStudentId }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-allocations"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setShowVacateDialog(false);
      setVacateStudentId("");
    },
  });

  const allocations: RoomAllocationPublic[] = allocationsData?.data || [];
  const meta = allocationsData?.meta || { page: 1, totalPages: 1, total: 0 };
  const allStudents: StudentPublic[] = studentsData?.data || [];
  const availableRooms: RoomPublic[] = roomsData?.data || [];

  const unallocatedStudents = allStudents.filter((s) => !s.hostelId && s.status === "ACTIVE");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading">Room Allocations</h1>
            <p className="text-muted-foreground">Manage student room allocations</p>
          </div>
          <Button onClick={() => setShowAllocateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Allocate Room
          </Button>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <SearchInput
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder="Search by student or room..."
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "__all__" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="TRANSFERRED">Transferred</SelectItem>
              <SelectItem value="VACATED">Vacated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <LoadingState rows={5} />
        ) : allocations.length === 0 ? (
          <EmptyState
            title="No allocations found"
            description="No room allocations match your search criteria."
            icon={<DoorOpen className="h-8 w-8" />}
          />
        ) : (
          <>
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Room Number</TableHead>
                    <TableHead>Block</TableHead>
                    <TableHead>Allocation Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allocations.map((alloc) => (
                    <TableRow key={alloc.id}>
                      <TableCell className="font-medium">
                        {alloc.student?.firstName} {alloc.student?.lastName}
                      </TableCell>
                      <TableCell>{alloc.student?.registrationNumber}</TableCell>
                      <TableCell>Room {alloc.room?.roomNumber}</TableCell>
                      <TableCell>{alloc.room?.hostel?.hostelName || "--"}</TableCell>
                      <TableCell>{format(new Date(alloc.allocatedDate), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <Badge className={ALLOCATION_STATUS_COLORS[alloc.allocationStatus]}>
                          {alloc.allocationStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {alloc.allocationStatus === "ACTIVE" && (
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setTransferStudentId(alloc.studentId);
                                setShowTransferDialog(true);
                              }}
                            >
                              <ArrowRight className="h-3.5 w-3.5 mr-1" />
                              Transfer
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive"
                              onClick={() => {
                                setVacateStudentId(alloc.studentId);
                                setShowVacateDialog(true);
                              }}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              Vacate
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
            <p className="text-sm text-muted-foreground">Total: {meta.total} allocations</p>
          </>
        )}
      </div>

      <Dialog open={showAllocateDialog} onOpenChange={setShowAllocateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Allocate Room</DialogTitle>
            <DialogDescription>Assign a room to a student</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {allocateMutation.error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {(allocateMutation.error as Error).message}
              </div>
            )}
            <div className="space-y-2">
              <Label>Student</Label>
              <Select value={allocateStudentId} onValueChange={setAllocateStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {unallocatedStudents.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.registrationNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Room</Label>
              <Select value={allocateRoomId} onValueChange={setAllocateRoomId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  {availableRooms.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      Room {r.roomNumber} - {r.hostel?.hostelName} ({(r.capacity - r.occupiedBeds)} free)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                onClick={() => allocateMutation.mutate()}
                disabled={!allocateStudentId || !allocateRoomId || allocateMutation.isPending}
              >
                {allocateMutation.isPending ? "Allocating..." : "Allocate Room"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Transfer Room</DialogTitle>
            <DialogDescription>Transfer student to a new room</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {transferMutation.error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {(transferMutation.error as Error).message}
              </div>
            )}
            <div className="space-y-2">
              <Label>New Room</Label>
              <Select value={transferNewRoomId} onValueChange={setTransferNewRoomId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new room" />
                </SelectTrigger>
                <SelectContent>
                  {availableRooms.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      Room {r.roomNumber} - {r.hostel?.hostelName} ({(r.capacity - r.occupiedBeds)} free)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                onClick={() => transferMutation.mutate()}
                disabled={!transferNewRoomId || transferMutation.isPending}
              >
                {transferMutation.isPending ? "Transferring..." : "Transfer Room"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showVacateDialog} onOpenChange={setShowVacateDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Vacate Room</DialogTitle>
            <DialogDescription>Are you sure you want to vacate this student&apos;s room?</DialogDescription>
          </DialogHeader>
          {vacateMutation.error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {(vacateMutation.error as Error).message}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVacateDialog(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => vacateMutation.mutate()}
              disabled={vacateMutation.isPending}
            >
              {vacateMutation.isPending ? "Vacating..." : "Yes, Vacate Room"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
