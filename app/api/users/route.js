// app/api/users/route.js
import { prisma } from '@/lib/prisma';
import { requirePermission, parseBody, json, error } from '@/lib/api';
import { hashPassword } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export async function GET(request) {
  const { response } = await requirePermission('USER_MANAGEMENT_READ');
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('search') || '').trim();
  const status = searchParams.get('status') || '';
  const roleIdRaw = searchParams.get('roleId');

  const where = {};
  if (q) {
    where.OR = [
      { email: { contains: q, mode: 'insensitive' } },
      { firstName: { contains: q, mode: 'insensitive' } },
      { lastName: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (status && status !== 'all') where.status = status;
  if (roleIdRaw && roleIdRaw !== 'all') {
    const roleId = Number(roleIdRaw);
    if (Number.isFinite(roleId)) {
      where.roleAssignments = { some: { roleId } };
    }
  }

  try {
    const users = await prisma.user.findMany({
      where,
      orderBy: { id: 'asc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        status: true,
        mustChangePassword: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        roleAssignments: { include: { role: true } },
      },
    });

    return json(
      { users },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (e) {
    console.error('[GET /api/users]', e);
    return error('Failed to load users', 500);
  }
}

export async function POST(request) {
  const { response } = await requirePermission('USER_MANAGEMENT_CREATE');
  if (response) return response;

  const body = await parseBody(request);
  const {
    email,
    password,
    firstName,
    lastName,
    phone,
    address,
    status,
    roleId,
  } = body;

  if (!email || !password) return error('email and password are required');
  if (String(password).length < 8)
    return error('password must be at least 8 characters');

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return error('Email already in use', 409);

  try {
    const hashed = await hashPassword(password);
    const created = await prisma.user.create({
      data: {
        email,
        password: hashed,
        firstName: firstName || null,
        lastName: lastName || null,
        phone: phone || null,
        address: address || null,
        status: status || 'ACTIVE',
        mustChangePassword: true,
      },
    });

    if (roleId) {
      const rid = Number(roleId);
      if (Number.isFinite(rid)) {
        await prisma.userRole.create({
          data: {
            userId: created.id,
            roleId: rid,
            scopeType: 'GLOBAL',
            scopeId: null,
          },
        });
      }
    }

    return json({ user: created }, { status: 201 });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === 'P2002'
    ) {
      return error('Email already in use', 409);
    }
    console.error('[POST /api/users]', e);
    return error('Failed to create user', 500);
  }
}
