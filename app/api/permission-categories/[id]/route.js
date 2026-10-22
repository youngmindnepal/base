// app/api/permission-categories/[id]/route.js
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requirePermission, parseBody, json, error, toInt } from '@/lib/api';

export async function GET(_req, { params }) {
  const { response } = await requirePermission('MANAGE_ROLES');
  if (response) return response;

  const { id: rawId } = await params;
  const id = toInt(rawId);
  if (!id) return error('Invalid id', 400);

  const category = await prisma.permissionCategory.findUnique({
    where: { id },
    include: {
      permissions: true,
      _count: { select: { permissions: true } },
    },
  });
  if (!category) return error('Category not found', 404);
  return json({ category });
}

export async function PATCH(req, { params }) {
  const { response } = await requirePermission('MANAGE_ROLES');
  if (response) return response;

  const { id: rawId } = await params;
  const id = toInt(rawId);
  if (!id) return error('Invalid id', 400);

  const body = await parseBody(req);
  const data = {};
  for (const k of [
    'name',
    'code',
    'description',
    'icon',
    'color',
    'sortOrder',
    'isActive',
  ]) {
    if (body[k] !== undefined) {
      if (k === 'code') data[k] = String(body[k]).toUpperCase();
      else if (k === 'sortOrder') data[k] = Number(body[k]) || 0;
      else if (k === 'isActive') data[k] = !!body[k];
      else data[k] = body[k];
    }
  }

  try {
    const category = await prisma.permissionCategory.update({
      where: { id },
      data,
      include: { _count: { select: { permissions: true } } },
    });
    return json({ category });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') return error('Name or code already exists', 409);
      if (e.code === 'P2025') return error('Category not found', 404);
    }
    console.error('[PATCH /api/permission-categories/:id]', e);
    return error('Failed to update category', 500);
  }
}

export async function DELETE(_req, { params }) {
  const { response } = await requirePermission('MANAGE_ROLES');
  if (response) return response;

  const { id: rawId } = await params;
  const id = toInt(rawId);
  if (!id) return error('Invalid id', 400);

  try {
    // If you want deleting a category to also delete its permissions,
    // uncomment the block below. Otherwise the FK uses SetNull (from schema)
    // and permissions are detached but kept.
    //
    // await prisma.permission.deleteMany({ where: { categoryId: id } });

    await prisma.permissionCategory.delete({ where: { id } });
    return json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2025') return error('Category not found', 404);
      if (e.code === 'P2003')
        return error(
          'Cannot delete category: permissions still reference it',
          409
        );
    }
    console.error('[DELETE /api/permission-categories/:id]', e);
    return error('Failed to delete category', 500);
  }
}
