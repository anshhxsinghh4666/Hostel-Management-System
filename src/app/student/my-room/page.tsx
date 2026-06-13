"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/shared/loading-state";
import { DoorOpen, Building2, Home, Users, Bed, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const ROOM_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  FULL: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  MAINTENANCE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

const ROOM_TYPE_LABELS: Record<string, string> = {
  SINGLE: "Single Room",
  DOUBLE: "Double Room",
  TRIPLE: "Triple Room",
  DORMITORY: "Dormitory",
};

export default function MyRoomPage() {
  const { data: session } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ["my-room", session?.user?.id],
    queryFn: async () => {
      const res = await fetch("/api/student/my-room");
      if (!res.ok) throw new Error("Failed to fetch room data");
      return res.json();
    },
    enabled: !!session?.user?.id,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingState rows={4} />
      </DashboardLayout>
    );
  }

  const roomData = data?.data;
  const room = roomData?.room;
  const roommates = roomData?.roommates || [];
  const allocation = roomData?.allocation;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading">My Room</h1>
            <p className="text-muted-foreground">View your current room and roommate details</p>
          </div>
          <Link href="/student/dashboard">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {!room ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Home className="h-16 w-16 text-muted-foreground mb-4 opacity-30" />
              <h2 className="text-xl font-semibold mb-2">No Room Allocated</h2>
              <p className="text-muted-foreground text-center max-w-md">
                You have not been allocated a room yet. Please contact the hostel administration.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DoorOpen className="h-5 w-5" /> Room Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Room Number</p>
                      <p className="text-2xl font-bold">{room.roomNumber}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Block</p>
                      <p className="text-lg font-semibold">{room.hostel?.hostelName || "--"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Floor</p>
                      <p className="text-lg font-semibold">Floor {room.floorNumber}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Room Type</p>
                      <p className="text-lg font-semibold">{ROOM_TYPE_LABELS[room.roomType] || room.roomType}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Capacity</p>
                      <p className="text-lg font-semibold">{room.capacity} beds</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Occupied</p>
                      <p className="text-lg font-semibold">{room.occupiedBeds} / {room.capacity}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge className={ROOM_STATUS_COLORS[room.roomStatus]}>{room.roomStatus}</Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Allocation Date</p>
                      <p className="text-sm font-semibold">
                        {allocation?.allocatedDate ? format(new Date(allocation.allocatedDate), "MMM d, yyyy") : "--"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Available Beds</p>
                      <p className="text-lg font-semibold text-green-600">{room.capacity - room.occupiedBeds}</p>
                    </div>
                  </div>

                  {room.capacity > 1 && (
                    <div className="mt-6">
                      <p className="text-sm font-medium mb-3">Bed Occupancy</p>
                      <div className="flex gap-2 flex-wrap">
                        {Array.from({ length: room.capacity }).map((_, i) => (
                          <div
                            key={i}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                              i < room.occupiedBeds
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <Bed className="h-3 w-3" />
                            Bed {i + 1}
                            {i < room.occupiedBeds && <span className="text-green-600">●</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" /> Hostel Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {room.hostel && (
                    <>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Building2 className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-semibold">{room.hostel.hostelName}</p>
                          <p className="text-xs text-muted-foreground capitalize">{room.hostel.hostelType.toLowerCase()} Hostel</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">Hostel Type:</span>
                        <span className="font-medium capitalize">{room.hostel.hostelType.toLowerCase()}</span>
                        <span className="text-muted-foreground">Allocation:</span>
                        <span className="font-medium">
                          {allocation?.allocatedDate
                            ? format(new Date(allocation.allocatedDate), "MMM d, yyyy")
                            : "--"}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" /> Roommates ({roommates.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {roommates.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {roommates.map((rm: Record<string, unknown>, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {(rm.firstName as string)?.charAt(0)}{(rm.lastName as string)?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{String(rm.firstName || "")} {String(rm.lastName || "")}</p>
                          <p className="text-xs text-muted-foreground">{String(rm.course || "")} - Year {String(rm.year || "")}</p>
                          <p className="text-xs text-muted-foreground">{String(rm.registrationNumber || "")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p>No roommates assigned to this room</p>
                    <p className="text-xs mt-1">You have this room to yourself</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
