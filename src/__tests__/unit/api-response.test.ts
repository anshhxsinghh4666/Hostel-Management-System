import { describe, it, expect } from "vitest";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from "@/lib/utils/api-response";

describe("API Response Utilities", () => {
  describe("successResponse", () => {
    it("returns 200 with data by default", async () => {
      const res = successResponse({ id: "1" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ success: true, data: { id: "1" } });
    });

    it("includes message when provided", async () => {
      const res = successResponse(null, "Created", 201);
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body).toEqual({ success: true, data: null, message: "Created" });
    });

    it("includes meta for pagination", async () => {
      const meta = { page: 1, limit: 10, total: 100, totalPages: 10 };
      const res = successResponse([], undefined, 200, meta);
      const body = await res.json();
      expect(body.meta).toEqual(meta);
    });
  });

  describe("errorResponse", () => {
    it("returns 400 with error message", async () => {
      const res = errorResponse("Bad request");
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toEqual({ success: false, error: "Bad request" });
    });

    it("includes field errors when provided", async () => {
      const errors = { email: ["Invalid email"] };
      const res = errorResponse("Validation failed", 400, errors);
      const body = await res.json();
      expect(body.errors).toEqual(errors);
    });
  });

  describe("unauthorizedResponse", () => {
    it("returns 401", async () => {
      const res = unauthorizedResponse();
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });
  });

  describe("forbiddenResponse", () => {
    it("returns 403", async () => {
      const res = forbiddenResponse();
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe("Forbidden");
    });
  });

  describe("notFoundResponse", () => {
    it("returns 404", async () => {
      const res = notFoundResponse();
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe("Not found");
    });
  });
});
