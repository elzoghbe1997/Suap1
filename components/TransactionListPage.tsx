import React from 'react';
import { AppContext } from '../App.tsx';
import { AppContextType, Transaction, CropCycle, TransactionType, Supplier, FertilizationProgram } from '../types.ts';
// FIX: Imported RevenueIcon and ExpenseIcon.
import { AddIcon, EditIcon, DeleteIcon, ArrowUpIcon, ArrowDownIcon, InvoiceIcon, ReceiptIcon, RevenueIcon, ExpenseIcon } from './Icons.tsx';
import ConfirmationModal from './ConfirmationModal.tsx';
import Pagination from './Pagination.tsx';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter.ts';
import InvoiceForm from './InvoiceForm.tsx';
import ExpenseForm from './ExpenseForm.tsx';
import { useLocation, useNavigate } from 'react-router-dom';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP' }).format(amount);

const AnimatedNumber: React.FC<{ value: number }> = React.memo(({ value }) => {
    const count = useAnimatedCounter(value);
    return <>{formatCurrency(count)}</>;
});

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string }> = React.memo(({ title, value, icon, color }) => (
    <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-md p-5 border-r-4 ${color}`}>
        <div className="flex items-center">
            <div className="flex-shrink-0">{icon}</div>
            <div className="mr-4">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{title}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                    <AnimatedNumber value={value} />
                </p>
            </div>
        </div>
    </div>
));

const SkeletonList: React.FC = () => (
    <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
             <div key={i} className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 space-y-3 skeleton-shimmer">
                <div className="flex justify-between items-start">
                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/5"></div>
                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/5"></div>
                </div>
                <div className="space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                </div>
            </div>
        ))}
    </div>
);


type MappedTransaction = Transaction & { cropCycleName: string; supplierName?: string; };

interface RowProps {
    transaction: MappedTransaction;
    onEdit: (transaction: Transaction) => void;
    onDelete: (id: string) => void;
    index: number;
}


const InvoiceRowDesktop: React.FC<RowProps> = React.memo(({ transaction, onEdit, onDelete, index }) => (
    <tr style={{ animationDelay: `${index * 50}ms` }} className="even:bg-slate-50 dark:even:bg-slate-800/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 animate-fadeInSlideUp">
        <td className="p-3 text-sm">{transaction.date}</td>
        <td className="p-3 text-sm font-medium text-slate-800 dark:text-slate-200">{transaction.description || '-'}</td>
        <td className="p-3 text-sm text-slate-500 dark:text-slate-400">{transaction.cropCycleName}</td>
        <td className="p-3 text-sm text-slate-500 dark:text-slate-400">{transaction.market}</td>
        <td className="p-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(transaction.amount)}</td>
        <td className="p-3 text-sm text-slate-500 dark:text-slate-400">{transaction.quantity ? `${transaction.quantity} ك.ج` : '-'}</td>
        <td className="p-3 text-center">
            <div className="flex items-center justify-center gap-1">
                <button onClick={() => onEdit(transaction)} className="p-1.5 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full"><EditIcon className="w-4 h-4"/></button>
                <button onClick={() => onDelete(transaction.id)} className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><DeleteIcon className="w-4 h-4"/></button>
            </div>
        </td>
    </tr>
));

const ExpenseRowDesktop: React.FC<RowProps> = React.memo(({ transaction, onEdit, onDelete, index }) => (
    <tr style={{ animationDelay: `${index * 50}ms` }} className="even:bg-slate-50 dark:even:bg-slate-800/50 hover:bg-rose-50/50 dark:hover:bg-rose-900/20 animate-fadeInSlideUp">
        <td className="p-3 text-sm">{transaction.date}</td>
        <td className="p-3 text-sm font-medium text-slate-800 dark:text-slate-200">{transaction.description}</td>
        <td className="p-3 text-sm text-slate-500 dark:text-slate-400">{transaction.category}</td>
        <td className="p-3 text-sm text-slate-500 dark:text-slate-400">{transaction.cropCycleName}</td>
        <td className="p-3 text-sm font-semibold text-rose-600 dark:text-rose-400">{formatCurrency(transaction.amount)}</td>
        <td className="p-3 text-sm text-slate-500 dark:text-slate-400">{transaction.supplierName || 'نقدي'}</td>
        <td className="p-3 text-center">
             <div className="flex items-center justify-center gap-1">
                <button onClick={() => onEdit(transaction)} className="p-1.5 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full"><EditIcon className="w-4 h-4"/></button>
                <button onClick={() => onDelete(transaction.id)} className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><DeleteIcon className="w-4 h-4"/></button>
            </div>
        </td>
    </tr>
));

const TransactionCardMobile: React.FC<RowProps> = React.memo(({ transaction, onEdit, onDelete }) => (
    <div className={`bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm flex flex-col gap-3 border-l-4 ${transaction.type === TransactionType.REVENUE ? 'border-emerald-500' : 'border-rose-500'}`}>
        <div className="flex justify-between items-start">
            <div>
                <p className="font-semibold text-slate-800 dark:text-white">{transaction.description}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{transaction.cropCycleName}</p>
            </div>
            <p className={`text-lg font-bold ${transaction.type === TransactionType.REVENUE ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(transaction.amount)}</p>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
            {transaction.type === TransactionType.EXPENSE && <p><strong>الفئة:</strong> {transaction.category} {transaction.supplierName ? `(${transaction.supplierName})`: ''}</p>}
            {transaction.type === TransactionType.REVENUE && <p><strong>السوق:</strong> {transaction.market} | <strong>الكمية:</strong> {transaction.quantity || 0} ك.ج</p>}
        </div>
        <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700 pt-3 mt-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">{transaction.date}</p>
            <div className="flex items-center space-x-2 space-x-reverse">
                <button onClick={() => onEdit(transaction)} className="p-1 text-slate-400 hover:text-blue-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><EditIcon className="w-5 h-5"/></button>
                <button onClick={() => onDelete(transaction.id)} className="p-1 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><DeleteIcon className="w-5 h-5"/></button>
            </div>
        </div>
    </div>
));


// Main component
const TransactionListPage: React.FC<{ type: 'invoice' | 'expense' }> = ({ type }) => {
    const context = React.useContext(AppContext) as AppContextType;
    const { loading, transactions, cropCycles, suppliers, addTransaction, updateTransaction, deleteTransaction, settings, fertilizationPrograms } = context;
    
    const location = useLocation();
    const navigate = useNavigate();
    
    const [modal, setModal] = React.useState<{ transaction?: Transaction } | null>(null);
    const [deletingId, setDeletingId] = React.useState<string | null>(null);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [filterCycle, setFilterCycle] = React.useState('all');
    const [searchQuery, setSearchQuery] = React.useState('');
    const [sortBy, setSortBy] = React.useState<{ key: keyof MappedTransaction, order: 'asc' | 'desc' }>({ key: 'date', order: 'desc' });
    
    const ITEMS_PER_PAGE = 10;
    const transactionType = type === 'invoice' ? TransactionType.REVENUE : TransactionType.EXPENSE;
    
    React.useEffect(() => {
        const state = location.state as { action?: string };
        const action = `add-${type}`;
        if (state?.action === action) {
            setModal({});
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, type, navigate]);

    const handleSort = (key: keyof MappedTransaction) => {
        if (sortBy.key === key) {
            setSortBy({ key, order: sortBy.order === 'asc' ? 'desc' : 'asc' });
        } else {
            setSortBy({ key, order: 'desc' });
        }
    };

    const sortedAndFilteredTransactions = React.useMemo(() => {
        const mapped = transactions
            .filter(t => t.type === transactionType)
            .map(t => {
                const cropCycleName = cropCycles.find(c => c.id === t.cropCycleId)?.name || 'غير محددة';
                const supplierName = suppliers.find(s => s.id === t.supplierId)?.name;
                return { ...t, cropCycleName, supplierName };
            });
        
        const filtered = mapped.filter(t => 
            (filterCycle === 'all' || t.cropCycleId === filterCycle) &&
            ((t.description || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
             t.cropCycleName.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        return filtered.sort((a, b) => {
            const aVal = a[sortBy.key];
            const bVal = b[sortBy.key];
            
            let comparison = 0;
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                if(sortBy.key === 'date') comparison = new Date(bVal).getTime() - new Date(aVal).getTime();
                else comparison = aVal.localeCompare(bVal);
            } else if (typeof aVal === 'number' && typeof bVal === 'number') {
                comparison = bVal - aVal;
            }
            
            return sortBy.order === 'desc' ? comparison : -comparison;
        });
    }, [transactions, transactionType, cropCycles, suppliers, filterCycle, searchQuery, sortBy]);

    const totalAmount = React.useMemo(() => sortedAndFilteredTransactions.reduce((sum, t) => sum + t.amount, 0), [sortedAndFilteredTransactions]);
    const totalPages = Math.ceil(sortedAndFilteredTransactions.length / ITEMS_PER_PAGE);
    const currentTransactions = sortedAndFilteredTransactions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handleSave = (t: Omit<Transaction, 'id'> | Transaction) => {
        if ('id' in t) updateTransaction(t); else addTransaction(t);
        setModal(null);
    };

    const confirmDelete = () => {
        if (deletingId) deleteTransaction(deletingId);
        setDeletingId(null);
    };
    
    const isInvoice = type === 'invoice';
    const config = {
        title: isInvoice ? 'الفواتير' : 'المصروفات',
        noun: isInvoice ? 'فاتورة' : 'مصروف',
        icon: isInvoice ? <InvoiceIcon className="w-8 h-8 text-emerald-500" /> : <ReceiptIcon className="w-8 h-8 text-rose-500" />,
        color: isInvoice ? 'border-emerald-500' : 'border-rose-500',
        accentClass: isInvoice ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700',
        TableComponent: isInvoice ? InvoiceRowDesktop : ExpenseRowDesktop,
        headers: isInvoice
            ? [ {key: 'date', label: 'التاريخ'}, {key: 'description', label: 'الوصف'}, {key: 'cropCycleName', label: 'العروة'}, {key: 'market', label: 'السوق'}, {key: 'amount', label: 'المبلغ'}, {key: 'quantity', label: 'الكمية'}, {key: 'actions', label: 'الإجراءات'} ]
            : [ {key: 'date', label: 'التاريخ'}, {key: 'description', label: 'الوصف'}, {key: 'category', label: 'الفئة'}, {key: 'cropCycleName', label: 'العروة'}, {key: 'amount', label: 'المبلغ'}, {key: 'supplierName', label: 'المورد'}, {key: 'actions', label: 'الإجراءات'} ]
    };


    const renderContent = () => {
        if (loading) return <SkeletonList />;
        if (sortedAndFilteredTransactions.length === 0 && !searchQuery && filterCycle === 'all') {
             return (
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <div className="flex justify-center mb-4 text-slate-400 dark:text-slate-500">{config.icon}</div>
                    <p className="text-lg font-semibold text-slate-600 dark:text-slate-300">لا توجد {config.title} مسجلة بعد.</p>
                </div>
            );
        }
         if (currentTransactions.length === 0) {
            return (
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <div className="flex justify-center mb-4 text-slate-400 dark:text-slate-500">{config.icon}</div>
                    <p className="text-lg font-semibold text-slate-600 dark:text-slate-300">لا توجد {config.title} تطابق بحثك.</p>
                </div>
            );
        }
        return (
            <>
                 {/* Desktop Table */}
                <div className="hidden md:block bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
                    <table className="min-w-full">
                        <thead className="bg-slate-100 dark:bg-slate-700/50">
                            <tr>
                                {config.headers.map(h => (
                                    <th key={h.key} className="p-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">
                                        {h.key !== 'actions' ? (
                                             <button onClick={() => handleSort(h.key as keyof MappedTransaction)} className="flex items-center gap-1">
                                                <span>{h.label}</span>
                                                {sortBy.key === h.key && (sortBy.order === 'asc' ? <ArrowUpIcon className="w-3 h-3"/> : <ArrowDownIcon className="w-3 h-3"/>)}
                                            </button>
                                        ) : <div className="text-center">{h.label}</div>}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {currentTransactions.map((t, index) => <config.TableComponent key={t.id} transaction={t} onEdit={() => setModal({ transaction: t })} onDelete={setDeletingId} index={index}/>)}
                        </tbody>
                    </table>
                </div>
                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                     {currentTransactions.map((t, index) => <TransactionCardMobile key={t.id} transaction={t} onEdit={() => setModal({ transaction: t })} onDelete={setDeletingId} index={index}/>)}
                </div>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </>
        );
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <StatCard title={`إجمالي ${config.title}`} value={totalAmount} icon={isInvoice ? <RevenueIcon className="w-8 h-8 text-emerald-500" /> : <ExpenseIcon className="w-8 h-8 text-rose-500" />} color={config.color} />
                <StatCard title={`عدد ${config.title}`} value={sortedAndFilteredTransactions.length} icon={config.icon} color={config.color} />
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <button onClick={() => setModal({})} className={`flex items-center justify-center px-4 py-2 text-white rounded-md shadow-sm ${config.accentClass}`}>
                    <AddIcon className="w-5 h-5 ml-2" /><span>إضافة {config.noun}</span>
                </button>
                <div className="flex-grow flex flex-col sm:flex-row gap-4">
                    <input type="text" placeholder="ابحث بالوصف أو العروة..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"/>
                    <select value={filterCycle} onChange={e => setFilterCycle(e.target.value)} className="block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500">
                        <option value="all">كل العروات</option>
                        {cropCycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            {renderContent()}

            {modal && (
                 <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={() => setModal(null)}>
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e=>e.stopPropagation()}>
                        <div className="p-6 pb-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{modal.transaction ? 'تعديل' : 'إضافة'} {config.noun}</h2>
                        </div>
                        <div className="p-6 flex-grow overflow-y-auto modal-scroll-contain">
                            {isInvoice ? 
                                <InvoiceForm invoice={modal.transaction} onSave={handleSave} onCancel={() => setModal(null)} cycles={cropCycles} fertilizationPrograms={fertilizationPrograms} /> : 
                                <ExpenseForm expense={modal.transaction} onSave={handleSave} onCancel={() => setModal(null)} cycles={cropCycles} suppliers={suppliers} settings={settings} fertilizationPrograms={fertilizationPrograms} transactions={transactions} />}
                        </div>
                    </div>
                </div>
            )}
            <ConfirmationModal isOpen={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={confirmDelete} title={`تأكيد حذف ${config.noun}`} message="هل أنت متأكد من حذف هذه المعاملة؟" />
        </div>
    );
};

export default TransactionListPage;