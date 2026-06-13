import { NextRequest } from "next/server";
import { loginSchema } from "@/lib/validations/auth.schema";
import { handleApiError } from "@/lib/utils/error-handler";
import { successResponse, unauthorizedResponse } from "@/lib/utils/api-response";
import { rateLimit, rateLimitResponse, getClientIp } from "@/lib/utils/rate-limit";
import { signIn } from "@/lib/auth/auth";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { success } = rateLimit(`login:${ip}`, 5, 60000);
    if (!success) return rateLimitResponse();

    const body = await request.json();
    const data = loginSchema.parse(body);

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (!result || result.error) {
      return unauthorizedResponse("Invalid email or password");
    }

    return successResponse(null, "Login successful");
  } catch (error) {
    return handleApiError(error);
  }
}
