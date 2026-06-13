"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateHostelSchema, UpdateHostelInput } from "@/lib/validations/hostel.schema";
import { HostelPublic, HostelType, RoomStatus } from "@/lib/types";
import { LoadingState } from "@/components/shared/loading-state";
import { ArrowLeft, Pencil, DoorOpen, Bed, Percent, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const HOSTEL_TYPE_LABELS: Record<HostelType, string> = {
  [HostelType.BOYS]: "Boys",
  [HostelType.GIRLS]: "Girls",
};

const HOSTEL_TYPE_COLORS: Record<HostelType, string> = {
  [HostelType.BOYS]: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  [HostelType.GIRLS]: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
};

const ROOM_STATUS_COLORS: Record<RoomStatus, string> = {
  [RoomStatus.AVAILABLE]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  [RoomStatus.FULL]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  [RoomStatus.MAINTENANCE]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

export default function HostelDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showEditDialog, setShowEditDialog] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["hostel", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/hostels/${params.id}`);
      if (!res.ok) throw new Error("Failed to fetch hostel");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateHostelInput) => {
      const res = await fetch(`/api/hostels/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update hostel");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hostel", params.id] });
      setShowEditDialog(false);
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingState rows={5} />
      </DashboardLayout>
    );
  }

  const hostel: HostelPublic | null = data?.data || null;
  if (!hostel) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Hostel not found</h2>
          <Button variant="link" onClick={() => router.push("/admin/hostels")}>Back to hostels</Button>
        </div>
      </DashboardLayout>
    );
  }

  const occupancyPct = hostel.totalCapacity > 0
    ? Math.round((hostel.occupiedCapacity / hostel.totalCapacity) * 100)
    : 0;
  const availableBeds = hostel.totalCapacity - hostel.occupiedCapacity;

  const rooms = hostel.rooms || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/hostels")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{hostel.hostelName}</h1>
              <Badge className={HOSTEL_TYPE_COLORS[hostel.hostelType]}>
                {HOSTEL_TYPE_LABELS[hostel.hostelType]}
              </Badge>
            </div>
          </div>
          <Button variant="outline" onClick={() => setShowEditDialog(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DoorOpen className="h-4 w-4 text-muted-foreground" /> Total Rooms
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{hostel.totalRooms}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bed className="h-4 w-4 text-muted-foreground" /> Total Capacity
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{hostel.totalCapacity}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" /> Occupied Beds
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{hostel.occupiedCapacity}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" /> Occupancy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{occupancyPct}%</p>
              <p className="text-sm text-muted-foreground">{availableBeds} beds available</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-3 h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${
              occupancyPct >= 90 ? "bg-destructive" : occupancyPct >= 60 ? "bg-yellow-500" : "bg-primary"
            }`}
            style={{ width: `${occupancyPct}%` }}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Rooms ({rooms.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {rooms.length === 0 ? (
              <p className="text-muted-foreground">No rooms in this hostel yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room No</TableHead>
                    <TableHead>Floor</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Occupied</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.map((room) => (
                    <TableRow
                      key={room.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/admin/rooms/${room.id}`)}
                    >
                      <TableCell className="font-medium">Room {room.roomNumber}</TableCell>
                      <TableCell>Floor {room.floorNumber}</TableCell>
                      <TableCell>{room.capacity}</TableCell>
                      <TableCell>{room.occupiedBeds}</TableCell>
                      <TableCell>{room.capacity - room.occupiedBeds}</TableCell>
                      <TableCell>
                        <Badge className={ROOM_STATUS_COLORS[room.roomStatus]}>
                          {room.roomStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <EditHostelDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        hostel={hostel}
        onSubmit={(data) => updateMutation.mutate(data)}
        isPending={updateMutation.isPending}
        error={updateMutation.error?.message}
      />
    </DashboardLayout>
  );
}

function EditHostelDialog({
  open,
  onOpenChange,
  hostel,
  onSubmit,
  isPending,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hostel: HostelPublic;
  onSubmit: (data: UpdateHostelInput) => void;
  isPending: boolean;
  error?: string;
}) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } =
    useForm<UpdateHostelInput>({
      resolver: zodResolver(updateHostelSchema),
      values: {
        hostelName: hostel.hostelName,
        hostelType: hostel.hostelType,
        totalRooms: hostel.totalRooms,
        totalCapacity: hostel.totalCapacity,
      },
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Edit Hostel</DialogTitle>
          <DialogDescription>Update {hostel.hostelName} information</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>}
          <div className="space-y-2">
            <Label htmlFor="edit-name">Hostel Name</Label>
            <Input id="edit-name" {...register("hostelName")} />
            {errors.hostelName && <p className="text-sm text-destructive">{errors.hostelName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Hostel Type</Label>
            <Select
              value={watch("hostelType")}
              onValueChange={(v) => setValue("hostelType", v as HostelType)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={HostelType.BOYS}>Boys Hostel</SelectItem>
                <SelectItem value={HostelType.GIRLS}>Girls Hostel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-rooms">Number of Rooms</Label>
              <Input id="edit-rooms" type="number" {...register("totalRooms", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-capacity">Total Capacity</Label>
              <Input id="edit-capacity" type="number" {...register("totalCapacity", { valueAsNumber: true })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Updating..." : "Update Hostel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
