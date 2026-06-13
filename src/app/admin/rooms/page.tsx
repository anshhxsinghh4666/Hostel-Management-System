"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRoomSchema, CreateRoomInput } from "@/lib/validations/room.schema";
import { RoomPublic, RoomStatus, HostelPublic } from "@/lib/types";
import { Plus, Eye, DoorOpen, FileSpreadsheet } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ROOM_STATUS_COLORS: Record<RoomStatus, string> = {
  [RoomStatus.AVAILABLE]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  [RoomStatus.FULL]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  [RoomStatus.MAINTENANCE]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

export default function RoomManagementPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const queryParams = new URLSearchParams({
    page: String(page),
    limit: "10",
    ...(statusFilter && { status: statusFilter }),
    ...(search && { search }),
  });

  const { data: roomsData, isLoading, isError } = useQuery({
    queryKey: ["rooms", page, statusFilter, search],
    queryFn: async () => {
      const res = await fetch(`/api/rooms?${queryParams}`);
      if (!res.ok) throw new Error("Failed to fetch rooms");
      return res.json();
    },
  });

  const { data: hostelsData } = useQuery({
    queryKey: ["hostels-simple"],
    queryFn: async () => {
      const res = await fetch("/api/hostels?simple=true");
      if (!res.ok) throw new Error("Failed to fetch hostels");
      return res.json();
    },
    enabled: showCreateDialog,
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateRoomInput) => {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create room");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setShowCreateDialog(false);
    },
  });

  const rooms: RoomPublic[] = roomsData?.data || [];
  const meta = roomsData?.meta || { page: 1, totalPages: 1, total: 0 };
  const hostels: HostelPublic[] = hostelsData?.data || [];

  const exportCSV = () => {
    const headers = ["Room No", "Floor", "Hostel", "Type", "Capacity", "Occupied", "Available", "Status"];
    const rows = rooms.map((r) => [r.roomNumber, String(r.floorNumber), r.hostel?.hostelName || "N/A", r.roomType, String(r.capacity), String(r.occupiedBeds), String(r.capacity - r.occupiedBeds), r.roomStatus]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `rooms-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading">Room Management</h1>
            <p className="text-muted-foreground">Manage all rooms in the system</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={rooms.length === 0}>
              <FileSpreadsheet className="h-4 w-4 mr-1" /> CSV
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Room
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <SearchInput
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder="Search by room number or hostel..."
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "__all__" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Status</SelectItem>
              <SelectItem value="AVAILABLE">Available</SelectItem>
              <SelectItem value="FULL">Full</SelectItem>
              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <LoadingState rows={5} />
        ) : isError ? (
          <EmptyState title="Error loading rooms" description="Failed to fetch rooms. Please try again." />
        ) : rooms.length === 0 ? (
          <EmptyState
            title="No rooms found"
            description="No rooms match your search criteria."
            icon={<DoorOpen className="h-8 w-8 text-muted-foreground" />}
          />
        ) : (
          <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room No</TableHead>
                  <TableHead>Floor</TableHead>
                  <TableHead>Hostel</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Occupied</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">Room {room.roomNumber}</TableCell>
                    <TableCell>Floor {room.floorNumber}</TableCell>
                    <TableCell>{room.hostel?.hostelName || "-"}</TableCell>
                    <TableCell>{room.capacity}</TableCell>
                    <TableCell>{room.occupiedBeds}</TableCell>
                    <TableCell>{room.capacity - room.occupiedBeds}</TableCell>
                    <TableCell>
                      <Badge className={ROOM_STATUS_COLORS[room.roomStatus]}>
                        {room.roomStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/admin/rooms/${room.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        )}

        <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
        <p className="text-sm text-muted-foreground">Total: {meta.total} rooms</p>
      </div>

      <CreateRoomDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        hostels={hostels}
        onSubmit={(data) => createMutation.mutate(data)}
        isPending={createMutation.isPending}
        error={createMutation.error?.message}
      />
    </DashboardLayout>
  );
}

function CreateRoomDialog({
  open,
  onOpenChange,
  hostels,
  onSubmit,
  isPending,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hostels: HostelPublic[];
  onSubmit: (data: CreateRoomInput) => void;
  isPending: boolean;
  error?: string;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CreateRoomInput>({
    resolver: zodResolver(createRoomSchema),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Add Room</DialogTitle>
          <DialogDescription>Create a new room in a hostel</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>}
          <div className="space-y-2">
            <Label>Hostel</Label>
            <Select onValueChange={(v) => setValue("hostelId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select hostel" />
              </SelectTrigger>
              <SelectContent>
                {hostels.map((h) => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.hostelName} ({h.hostelType.toLowerCase()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.hostelId && <p className="text-sm text-destructive">{errors.hostelId.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="room-number">Room Number</Label>
              <Input id="room-number" {...register("roomNumber")} placeholder="e.g. 101" />
              {errors.roomNumber && <p className="text-sm text-destructive">{errors.roomNumber.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="floor-number">Floor Number</Label>
              <Input id="floor-number" type="number" min="0" {...register("floorNumber", { valueAsNumber: true })} />
              {errors.floorNumber && <p className="text-sm text-destructive">{errors.floorNumber.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity (beds)</Label>
            <Input id="capacity" type="number" min="1" {...register("capacity", { valueAsNumber: true })} />
            {errors.capacity && <p className="text-sm text-destructive">{errors.capacity.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
