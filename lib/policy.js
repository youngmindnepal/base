// lib/policy.js
import { prisma } from '@/lib/prisma';

const SYSTEM_ADMIN_ROLE = 'System Administrator';

function toUserId(userId) {
  const n = Number(userId);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export async function resolveEffectivePermissions(userId) {
  const id = toUserId(userId);
  if (id == null) return { isSysAdmin: false, map: new Map() };

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      roleAssignments: {
        select: {
          scopeType: true,
          scopeId: true,
          role: {
            select: {
              name: true,
              permissions: {
                select: { permission: { select: { name: true } } },
              },
            },
          },
        },
      },
      overrides: {
        select: {
          effect: true,
          scopeType: true,
          scopeId: true,
          permission: { select: { name: true } },
        },
      },
    },
  });

  if (!user) return { isSysAdmin: false, map: new Map() };

  // ✅ Loosened: any System Administrator assignment counts,
  // regardless of scopeType. (Previously required scopeType === 'GLOBAL',
  // which silently failed when the seed stored null or a lowercase value.)
  const isSysAdmin = user.roleAssignments.some(
    (ra) => ra.role.name === SYSTEM_ADMIN_ROLE
  );

  const map = new Map();
  const bucket = (name) => {
    if (!map.has(name))
      map.set(name, { allowed: new Set(), denied: new Set() });
    return map.get(name);
  };
  const key = (scopeType, scopeId) =>
    scopeType === 'GLOBAL' ? 'GLOBAL' : `${scopeType}:${scopeId}`;

  // 1) Role grants → ALLOW @ GLOBAL
  for (const ra of user.roleAssignments) {
    for (const rp of ra.role.permissions) {
      bucket(rp.permission.name).allowed.add('GLOBAL');
    }
  }

  // 2) Per-user overrides
  for (const o of user.overrides) {
    const b = bucket(o.permission.name);
    const k = key(o.scopeType, o.scopeId);
    if (o.effect === 'DENY') b.denied.add(k);
    else b.allowed.add(k);
  }

  return { isSysAdmin, map };
}

export async function can(userId, permission, resource = {}) {
  const { isSysAdmin, map } = await resolveEffectivePermissions(userId);
  if (isSysAdmin) return true;

  const entry = map.get(permission);
  if (!entry) return false;

  const targetKey =
    resource.scopeType && resource.scopeId
      ? `${resource.scopeType}:${resource.scopeId}`
      : 'GLOBAL';

  if (entry.denied.has('GLOBAL')) return false;
  if (entry.denied.has(targetKey)) return false;
  return entry.allowed.has('GLOBAL') || entry.allowed.has(targetKey);
}

export async function canDelegate(actorId, permissionNames) {
  const { isSysAdmin, map } = await resolveEffectivePermissions(actorId);
  if (isSysAdmin) return true;

  return permissionNames.every((name) => {
    const e = map.get(name);
    return e && (e.allowed.has('GLOBAL') || e.allowed.size > 0);
  });
}
