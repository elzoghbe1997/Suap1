import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppContext } from '../App.tsx';
import { AppContextType, TransactionType } from '../types.ts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { ArrowRightIcon, CostIcon, RevenueIcon, ExpenseIcon, ProfitIcon, ReportIcon } from './Icons.tsx';
import LoadingSpinner from './LoadingSpinner.tsx';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter.ts';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);

const AnimatedNumber: React.FC<{ value: number; formatter: (val: number) => string; }> = React.memo(({ value, formatter }) => {
    const count = useAnimatedCounter(value);
    return <>{formatter(count)}</>;
});

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color?: string; description?: string; formatter?: (val: number) => string; }> = React.memo(({ title, value, icon, color, description, formatter = formatCurrency }) => (
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

const GreenhouseReport: React.FC = () => {
    const { greenhouseId } = useParams<{ greenhouseId: string }>();
    const { loading, greenhouses, cropCycles, transactions, settings } = React.useContext(AppContext) as AppContextType;

    const greenhouse = React.useMemo(() => greenhouses.find(g => g.id === greenhouseId), [greenhouses, greenhouseId]);
    
    const reportData = React.useMemo(() => {
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

            if (settings.isFarmerSystemEnabled && cycle.farmerId && cycle.farmerSharePercentage) {
                const farmerShare = revenue * (cycle.farmerSharePercentage / 100);
                ownerProfit -= farmerShare;
            }

            return {
                name: cycle.name,
                "الربح": ownerProfit,
            };
        }).sort((a, b) => {
            const cycleA = cropCycles.find(c => c.name === a.name);
            const cycleB = cropCycles.find(c => c.name === b.name);
            if (!cycleA || !cycleB) return 0;
            return new Date(cycleA.startDate).getTime() - new Date(cycleB.startDate).getTime();
        });
        
        return { totalRevenue, totalExpense, ownerNetProfit, lifetimeProfit, roi, cyclePerformance };
    }, [greenhouse, cropCycles, transactions, settings.isFarmerSystemEnabled]);
    
    if (loading) {
        return <LoadingSpinner />;
    }

    if (!greenhouse || !reportData) {
        return (
            <div className="text-center p-8">
                <p className="text-xl text-slate-600 dark:text-slate-400">لم يتم العثور على الصوبة المطلوبة.</p>
                <Link to="/greenhouse" className="mt-4 inline-flex items-center text-green-600 hover:underline">
                    العودة إلى إدارة الصوب <ArrowRightIcon className="w-4 h-4 mr-2"/>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">تقرير الربحية: {greenhouse.name}</h1>
                    <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">تحليل استثماري شامل لأداء الصوبة منذ إنشائها.</p>
                </div>
                <Link to="/greenhouse" className="flex-shrink-0 inline-flex items-center px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md shadow-sm hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
                    <span>العودة</span>
                    <ArrowRightIcon className="w-5 h-5 mr-2" />
                </Link>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                 <StatCard title="عائد استثمار المالك (ROI)" value={reportData.roi} formatter={(v) => `${v === Infinity ? '∞' : v.toFixed(1)}%`} icon={<ReportIcon className="h-8 w-8 text-purple-500"/>} color="border-purple-500" description="صافي ربح المالك التشغيلي كنسبة من التكلفة التأسيسية." />
                 <StatCard title="صافي ربح المالك (مدى الحياة)" value={reportData.lifetimeProfit} icon={<ProfitIcon className="h-8 w-8 text-blue-500"/>} color={reportData.lifetimeProfit >= 0 ? "border-blue-500" : "border-orange-500"} description="ربح المالك بعد خصم التكلفة التأسيسية." />
                 <StatCard title="التكلفة التأسيسية" value={greenhouse.initialCost} icon={<CostIcon className="h-8 w-8 text-slate-500"/>} color="border-slate-500" />
                 <StatCard title="إجمالي الإيرادات" value={reportData.totalRevenue} icon={<RevenueIcon className="h-8 w-8 text-green-500"/>} color="border-green-500" />
                 <StatCard title="إجمالي المصروفات" value={reportData.totalExpense} icon={<ExpenseIcon className="h-8 w-8 text-red-500"/>} color="border-red-500" />
                 <StatCard title="صافي ربح المالك (تشغيلي)" value={reportData.ownerNetProfit} icon={<ProfitIcon className="h-8 w-8 text-teal-500"/>} color={reportData.ownerNetProfit >= 0 ? "border-teal-500" : "border-orange-500"} description="بعد خصم حصص المزارعين." />
            </div>

             <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 sm:p-6">
                <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">أداء العروات داخل الصوبة (ربحية المالك)</h2>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={reportData.cyclePerformance} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                        <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} angle={-25} textAnchor="end" height={80} />
                        <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(value) => new Intl.NumberFormat('en-US', {notation: 'compact'}).format(value as number)} />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', border: 'none', borderRadius: '0.5rem' }}
                            labelStyle={{ color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value) => formatCurrency(value as number)}
                        />
                        <Legend />
                        <Bar dataKey="الربح" name="صافي ربح المالك" radius={[4, 4, 0, 0]}>
                           {reportData.cyclePerformance.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.الربح >= 0 ? '#10B981' : '#EF4444'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default GreenhouseReport;