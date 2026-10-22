// app/api/user-roles/[id]/route.js
import { prisma } from '@/lib/prisma';
import { requirePermission, json, toInt } from '@/lib/api';

export async function DELETE(_req, { params }) {
  const { response } = await requirePermission('MANAGE_ROLES');
  if (response) return response;

  const id = toInt(params.id);
  await prisma.userRole.delete({ where: { id } });
  return json({ ok: true });
}
