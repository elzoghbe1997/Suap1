import React from 'react';
import { AppContext } from '../../App';
import { AppContextType, CropCycle, TransactionType } from '../../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { RevenueIcon, ExpenseIcon, ProfitIcon, YieldIcon } from '../Icons';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);

const ReportStatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <div className="bg-slate-100 dark:bg-slate-700/50 rounded-lg p-4">
        <div className="flex items-center">
            {icon}
            <div className="mr-3">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-200">{value}</p>
            </div>
        </div>
    </div>
);

const OverviewTab: React.FC<{ cycle: CropCycle }> = ({ cycle }) => {
    const { transactions, settings } = React.useContext(AppContext) as AppContextType;

    const { revenue, expense, ownerNetProfit, expenseCategoryData, totalYield } = React.useMemo(() => {
        const cycleTransactions = transactions.filter(t => t.cropCycleId === cycle.id);
        const revenue = cycleTransactions.filter(t => t.type === TransactionType.REVENUE).reduce((sum, t) => sum + t.amount, 0);
        const expense = cycleTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
        const totalYield = cycleTransactions.filter(t => t.type === TransactionType.REVENUE).reduce((sum, t) => sum + (t.quantity || 0), 0);
        const operationalProfit = revenue - expense;
        let farmerShare = 0;
        if (settings.isFarmerSystemEnabled && cycle.farmerId && cycle.farmerSharePercentage) {
            farmerShare = revenue * (cycle.farmerSharePercentage / 100);
        }
        const ownerNetProfit = operationalProfit - farmerShare;
        const expenseData: { [key: string]: number } = {};
        cycleTransactions.filter(t => t.type === TransactionType.EXPENSE).forEach(t => {
            expenseData[t.category] = (expenseData[t.category] || 0) + t.amount;
        });
        const expenseCategoryData = Object.entries(expenseData).map(([name, value]) => ({ name, value }));
        return { revenue, expense, ownerNetProfit, expenseCategoryData, totalYield };
    }, [transactions, cycle, settings]);
    
    const profitMargin = revenue > 0 ? (ownerNetProfit / revenue) * 100 : 0;
    
    const COLORS = ['#10b981', '#0ea5e9', '#f97316', '#f43f5e', '#8b5cf6', '#f59e0b', '#6366f1'];
    
    return (
        <div className="space-y-6 animate-fadeInSlideUp">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <ReportStatCard title="إجمالي الإيرادات" value={formatCurrency(revenue)} icon={<RevenueIcon className="w-7 h-7 text-emerald-500" />} />
               <ReportStatCard title="إجمالي المصروفات" value={formatCurrency(expense)} icon={<ExpenseIcon className="w-7 h-7 text-rose-500" />} />
               <ReportStatCard title="صافي ربح المالك" value={formatCurrency(ownerNetProfit)} icon={<ProfitIcon className={`w-7 h-7 ${ownerNetProfit >= 0 ? 'text-sky-500' : 'text-orange-500'}`} />} />
            </div>
            
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold mb-3">تحليل الإنتاج والربحية</h3>
                    <div className="space-y-3">
                        <ReportStatCard title="هامش ربح المالك" value={`${profitMargin.toFixed(1)}%`} icon={<ProfitIcon className="w-7 h-7 text-sky-500" />} />
                        <ReportStatCard title="إجمالي الإنتاج (ك.ج)" value={`${totalYield.toLocaleString('en-US')} ك.ج`} icon={<YieldIcon className="w-7 h-7 text-teal-500" />} />
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold mb-3">تحليل المصروفات</h3>
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
        </div>
    );
};

export default OverviewTab;
