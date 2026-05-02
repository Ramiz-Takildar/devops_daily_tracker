import { motion } from 'framer-motion';

export const CardSkeleton = ({ className = '' }) => (
  <div className={`card p-6 ${className}`}>
    <div className="animate-pulse space-y-4">
      <div className="h-4 w-1/3 rounded bg-[color:var(--surface-soft)]" />
      <div className="h-8 w-2/3 rounded bg-[color:var(--surface-soft)]" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-[color:var(--surface-soft)]" />
        <div className="h-3 w-5/6 rounded bg-[color:var(--surface-soft)]" />
      </div>
    </div>
  </div>
);

export const StatCardSkeleton = () => (
  <div className="stat-card">
    <div className="animate-pulse space-y-4">
      <div className="flex items-start justify-between">
        <div className="h-12 w-12 rounded-3xl bg-[color:var(--surface-soft)]" />
        <div className="h-6 w-16 rounded-full bg-[color:var(--surface-soft)]" />
      </div>
      <div className="h-10 w-24 rounded bg-[color:var(--surface-soft)]" />
      <div className="h-4 w-32 rounded bg-[color:var(--surface-soft)]" />
    </div>
  </div>
);

export const ChartSkeleton = ({ height = 'h-80' }) => (
  <div className={`card p-6 ${height}`}>
    <div className="animate-pulse space-y-4">
      <div className="h-6 w-1/4 rounded bg-[color:var(--surface-soft)]" />
      <div className="flex h-full items-end justify-between gap-2 pt-4">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="w-full rounded-t bg-[color:var(--surface-soft)]"
            style={{ height: `${Math.random() * 60 + 40}%` }}
          />
        ))}
      </div>
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="card overflow-hidden">
    <div className="animate-pulse">
      <div className="border-b border-theme p-4">
        <div className="h-6 w-1/4 rounded bg-[color:var(--surface-soft)]" />
      </div>
      <div className="divide-y divide-theme">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <div className="h-10 w-10 rounded-full bg-[color:var(--surface-soft)]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded bg-[color:var(--surface-soft)]" />
              <div className="h-3 w-1/2 rounded bg-[color:var(--surface-soft)]" />
            </div>
            <div className="h-8 w-20 rounded bg-[color:var(--surface-soft)]" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const PageHeaderSkeleton = () => (
  <section className="card p-6 md:p-8">
    <div className="animate-pulse space-y-4">
      <div className="h-6 w-48 rounded-full bg-[color:var(--surface-soft)]" />
      <div className="h-12 w-3/4 rounded bg-[color:var(--surface-soft)]" />
      <div className="h-4 w-full max-w-2xl rounded bg-[color:var(--surface-soft)]" />
    </div>
  </section>
);

export const ToolCardSkeleton = () => (
  <div className="card p-5">
    <div className="animate-pulse space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-3xl bg-[color:var(--surface-soft)]" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 rounded bg-[color:var(--surface-soft)]" />
          <div className="h-3 w-32 rounded bg-[color:var(--surface-soft)]" />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div className="h-8 w-16 rounded bg-[color:var(--surface-soft)]" />
        <div className="h-4 w-12 rounded bg-[color:var(--surface-soft)]" />
      </div>
      <div className="h-2 w-full rounded-full bg-[color:var(--surface-soft)]" />
    </div>
  </div>
);

export default {
  CardSkeleton,
  StatCardSkeleton,
  ChartSkeleton,
  TableSkeleton,
  PageHeaderSkeleton,
  ToolCardSkeleton,
};
