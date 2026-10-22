import { prisma } from '@/lib/prisma';
import { requirePermission, parseBody, json, error, toInt } from '@/lib/api';
import { canDelegate } from '@/lib/policy';

// GET — list current overrides for a user
export async function GET(_req, { params }) {
  const { response } = await requirePermission('USER_MANAGEMENT_READ');
  if (response) return response;

  const userId = params.id;
  const assignments = await prisma.permissionAssignment.findMany({
    where: { userId },
    include: { permission: true },
    orderBy: { id: 'asc' },
  });
  return json({ assignments });
}

// POST — add/update an override
export async function POST(request, { params }) {
  const { response, session } = await requirePermission(
    'USER_MANAGEMENT_UPDATE'
  );
  if (response) return response;

  const userId = params.id;
  const body = await parseBody(request);
  const permissionId = toInt(body.permissionId);
  const effect = body.effect === 'DENY' ? 'DENY' : 'ALLOW';
  const scopeType = body.scopeType || 'GLOBAL';
  const scopeId = scopeType === 'GLOBAL' ? null : body.scopeId || null;

  if (!permissionId) return error('permissionId is required');

  const permission = await prisma.permission.findUnique({
    where: { id: permissionId },
  });
  if (!permission) return error('Permission not found', 404);

  // ─── Privilege-escalation guard ───────────────────────────────
  if (effect === 'ALLOW') {
    const ok = await canDelegate(session.user.id, [permission.name]);
    if (!ok) return error('You cannot grant a permission you do not hold', 403);
  }

  const created = await prisma.permissionAssignment.upsert({
    where: {
      userId_permissionId_scopeType_scopeId: {
        userId,
        permissionId,
        scopeType,
        scopeId,
      },
    },
    create: { userId, permissionId, effect, scopeType, scopeId },
    update: { effect },
  });

  // bump version so any cached UI hints can refresh
  await prisma.user.update({
    where: { id: userId },
    data: { permissionsVersion: { increment: 1 } },
  });

  return json({ assignment: created }, { status: 201 });
}

// DELETE — remove an override
export async function DELETE(request, { params }) {
  const { response } = await requirePermission('USER_MANAGEMENT_UPDATE');
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const id = toInt(searchParams.get('id'));
  if (!id) return error('id is required');

  await prisma.permissionAssignment.delete({ where: { id } }).catch(() => {});
  await prisma.user.update({
    where: { id: params.id },
    data: { permissionsVersion: { increment: 1 } },
  });
  return json({ ok: true });
}
