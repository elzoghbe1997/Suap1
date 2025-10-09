import React from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../App';
import { AppContextType, CropCycle, TransactionType, CropCycleStatus } from '../types';
import { TreasuryIcon, ArrowRightIcon } from './Icons';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);

const TreasuryCard: React.FC<{ cycle: CropCycle }> = ({ cycle }) => {
    const { transactions, settings, farmerWithdrawals } = React.useContext(AppContext) as AppContextType;

    const treasuryBalance = React.useMemo(() => {
        const cycleTransactions = transactions.filter(t => t.cropCycleId === cycle.id);
        const revenue = cycleTransactions.filter(t => t.type === TransactionType.REVENUE).reduce((sum, t) => sum + t.amount, 0);
        
        const foundationalCategories = new Set(settings.expenseCategories.filter(c => c.isFoundational).map(c => c.name));
        
        const operationalExpenses = cycleTransactions
            .filter(t => t.type === TransactionType.EXPENSE && !foundationalCategories.has(t.category))
            .reduce((sum, t) => sum + t.amount, 0);
        
        const totalWithdrawals = farmerWithdrawals
            .filter(w => w.cropCycleId === cycle.id)
            .reduce((sum, w) => sum + w.amount, 0);

        return revenue - operationalExpenses - totalWithdrawals;
    }, [transactions, cycle.id, settings.expenseCategories, farmerWithdrawals]);

    return (
        <Link 
            to={`/treasury/${cycle.id}`}
            className="group block bg-white dark:bg-slate-800 rounded-lg shadow-md border-t-4 border-emerald-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        >
            <div className="p-5">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">صندوق: {cycle.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">الرصيد الفعلي</p>
                    </div>
                     <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-full">
                        <TreasuryIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400"/>
                    </div>
                </div>
                <div className="mt-4 text-3xl font-bold text-sky-600 dark:text-sky-400">
                    {formatCurrency(treasuryBalance)}
                </div>
            </div>
             <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-b-lg border-t border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    <span>عرض التفاصيل</span>
                    <ArrowRightIcon className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-[-4px]"/>
                </div>
            </div>
        </Link>
    );
};


const TreasuryPage: React.FC = () => {
    const { cropCycles } = React.useContext(AppContext) as AppContextType;
    
    const activeCycles = React.useMemo(() => 
        cropCycles.filter(c => c.status === CropCycleStatus.ACTIVE),
    [cropCycles]);
    
    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">صناديق العروات</h1>
                <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
                    نظرة عامة على السيولة النقدية المتاحة لكل عروة من العروات النشطة.
                </p>
            </header>

            {activeCycles.length > 0 ? (
                 <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {activeCycles.map(cycle => (
                            <TreasuryCard key={cycle.id} cycle={cycle} />
                        ))}
                    </div>
                 </div>
            ) : (
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <TreasuryIcon className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">لا توجد عروات نشطة حالياً</h2>
                    <p className="mt-2 mb-8 max-w-2xl mx-auto text-lg text-slate-500 dark:text-slate-400">
                        عند بدء عروة جديدة، سيظهر صندوق الخزنة الخاص بها هنا تلقائياً.
                    </p>
                    <Link to="/cycles" state={{ action: 'add-cycle' }} className="px-6 py-3 text-base font-semibold text-white bg-emerald-600 rounded-md shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors">
                        + إضافة عروة جديدة
                    </Link>
                </div>
            )}
        </div>
    );
};

export default TreasuryPage;