// app/api/users/[id]/overrides/route.js
import { prisma } from '@/lib/prisma';
import { requirePermission, parseBody, json, error, toInt } from '@/lib/api';

export async function GET(_req, { params }) {
  const { response } = await requirePermission('READ_USER');
  if (response) return response;

  const id = toInt(params.id);
  const overrides = await prisma.userPermissionOverride.findMany({
    where: { userId: id },
    include: { permission: true },
  });
  return json({ overrides });
}

// POST /api/users/:id/overrides { permissionId, allowed }
// Upsert semantics: (userId, permissionId) is the PK.
export async function POST(req, { params }) {
  const { response } = await requirePermission('MANAGE_ROLES');
  if (response) return response;

  const id = toInt(params.id);
  const { permissionId, allowed } = await parseBody(req);
  if (!permissionId || typeof allowed !== 'boolean') {
    return error('permissionId and allowed (bool) required');
  }

  const override = await prisma.userPermissionOverride.upsert({
    where: {
      userId_permissionId: {
        userId: id,
        permissionId: Number(permissionId),
      },
    },
    update: { allowed },
    create: { userId: id, permissionId: Number(permissionId), allowed },
  });
  return json({ override });
}

export async function DELETE(req, { params }) {
  const { response } = await requirePermission('MANAGE_ROLES');
  if (response) return response;

  const id = toInt(params.id);
  const { searchParams } = new URL(req.url);
  const permissionId = toInt(searchParams.get('permissionId'), null);
  if (!permissionId) return error('permissionId query param required');

  await prisma.userPermissionOverride.delete({
    where: { userId_permissionId: { userId: id, permissionId } },
  });
  return json({ ok: true });
}
