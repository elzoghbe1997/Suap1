import React from 'react';

const DashboardSkeleton: React.FC = () => (
    <div className="space-y-6">
        {/* Stat Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="h-28 bg-slate-200 dark:bg-slate-700 rounded-lg skeleton-shimmer"></div>
            <div className="h-28 bg-slate-200 dark:bg-slate-700 rounded-lg skeleton-shimmer"></div>
            <div className="h-28 bg-slate-200 dark:bg-slate-700 rounded-lg skeleton-shimmer"></div>
            <div className="h-28 bg-slate-200 dark:bg-slate-700 rounded-lg skeleton-shimmer"></div>
        </div>
        
        {/* Quick Actions Skeleton */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 sm:p-6 skeleton-shimmer">
            <div className="h-6 w-1/4 bg-slate-200 dark:bg-slate-700 rounded-md mb-4"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="h-14 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                <div className="h-14 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                <div className="h-14 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                <div className="h-14 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            </div>
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-lg shadow p-4 sm:p-6 skeleton-shimmer">
                <div className="h-6 w-1/3 bg-slate-200 dark:bg-slate-700 rounded-md mb-4"></div>
                <div className="h-[300px] bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            </div>
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg shadow p-4 sm:p-6 skeleton-shimmer">
                <div className="h-6 w-1/2 bg-slate-200 dark:bg-slate-700 rounded-md mb-4"></div>
                <div className="h-[300px] bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            </div>
        </div>

        {/* Recent Transactions Skeleton */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow skeleton-shimmer">
            <div className="p-4 sm:p-6">
                <div className="h-6 w-1/4 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/6"></div>
                        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-2/5"></div>
                        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/6"></div>
                        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/6"></div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default DashboardSkeleton;