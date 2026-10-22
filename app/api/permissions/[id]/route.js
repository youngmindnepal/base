// app/api/permissions/[id]/route.js
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  requirePermission,
  requireAnyPermission,
  parseBody,
  json,
  error,
  toInt,
} from '@/lib/api';

const READABLE_WITH = [
  'PERMISSION_MANAGEMENT_READ',
  'ROLE_MANAGEMENT_READ',
  'ROLE_PERMISSION_ASSIGNMENT_READ',
];

// ─── GET ─────────────────────────────────────────────────────
export async function GET(_req, { params }) {
  const { response } = await requireAnyPermission(READABLE_WITH);
  if (response) return response;

  const { id: rawId } = await params;
  const id = toInt(rawId);
  if (!id) return error('Invalid id', 400);

  const permission = await prisma.permission.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!permission) return error('Permission not found', 404);
  return json({ permission });
}

// ─── PATCH ───────────────────────────────────────────────────
export async function PATCH(req, { params }) {
  const { response } = await requirePermission('PERMISSION_MANAGEMENT_UPDATE');
  if (response) return response;

  const { id: rawId } = await params;
  const id = toInt(rawId);
  if (!id) return error('Invalid id', 400);

  const body = await parseBody(req);
  const data = {};
  for (const k of ['name', 'description', 'module', 'action']) {
    if (body[k] !== undefined) data[k] = body[k];
  }
  if (body.categoryId !== undefined) {
    data.categoryId = body.categoryId ? Number(body.categoryId) : null;
  }

  try {
    const permission = await prisma.permission.update({
      where: { id },
      data,
      include: { category: true },
    });
    return json({ permission });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002')
        return error('Permission name already exists', 409);
      if (e.code === 'P2025') return error('Permission not found', 404);
      if (e.code === 'P2003') return error('Invalid category reference', 400);
    }
    console.error('[PATCH /api/permissions/:id]', e);
    return error('Failed to update permission', 500);
  }
}

// ─── DELETE ──────────────────────────────────────────────────
export async function DELETE(_req, { params }) {
  const { response } = await requirePermission('PERMISSION_MANAGEMENT_DELETE');
  if (response) return response;

  const { id: rawId } = await params;
  const id = toInt(rawId);
  if (!id) return error('Invalid id', 400);

  try {
    const permission = await prisma.permission.findUnique({ where: { id } });
    if (!permission) return error('Permission not found', 404);

    const [roleLinks, userLinks] = await Promise.all([
      prisma.rolePermission.count({ where: { permissionId: id } }),
      prisma.userPermissionOverride.count({ where: { permissionId: id } }),
    ]);

    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { permissionId: id } }),
      prisma.userPermissionOverride.deleteMany({ where: { permissionId: id } }),
      prisma.permission.delete({ where: { id } }),
    ]);

    return json({
      ok: true,
      removedRoleLinks: roleLinks,
      removedUserOverrides: userLinks,
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2025') return error('Permission not found', 404);
      if (e.code === 'P2003') {
        return error(
          'Cannot delete permission: it is still referenced by roles or users',
          409
        );
      }
    }
    console.error('[DELETE /api/permissions/:id]', e);
    return error(e.message || 'Failed to delete permission', 500);
  }
}
