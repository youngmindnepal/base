// lib/auth.js
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

/**
 * Resolve effective permissions for a user.
 * Effective set = union(role perms for that user) then apply overrides.
 * Overrides: allowed=true forces add, allowed=false forces remove.
 */
export async function resolvePermissions(userId) {
  const assignments = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  });

  const set = new Set();
  for (const a of assignments) {
    for (const rp of a.role.permissions) {
      set.add(rp.permission.name);
    }
  }

  const overrides = await prisma.userPermissionOverride.findMany({
    where: { userId },
    include: { permission: true },
  });

  for (const o of overrides) {
    if (o.allowed) set.add(o.permission.name);
    else set.delete(o.permission.name);
  }

  return Array.from(set);
}

export async function resolveRoles(userId) {
  const assignments = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  });
  return assignments.map((a) => ({
    id: a.role.id,
    name: a.role.name,
    scopeType: a.scopeType,
    scopeId: a.scopeId,
  }));
}

export async function verifyPassword(plain, hashed) {
  if (!hashed) return false;
  return bcrypt.compare(plain, hashed);
}

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}
