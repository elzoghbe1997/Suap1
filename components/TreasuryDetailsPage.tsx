import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppContext } from '../App';
import { AppContextType, TransactionType } from '../types';
import { ArrowRightIcon, TreasuryIcon, RevenueIcon, ExpenseIcon, FarmerIcon, AdvanceIcon, SupplierIcon, ChevronDownIcon } from './Icons';
import LoadingSpinner from './LoadingSpinner';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);

const CollapsibleDeductionCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  total: number;
  count: number;
  children: React.ReactNode;
}> = ({ title, icon, total, count, children }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  if (count === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-4 text-right"
        aria-expanded={isOpen}
      >
        <div className="flex items-center">
          <span className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full">{icon}</span>
          <div className="mr-3">
            <h4 className="font-semibold text-slate-700 dark:text-slate-200">{title}</h4>
            <span className="text-xs text-slate-500 dark:text-slate-400">{count} معاملات</span>
          </div>
        </div>
        <div className="flex items-center">
          <span className="font-semibold text-rose-600 dark:text-rose-400 ml-4">- {formatCurrency(total)}</span>
          <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-1">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

const DetailRow: React.FC<{ description: string; date: string; amount: number; }> = ({ description, date, amount }) => (
  <div className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700/50">
    <div>
      <p className="text-slate-800 dark:text-slate-200">{description}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{date}</p>
    </div>
    <p className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(amount)}</p>
  </div>
);


const TreasuryDetailsPage: React.FC = () => {
    const { loading, cropCycles, transactions, settings, farmerWithdrawals, advances, farmers, suppliers, supplierPayments, people } = React.useContext(AppContext) as AppContextType;
    const { cropCycleId } = useParams<{ cropCycleId: string }>();

    const cycle = React.useMemo(() => cropCycles.find(c => c.id === cropCycleId), [cropCycles, cropCycleId]);

    const {
        revenue,
        treasuryBalance,
        totalDeductions,
        cashOperationalExpenseTransactions,
        withdrawalsForCycle,
        supplierPaymentsForCycle,
        personalAdvancesForCycle,
    } = React.useMemo(() => {
        if (!cycle) return { revenue: 0, treasuryBalance: 0, totalDeductions: 0, cashOperationalExpenseTransactions: [], withdrawalsForCycle: [], supplierPaymentsForCycle: [], personalAdvancesForCycle: [] };

        const cycleTransactions = transactions.filter(t => t.cropCycleId === cycle.id);
        const revenue = cycleTransactions.filter(t => t.type === TransactionType.REVENUE).reduce((sum, t) => sum + t.amount, 0);
        
        const foundationalCategories = new Set(settings.expenseCategories.filter(c => c.isFoundational).map(c => c.name));
        
        const cashOperationalExpenseTransactions = cycleTransactions.filter(t => t.type === TransactionType.EXPENSE && !foundationalCategories.has(t.category) && !t.supplierId);
        const cashOperationalExpensesTotal = cashOperationalExpenseTransactions.reduce((sum, t) => sum + t.amount, 0);

        const withdrawalsForCycle = farmerWithdrawals.filter(w => w.cropCycleId === cycle.id);
        const totalWithdrawals = withdrawalsForCycle.reduce((sum, w) => sum + w.amount, 0);
        
        const supplierPaymentsForCycle = supplierPayments.filter(p => p.cropCycleId === cycle.id);
        const totalSupplierPayments = supplierPaymentsForCycle.reduce((sum, p) => sum + p.amount, 0);

        const personalAdvancesForCycle = advances.filter(a => a.cropCycleId === cycle.id);
        const totalPersonalAdvances = personalAdvancesForCycle.reduce((sum, a) => sum + a.amount, 0);
        
        const totalDeductions = cashOperationalExpensesTotal + totalWithdrawals + totalSupplierPayments + totalPersonalAdvances;
        const treasuryBalance = revenue - totalDeductions;

        return { 
            revenue, 
            treasuryBalance, 
            totalDeductions,
            cashOperationalExpenseTransactions,
            withdrawalsForCycle,
            supplierPaymentsForCycle,
            personalAdvancesForCycle,
        };
    }, [cycle, transactions, settings.expenseCategories, farmerWithdrawals, advances, supplierPayments]);

    if (loading) return <LoadingSpinner />;
    if (!cycle) return <div className="text-center p-8">لم يتم العثور على العروة.</div>;
    
    const totalCashExpenses = cashOperationalExpenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalWithdrawals = withdrawalsForCycle.reduce((sum, w) => sum + w.amount, 0);
    const totalSupplierPayments = supplierPaymentsForCycle.reduce((sum, p) => sum + p.amount, 0);
    const totalPersonalAdvances = personalAdvancesForCycle.reduce((sum, a) => sum + a.amount, 0);

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-page-fade-in">
            <header>
                <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-2">
                    <Link to="/treasury" className="hover:underline">الخزنة</Link>
                    <ArrowRightIcon className="w-4 h-4 mx-2 transform scale-x-[-1]" />
                    <span>{cycle.name}</span>
                </div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">تفاصيل صندوق: {cycle.name}</h1>
            </header>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 text-center">
                <p className="text-lg font-medium text-slate-500 dark:text-slate-400">الرصيد الفعلي المتاح</p>
                <p className={`text-5xl font-bold mt-2 ${treasuryBalance >= 0 ? 'text-sky-600 dark:text-sky-400' : 'text-orange-500'}`}>
                    {formatCurrency(treasuryBalance)}
                </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* INFLOWS */}
                <div className="lg:col-span-2 space-y-6">
                     <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">التدفقات الداخلة</h3>
                        <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                            <div className="flex items-center">
                                <span className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-full">
                                    <RevenueIcon className="w-6 h-6 text-emerald-500"/>
                                </span>
                                <span className="text-slate-700 dark:text-slate-200 text-lg mr-3">إجمالي الإيرادات</span>
                            </div>
                            <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(revenue)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* OUTFLOWS */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">التدفقات الخارجة (الخصومات)</h3>
                         <div className="flex items-center justify-between p-4 bg-rose-50 dark:bg-rose-900/30 rounded-lg mb-4">
                            <div className="flex items-center">
                                <span className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-full">
                                    <ExpenseIcon className="w-6 h-6 text-rose-500"/>
                                </span>
                                <span className="text-slate-700 dark:text-slate-200 text-lg mr-3">إجمالي الخصومات</span>
                            </div>
                            <span className="font-bold text-lg text-rose-600 dark:text-rose-400">
                                - {formatCurrency(totalDeductions)}
                            </span>
                        </div>
                        <div className="space-y-3">
                            <CollapsibleDeductionCard title="مصروفات تشغيلية نقدية" icon={<ExpenseIcon className="w-5 h-5 text-rose-500"/>} total={totalCashExpenses} count={cashOperationalExpenseTransactions.length}>
                                {cashOperationalExpenseTransactions.map(t => <DetailRow key={t.id} description={t.description} amount={t.amount} date={t.date} />)}
                            </CollapsibleDeductionCard>
                             <CollapsibleDeductionCard title="مدفوعات الموردين" icon={<SupplierIcon className="w-5 h-5 text-blue-500"/>} total={totalSupplierPayments} count={supplierPaymentsForCycle.length}>
                                {supplierPaymentsForCycle.map(p => {
                                    const supplierName = suppliers.find(s => s.id === p.supplierId)?.name || 'غير معروف';
                                    return <DetailRow key={p.id} description={`${p.description} (${supplierName})`} amount={p.amount} date={p.date} />;
                                })}
                            </CollapsibleDeductionCard>
                            <CollapsibleDeductionCard title="سحوبات المزارع" icon={<FarmerIcon className="w-5 h-5 text-indigo-500"/>} total={totalWithdrawals} count={withdrawalsForCycle.length}>
                                {withdrawalsForCycle.map(w => <DetailRow key={w.id} description={w.description} amount={w.amount} date={w.date} />)}
                            </CollapsibleDeductionCard>
                            <CollapsibleDeductionCard title="سلف شخصية" icon={<AdvanceIcon className="w-5 h-5 text-purple-500"/>} total={totalPersonalAdvances} count={personalAdvancesForCycle.length}>
                                {personalAdvancesForCycle.map(a => {
                                    const personName = people.find(p => p.id === a.personId)?.name || 'غير معروف';
                                    return <DetailRow key={a.id} description={`${a.description} (${personName})`} amount={a.amount} date={a.date} />;
                                })}
                            </CollapsibleDeductionCard>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TreasuryDetailsPage;
