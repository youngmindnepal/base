// app/api/roles/route.js
import { prisma } from '@/lib/prisma';
import {
  requirePermission,
  requireAnyPermission,
  parseBody,
  json,
  error,
} from '@/lib/api';

const READABLE_WITH = [
  'ROLE_MANAGEMENT_READ',
  'PERMISSION_MANAGEMENT_READ',
  'ROLE_PERMISSION_ASSIGNMENT_READ',
];

// ─── GET /api/roles ────────────────────────────────────────────
export async function GET() {
  const { response } = await requireAnyPermission(READABLE_WITH);
  if (response) return response;

  try {
    const roles = await prisma.role.findMany({
      orderBy: { id: 'asc' },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { assignments: true } },
      },
    });
    return json(
      { roles },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (e) {
    console.error('[GET /api/roles]', e);
    return error('Failed to load roles', 500);
  }
}

// ─── POST /api/roles ──────────────────────────────────────────
export async function POST(request) {
  const { response } = await requirePermission('ROLE_MANAGEMENT_CREATE');
  if (response) return response;

  const body = await parseBody(request);
  const { name, description } = body || {};
  if (!name || !String(name).trim()) return error('Role name is required');

  try {
    const existing = await prisma.role.findUnique({
      where: { name: String(name).trim() },
    });
    if (existing) return error('Role name already in use', 409);

    const role = await prisma.role.create({
      data: {
        name: String(name).trim(),
        description: description || null,
      },
    });
    return json({ role }, { status: 201 });
  } catch (e) {
    if (e?.code === 'P2002') return error('Role name already in use', 409);
    console.error('[POST /api/roles]', e);
    return error('Failed to create role', 500);
  }
}
