// app/api/users/[id]/roles/route.js
import { prisma } from '@/lib/prisma';
import { requirePermission, parseBody, json, error, toInt } from '@/lib/api';

// GET /api/users/:id/roles
export async function GET(_req, { params }) {
  const { response } = await requirePermission('READ_USER');
  if (response) return response;

  const id = toInt(params.id);
  const assignments = await prisma.userRole.findMany({
    where: { userId: id },
    include: { role: true },
  });
  return json({ assignments });
}

// POST /api/users/:id/roles { roleId, scopeType?, scopeId? }
export async function POST(req, { params }) {
  const { response } = await requirePermission('MANAGE_ROLES');
  if (response) return response;

  const id = toInt(params.id);
  const { roleId, scopeType = 'GLOBAL', scopeId = null } = await parseBody(req);
  if (!roleId) return error('roleId required');

  const created = await prisma.userRole.create({
    data: {
      userId: id,
      roleId: Number(roleId),
      scopeType,
      scopeId: scopeId ?? null,
    },
  });
  return json({ assignment: created }, { status: 201 });
}
