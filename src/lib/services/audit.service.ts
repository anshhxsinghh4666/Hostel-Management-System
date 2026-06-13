import { auditRepository } from "@/lib/repositories/audit.repository";
import { AuditLogQuery } from "@/lib/types";

export const auditService = {
  async log(params: {
    userId: string;
    action: string;
    entity: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }) {
    await auditRepository.create(params);
  },

  async logRegistration(userId: string, metadata?: Record<string, unknown>) {
    await this.log({
      userId,
      action: "REGISTER",
      entity: "USER",
      entityId: userId,
      metadata,
    });
  },

  async logLogin(userId: string, metadata?: Record<string, unknown>) {
    await this.log({
      userId,
      action: "LOGIN",
      entity: "USER",
      entityId: userId,
      metadata,
    });
  },

  async logLogout(userId: string) {
    await this.log({
      userId,
      action: "LOGOUT",
      entity: "USER",
      entityId: userId,
    });
  },

  async logPasswordReset(userId: string) {
    await this.log({
      userId,
      action: "PASSWORD_RESET",
      entity: "USER",
      entityId: userId,
    });
  },

  async logUserCreation(actorId: string, targetUserId: string, metadata?: Record<string, unknown>) {
    await this.log({
      userId: actorId,
      action: "USER_CREATED",
      entity: "USER",
      entityId: targetUserId,
      metadata,
    });
  },

  async logUserUpdate(actorId: string, targetUserId: string, metadata?: Record<string, unknown>) {
    await this.log({
      userId: actorId,
      action: "USER_UPDATED",
      entity: "USER",
      entityId: targetUserId,
      metadata,
    });
  },

  async logUserSuspension(actorId: string, targetUserId: string, metadata?: Record<string, unknown>) {
    await this.log({
      userId: actorId,
      action: "USER_SUSPENDED",
      entity: "USER",
      entityId: targetUserId,
      metadata,
    });
  },

  async logUserRestoration(actorId: string, targetUserId: string, metadata?: Record<string, unknown>) {
    await this.log({
      userId: actorId,
      action: "USER_RESTORED",
      entity: "USER",
      entityId: targetUserId,
      metadata,
    });
  },

  async logRoleChange(actorId: string, targetUserId: string, metadata?: Record<string, unknown>) {
    await this.log({
      userId: actorId,
      action: "ROLE_CHANGED",
      entity: "USER",
      entityId: targetUserId,
      metadata,
    });
  },

  async logProfileUpdate(userId: string, metadata?: Record<string, unknown>) {
    await this.log({
      userId,
      action: "PROFILE_UPDATED",
      entity: "USER",
      entityId: userId,
      metadata,
    });
  },

  async getLogs(query: AuditLogQuery) {
    return auditRepository.findAll(query);
  },
};
