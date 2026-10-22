// app/api/roles/[id]/permissions/route.js
import { prisma } from '@/lib/prisma';
import { requireAnyPermission, parseBody, json, error, toInt } from '@/lib/api';

// Read: any of the three read permissions
const READABLE_WITH = [
  'ROLE_MANAGEMENT_READ',
  'PERMISSION_MANAGEMENT_READ',
  'ROLE_PERMISSION_ASSIGNMENT_READ',
];

// Grant: CREATE
const GRANT_WITH = ['ROLE_PERMISSION_ASSIGNMENT_CREATE'];

// Revoke: UPDATE
const REVOKE_WITH = ['ROLE_PERMISSION_ASSIGNMENT_UPDATE'];

function normaliseIds(body) {
  if (Array.isArray(body?.permissionIds)) {
    return body.permissionIds.map(Number).filter(Number.isFinite);
  }
  if (body?.permissionId != null) {
    const n = Number(body.permissionId);
    return Number.isFinite(n) ? [n] : [];
  }
  return [];
}

// ─── GET — read any role's assigned permissions ──────────────
export async function GET(_req, { params }) {
  const { response } = await requireAnyPermission(READABLE_WITH);
  if (response) return response;

  const { id: rawId } = await params;
  const roleId = toInt(rawId);
  if (!roleId) return error('Invalid role id');

  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: {
      id: true,
      name: true,
      permissions: {
        select: {
          permissionId: true,
          permission: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!role) return error('Role not found', 404);

  return json({
    roleId: role.id,
    roleName: role.name,
    permissionIds: role.permissions.map((p) => p.permissionId),
    permissions: role.permissions.map((p) => p.permission),
  });
}

// ─── POST — GRANT — requires ROLE_PERMISSION_ASSIGNMENT_CREATE ─
// No secondary delegation check. The CREATE permission IS the
// authorization to assign any permission to any role.
export async function POST(request, { params }) {
  const { response } = await requireAnyPermission(GRANT_WITH);
  if (response) return response;

  const { id: rawId } = await params;
  const roleId = toInt(rawId);
  if (!roleId) return error('Invalid role id');

  const body = await parseBody(request);
  const permissionIds = normaliseIds(body);
  if (permissionIds.length === 0)
    return error('permissionId or permissionIds is required');

  const permissions = await prisma.permission.findMany({
    where: { id: { in: permissionIds } },
    select: { id: true, name: true },
  });
  if (permissions.length === 0) return error('Permissions not found', 404);

  try {
    const result = await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId, permissionId: p.id })),
      skipDuplicates: true,
    });

    return json({
      ok: true,
      added: permissions.map((p) => p.id),
      count: result.count,
    });
  } catch (e) {
    if (e?.code === 'P2003') return error('Role not found', 404);
    console.error('[POST /api/roles/:id/permissions]', e);
    return error('Failed to assign permissions', 500);
  }
}

// ─── DELETE — REVOKE — requires ROLE_PERMISSION_ASSIGNMENT_UPDATE ─
export async function DELETE(request, { params }) {
  const { response } = await requireAnyPermission(REVOKE_WITH);
  if (response) return response;

  const { id: rawId } = await params;
  const roleId = toInt(rawId);
  if (!roleId) return error('Invalid role id');

  const { searchParams } = new URL(request.url);
  const single = toInt(searchParams.get('permissionId'));

  try {
    if (single) {
      await prisma.rolePermission
        .delete({
          where: { roleId_permissionId: { roleId, permissionId: single } },
        })
        .catch(() => {});
      return json({ ok: true, removed: [single] });
    }

    try {
      const body = await request.clone().json();
      const ids = normaliseIds(body);
      if (ids.length > 0) {
        const result = await prisma.rolePermission.deleteMany({
          where: { roleId, permissionId: { in: ids } },
        });
        return json({ ok: true, removedCount: result.count, removed: ids });
      }
    } catch {
      /* no body — fall through to clear all */
    }

    const result = await prisma.rolePermission.deleteMany({
      where: { roleId },
    });
    return json({ ok: true, removedCount: result.count });
  } catch (e) {
    console.error('[DELETE /api/roles/:id/permissions]', e);
    return error('Failed to remove permissions', 500);
  }
}
