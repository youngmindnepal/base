// app/dashboard/page.jsx
import { Suspense } from 'react';
import DashboardStats from './DashboardStats';

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-4">Overview</h1>
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats />
      </Suspense>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 h-32 shadow-[0_1px_0_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.06)] animate-pulse" />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 h-24 shadow-[0_1px_0_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.06)] animate-pulse" />
  );
}
