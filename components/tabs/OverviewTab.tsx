import React from 'react';
import { AppContext } from '../../App';
import { AppContextType, CropCycle, TransactionType } from '../../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { RevenueIcon, ExpenseIcon, ProfitIcon, YieldIcon, PlantIcon, PercentIcon, DailyProductionIcon } from '../Icons';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);

const KPICard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string; }> = ({ title, value, icon, color }) => (
    <div className={`bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md flex items-start border-l-4 ${color}`}>
        <div className="flex-shrink-0">{icon}</div>
        <div className="mr-3">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{value}</p>
        </div>
    </div>
);

const ProfitabilityAnalysis: React.FC<{ revenue: number, expense: number }> = ({ revenue, expense }) => {
    const [isAnimated, setIsAnimated] = React.useState(false);

    React.useEffect(() => {
        const timer = setTimeout(() => setIsAnimated(true), 100);
        return () => clearTimeout(timer);
    }, []);
    
    const maxAmount = Math.max(revenue, expense, 1); // Use 1 to prevent division by zero
    const revenueWidth = (revenue / maxAmount) * 100;
    const expenseWidth = (expense / maxAmount) * 100;
    
    const netResult = revenue - expense;

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md space-y-5">
            <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-slate-600 dark:text-slate-300">إجمالي الإيرادات</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(revenue)}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                    <div
                        className="bg-emerald-500 h-3 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: isAnimated ? `${revenueWidth}%` : '0%' }}
                        role="progressbar"
                        aria-label="Revenue progress"
                        aria-valuenow={revenue}
                        aria-valuemax={maxAmount}
                    ></div>
                </div>
            </div>

            <div className="space-y-2">
                 <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-slate-600 dark:text-slate-300">إجمالي المصروفات</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">{formatCurrency(expense)}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                    <div
                        className="bg-rose-500 h-3 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: isAnimated ? `${expenseWidth}%` : '0%' }}
                        role="progressbar"
                        aria-label="Expense progress"
                        aria-valuenow={expense}
                        aria-valuemax={maxAmount}
                    ></div>
                </div>
            </div>

            <div className={`mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-center`}>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {netResult >= 0 ? 'صافي الربح التشغيلي' : 'صافي الخسارة التشغيلية'}
                </p>
                <p className={`text-2xl font-bold ${netResult >= 0 ? 'text-sky-600 dark:text-sky-400' : 'text-orange-500'}`}>
                    {formatCurrency(netResult)}
                </p>
            </div>
        </div>
    );
};


const ReportStatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <div className="bg-slate-100 dark:bg-slate-700/50 rounded-lg p-4 text-center">
        <div className="flex justify-center mb-2">{icon}</div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{value}</p>
    </div>
);

const OverviewTab: React.FC<{ cycle: CropCycle }> = ({ cycle }) => {
    const { transactions, settings } = React.useContext(AppContext) as AppContextType;

    const memoizedData = React.useMemo(() => {
        const cycleTransactions = transactions.filter(t => t.cropCycleId === cycle.id);
        const revenue = cycleTransactions.filter(t => t.type === TransactionType.REVENUE).reduce((sum, t) => sum + t.amount, 0);
        
        const expenseData: { [key: string]: number } = {};
        cycleTransactions.filter(t => t.type === TransactionType.EXPENSE).forEach(t => {
            expenseData[t.category] = (expenseData[t.category] || 0) + t.amount;
        });
        
        const totalExpenses = Object.values(expenseData).reduce((sum, amount) => sum + amount, 0);
        
        let farmerShare = 0;
        if (settings.isFarmerSystemEnabled && cycle.farmerId && cycle.farmerSharePercentage) {
            farmerShare = revenue * (cycle.farmerSharePercentage / 100);
        }
        
        const ownerNetProfit = revenue - totalExpenses - farmerShare;

        const expenseCategoryData = Object.entries(expenseData).map(([name, value]) => ({ name, value }));
        
        const totalYield = cycleTransactions.filter(t => t.type === TransactionType.REVENUE).reduce((sum, t) => sum + (t.quantity || 0), 0);

        const roi = totalExpenses > 0 ? (ownerNetProfit / totalExpenses) * 100 : 0;
        
        let dailyProduction = 0;
        if (cycle.productionStartDate) {
            const startDate = new Date(cycle.productionStartDate);
            const today = new Date();
            if (today > startDate) {
                const diffTime = Math.abs(today.getTime() - startDate.getTime());
                const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                dailyProduction = totalYield / diffDays;
            }
        }

        return { 
            revenue, 
            totalExpenses, 
            ownerNetProfit, 
            expenseCategoryData, 
            totalYield,
            roi,
            dailyProduction
        };
    }, [transactions, cycle, settings]);

    const { 
        revenue, 
        totalExpenses,
        ownerNetProfit, 
        expenseCategoryData, 
        totalYield,
        roi,
        dailyProduction
    } = memoizedData;
    
    const productionPerPlant = cycle.plantCount > 0 ? (totalYield / cycle.plantCount) : 0;
    const revenuePerPlant = cycle.plantCount > 0 ? (revenue / cycle.plantCount) : 0;
    const costPerPlant = cycle.plantCount > 0 ? (totalExpenses / cycle.plantCount) : 0;
    const profitPerPlant = cycle.plantCount > 0 ? (ownerNetProfit / cycle.plantCount) : 0;

    const COLORS = ['#10b981', '#0ea5e9', '#f97316', '#f43f5e', '#8b5cf6', '#f59e0b', '#6366f1'];
    
    return (
        <div className="space-y-8 animate-fadeInSlideUp">
            
            <div>
                <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">مؤشرات الأداء الرئيسية (KPIs)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                   <KPICard title="صافي ربح المالك" value={formatCurrency(ownerNetProfit)} icon={<ProfitIcon className={`w-8 h-8 ${ownerNetProfit >= 0 ? 'text-sky-500' : 'text-orange-500'}`} />} color={`${ownerNetProfit >= 0 ? 'border-sky-500' : 'border-orange-500'}`} />
                   <KPICard title="العائد على الاستثمار" value={`${roi === Infinity ? '∞' : roi.toFixed(1)}%`} icon={<PercentIcon className="w-8 h-8 text-purple-500" />} color="border-purple-500" />
                   <KPICard title="متوسط الإنتاج اليومي" value={`${dailyProduction.toFixed(1)} ك.ج`} icon={<DailyProductionIcon className="w-8 h-8 text-teal-500" />} color="border-teal-500" />
                </div>
            </div>

             <div>
                <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">تحليل الربحية: الإيرادات مقابل المصروفات</h3>
                <ProfitabilityAnalysis revenue={revenue} expense={totalExpenses} />
            </div>

            <div>
                <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">تحليل كفاءة النبات</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                   <ReportStatCard title="إجمالي الإنتاج" value={`${totalYield.toLocaleString()} ك.ج`} icon={<YieldIcon className="w-7 h-7 text-teal-500" />} />
                   {cycle.plantCount > 0 && (
                       <>
                           <ReportStatCard title="إنتاج النبات الواحد" value={`${productionPerPlant.toFixed(2)} ك.ج`} icon={<PlantIcon className="w-7 h-7 text-lime-500" />} />
                           <ReportStatCard title="إيراد النبات الواحد" value={formatCurrency(revenuePerPlant)} icon={<RevenueIcon className="w-7 h-7 text-emerald-500" />} />
                           <ReportStatCard title="تكلفة النبات الواحد" value={formatCurrency(costPerPlant)} icon={<ExpenseIcon className="w-7 h-7 text-rose-500" />} />
                           <ReportStatCard title="ربح النبات الواحد" value={formatCurrency(profitPerPlant)} icon={<ProfitIcon className={`w-7 h-7 ${profitPerPlant >= 0 ? 'text-sky-500' : 'text-orange-500'}`} />} />
                       </>
                   )}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-white">تفاصيل المصروفات</h3>
                {expenseCategoryData.length > 0 ? (
                     <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie data={expenseCategoryData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                                {expenseCategoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(value, name) => [formatCurrency(value as number), name]} contentStyle={{backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '0.5rem'}}/>
                        </PieChart>
                    </ResponsiveContainer>
                ) : <p className="text-center text-slate-500 dark:text-slate-400 py-8">لا توجد مصروفات مسجلة.</p>}
            </div>

        </div>
    );
};

export default OverviewTab;