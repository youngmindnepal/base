// app/api/me/password/route.js
import { prisma } from '@/lib/prisma';
import { requireSession, parseBody, json, error } from '@/lib/api';
import { verifyPassword, hashPassword } from '@/lib/auth';

export async function POST(req) {
  const { session, response } = await requireSession();
  if (response) return response;

  const { currentPassword, newPassword } = await parseBody(req);
  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return error('currentPassword and newPassword (>=8) required');
  }

  const user = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
  });
  if (!user) return error('Not found', 404);

  const ok = await verifyPassword(currentPassword, user.password);
  if (!ok) return error('Current password is incorrect', 400);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: await hashPassword(newPassword),
      mustChangePassword: false,
    },
  });

  return json({ ok: true });
}
