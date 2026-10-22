// app/dashboard/DashboardStats.jsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export default async function DashboardStats() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return <p className="text-sm text-gray-500">Not signed in.</p>;
  }

  const [users, roles, perms] = await Promise.all([
    prisma.user.count(),
    prisma.role.count(),
    prisma.permission.count(),
  ]);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card label="Users" value={users} />
        <Card label="Roles" value={roles} />
        <Card label="Permissions" value={perms} />
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-medium mb-2">Your session</h2>
        <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
          {JSON.stringify(session.user, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function Card({ label, value }) {
  return (
    <div className="bg-white rounded shadow p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-3xl font-semibold">{value}</div>
    </div>
  );
}
