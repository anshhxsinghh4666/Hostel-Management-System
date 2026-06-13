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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateStudentSchema, UpdateStudentInput } from "@/lib/validations/student.schema";
import { StudentPublic, StudentStatus, HostelPublic, RoomPublic } from "@/lib/types";
import { LoadingState } from "@/components/shared/loading-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { format } from "date-fns";
import { ArrowLeft, Pencil, DoorOpen, UserX, Building2, Calendar, Shield, GraduationCap } from "lucide-react";

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAllocateDialog, setShowAllocateDialog] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["student", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/students/${params.id}`);
      if (!res.ok) throw new Error("Failed to fetch student");
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
    enabled: showAllocateDialog,
  });

  const { data: roomsData } = useQuery({
    queryKey: ["rooms-list"],
    queryFn: async () => {
      const res = await fetch("/api/rooms?limit=100");
      if (!res.ok) throw new Error("Failed to fetch rooms");
      return res.json();
    },
  });

  const student: StudentPublic | null = data?.data || null;
  const hostels = hostelsData?.data || [];
  const rooms: RoomPublic[] = roomsData?.data || [];

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateStudentInput) => {
      const res = await fetch(`/api/students/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update student");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student", params.id] });
      setShowEditDialog(false);
    },
  });

  const allocateMutation = useMutation({
    mutationFn: async ({ studentId, roomId }: { studentId: string; roomId: string }) => {
      const res = await fetch("/api/allocate-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, roomId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to allocate room");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student", params.id] });
      setShowAllocateDialog(false);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/students/${params.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to deactivate student");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student", params.id] });
      router.push("/admin/students");
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingState rows={5} />
      </DashboardLayout>
    );
  }

  if (isError || !student) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Student not found</h2>
          <Button variant="link" onClick={() => router.push("/admin/students")}>Back to students</Button>
        </div>
      </DashboardLayout>
    );
  }

  const roomsInHostel = rooms.filter((r) => r.roomStatus !== "MAINTENANCE" && r.occupiedBeds < r.capacity);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/students")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{student.firstName} {student.lastName}</h1>
            <p className="text-muted-foreground">{student.registrationNumber}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(true)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Button>
            {!student.hostelId && student.status === StudentStatus.ACTIVE && (
              <Button onClick={() => setShowAllocateDialog(true)}>
                <DoorOpen className="mr-2 h-4 w-4" /> Allocate Room
              </Button>
            )}
            {student.status === StudentStatus.ACTIVE && (
              <Button variant="destructive" onClick={() => deactivateMutation.mutate()}>
                <UserX className="mr-2 h-4 w-4" /> Deactivate
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" /> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between"><span className="text-muted-foreground">Full Name</span><span>{student.firstName} {student.lastName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Gender</span><span className="capitalize">{student.gender}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{student.email}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{student.phone}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Address</span><span className="text-right max-w-[250px]">{student.address}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge isActive={student.status === StudentStatus.ACTIVE} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" /> Academic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between"><span className="text-muted-foreground">Registration No</span><span className="font-mono">{student.registrationNumber}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Course</span><span>{student.course}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Year</span><span>Year {student.year}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Guardian</span><span>{student.guardianName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Guardian Phone</span><span>{student.guardianPhone}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" /> Hostel Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {student.hostel ? (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">Hostel</span><span>{student.hostel.hostelName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="capitalize">{student.hostel.hostelType.toLowerCase()}</span></div>
                </>
              ) : (
                <p className="text-muted-foreground">Not allocated to any hostel</p>
              )}
              {student.room && (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">Room No</span><span>{student.room.roomNumber}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Floor</span><span>{student.room.floorNumber}</span></div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" /> Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between"><span className="text-muted-foreground">Check In Date</span><span>{student.checkInDate ? format(new Date(student.checkInDate), "MMM d, yyyy") : "Not checked in"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Created At</span><span>{format(new Date(student.createdAt), "MMM d, yyyy")}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>

      <EditStudentDialog
        open={showEditDialog}
        onOpenChange={(open) => { setShowEditDialog(open); }}
        student={student}
        onSubmit={(data) => updateMutation.mutate(data)}
        isPending={updateMutation.isPending}
        error={updateMutation.error?.message}
      />

      <AllocateRoomDialog
        open={showAllocateDialog}
        onOpenChange={setShowAllocateDialog}
        rooms={roomsInHostel}
        hostels={hostels}
        onSubmit={(roomId) => allocateMutation.mutate({ studentId: student.id, roomId })}
        isPending={allocateMutation.isPending}
        error={allocateMutation.error?.message}
      />
    </DashboardLayout>
  );
}

function EditStudentDialog({
  open,
  onOpenChange,
  student,
  onSubmit,
  isPending,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentPublic;
  onSubmit: (data: UpdateStudentInput) => void;
  isPending: boolean;
  error?: string;
}) {
  const { register, handleSubmit, formState: { errors } } =
    useForm<UpdateStudentInput>({
      resolver: zodResolver(updateStudentSchema),
      values: {
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phone: student.phone,
        course: student.course,
        year: student.year,
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone,
        address: student.address,
      },
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>Update information for {student.firstName} {student.lastName}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-first-name">First Name</Label>
              <Input id="edit-first-name" {...register("firstName")} />
              {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-last-name">Last Name</Label>
              <Input id="edit-last-name" {...register("lastName")} />
              {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" type="email" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input id="edit-phone" type="tel" {...register("phone")} />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-course">Course</Label>
              <Input id="edit-course" {...register("course")} />
              {errors.course && <p className="text-sm text-destructive">{errors.course.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-year">Year</Label>
              <Input id="edit-year" type="number" {...register("year", { valueAsNumber: true })} />
              {errors.year && <p className="text-sm text-destructive">{errors.year.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-guardian-name">Guardian Name</Label>
              <Input id="edit-guardian-name" {...register("guardianName")} />
              {errors.guardianName && <p className="text-sm text-destructive">{errors.guardianName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-guardian-phone">Guardian Phone</Label>
              <Input id="edit-guardian-phone" type="tel" {...register("guardianPhone")} />
              {errors.guardianPhone && <p className="text-sm text-destructive">{errors.guardianPhone.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-address">Address</Label>
            <textarea
              id="edit-address"
              {...register("address")}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Updating..." : "Update Student"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AllocateRoomDialog({
  open,
  onOpenChange,
  rooms,
  hostels,
  onSubmit,
  isPending,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rooms: RoomPublic[];
  hostels: HostelPublic[];
  onSubmit: (roomId: string) => void;
  isPending: boolean;
  error?: string;
}) {
  const [selectedHostelId, setSelectedHostelId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");

  const filteredRooms = selectedHostelId
    ? rooms.filter((r) => r.hostelId === selectedHostelId)
    : rooms;

  const handleSubmit = () => {
    if (!selectedRoomId) return;
    onSubmit(selectedRoomId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Allocate Room</DialogTitle>
          <DialogDescription>Select a hostel and room for this student</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>}
          <div className="space-y-2">
            <Label>Hostel</Label>
            <Select value={selectedHostelId} onValueChange={(v) => { setSelectedHostelId(v); setSelectedRoomId(""); }}>
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
          </div>
          <div className="space-y-2">
            <Label>Room</Label>
            <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
              <SelectTrigger>
                <SelectValue placeholder={selectedHostelId ? "Select room" : "Select hostel first"} />
              </SelectTrigger>
              <SelectContent>
                {filteredRooms.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    Room {r.roomNumber} (Floor {r.floorNumber}) - {r.occupiedBeds}/{r.capacity} beds
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit} disabled={isPending || !selectedRoomId}>
              {isPending ? "Allocating..." : "Allocate Room"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
