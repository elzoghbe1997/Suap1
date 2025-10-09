import React from 'react';

const SkeletonCard: React.FC = () => {
    return (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-md skeleton-shimmer">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3"></div>
                    <div className="space-y-2">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                    </div>
                </div>
                <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            </div>
            <div className="grid grid-cols-3 gap-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
             <div className="flex justify-between items-center mt-4">
                <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            </div>
        </div>
    );
};

export default SkeletonCard;