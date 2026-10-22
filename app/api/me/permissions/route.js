// app/api/me/permissions/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { resolveEffectivePermissions } from '@/lib/policy';
import { json, error } from '@/lib/api';

// Never cache — this endpoint must reflect the current DB state.
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return error('Unauthorized', 401);

  const { isSysAdmin, map } = await resolveEffectivePermissions(
    session.user.id
  );

  const permissions = {};
  for (const [name, entry] of map.entries()) {
    permissions[name] = {
      allowed: [...entry.allowed],
      denied: [...entry.denied],
    };
  }

  return json(
    { isSysAdmin, permissions },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
