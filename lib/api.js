// lib/api.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { can, resolveEffectivePermissions } from '@/lib/policy';

// ─── Primitive responses ──────────────────────────────────────
export function json(data, init = {}) {
  return NextResponse.json(data, init);
}

export function error(message, status = 400, extra = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

// ─── Request body helper ──────────────────────────────────────
export async function parseBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

// ─── Numeric parse helper ─────────────────────────────────────
export function toInt(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

// ─── SINGLE permission gate ──────────────────────────────────
export async function requirePermission(permission, resource = {}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    console.log('[requirePermission] no session', { permission });
    return { response: error('Unauthorized', 401) };
  }

  const allowed = await can(session.user.id, permission, resource);

  console.log('[requirePermission]', {
    userId: session.user.id,
    permission,
    allowed,
  });

  if (!allowed) {
    return { response: error('Forbidden', 403) };
  }

  return { session };
}

// ─── ANY-OF permission gate ──────────────────────────────────
// Passes when the caller has at least ONE of the listed permissions.
export async function requireAnyPermission(permissions) {
  if (!Array.isArray(permissions) || permissions.length === 0) {
    return {
      response: error(
        'Server misconfigured: requireAnyPermission called with empty permissions',
        500
      ),
    };
  }

  const session = await getServerSession(authOptions);

  console.log('[requireAnyPermission] SESSION', {
    hasSession: !!session,
    userId: session?.user?.id,
    email: session?.user?.email,
    requestedPermissions: permissions,
  });

  if (!session?.user?.id) {
    return { response: error('Unauthorized', 401) };
  }

  const { isSysAdmin, map } = await resolveEffectivePermissions(
    session.user.id
  );

  const resolved = permissions.map((p) => {
    const entry = map.get(p);
    return {
      permission: p,
      allowed: entry ? [...entry.allowed] : null,
      denied: entry ? [...entry.denied] : null,
    };
  });

  console.log('[requireAnyPermission] RESOLVED', {
    userId: session.user.id,
    isSysAdmin,
    resolvedPermissions: resolved,
    allPermissionKeys: [...map.keys()],
  });

  const results = await Promise.all(
    permissions.map((p) => can(session.user.id, p))
  );

  console.log('[requireAnyPermission] RESULTS', {
    userId: session.user.id,
    results,
  });

  if (!results.some(Boolean)) {
    return { response: error('Forbidden', 403) };
  }

  return { session };
}
