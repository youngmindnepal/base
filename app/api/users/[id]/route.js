// app/api/users/[id]/route.js
import { prisma } from '@/lib/prisma';
import { requirePermission, parseBody, json, error, toInt } from '@/lib/api';
import { hashPassword } from '@/lib/auth';

const SYSTEM_ADMIN_ROLE = 'System Administrator';

// ─────────────────────────────────────────────────────────────
// GET
// ─────────────────────────────────────────────────────────────
export async function GET(_req, { params }) {
  const { response } = await requirePermission('USER_MANAGEMENT_READ');
  if (response) return response;

  const { id: rawId } = await params;
  const id = toInt(rawId);
  if (!id) return error('Invalid id');

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      address: true,
      status: true,
      mustChangePassword: true,
      roleAssignments: {
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } },
            },
          },
        },
      },
    },
  });

  if (!user) return error('User not found', 404);
  return json({ user });
}

// ─────────────────────────────────────────────────────────────
// PATCH
// ─────────────────────────────────────────────────────────────
export async function PATCH(request, { params }) {
  const { response, session } = await requirePermission(
    'USER_MANAGEMENT_UPDATE'
  );
  if (response) return response;

  const { id: rawId } = await params;
  const id = toInt(rawId);
  if (!id) return error('Invalid id');

  const body = await parseBody(request);

  // ── Guard 1: refuse to move a System Administrator to another role
  //    unless the caller IS that same System Administrator.
  if (body.roleId !== undefined) {
    const target = await prisma.user.findUnique({
      where: { id },
      select: {
        roleAssignments: { select: { role: { select: { name: true } } } },
      },
    });
    const targetIsSysAdmin = target?.roleAssignments?.some(
      (ra) => ra.role?.name === SYSTEM_ADMIN_ROLE
    );
    if (targetIsSysAdmin && Number(session.user.id) !== id) {
      return error(
        'Only the System Administrator can change their own role',
        403
      );
    }
  }

  const data = {
    email: body.email ?? undefined,
    firstName: body.firstName ?? null,
    lastName: body.lastName ?? null,
    phone: body.phone ?? null,
    address: body.address ?? null,
    status: body.status ?? undefined,
  };
  if (body.password) {
    if (String(body.password).length < 8)
      return error('password must be at least 8 characters');
    data.password = await hashPassword(body.password);
  }

  const updated = await prisma.user.update({ where: { id }, data });

  if (body.roleId !== undefined) {
    const rid = body.roleId ? Number(body.roleId) : null;
    await prisma.userRole.deleteMany({ where: { userId: id } });
    if (rid && Number.isFinite(rid)) {
      await prisma.userRole.create({
        data: {
          userId: id,
          roleId: rid,
          scopeType: 'GLOBAL',
          scopeId: null,
        },
      });
    }
  }

  return json({ user: updated });
}

// ─────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────
export async function DELETE(_req, { params }) {
  const { response, session } = await requirePermission(
    'USER_MANAGEMENT_DELETE'
  );
  if (response) return response;

  const { id: rawId } = await params;
  const id = toInt(rawId);
  if (!id) return error('Invalid id');

  // ── Guard 1: cannot delete yourself
  if (Number(session.user.id) === id) {
    return error('You cannot delete your own account', 400);
  }

  // ── Guard 2: cannot delete any user who holds the System Administrator role
  const target = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      roleAssignments: { select: { role: { select: { name: true } } } },
    },
  });

  if (!target) return error('User not found', 404);

  const targetIsSysAdmin = target.roleAssignments.some(
    (ra) => ra.role?.name === SYSTEM_ADMIN_ROLE
  );
  if (targetIsSysAdmin) {
    return error('The System Administrator account cannot be deleted', 403);
  }

  // ── Delete
  try {
    await prisma.user.delete({ where: { id } });
    return json({ ok: true });
  } catch (e) {
    if (e?.code === 'P2025') return error('User not found', 404);
    if (e?.code === 'P2003') {
      return error(
        'Cannot delete user because related records reference them',
        409
      );
    }
    console.error('[DELETE /api/users/:id]', e);
    return error('Failed to delete user', 500);
  }
}
