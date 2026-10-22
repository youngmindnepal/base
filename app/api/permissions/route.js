// app/api/permissions/route.js
import { prisma } from '@/lib/prisma';
import {
  requirePermission,
  requireAnyPermission,
  parseBody,
  json,
  error,
} from '@/lib/api';

const READABLE_WITH = [
  'PERMISSION_MANAGEMENT_READ',
  'ROLE_MANAGEMENT_READ',
  'ROLE_PERMISSION_ASSIGNMENT_READ',
];

export async function GET() {
  const { response } = await requireAnyPermission(READABLE_WITH);
  if (response) return response;

  try {
    const permissions = await prisma.permission.findMany({
      orderBy: { name: 'asc' },
      include: { category: true },
    });
    return json(
      { permissions },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (e) {
    console.error('[GET /api/permissions]', e);
    return error('Failed to load permissions', 500);
  }
}

export async function POST(request) {
  const { response } = await requirePermission('PERMISSION_MANAGEMENT_CREATE');
  if (response) return response;

  const body = await parseBody(request);
  const { name, description, categoryId, module, action } = body || {};
  if (!name) return error('Permission name is required');
  if (!action) return error('Action is required');

  try {
    const existing = await prisma.permission.findUnique({
      where: { name: String(name).trim() },
    });
    if (existing) return error('Permission name already in use', 409);

    const permission = await prisma.permission.create({
      data: {
        name: String(name).trim(),
        description: description || null,
        categoryId: categoryId ? Number(categoryId) : null,
        module: module || null,
        action: String(action).toUpperCase(),
      },
      include: { category: true },
    });
    return json({ permission }, { status: 201 });
  } catch (e) {
    if (e?.code === 'P2002')
      return error('Permission name already in use', 409);
    console.error('[POST /api/permissions]', e);
    return error('Failed to create permission', 500);
  }
}
