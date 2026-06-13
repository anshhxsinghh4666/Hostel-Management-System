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
import { updateRoomSchema, UpdateRoomInput } from "@/lib/validations/room.schema";
import { RoomPublic, RoomStatus } from "@/lib/types";
import { LoadingState } from "@/components/shared/loading-state";
import { ArrowLeft, Pencil, DoorOpen, Building2, Users, Bed } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ROOM_STATUS_COLORS: Record<RoomStatus, string> = {
  [RoomStatus.AVAILABLE]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  [RoomStatus.FULL]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  [RoomStatus.MAINTENANCE]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

export default function RoomDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showEditDialog, setShowEditDialog] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["room", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/rooms/${params.id}`);
      if (!res.ok) throw new Error("Failed to fetch room");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateRoomInput) => {
      const res = await fetch(`/api/rooms/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update room");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room", params.id] });
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

  const room: RoomPublic | null = data?.data || null;
  if (!room) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Room not found</h2>
          <Button variant="link" onClick={() => router.push("/admin/rooms")}>Back to rooms</Button>
        </div>
      </DashboardLayout>
    );
  }

  const availableBeds = room.capacity - room.occupiedBeds;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/rooms")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold font-heading">Room {room.roomNumber}</h1>
              <Badge className={ROOM_STATUS_COLORS[room.roomStatus]}>
                {room.roomStatus}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {room.hostel?.hostelName} ({room.hostel?.hostelType.toLowerCase()}) - Floor {room.floorNumber}
            </p>
          </div>
          <Button variant="outline" onClick={() => setShowEditDialog(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bed className="h-4 w-4 text-muted-foreground" /> Total Capacity
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{room.capacity}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" /> Occupied
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{room.occupiedBeds}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DoorOpen className="h-4 w-4 text-muted-foreground" /> Available
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{availableBeds}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" /> Floor
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{room.floorNumber}</p></CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Occupancy Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-4 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  room.roomStatus === "FULL" ? "bg-destructive" : room.roomStatus === "MAINTENANCE" ? "bg-yellow-500" : "bg-primary"
                }`}
                style={{ width: `${room.capacity > 0 ? (room.occupiedBeds / room.capacity) * 100 : 0}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>{room.occupiedBeds} occupied</span>
              <span>{availableBeds} available</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <EditRoomDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        room={room}
        onSubmit={(data) => updateMutation.mutate(data)}
        isPending={updateMutation.isPending}
        error={updateMutation.error?.message}
      />
    </DashboardLayout>
  );
}

function EditRoomDialog({
  open,
  onOpenChange,
  room,
  onSubmit,
  isPending,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: RoomPublic;
  onSubmit: (data: UpdateRoomInput) => void;
  isPending: boolean;
  error?: string;
}) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } =
    useForm<UpdateRoomInput>({
      resolver: zodResolver(updateRoomSchema),
      values: {
        roomNumber: room.roomNumber,
        floorNumber: room.floorNumber,
        capacity: room.capacity,
        roomStatus: room.roomStatus,
      },
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Edit Room</DialogTitle>
          <DialogDescription>Update room Room {room.roomNumber}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-room-number">Room Number</Label>
              <Input id="edit-room-number" {...register("roomNumber")} />
              {errors.roomNumber && <p className="text-sm text-destructive">{errors.roomNumber.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-floor">Floor Number</Label>
              <Input id="edit-floor" type="number" {...register("floorNumber", { valueAsNumber: true })} />
              {errors.floorNumber && <p className="text-sm text-destructive">{errors.floorNumber.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-capacity">Capacity</Label>
            <Input id="edit-capacity" type="number" {...register("capacity", { valueAsNumber: true })} />
            {errors.capacity && <p className="text-sm text-destructive">{errors.capacity.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Room Status</Label>
            <Select
              value={watch("roomStatus")}
              onValueChange={(v) => setValue("roomStatus", v as RoomStatus)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={RoomStatus.AVAILABLE}>Available</SelectItem>
                <SelectItem value={RoomStatus.FULL}>Full</SelectItem>
                <SelectItem value={RoomStatus.MAINTENANCE}>Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Updating..." : "Update Room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
