import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppContext } from '../App';
import { AppContextType, TransactionType } from '../types';
import { ArrowRightIcon, TreasuryIcon, RevenueIcon, ExpenseIcon, FarmerIcon, AdvanceIcon, SupplierIcon } from './Icons';
import LoadingSpinner from './LoadingSpinner';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string; }> = ({ title, value, icon, color }) => (
    <div className={`bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg flex items-center border-r-4 ${color}`}>
        <div className="flex-shrink-0">{icon}</div>
        <div className="mr-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{formatCurrency(value)}</p>
        </div>
    </div>
);

const SummaryListItem: React.FC<{ label: string; value: number; color?: string; icon: React.ReactNode }> = ({ label, value, color = 'text-rose-600 dark:text-rose-400', icon }) => (
    <li className="flex items-center justify-between py-3">
        <div className="flex items-center">
            <span className="ml-3">{icon}</span>
            <span className="text-slate-600 dark:text-slate-300">{label}</span>
        </div>
        <span className={`font-bold text-md ${color}`}>{formatCurrency(value)}</span>
    </li>
);


const TreasuryDetailsPage: React.FC = () => {
    const { cropCycleId } = useParams<{ cropCycleId: string }>();
    const { loading, cropCycles, transactions, settings, farmerWithdrawals, advances, farmers, suppliers } = React.useContext(AppContext) as AppContextType;

    const cycle = React.useMemo(() => cropCycles.find(c => c.id === cropCycleId), [cropCycles, cropCycleId]);
    const farmer = React.useMemo(() => {
        if (!cycle || !cycle.farmerId) return null;
        return farmers.find(f => f.id === cycle.farmerId);
    }, [cycle, farmers]);

    const {
        revenue,
        treasuryBalance,
        operationalExpensesTotal,
        totalWithdrawals,
        expensesByCategory,
        expensesBySupplier,
        totalAdvances
    } = React.useMemo(() => {
        if (!cycle) return { revenue: 0, treasuryBalance: 0, operationalExpensesTotal: 0, totalWithdrawals: 0, expensesByCategory: {}, expensesBySupplier: {}, totalAdvances: 0 };

        const cycleTransactions = transactions.filter(t => t.cropCycleId === cycle.id);
        const revenue = cycleTransactions.filter(t => t.type === TransactionType.REVENUE).reduce((sum, t) => sum + t.amount, 0);
        
        const foundationalCategories = new Set(settings.expenseCategories.filter(c => c.isFoundational).map(c => c.name));
        const operationalExpenseTransactions = cycleTransactions.filter(t => t.type === TransactionType.EXPENSE && !foundationalCategories.has(t.category));
        const operationalExpensesTotal = operationalExpenseTransactions.reduce((sum, t) => sum + t.amount, 0);
        
        const cycleWithdrawals = farmerWithdrawals.filter(w => w.cropCycleId === cycle.id);
        const totalWithdrawals = cycleWithdrawals.reduce((sum, w) => sum + w.amount, 0);

        const treasuryBalance = revenue - operationalExpensesTotal - totalWithdrawals;
        const totalAdvances = advances.reduce((sum, a) => sum + a.amount, 0);

        const expensesWithSupplier = operationalExpenseTransactions.filter(t => t.supplierId);
        const expensesWithoutSupplier = operationalExpenseTransactions.filter(t => !t.supplierId);

        const expensesBySupplier = expensesWithSupplier.reduce((acc, t) => {
            const supplierName = suppliers.find(s => s.id === t.supplierId)?.name || 'مورد غير معروف';
            acc[supplierName] = (acc[supplierName] || 0) + t.amount;
            return acc;
        }, {} as { [key: string]: number });

        const expensesByCategory = expensesWithoutSupplier.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {} as { [key: string]: number });


        return { revenue, treasuryBalance, operationalExpensesTotal, totalWithdrawals, expensesByCategory, expensesBySupplier, totalAdvances };
    }, [transactions, cycle, settings.expenseCategories, farmerWithdrawals, advances, suppliers]);

    if (loading) return <LoadingSpinner />;
    if (!cycle) return <div className="text-center p-8">لم يتم العثور على العروة.</div>;

    const cycleDeductionsExist = totalWithdrawals > 0 || Object.keys(expensesByCategory).length > 0 || Object.keys(expensesBySupplier).length > 0;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-page-fade-in">
            <header>
                <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-2">
                    <Link to="/treasury" className="hover:underline">الخزنة</Link>
                    <ArrowRightIcon className="w-4 h-4 mx-2 transform scale-x-[-1]" />
                    <span>{cycle.name}</span>
                </div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">صندوق العروة: {cycle.name}</h1>
            </header>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border-l-4 border-sky-500">
                <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-slate-800 dark:text-white">الرصيد الفعلي المتاح</span>
                    <span className={`text-3xl font-bold ${treasuryBalance >= 0 ? 'text-sky-600 dark:text-sky-400' : 'text-orange-500'}`}>
                        {formatCurrency(treasuryBalance)}
                    </span>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard title="إجمالي الإيرادات" value={revenue} icon={<RevenueIcon className="h-6 w-6 text-emerald-500"/>} color="border-emerald-500" />
                <StatCard title="إجمالي المصروفات التشغيلية" value={operationalExpensesTotal} icon={<ExpenseIcon className="h-6 w-6 text-rose-500"/>} color="border-rose-500" />
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white p-6 border-b border-slate-200 dark:border-slate-700">ملخص الخصومات</h2>
                
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">خصومات خاصة بالعروة</h3>
                    {cycleDeductionsExist ? (
                        <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                            {totalWithdrawals > 0 && farmer && (
                                <SummaryListItem 
                                    label={`سحوبات المزارع (${farmer.name})`} 
                                    value={totalWithdrawals} 
                                    color="text-indigo-600 dark:text-indigo-400"
                                    icon={<FarmerIcon className="w-5 h-5 text-indigo-500"/>}
                                />
                            )}
                            
                            {Object.entries(expensesByCategory).map(([category, amount]) => (
                                <SummaryListItem 
                                    key={category} 
                                    label={category} 
                                    value={amount}
                                    icon={<ExpenseIcon className="w-5 h-5 text-rose-500" />}
                                />
                            ))}

                            {Object.entries(expensesBySupplier).map(([supplier, amount]) => (
                                <SummaryListItem 
                                    key={supplier} 
                                    label={`مورد: ${supplier}`} 
                                    value={amount}
                                    icon={<SupplierIcon className="w-5 h-5 text-blue-500" />}
                                />
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400 py-4">لا توجد خصومات مسجلة لهذه العروة.</p>
                    )}
                </div>

                {advances.length > 0 && (
                    <div className="p-6 border-t border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">خصم السلف من الخزنة العامة</h3>
                        <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                            {advances.map(advance => (
                                <SummaryListItem 
                                    key={advance.id} 
                                    label={advance.description} 
                                    value={advance.amount} 
                                    color="text-yellow-600 dark:text-yellow-400"
                                    icon={<AdvanceIcon className="w-5 h-5 text-yellow-500" />}
                                />
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TreasuryDetailsPage;