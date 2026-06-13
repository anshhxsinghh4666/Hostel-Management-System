"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchInput } from "@/components/shared/search-input";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { RoomPublic } from "@/lib/types";
import { DoorOpen, Bed, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";

const ROOM_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300",
  FULL: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300",
  MAINTENANCE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300",
};

const ROOM_STATUS_BG: Record<string, string> = {
  AVAILABLE: "border-l-green-500",
  FULL: "border-l-red-500",
  MAINTENANCE: "border-l-yellow-500",
};

const ROOM_TYPE_LABELS: Record<string, string> = {
  SINGLE: "Single",
  DOUBLE: "Double",
  TRIPLE: "Triple",
  DORMITORY: "Dormitory",
};

export default function RoomVisualizationPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [blockFilter, setBlockFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("roomNumber");

  const queryParams = new URLSearchParams({
    page: String(page),
    limit: "50",
    ...(search && { search }),
    ...(statusFilter && { status: statusFilter }),
    ...(typeFilter && { roomType: typeFilter }),
  });

  const { data: roomsData, isLoading } = useQuery({
    queryKey: ["rooms", page, search, statusFilter, typeFilter],
    queryFn: async () => {
      const res = await fetch(`/api/rooms?${queryParams}`);
      if (!res.ok) throw new Error("Failed to fetch rooms");
      return res.json();
    },
  });

  const totalRooms = roomsData?.meta?.total || 0;

  const processedRooms: RoomPublic[] = useMemo(() => roomsData?.data || [], [roomsData]);

  const filteredAndSorted = useMemo(() => {
    let result = [...processedRooms];

    if (blockFilter) {
      result = result.filter((r) => r.hostel?.hostelName === blockFilter);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "roomNumber":
          return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true });
        case "floorNumber":
          return a.floorNumber - b.floorNumber;
        case "capacity":
          return b.capacity - a.capacity;
        case "occupiedBeds":
          return b.occupiedBeds - a.occupiedBeds;
        default:
          return 0;
      }
    });

    return result;
  }, [processedRooms, blockFilter, sortBy]);

  const uniqueHostelNames = useMemo(() => {
    const names = new Set(processedRooms.map((r: RoomPublic) => r.hostel?.hostelName).filter(Boolean));
    return Array.from(names) as string[];
  }, [processedRooms]);

  const stats = useMemo(() => {
    const roomList: RoomPublic[] = roomsData?.data || [];
    const available = roomList.filter((r) => r.roomStatus === "AVAILABLE").length;
    const full = roomList.filter((r) => r.roomStatus === "FULL").length;
    const maintenance = roomList.filter((r) => r.roomStatus === "MAINTENANCE").length;
    const totalBeds = roomList.reduce((sum, r) => sum + r.capacity, 0);
    const occupiedBeds = roomList.reduce((sum, r) => sum + r.occupiedBeds, 0);
    return { available, full, maintenance, totalBeds, occupiedBeds };
  }, [roomsData]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-heading">Room Visualization</h1>
          <p className="text-muted-foreground">View all rooms as cards with occupancy and status</p>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <Card variant="elevated" className="border-l-[3px] border-l-emerald-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{stats.available}</p>
            </CardContent>
          </Card>
          <Card variant="elevated" className="border-l-[3px] border-l-red-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Occupied</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{stats.full}</p>
            </CardContent>
          </Card>
          <Card variant="elevated" className="border-l-[3px] border-l-amber-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">{stats.maintenance}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Beds</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalBeds}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Occupied Beds</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.occupiedBeds}</p>
              <p className="text-xs text-muted-foreground">
                {stats.totalBeds > 0 ? `${Math.round((stats.occupiedBeds / stats.totalBeds) * 100)}% occupancy` : ""}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <Label className="text-xs mb-1 block">Search</Label>
            <SearchInput
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder="Search room number..."
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Block</Label>
            <Select value={blockFilter} onValueChange={(v) => { setBlockFilter(v === "__all__" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Blocks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Blocks</SelectItem>
                {uniqueHostelNames.map((name) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Room Type</Label>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v === "__all__" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Types</SelectItem>
                <SelectItem value="SINGLE">Single</SelectItem>
                <SelectItem value="DOUBLE">Double</SelectItem>
                <SelectItem value="TRIPLE">Triple</SelectItem>
                <SelectItem value="DORMITORY">Dormitory</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Status</Label>
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
          <div>
            <Label className="text-xs mb-1 block">Sort By</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="roomNumber">Room Number</SelectItem>
                <SelectItem value="floorNumber">Floor</SelectItem>
                <SelectItem value="capacity">Capacity</SelectItem>
                <SelectItem value="occupiedBeds">Occupancy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <LoadingState rows={4} />
        ) : filteredAndSorted.length === 0 ? (
          <EmptyState
            title="No rooms found"
            description="No rooms match your search or filter criteria."
            icon={<DoorOpen className="h-8 w-8" />}
          />
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Showing {filteredAndSorted.length} of {totalRooms} rooms</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredAndSorted.map((room) => (
                <Card
                  key={room.id}
                  className={`cursor-pointer hover:shadow-md transition-all border-l-4 ${ROOM_STATUS_BG[room.roomStatus]}`}
                  onClick={() => router.push(`/admin/rooms/${room.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <DoorOpen className="h-4 w-4" />
                        Room {room.roomNumber}
                      </CardTitle>
                      <Badge className={ROOM_STATUS_COLORS[room.roomStatus]}>
                        {room.roomStatus}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5" />
                      <span>{room.hostel?.hostelName || "--"} · Floor {room.floorNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Bed className="h-3.5 w-3.5" />
                      <span>{ROOM_TYPE_LABELS[room.roomType] || room.roomType}</span>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Occupancy</span>
                        <span className="font-medium">{room.occupiedBeds}/{room.capacity}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            room.roomStatus === "FULL"
                              ? "bg-red-500"
                              : room.roomStatus === "MAINTENANCE"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${(room.occupiedBeds / room.capacity) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                        {room.capacity - room.occupiedBeds} free
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
