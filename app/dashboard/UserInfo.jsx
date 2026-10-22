// app/dashboard/UserInfo.jsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import LogoutButton from './LogoutButton';

export default async function UserInfo() {
  const session = await getServerSession(authOptions);

  if (!session?.user) return null;

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-gray-600">{session.user.email}</span>
      <LogoutButton />
    </div>
  );
}
