import React, { FC, memo, useMemo, useContext, ReactNode } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppContext } from '../App.tsx';
import { AppContextType, TransactionType } from '../types.ts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowRightIcon, CostIcon, RevenueIcon, ExpenseIcon, ProfitIcon } from './Icons.tsx';
import LoadingSpinner from './LoadingSpinner.tsx';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter.ts';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);

const AnimatedNumber: FC<{ value: number; formatter: (val: number) => string; }> = memo(({ value, formatter }) => {
    const count = useAnimatedCounter(value);
    return <>{formatter(count)}</>;
});

const StatCard: FC<{ title: string; value: number; icon: ReactNode; color?: string; description?: string; formatter?: (val: number) => string; }> = memo(({ title, value, icon, color, description, formatter = formatCurrency }) => (
    <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-md p-5 border-r-4 ${color || 'border-slate-300'}`}>
        <div className="flex items-center">
             <div className="flex-shrink-0">
                {icon}
            </div>
            <div className="mr-4">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{title}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                    <AnimatedNumber value={value} formatter={formatter} />
                </p>
            </div>
        </div>
        {description && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
    </div>
));

const GreenhouseReport: FC = () => {
    const { greenhouseId } = useParams<{ greenhouseId: string }>();
    const { loading, greenhouses, cropCycles, transactions, settings } = useContext(AppContext) as AppContextType;

    const greenhouse = useMemo(() => greenhouses.find(g => g.id === greenhouseId), [greenhouses, greenhouseId]);
    
    const reportData = useMemo(() => {
        if (!greenhouse) return null;
        
        const cyclesInGreenhouse = cropCycles.filter(c => c.greenhouseId === greenhouse.id);
        const cycleIds = new Set(cyclesInGreenhouse.map(c => c.id));
        const relevantTransactions = transactions.filter(t => cycleIds.has(t.cropCycleId));
        
        const totalRevenue = relevantTransactions.filter(t => t.type === TransactionType.REVENUE).reduce((s, t) => s + t.amount, 0);
        const totalExpense = relevantTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);
        const operationalProfit = totalRevenue - totalExpense;

        let totalFarmerShare = 0;
        if (settings.isFarmerSystemEnabled) {
            cyclesInGreenhouse.forEach(cycle => {
                if (cycle.farmerId && cycle.farmerSharePercentage) {
                    const cycleRevenue = relevantTransactions
                        .filter(t => t.cropCycleId === cycle.id && t.type === TransactionType.REVENUE)
                        .reduce((sum, t) => sum + t.amount, 0);
                    totalFarmerShare += cycleRevenue * (cycle.farmerSharePercentage / 100);
                }
            });
        }
    
        const ownerNetProfit = operationalProfit - totalFarmerShare;
        const lifetimeProfit = ownerNetProfit - greenhouse.initialCost;
        const roi = greenhouse.initialCost > 0 ? (ownerNetProfit / greenhouse.initialCost) * 100 : Infinity;
        
        const cyclePerformance = cyclesInGreenhouse.map(cycle => {
            const cycleTransactions = relevantTransactions.filter(t => t.cropCycleId === cycle.id);
            const revenue = cycleTransactions.filter(t => t.type === TransactionType.REVENUE).reduce((sum, t) => sum + t.amount, 0);
            const expense = cycleTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
            let ownerProfit = revenue - expense;

            // FIX: Completed the logic for calculating owner's profit by subtracting the farmer's share. This file was previously incomplete, causing a syntax error.
            if (settings.isFarmerSystemEnabled && cycle.farmerId && cycle.farmerSharePercentage) {
                const farmerShare = revenue * (cycle.farmerSharePercentage / 100);
                ownerProfit -= farmerShare;
            }

            return {
                name: cycle.name,
                "إيرادات": revenue,
                "مصروفات": expense,
                "صافي ربح المالك": ownerProfit,
            };
        });

        return {
            totalRevenue,
            totalExpense,
            ownerNetProfit,
            lifetimeProfit,
            roi,
            cyclePerformance,
        };
    }, [greenhouse, cropCycles, transactions, settings.isFarmerSystemEnabled]);
    
    if (loading) {
        return <LoadingSpinner />;
    }

    if (!greenhouse || !reportData) {
        return <div className="text-center p-8">لم يتم العثور على الصوبة.</div>;
    }

    const {
        ownerNetProfit,
        lifetimeProfit,
        cyclePerformance,
    } = reportData;

    return (
        <div className="space-y-8 animate-page-fade-in">
            <header>
                <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-2">
                    <Link to="/greenhouse" className="hover:underline">إدارة الصوبة</Link>
                    <ArrowRightIcon className="w-4 h-4 mx-2 transform scale-x-[-1]" />
                    <span>تقرير: {greenhouse.name}</span>
                </div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">تقرير شامل لـ: {greenhouse.name}</h1>
                <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">تحليل الأداء المالي والتاريخي للصوبة.</p>
            </header>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="التكلفة التأسيسية" value={greenhouse.initialCost} icon={<CostIcon className="h-8 w-8 text-amber-500" />} color="border-amber-500" />
                <StatCard title="إجمالي ربح المالك" value={ownerNetProfit} icon={<RevenueIcon className="h-8 w-8 text-emerald-500" />} color="border-emerald-500" description="من جميع العروات" />
                <StatCard title="الربح الصافي مدى الحياة" value={lifetimeProfit} icon={<ProfitIcon className={`h-8 w-8 ${lifetimeProfit >= 0 ? 'text-sky-500' : 'text-orange-500'}`} />} color={`${lifetimeProfit >= 0 ? 'border-sky-500' : 'border-orange-500'}`} description="بعد خصم التكلفة التأسيسية" />
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 sm:p-6">
                <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">أداء العروات في هذه الصوبة</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={cyclePerformance} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                        <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                        <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(value) => new Intl.NumberFormat('en-US', {notation: 'compact'}).format(value as number)} />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', border: 'none', borderRadius: '0.5rem' }} labelStyle={{ color: '#fff' }} itemStyle={{ color: '#fff' }} formatter={(value) => formatCurrency(value as number)} />
                        <Legend />
                        <Bar dataKey="إيرادات" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="مصروفات" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="صافي ربح المالك" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default GreenhouseReport;