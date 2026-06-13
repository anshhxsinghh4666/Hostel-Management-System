import bcrypt from "bcryptjs";
import { userRepository } from "@/lib/repositories/user.repository";
import { auditService } from "./audit.service";
import { PaginationParams, Role } from "@/lib/types";
import { getCreatableRoles, canEditUser, canSuspendUser, canRestoreUser } from "@/lib/permissions/permissions";

const SALT_ROUNDS = 12;

export const userService = {
  async createUser(
    actorRole: Role,
    actorId: string,
    data: {
      fullName: string;
      email: string;
      phone: string;
      password: string;
      role: Role;
    }
  ) {
    const allowedRoles = getCreatableRoles(actorRole);
    if (!allowedRoles.includes(data.role)) {
      throw new Error("You do not have permission to create users with this role");
    }

    const existingEmail = await userRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new Error("A user with this email already exists");
    }

    const existingPhone = await userRepository.findByPhone(data.phone);
    if (existingPhone) {
      throw new Error("A user with this phone number already exists");
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = await userRepository.create({
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      passwordHash,
      role: data.role,
    });

    await auditService.logUserCreation(actorId, user.id, {
      createdRole: data.role,
    });

    return user;
  },

  async updateUser(
    actorRole: Role,
    actorId: string,
    targetId: string,
    data: {
      fullName?: string;
      phone?: string;
      role?: Role;
      isActive?: boolean;
    }
  ) {
    if (!canEditUser(actorRole)) {
      throw new Error("You do not have permission to edit users");
    }

    const targetUser = await userRepository.findById(targetId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    if (targetUser.role === Role.SUPER_ADMIN && actorRole !== Role.SUPER_ADMIN) {
      throw new Error("You cannot modify SUPER_ADMIN accounts");
    }

    if (actorId === targetId && data.role && data.role !== Role.SUPER_ADMIN) {
      throw new Error("You cannot demote yourself from SUPER_ADMIN");
    }

    const updates: Record<string, unknown> = {};

    if (data.fullName) updates.fullName = data.fullName;
    if (data.phone) {
      const existingPhone = await userRepository.findByPhone(data.phone);
      if (existingPhone && existingPhone.id !== targetId) {
        throw new Error("This phone number is already in use");
      }
      updates.phone = data.phone;
    }
    if (data.role) {
      updates.role = data.role;
    }
    if (data.isActive !== undefined) {
      updates.isActive = data.isActive;
    }

    const updatedUser = await userRepository.update(targetId, updates);

    const metadata: Record<string, unknown> = {};
    if (data.role) metadata.newRole = data.role;
    if (data.isActive !== undefined) metadata.isActive = data.isActive;

    if (data.role) {
      await auditService.logRoleChange(actorId, targetId, {
        oldRole: targetUser.role,
        newRole: data.role,
      });
    } else {
      await auditService.logUserUpdate(actorId, targetId, metadata);
    }

    return updatedUser;
  },

  async suspendUser(actorRole: Role, actorId: string, targetId: string) {
    if (!canSuspendUser(actorRole)) {
      throw new Error("You do not have permission to suspend users");
    }

    const targetUser = await userRepository.findById(targetId);
    if (!targetUser) throw new Error("User not found");
    if (!targetUser.isActive) throw new Error("User is already suspended");

    const user = await userRepository.softDelete(targetId);

    await auditService.logUserSuspension(actorId, targetId);

    return user;
  },

  async restoreUser(actorRole: Role, actorId: string, targetId: string) {
    if (!canRestoreUser(actorRole)) {
      throw new Error("You do not have permission to restore users");
    }

    const targetUser = await userRepository.findById(targetId);
    if (!targetUser) throw new Error("User not found");
    if (targetUser.isActive) throw new Error("User is already active");

    const user = await userRepository.restore(targetId);

    await auditService.logUserRestoration(actorId, targetId);

    return user;
  },

  async getUsers(params: PaginationParams) {
    return userRepository.findAll(params);
  },

  async getUserById(id: string) {
    const user = await userRepository.findById(id);
    if (!user) throw new Error("User not found");
    const { passwordHash, ...publicUser } = user;
    void passwordHash;
    return {
      ...publicUser,
      role: publicUser.role as unknown as Role,
    };
  },

  async getUserByEmail(email: string) {
    return userRepository.findByEmail(email);
  },
};
