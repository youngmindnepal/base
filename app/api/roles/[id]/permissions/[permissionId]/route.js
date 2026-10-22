// app/api/roles/[id]/permissions/[permissionId]/route.js
import { prisma } from '@/lib/prisma';
import { requirePermission, json, error, toInt } from '@/lib/api';

export async function DELETE(_req, { params }) {
  const { response } = await requirePermission('MANAGE_ROLES');
  if (response) return response;

  const { id: rawRoleId, permissionId: rawPermId } = await params;
  const roleId = toInt(rawRoleId);
  const permissionId = toInt(rawPermId);
  if (!roleId || !permissionId) return error('Invalid id', 400);

  try {
    await prisma.rolePermission.delete({
      where: { roleId_permissionId: { roleId, permissionId } },
    });
    return json({ ok: true });
  } catch (e) {
    if (e?.code === 'P2025') return error('Not found', 404);
    console.error('[DELETE /api/roles/:id/permissions/:permissionId]', e);
    return error('Failed to remove permission', 500);
  }
}
