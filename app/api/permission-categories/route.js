// app/api/permission-categories/route.js
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
    const categories = await prisma.permissionCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { permissions: true } } },
    });
    return json(
      { categories },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (e) {
    console.error('[GET /api/permission-categories]', e);
    return error('Failed to load categories', 500);
  }
}

export async function POST(request) {
  const { response } = await requirePermission('PERMISSION_MANAGEMENT_CREATE');
  if (response) return response;

  const body = await parseBody(request);
  const { name, code, description, icon, color, sortOrder, permissions } =
    body || {};
  if (!name || !code) return error('name and code are required');

  try {
    const created = await prisma.permissionCategory.create({
      data: {
        name: String(name).trim(),
        code: String(code).trim().toUpperCase(),
        description: description || null,
        icon: icon || 'Folder',
        color: color || 'blue',
        sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
      },
    });

    if (Array.isArray(permissions) && permissions.length > 0) {
      const upperCode = String(code).trim().toUpperCase();
      await prisma.permission.createMany({
        data: permissions
          .map((a) => String(a).toUpperCase())
          .map((action) => ({
            name: `${upperCode}_${action}`,
            description: `${action} permission for ${name}`,
            action,
            module: upperCode,
            categoryId: created.id,
          })),
        skipDuplicates: true,
      });
    }

    return json({ category: created }, { status: 201 });
  } catch (e) {
    if (e?.code === 'P2002')
      return error('Category name or code already exists', 409);
    console.error('[POST /api/permission-categories]', e);
    return error('Failed to create category', 500);
  }
}
