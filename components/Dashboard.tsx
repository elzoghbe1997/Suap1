import React from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../App.tsx';
import { AppContextType, Transaction, TransactionType, CropCycleStatus, CropCycle } from '../types.ts';
// FIX: Imported `Cell` from recharts to be used in the expense category BarChart.
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, Cell } from 'recharts';
import { RevenueIcon, ExpenseIcon, ProfitIcon, ActiveCycleIcon, AddIcon, InvoiceIcon, ReceiptIcon, CycleIcon, SparklesIcon, TrophyIcon, GreenhouseIcon, ReportIcon } from './Icons.tsx';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter.ts';
import DashboardSkeleton from './DashboardSkeleton.tsx';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);
};

const AnimatedNumber: React.FC<{ value: number; formatter: (val: number) => string; }> = React.memo(({ value, formatter }) => {
    const count = useAnimatedCounter(value);
    return <>{formatter(count)}</>;
});

type StatCardColor = 'emerald' | 'rose' | 'sky' | 'amber' | 'orange' | 'slate';
const colorMap: Record<StatCardColor, { hex: string; border: string }> = {
    emerald: { hex: '#10b981', border: 'border-emerald-500' },
    rose: { hex: '#f43f5e', border: 'border-rose-500' },
    sky: { hex: '#0ea5e9', border: 'border-sky-500' },
    amber: { hex: '#f59e0b', border: 'border-amber-500' },
    orange: { hex: '#f97316', border: 'border-orange-500' },
    slate: { hex: '#64748b', border: 'border-slate-500' },
};

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; colorName: StatCardColor; sparklineData?: { value: number }[] }> = React.memo(({ title, value, icon, colorName, sparklineData }) => {
    const theme = colorMap[colorName];

    return (
        <div className={`bg-white dark:bg-slate-800 rounded-lg shadow p-5 border-l-4 transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-105 ${theme.border}`}>
            <div className="flex items-center">
                 <div className="flex-shrink-0">
                    {icon}
                </div>
                <div className="mr-4">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{title}</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                        <AnimatedNumber value={value} formatter={title.includes('العروات') ? (v) => Math.round(v).toString() : formatCurrency} />
                    </p>
                </div>
            </div>
            {sparklineData && sparklineData.length > 1 && (
                 <div className="h-12 mt-2 -mb-2 -mx-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sparklineData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                             <defs>
                                <linearGradient id={`gradient-${theme.hex.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={theme.hex} stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor={theme.hex} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Tooltip content={<></>} />
                            <Area type="monotone" dataKey="value" stroke={theme.hex} strokeWidth={2} fillOpacity={1} fill={`url(#gradient-${theme.hex.replace('#','')})`} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    )
});


const HighlightCard: React.FC<{
    title: string;
    name: string;
    value: number;
    prefix: string;
    icon: React.ReactNode;
}> = React.memo(({ title, name, value, prefix, icon }) => (
    <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-4 flex items-center space-x-4 space-x-reverse border border-slate-200 dark:border-slate-700">
        <div className="flex-shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-lg font-semibold text-slate-800 dark:text-white truncate" title={name}>{name}</p>
            <p className="text-md font-bold text-slate-900 dark:text-slate-200">
                {prefix} <AnimatedNumber value={value} formatter={formatCurrency} />
            </p>
        </div>
    </div>
));


const QuickActionButton: React.FC<{ to: string; title: string; icon: React.ReactNode; color: string; state?: object; }> = React.memo(({ to, title, icon, color, state }) => (
    <Link to={to} state={state} className={`flex items-center p-4 rounded-lg shadow-sm transition-all duration-200 ease-in-out transform hover:-translate-y-1 ${color}`}>
        {icon}
        <span className="mr-3 font-semibold text-white">{title}</span>
    </Link>
));

const DashboardEmptyState: React.FC = React.memo(() => {
  return (
    <div className="text-center py-16 px-6 bg-white dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700">
      <SparklesIcon className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">مرحباً بك! لنبدأ العمل.</h2>
      <p className="mt-2 mb-8 max-w-2xl mx-auto text-lg text-slate-500 dark:text-slate-400">
        يبدو أنك لم تقم بإضافة أي بيانات بعد. ابدأ بإضافة أول صوبة وعروة لتتبع أرباحك.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/greenhouse" className="px-6 py-3 text-base font-semibold text-white bg-emerald-600 rounded-md shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors">
          + إضافة أول صوبة
        </Link>
        <Link to="/cycles" className="px-6 py-3 text-base font-semibold text-slate-800 dark:text-slate-200 bg-slate-200 dark:bg-slate-700 rounded-md shadow-sm hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-colors">
          + إضافة أول عروة
        </Link>
      </div>
    </div>
  );
});

const LastClosedCycleSummary: React.FC<{ cycle: CropCycle; stats: { revenue: number; expense: number; profit: number } }> = React.memo(({ cycle, stats }) => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-5 border-l-4 border-slate-500 animate-fadeInSlideUp">
            <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">ملخص آخر عروة مغلقة</h2>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{cycle.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{cycle.seedType}</p>
                </div>
                <Link 
                    to={`/cycles/${cycle.id}`}
                    className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-md shadow-sm hover:bg-emerald-700 transition-colors"
                >
                    <ReportIcon className="w-4 h-4 ml-2" />
                    <span>عرض التفاصيل الكاملة</span>
                </Link>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 mt-4 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">إجمالي الإيرادات</p>
                    <p className="text-lg font-semibold text-emerald-600">{formatCurrency(stats.revenue)}</p>
                </div>
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">إجمالي المصروفات</p>
                    <p className="text-lg font-semibold text-rose-600">{formatCurrency(stats.expense)}</p>
                </div>
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">صافي ربح المالك</p>
                    <p className={`text-lg font-semibold ${stats.profit >= 0 ? 'text-sky-600' : 'text-orange-500'}`}>{formatCurrency(stats.profit)}</p>
                </div>
            </div>
        </div>
    );
});


const ActiveDashboardEmptyState: React.FC = React.memo(() => {
  return (
    <div className="text-center py-16 px-6 bg-white dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700">
      <CycleIcon className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">لا توجد عروات نشطة حالياً</h2>
      <p className="mt-2 mb-8 max-w-2xl mx-auto text-lg text-slate-500 dark:text-slate-400">
        ابدأ عروة جديدة لتظهر إحصائياتها هنا في لوحة التحكم. يمكنك الاطلاع على بيانات العروات المغلقة والمؤرشفة من صفحات التقارير الخاصة بها.
      </p>
      <div className="flex justify-center">
        <Link to="/cycles" className="px-6 py-3 text-base font-semibold text-white bg-emerald-600 rounded-md shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors">
          + إضافة عروة جديدة
        </Link>
      </div>
    </div>
  );
});

const RecentTransactionRow = React.memo(({ t }: { t: Transaction }) => (
    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors duration-200">
        <td className="py-4 px-4 whitespace-nowrap">{t.date}</td>
        <td className="py-4 px-4 whitespace-nowrap">{t.description}</td>
        <td className="py-4 px-4 whitespace-nowrap">
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${t.type === TransactionType.REVENUE ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300'}`}>
                {t.type}
            </span>
        </td>
        <td className={`py-4 px-4 whitespace-nowrap font-medium ${t.type === TransactionType.REVENUE ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(t.amount)}</td>
    </tr>
));

const RecentTransactionCard: React.FC<{ t: Transaction }> = React.memo(({ t }) => (
    <div className="bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-lg flex justify-between items-center">
        <div>
            <p className="font-semibold text-slate-800 dark:text-white">{t.description}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t.date}</p>
        </div>
        <div className="text-left">
             <p className={`font-medium text-lg ${t.type === TransactionType.REVENUE ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(t.amount)}</p>
             <span className={`mt-1 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${t.type === TransactionType.REVENUE ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300'}`}>
                {t.type}
            </span>
        </div>
    </div>
));

const Dashboard: React.FC = () => {
    const { cropCycles, transactions, loading, settings, greenhouses } = React.useContext(AppContext) as AppContextType;

    const activeCycleIds = React.useMemo(() => 
        new Set(cropCycles.filter(c => c.status === CropCycleStatus.ACTIVE).map(c => c.id)), 
        [cropCycles]
    );

    const activeTransactions = React.useMemo(() => 
        transactions.filter(t => activeCycleIds.has(t.cropCycleId)),
        [transactions, activeCycleIds]
    );

    const { totalRevenue, totalExpenses, totalProfit, activeCyclesCount } = React.useMemo(() => {
        const totalRevenue = activeTransactions
            .filter(t => t.type === TransactionType.REVENUE)
            .reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = activeTransactions
            .filter(t => t.type === TransactionType.EXPENSE)
            .reduce((sum, t) => sum + t.amount, 0);
        const activeCyclesCount = activeCycleIds.size;

        let totalFarmerShare = 0;
        if (settings.isFarmerSystemEnabled) {
            cropCycles.forEach(cycle => {
                if (activeCycleIds.has(cycle.id) && cycle.farmerId && cycle.farmerSharePercentage) {
                    const cycleRevenue = activeTransactions
                        .filter(t => t.cropCycleId === cycle.id && t.type === TransactionType.REVENUE)
                        .reduce((sum, t) => sum + t.amount, 0);
                    totalFarmerShare += cycleRevenue * (cycle.farmerSharePercentage / 100);
                }
            });
        }

        return {
            totalRevenue,
            totalExpenses,
            totalProfit: totalRevenue - totalExpenses - totalFarmerShare,
            activeCyclesCount
        };
    }, [activeTransactions, cropCycles, settings.isFarmerSystemEnabled, activeCycleIds]);

    const sevenDaysSparklineData = React.useMemo(() => {
        const today = new Date();
        const dailyData: { [key: string]: { revenue: number; expense: number; profit: number } } = {};
        const dailyFarmerShare: { [key: string]: number } = {};

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const formattedDate = date.toISOString().split('T')[0];
            dailyData[formattedDate] = { revenue: 0, expense: 0, profit: 0 };
            dailyFarmerShare[formattedDate] = 0;
        }

        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6);
        const relevantTransactions = activeTransactions.filter(t => new Date(t.date) >= sevenDaysAgo);

        relevantTransactions.forEach(t => {
            const day = t.date;
            if (dailyData[day]) {
                if (t.type === TransactionType.REVENUE) {
                    dailyData[day].revenue += t.amount;
                    if (settings.isFarmerSystemEnabled) {
                        const cycle = cropCycles.find(c => c.id === t.cropCycleId);
                        if (cycle && cycle.farmerId && cycle.farmerSharePercentage) {
                            dailyFarmerShare[day] += t.amount * (cycle.farmerSharePercentage / 100);
                        }
                    }
                } else {
                    dailyData[day].expense += t.amount;
                }
            }
        });
        
        Object.keys(dailyData).forEach(date => {
            dailyData[date].profit = dailyData[date].revenue - dailyData[date].expense - dailyFarmerShare[date];
        });

        const revenue = Object.values(dailyData).map(d => ({ value: d.revenue }));
        const expense = Object.values(dailyData).map(d => ({ value: d.expense }));
        const profit = Object.values(dailyData).map(d => ({ value: d.profit }));

        return { revenue, expense, profit };
    }, [activeTransactions, cropCycles, settings.isFarmerSystemEnabled]);

    const monthlyData = React.useMemo(() => {
        const data: { [key: string]: { month: string; إيرادات: number; مصروفات: number } } = {};
        activeTransactions.forEach(t => {
            const month = new Date(t.date).toLocaleString('ar-EG', { month: 'short', year: 'numeric' });
            if (!data[month]) {
                data[month] = { month, إيرادات: 0, مصروفات: 0 };
            }
            if (t.type === TransactionType.REVENUE) {
                data[month].إيرادات += t.amount;
            } else {
                data[month].مصروفات += t.amount;
            }
        });
        return Object.values(data).reverse();
    }, [activeTransactions]);
    
    const expenseCategoryData = React.useMemo(() => {
        const data: { [key: string]: number } = {};
        activeTransactions
            .filter(t => t.type === TransactionType.EXPENSE)
            .forEach(t => {
                data[t.category] = (data[t.category] || 0) + t.amount;
            });
        return Object.entries(data)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [activeTransactions]);

    const kpis = React.useMemo(() => {
        if (loading || activeTransactions.length === 0) {
            return { starCycle: null, topGreenhouse: null, topExpense: null };
        }

        const activeCyclesList = cropCycles.filter(cycle => activeCycleIds.has(cycle.id));
        
        const cycleProfits = activeCyclesList.map(cycle => {
            const cycleTransactions = activeTransactions.filter(t => t.cropCycleId === cycle.id);
            const revenue = cycleTransactions.filter(t => t.type === TransactionType.REVENUE).reduce((sum, t) => sum + t.amount, 0);
            const expense = cycleTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
            let ownerProfit = revenue - expense;

            if (settings.isFarmerSystemEnabled && cycle.farmerId && cycle.farmerSharePercentage) {
                const farmerShare = revenue * (cycle.farmerSharePercentage / 100);
                ownerProfit -= farmerShare;
            }
            return { name: cycle.name, profit: ownerProfit };
        });
        const starCycle = cycleProfits.length > 0 ? cycleProfits.reduce((max, cycle) => cycle.profit > max.profit ? cycle : max, { name: '', profit: -Infinity }) : null;

        const greenhouseProfits = greenhouses.map(gh => {
            const ghCycles = activeCyclesList.filter(c => c.greenhouseId === gh.id);
            const ghCycleIds = new Set(ghCycles.map(c => c.id));
            const operationalProfit = activeTransactions
                .filter(t => ghCycleIds.has(t.cropCycleId))
                .reduce((profit, t) => profit + (t.type === TransactionType.REVENUE ? t.amount : -t.amount), 0);
            return { name: gh.name, profit: operationalProfit };
        });
        const topGreenhouse = greenhouseProfits.length > 0 ? greenhouseProfits.reduce((max, gh) => gh.profit > max.profit ? gh : max, { name: '', profit: -Infinity }) : null;
        
        const topExpense = expenseCategoryData.length > 0 ? expenseCategoryData[0] : null;

        return {
            starCycle: starCycle && starCycle.profit > 0 ? starCycle : null,
            topGreenhouse: topGreenhouse && topGreenhouse.profit > 0 ? topGreenhouse : null,
            topExpense: topExpense && topExpense.value > 0 ? topExpense : null,
        };
    }, [loading, activeTransactions, cropCycles, greenhouses, expenseCategoryData, settings.isFarmerSystemEnabled, activeCycleIds]);
    
    const lastClosedCycle = React.useMemo(() => {
        const closedCycles = cropCycles.filter(c => c.status === CropCycleStatus.CLOSED);
        if (closedCycles.length === 0) return null;

        const cyclesWithLastDate = closedCycles.map(cycle => {
            const cycleTransactions = transactions.filter(t => t.cropCycleId === cycle.id);
            if (cycleTransactions.length === 0) {
                return { cycle, lastDate: new Date(cycle.startDate).getTime() };
            }
            const lastDate = Math.max(...cycleTransactions.map(t => new Date(t.date).getTime()));
            return { cycle, lastDate };
        });

        cyclesWithLastDate.sort((a, b) => b.lastDate - a.lastDate);
        return cyclesWithLastDate[0].cycle;
    }, [cropCycles, transactions]);

    const lastClosedCycleStats = React.useMemo(() => {
        if (!lastClosedCycle) return null;

        const cycleTransactions = transactions.filter(t => t.cropCycleId === lastClosedCycle.id);
        const revenue = cycleTransactions.filter(t => t.type === TransactionType.REVENUE).reduce((sum, t) => sum + t.amount, 0);
        const expense = cycleTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
        
        let profit = revenue - expense;
        if (settings.isFarmerSystemEnabled && lastClosedCycle.farmerId && lastClosedCycle.farmerSharePercentage) {
            const farmerShare = revenue * (lastClosedCycle.farmerSharePercentage / 100);
            profit -= farmerShare;
        }

        return { revenue, expense, profit };
    }, [lastClosedCycle, transactions, settings.isFarmerSystemEnabled]);


    const COLORS = ['#10b981', '#0ea5e9', '#f97316', '#f43f5e', '#8b5cf6', '#f59e0b', '#6366f1'];
    
    // FIX: Replaced unstable hashing with a stable color map based on all available expense categories from settings.
    const categoryColorMap = React.useMemo(() => {
        const map = new Map<string, string>();
        settings.expenseCategories.forEach((category, index) => {
            map.set(category.name, COLORS[index % COLORS.length]);
        });
        return map;
    }, [settings.expenseCategories]);

    if (loading) {
        return <DashboardSkeleton />;
    }

    if (cropCycles.length === 0 && transactions.length === 0) {
        return <DashboardEmptyState />;
    }

    if (activeCycleIds.size === 0) {
         return (
            <div className="space-y-6">
                {lastClosedCycle && lastClosedCycleStats && (
                    <LastClosedCycleSummary cycle={lastClosedCycle} stats={lastClosedCycleStats} />
                )}
                <ActiveDashboardEmptyState />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="p-4 bg-sky-50 dark:bg-sky-900/20 border-l-4 border-sky-500 rounded-r-lg">
                <p className="text-sm text-sky-800 dark:text-sky-200">
                    <strong>ملاحظة:</strong> جميع الأرقام والرسوم البيانية في لوحة التحكم تعكس أداء <strong>العروات النشطة</strong> فقط.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard title="إجمالي الإيرادات" value={totalRevenue} icon={<RevenueIcon className="h-8 w-8 text-emerald-500"/>} colorName="emerald" sparklineData={sevenDaysSparklineData.revenue} />
                <StatCard title="إجمالي المصروفات" value={totalExpenses} icon={<ExpenseIcon className="h-8 w-8 text-rose-500"/>} colorName="rose" sparklineData={sevenDaysSparklineData.expense} />
                <StatCard title="صافي ربح المالك" value={totalProfit} icon={<ProfitIcon className="h-8 w-8 text-sky-500"/>} colorName={totalProfit >= 0 ? "sky" : "orange"} sparklineData={sevenDaysSparklineData.profit} />
                <StatCard title="العروات النشطة" value={activeCyclesCount} icon={<ActiveCycleIcon className="h-8 w-8 text-amber-500"/>} colorName="amber" />
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 sm:p-6 border border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">إجراءات سريعة</h2>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <QuickActionButton to="/cycles" title="إضافة عروة" icon={<CycleIcon className="w-6 h-6 text-white"/>} color="bg-emerald-500 hover:bg-emerald-600" state={{ action: 'add-cycle' }}/>
                    <QuickActionButton to="/invoices" title="إضافة فاتورة" icon={<InvoiceIcon className="w-6 h-6 text-white"/>} color="bg-sky-500 hover:bg-sky-600" state={{ action: 'add-invoice' }} />
                    <QuickActionButton to="/expenses" title="إضافة مصروف" icon={<ReceiptIcon className="w-6 h-6 text-white"/>} color="bg-rose-500 hover:bg-rose-600" state={{ action: 'add-expense' }} />
                    {settings.isFarmerSystemEnabled && <QuickActionButton to="/farmer-accounts" title="إضافة سحب" icon={<ExpenseIcon className="w-6 h-6 text-white"/>} color="bg-indigo-500 hover:bg-indigo-600" state={{ action: 'add-withdrawal' }} />}
                </div>
            </div>

            {(kpis.starCycle || kpis.topGreenhouse || kpis.topExpense) && (
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">أبرز مؤشرات الأداء (للعروات النشطة)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {kpis.starCycle && (
                            <HighlightCard
                                title="العروة النجمة (للمالك)"
                                name={kpis.starCycle.name}
                                value={kpis.starCycle.profit}
                                prefix="ربح"
                                icon={<div className="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-full"><TrophyIcon className="w-7 h-7 text-yellow-500" /></div>}
                            />
                        )}
                        {kpis.topGreenhouse && (
                            <HighlightCard
                                title="الصوبة الأكثر ربحية"
                                name={kpis.topGreenhouse.name}
                                value={kpis.topGreenhouse.profit}
                                prefix="ربح تشغيلي"
                                icon={<div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-full"><GreenhouseIcon className="w-7 h-7 text-emerald-500" /></div>}
                            />
                        )}
                        {kpis.topExpense && (
                             <HighlightCard
                                title="أعلى فئة مصروفات"
                                name={kpis.topExpense.name}
                                value={kpis.topExpense.value}
                                prefix="إنفاق"
                                icon={<div className="p-3 bg-rose-100 dark:bg-rose-900/50 rounded-full"><ExpenseIcon className="w-7 h-7 text-rose-500" /></div>}
                            />
                        )}
                    </div>
                </div>
            )}


            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-lg shadow p-4 sm:p-6 border border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">الأداء الشهري</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                            <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => new Intl.NumberFormat('en-US', {notation: 'compact'}).format(value as number)} />
                            <Tooltip contentStyle={{backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '0.5rem'}} labelStyle={{color: '#fff'}} itemStyle={{color: '#fff'}} formatter={(value) => formatCurrency(value as number)} />
                            <Legend />
                            <Bar dataKey="إيرادات" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="مصروفات" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg shadow p-4 sm:p-6 border border-slate-200 dark:border-slate-700">
                     <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">تصنيفات المصروفات</h2>
                     <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={expenseCategoryData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                            <XAxis type="number" stroke="#94a3b8" fontSize={12} tickFormatter={(value) => new Intl.NumberFormat('en-US', {notation: 'compact'}).format(value as number)} />
                            <YAxis dataKey="name" type="category" width={110} stroke="#94a3b8" fontSize={12} />
                            <Tooltip
                                contentStyle={{backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '0.5rem'}}
                                labelStyle={{color: '#fff'}} itemStyle={{color: '#fff'}}
                                formatter={(value) => formatCurrency(value as number)}
                            />
                            <Bar dataKey="value" name="المبلغ" barSize={20} radius={[0, 4, 4, 0]}>
                                {expenseCategoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={categoryColorMap.get(entry.name) || COLORS[5]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-semibold p-4 sm:p-6 text-slate-800 dark:text-white">أحدث المعاملات (لكل العروات)</h2>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="py-3 px-4 text-right font-medium text-slate-500 dark:text-slate-300">التاريخ</th>
                                <th className="py-3 px-4 text-right font-medium text-slate-500 dark:text-slate-300">الوصف</th>
                                <th className="py-3 px-4 text-right font-medium text-slate-500 dark:text-slate-300">النوع</th>
                                <th className="py-3 px-4 text-right font-medium text-slate-500 dark:text-slate-300">المبلغ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {transactions.slice(0, 5).map(t => (
                               <RecentTransactionRow key={t.id} t={t} />
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden p-4 space-y-3">
                     {transactions.slice(0, 5).map(t => (
                        <RecentTransactionCard key={t.id} t={t} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;