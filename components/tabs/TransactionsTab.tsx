import React from 'react';
import { AppContext } from '../../App';
import { AppContextType, CropCycle, Transaction, TransactionType, Supplier, FertilizationProgram } from '../../types';
import { AddIcon, EditIcon, DeleteIcon } from '../Icons';
import ConfirmationModal from '../ConfirmationModal';
import Pagination from '../Pagination';
import InvoiceForm from '../InvoiceForm';
import ExpenseForm from '../ExpenseForm';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);

const TransactionCard: React.FC<{
    t: Transaction;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ t, onEdit, onDelete }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start gap-4 border-l-4" style={{ borderColor: t.type === TransactionType.REVENUE ? '#10b981' : '#f43f5e' }}>
        <div className="flex-grow">
            <p className="font-semibold text-slate-800 dark:text-white">{t.description}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t.date} - {t.category}</p>
        </div>
        <div className="flex-shrink-0 flex w-full justify-between items-center sm:w-auto sm:flex-col sm:items-end sm:justify-start gap-2">
            <p className={`text-lg font-bold ${t.type === TransactionType.REVENUE ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(t.amount)}</p>
            <div className="flex items-center space-x-2 space-x-reverse">
                <button onClick={onEdit} className="p-1 text-slate-400 hover:text-blue-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" aria-label={`تعديل ${t.description}`}><EditIcon className="w-5 h-5"/></button>
                <button onClick={onDelete} className="p-1 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" aria-label={`حذف ${t.description}`}><DeleteIcon className="w-5 h-5"/></button>
            </div>
        </div>
    </div>
);

const TransactionFormModal: React.FC<{
    type: 'REVENUE' | 'EXPENSE';
    transaction?: Transaction;
    cycle: CropCycle;
    onSave: (t: Omit<Transaction, 'id'> | Transaction) => void;
    onClose: () => void;
    settings: AppContextType['settings'];
    suppliers: Supplier[];
    fertilizationPrograms: FertilizationProgram[];
    transactions: Transaction[];
}> = ({ type, transaction, cycle, onSave, onClose, ...props}) => {
    const isRevenue = type === 'REVENUE';
    return (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto modal-scroll-contain" onClick={e=>e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">{transaction ? 'تعديل' : 'إضافة'} {isRevenue ? 'فاتورة' : 'مصروف'}</h2>
                {isRevenue ? 
                    <InvoiceForm invoice={transaction} onSave={onSave} onCancel={onClose} cycles={[cycle]} fertilizationPrograms={props.fertilizationPrograms} initialCycleId={cycle.id} /> : 
                    <ExpenseForm expense={transaction} onSave={onSave} onCancel={onClose} cycles={[cycle]} {...props} initialCycleId={cycle.id} />}
            </div>
        </div>
    )
}


const TransactionsTab: React.FC<{ cycle: CropCycle }> = ({ cycle }) => {
    const { transactions, addTransaction, updateTransaction, deleteTransaction, settings, suppliers, fertilizationPrograms } = React.useContext(AppContext) as AppContextType;
    
    // FIX: Refactored modal state to a single state object for better clarity and management.
    const [modalState, setModalState] = React.useState<{ type: 'REVENUE' | 'EXPENSE', transaction?: Transaction } | null>(null);
    const [deletingId, setDeletingId] = React.useState<string | null>(null);

    const [invoicePage, setInvoicePage] = React.useState(1);
    const [expensePage, setExpensePage] = React.useState(1);
    const ITEMS_PER_PAGE = 5;

    React.useEffect(() => {
        const isAnyModalOpen = !!modalState || !!deletingId;
        if (isAnyModalOpen) {
            document.body.classList.add('body-no-scroll');
        } else {
            document.body.classList.remove('body-no-scroll');
        }
        return () => {
            document.body.classList.remove('body-no-scroll');
        };
    }, [modalState, deletingId]);

    const { cycleInvoices, cycleExpenses, totalRevenue, totalExpenses } = React.useMemo(() => {
        const cycleTransactions = transactions.filter(t => t.cropCycleId === cycle.id);
        const invoices = cycleTransactions.filter(t => t.type === TransactionType.REVENUE);
        const expenses = cycleTransactions.filter(t => t.type === TransactionType.EXPENSE);
        const revenue = invoices.reduce((sum, t) => sum + t.amount, 0);
        const expense = expenses.reduce((sum, t) => sum + t.amount, 0);
        return { cycleInvoices: invoices, cycleExpenses: expenses, totalRevenue: revenue, totalExpenses: expense };
    }, [transactions, cycle.id]);

    const handleSave = (transaction: Omit<Transaction, 'id'> | Transaction) => {
        if ('id' in transaction) {
            updateTransaction(transaction);
        } else {
            addTransaction(transaction);
        }
        setModalState(null);
    };

    const totalInvoicePages = Math.ceil(cycleInvoices.length / ITEMS_PER_PAGE);
    const currentInvoices = cycleInvoices.slice((invoicePage - 1) * ITEMS_PER_PAGE, invoicePage * ITEMS_PER_PAGE);

    const totalExpensePages = Math.ceil(cycleExpenses.length / ITEMS_PER_PAGE);
    const currentExpenses = cycleExpenses.slice((expensePage - 1) * ITEMS_PER_PAGE, expensePage * ITEMS_PER_PAGE);

    return (
        <div className="space-y-8 animate-fadeInSlideUp">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">الفواتير ({cycleInvoices.length})</h3>
                        <button onClick={() => setModalState({ type: 'REVENUE' })} className="flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-md shadow-sm hover:bg-emerald-700 transition-colors text-sm">
                            <AddIcon className="w-4 h-4 ml-2" />
                            <span>إضافة فاتورة</span>
                        </button>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg mb-4 text-center">
                        <span className="text-sm text-emerald-800 dark:text-emerald-300">إجمالي الإيرادات:</span>
                        <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400 mr-2">{formatCurrency(totalRevenue)}</span>
                    </div>
                    {currentInvoices.length > 0 ? (
                        <div className="space-y-4">
                            {currentInvoices.map(t => <TransactionCard key={t.id} t={t} onEdit={() => setModalState({ type: 'REVENUE', transaction: t })} onDelete={() => setDeletingId(t.id)} />)}
                            <Pagination currentPage={invoicePage} totalPages={totalInvoicePages} onPageChange={setInvoicePage} />
                        </div>
                    ) : (
                        <p className="text-center py-10 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-lg shadow-sm">لا توجد فواتير لهذه العروة.</p>
                    )}
                </section>

                <section>
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">المصروفات ({cycleExpenses.length})</h3>
                        <button onClick={() => setModalState({ type: 'EXPENSE' })} className="flex items-center justify-center px-4 py-2 bg-rose-600 text-white rounded-md shadow-sm hover:bg-rose-700 transition-colors text-sm">
                            <AddIcon className="w-4 h-4 ml-2" />
                            <span>إضافة مصروف</span>
                        </button>
                    </div>
                    <div className="bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg mb-4 text-center">
                        <span className="text-sm text-rose-800 dark:text-rose-300">إجمالي المصروفات:</span>
                        <span className="font-bold text-lg text-rose-600 dark:text-rose-400 mr-2">{formatCurrency(totalExpenses)}</span>
                    </div>
                    {currentExpenses.length > 0 ? (
                        <div className="space-y-4">
                            {currentExpenses.map(t => <TransactionCard key={t.id} t={t} onEdit={() => setModalState({ type: 'EXPENSE', transaction: t })} onDelete={() => setDeletingId(t.id)} />)}
                            <Pagination currentPage={expensePage} totalPages={totalExpensePages} onPageChange={setExpensePage} />
                        </div>
                    ) : (
                        <p className="text-center py-10 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-lg shadow-sm">لا توجد مصروفات لهذه العروة.</p>
                    )}
                </section>
            </div>

            {modalState && (
                <TransactionFormModal
                    type={modalState.type}
                    transaction={modalState.transaction}
                    cycle={cycle}
                    onSave={handleSave}
                    onClose={() => setModalState(null)}
                    settings={settings}
                    suppliers={suppliers}
                    fertilizationPrograms={fertilizationPrograms}
                    transactions={transactions}
                />
            )}
            <ConfirmationModal isOpen={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={() => { if(deletingId) deleteTransaction(deletingId); setDeletingId(null); }} title="تأكيد الحذف" message="هل أنت متأكد من حذف هذه المعاملة؟" />
        </div>
    );
};

export default TransactionsTab;
