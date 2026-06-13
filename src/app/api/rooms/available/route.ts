import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { roomService } from "@/lib/services/room.service";
import { handleApiError } from "@/lib/utils/error-handler";
import { successResponse, unauthorizedResponse } from "@/lib/utils/api-response";
import { z } from "zod";
import { RoomType } from "@/lib/types";

const availableRoomQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  hostelId: z.string().optional(),
  roomType: z.nativeEnum(RoomType).optional(),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const query = availableRoomQuerySchema.parse(Object.fromEntries(searchParams));

    const result = await roomService.getAvailableRooms(query);

    return successResponse(result.data, undefined, 200, result.meta);
  } catch (error) {
    return handleApiError(error);
  }
}
