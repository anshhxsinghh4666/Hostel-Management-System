"use client";

import { useState } from "react";
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createHostelSchema, CreateHostelInput } from "@/lib/validations/hostel.schema";
import { HostelPublic, HostelType } from "@/lib/types";
import { Plus, Building2, Bed, DoorOpen, Percent } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const HOSTEL_TYPE_LABELS: Record<HostelType, string> = {
  [HostelType.BOYS]: "Boys",
  [HostelType.GIRLS]: "Girls",
};

const HOSTEL_TYPE_COLORS: Record<HostelType, string> = {
  [HostelType.BOYS]: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  [HostelType.GIRLS]: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
};

export default function HostelManagementPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const queryParams = new URLSearchParams({
    page: String(page),
    limit: "10",
    ...(search && { search }),
    ...(typeFilter && { hostelType: typeFilter }),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["hostels", page, search, typeFilter],
    queryFn: async () => {
      const res = await fetch(`/api/hostels?${queryParams}`);
      if (!res.ok) throw new Error("Failed to fetch hostels");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateHostelInput) => {
      const res = await fetch("/api/hostels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create hostel");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hostels"] });
      setShowCreateDialog(false);
    },
  });

  const hostels: HostelPublic[] = data?.data || [];
  const meta = data?.meta || { page: 1, totalPages: 1, total: 0 };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading">Hostel Management</h1>
            <p className="text-muted-foreground">Manage all hostels in the system</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Hostel
          </Button>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <SearchInput
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder="Search hostels..."
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v === "__all__" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Types</SelectItem>
              <SelectItem value="BOYS">Boys</SelectItem>
              <SelectItem value="GIRLS">Girls</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <LoadingState rows={5} />
        ) : isError ? (
          <EmptyState title="Error loading hostels" description="Failed to fetch hostels. Please try again." />
        ) : hostels.length === 0 ? (
          <EmptyState
            title="No hostels found"
            description="No hostels match your search criteria."
            icon={<Building2 className="h-8 w-8 text-muted-foreground" />}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {hostels.map((hostel) => {
              const occupancyPct = hostel.totalCapacity > 0
                ? Math.round((hostel.occupiedCapacity / hostel.totalCapacity) * 100)
                : 0;
              return (
                <Card
                  key={hostel.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => router.push(`/admin/hostels/${hostel.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{hostel.hostelName}</CardTitle>
                      <Badge className={HOSTEL_TYPE_COLORS[hostel.hostelType]}>
                        {HOSTEL_TYPE_LABELS[hostel.hostelType]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <DoorOpen className="h-4 w-4 text-muted-foreground" />
                        <span>{hostel.totalRooms} Rooms</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Bed className="h-4 w-4 text-muted-foreground" />
                        <span>{hostel.totalCapacity} Capacity</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{hostel.occupiedCapacity} Occupied</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-muted-foreground" />
                        <span>{occupancyPct}% Full</span>
                      </div>
                    </div>
                    <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          occupancyPct >= 90 ? "bg-destructive" : occupancyPct >= 60 ? "bg-orange-500" : "bg-primary"
                        }`}
                        style={{ width: `${occupancyPct}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
        <p className="text-sm text-muted-foreground">Total: {meta.total} hostels</p>
      </div>

      <CreateHostelDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={(data) => createMutation.mutate(data)}
        isPending={createMutation.isPending}
        error={createMutation.error?.message}
      />
    </DashboardLayout>
  );
}

function CreateHostelDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateHostelInput) => void;
  isPending: boolean;
  error?: string;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateHostelInput>({
    resolver: zodResolver(createHostelSchema),
    defaultValues: { hostelType: HostelType.BOYS },
  });

  const selectedType = watch("hostelType");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Add Hostel</DialogTitle>
          <DialogDescription>Create a new hostel in the system</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>}
          <div className="space-y-2">
            <Label htmlFor="hostel-name">Hostel Name</Label>
            <Input id="hostel-name" {...register("hostelName")} placeholder="e.g. Mahatma Gandhi Hostel" />
            {errors.hostelName && <p className="text-sm text-destructive">{errors.hostelName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Hostel Type</Label>
            <Select value={selectedType} onValueChange={(v) => setValue("hostelType", v as HostelType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={HostelType.BOYS}>Boys Hostel</SelectItem>
                <SelectItem value={HostelType.GIRLS}>Girls Hostel</SelectItem>
              </SelectContent>
            </Select>
            {errors.hostelType && <p className="text-sm text-destructive">{errors.hostelType.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total-rooms">Number of Rooms</Label>
              <Input id="total-rooms" type="number" min="1" {...register("totalRooms", { valueAsNumber: true })} />
              {errors.totalRooms && <p className="text-sm text-destructive">{errors.totalRooms.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="total-capacity">Total Capacity</Label>
              <Input id="total-capacity" type="number" min="1" {...register("totalCapacity", { valueAsNumber: true })} />
              {errors.totalCapacity && <p className="text-sm text-destructive">{errors.totalCapacity.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Hostel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
