import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { AppContextType, Transaction, CropCycle, TransactionType, Supplier, CropCycleStatus, FertilizationProgram } from '../types';
import { AddIcon, EditIcon, DeleteIcon, RevenueIcon, ExpenseIcon, ArrowUpIcon, ArrowDownIcon, InvoiceIcon, ReceiptIcon } from './Icons';
import ConfirmationModal from './ConfirmationModal';
import Pagination from './Pagination';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter';
import InvoiceForm from './InvoiceForm';
import ExpenseForm from './ExpenseForm';

const formInputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500";
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
        {[...Array(3)].map((_, i) => (
             <div key={i} className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 space-y-3 animate-pulse">
                <div className="flex justify-between items-start">
                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/5"></div>
                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/5"></div>
                </div>
                <div className="space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700 pt-3 mt-3">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                        <div className="h-6 w-6 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                        <div className="h-6 w-6 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                    </div>
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
    <tr style={{ animationDelay: `${index * 50}ms` }} className="even:bg-slate-50 dark:even:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors duration-200 animate-fadeInSlideUp">
        <td className="py-4 px-4 whitespace-nowrap">{transaction.date}</td>
        <td className="py-4 px-4 whitespace-nowrap">{transaction.description}</td>
        <td className="py-4 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400">{transaction.cropCycleName}</td>
        <td className="py-4 px-4 whitespace-nowrap">{transaction.quantity?.toLocaleString() ?? '-'}</td>
        <td className="py-4 px-4 whitespace-nowrap font-medium text-green-600">{formatCurrency(transaction.amount)}</td>
        <td className="py-4 px-4 whitespace-nowrap font-medium">
            <div className="flex items-center space-x-2 space-x-reverse">
                <button onClick={() => onEdit(transaction)} className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50" aria-label={`تعديل الفاتورة ${transaction.description}`}><EditIcon className="w-5 h-5"/></button>
                <button onClick={() => onDelete(transaction.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" aria-label={`حذف الفاتورة ${transaction.description}`}><DeleteIcon className="w-5 h-5"/></button>
            </div>
        </td>
    </tr>
));

const InvoiceRowMobile: React.FC<RowProps> = React.memo(({ transaction, onEdit, onDelete, index }) => (
    <div style={{ animationDelay: `${index * 50}ms` }} className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 space-y-3 animate-fadeInSlideUp">
        <div className="flex justify-between items-start">
            <p className="font-bold text-slate-800 dark:text-white flex-1 pr-2">{transaction.description}</p>
            <p className="font-semibold text-green-600 whitespace-nowrap">{formatCurrency(transaction.amount)}</p>
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-400">
            <p><strong className="font-medium text-slate-700 dark:text-slate-300">العروة:</strong> {transaction.cropCycleName}</p>
            <p><strong className="font-medium text-slate-700 dark:text-slate-300">الكمية:</strong> {transaction.quantity?.toLocaleString() ?? '-'} ك.ج</p>
        </div>
        <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700 pt-3 mt-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">{transaction.date}</p>
            <div className="flex items-center space-x-2 space-x-reverse">
                <button onClick={() => onEdit(transaction)} className="text-blue-500 hover:text-blue-700 p-1 rounded-full" aria-label={`تعديل الفاتورة ${transaction.description}`}><EditIcon className="w-5 h-5"/></button>
                <button onClick={() => onDelete(transaction.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full" aria-label={`حذف الفاتورة ${transaction.description}`}><DeleteIcon className="w-5 h-5"/></button>
            </div>
        </div>
    </div>
));

const ExpenseRowDesktop: React.FC<RowProps> = React.memo(({ transaction, onEdit, onDelete, index }) => (
    <tr style={{ animationDelay: `${index * 50}ms` }} className="even:bg-slate-50 dark:even:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors duration-200 animate-fadeInSlideUp">
        <td className="py-4 px-4 whitespace-nowrap">{transaction.date}</td>
        <td className="py-4 px-4 whitespace-nowrap">{transaction.description}</td>
        <td className="py-4 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400">{transaction.cropCycleName}</td>
        <td className="py-4 px-4 whitespace-nowrap">{transaction.category}</td>
        <td className="py-4 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400">{transaction.supplierName || 'نقدي'}</td>
        <td className="py-4 px-4 whitespace-nowrap font-medium text-red-600">{formatCurrency(transaction.amount)}</td>
        <td className="py-4 px-4 whitespace-nowrap font-medium">
            <div className="flex items-center space-x-2 space-x-reverse">
                <button onClick={() => onEdit(transaction)} className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50" aria-label={`تعديل المصروف ${transaction.description}`}><EditIcon className="w-5 h-5"/></button>
                <button onClick={() => onDelete(transaction.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" aria-label={`حذف المصروف ${transaction.description}`}><DeleteIcon className="w-5 h-5"/></button>
            </div>
        </td>
    </tr>
));

const ExpenseRowMobile: React.FC<RowProps> = React.memo(({ transaction, onEdit, onDelete, index }) => (
     <div style={{ animationDelay: `${index * 50}ms` }} className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 space-y-3 animate-fadeInSlideUp">
         <div className="flex justify-between items-start">
            <p className="font-bold text-slate-800 dark:text-white flex-1 pr-2">{transaction.description}</p>
            <p className="font-semibold text-red-600 whitespace-nowrap">{formatCurrency(transaction.amount)}</p>
        </div>
         <div className="text-sm text-slate-600 dark:text-slate-400">
            <p><strong className="font-medium text-slate-700 dark:text-slate-300">العروة:</strong> {transaction.cropCycleName}</p>
            <p><strong className="font-medium text-slate-700 dark:text-slate-300">الفئة:</strong> {transaction.category}</p>
            <p><strong className="font-medium text-slate-700 dark:text-slate-300">المورد:</strong> {transaction.supplierName || 'نقدي'}</p>
        </div>
        <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700 pt-3 mt-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">{transaction.date}</p>
            <div className="flex items-center space-x-2 space-x-reverse">
                <button onClick={() => onEdit(transaction)} className="text-blue-500 hover:text-blue-700 p-1 rounded-full" aria-label={`تعديل المصروف ${transaction.description}`}><EditIcon className="w-5 h-5"/></button>
                <button onClick={() => onDelete(transaction.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full" aria-label={`حذف المصروف ${transaction.description}`}><DeleteIcon className="w-5 h-5"/></button>
            </div>
        </div>
    </div>
));


type SortDirection = 'ascending' | 'descending';
type SortableKeys = 'date' | 'description' | 'cropCycleName' | 'category' | 'amount' | 'supplierName' | 'quantity';

const TransactionListPage: React.FC<{ type: 'invoice' | 'expense' }> = ({ type }) => {
    const isInvoice = type === 'invoice';
    const { loading, transactions, cropCycles, suppliers, settings, fertilizationPrograms, addTransaction, updateTransaction, deleteTransaction } = React.useContext(AppContext) as AppContextType;
    
    const location = useLocation();
    const navigate = useNavigate();

    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingTransaction, setEditingTransaction] = React.useState<Transaction | undefined>(undefined);
    const [deletingId, setDeletingId] = React.useState<string | null>(null);
    const [filterCycle, setFilterCycle] = React.useState('all');
    const [filterCategory, setFilterCategory] = React.useState('all');
    const [sortConfig, setSortConfig] = React.useState<{ key: SortableKeys, direction: SortDirection }>({ key: 'date', direction: 'descending' });
    const [currentPage, setCurrentPage] = React.useState(1);
    const ITEMS_PER_PAGE = 10;
    
    const actionName = isInvoice ? 'add-invoice' : 'add-expense';

    React.useEffect(() => {
        const isAnyModalOpen = isModalOpen || !!deletingId;
        if (isAnyModalOpen) {
            document.body.classList.add('body-no-scroll');
        } else {
            document.body.classList.remove('body-no-scroll');
        }
        return () => {
            document.body.classList.remove('body-no-scroll');
        };
    }, [isModalOpen, deletingId]);

    React.useEffect(() => {
        const state = location.state as { action?: string };
        if (state?.action === actionName) {
            setEditingTransaction(undefined);
            setIsModalOpen(true);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate, actionName]);
    
    React.useEffect(() => {
        setCurrentPage(1);
    }, [filterCycle, filterCategory]);

    const processedTransactions = React.useMemo((): MappedTransaction[] => {
        const activeCycleIds = new Set(cropCycles.filter(c => c.status === CropCycleStatus.ACTIVE).map(c => c.id));
        
        let filtered = transactions
            .filter(t => t.type === (isInvoice ? TransactionType.REVENUE : TransactionType.EXPENSE) && activeCycleIds.has(t.cropCycleId))
            .map(t => ({
                ...t,
                cropCycleName: cropCycles.find(c => c.id === t.cropCycleId)?.name ?? 'N/A',
                supplierName: suppliers.find(s => s.id === t.supplierId)?.name ?? '',
            }));

        if (filterCycle !== 'all') {
            filtered = filtered.filter(t => t.cropCycleId === filterCycle);
        }
        if (!isInvoice && filterCategory !== 'all') {
            filtered = filtered.filter(t => t.category === filterCategory);
        }
        
        filtered.sort((a, b) => {
            const aValue = a[sortConfig.key as keyof typeof a];
            const bValue = b[sortConfig.key as keyof typeof b];

            if (aValue == null || aValue === undefined) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (bValue == null || bValue === undefined) return sortConfig.direction === 'ascending' ? 1 : -1;

            if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
        
        return filtered;
    }, [transactions, filterCycle, filterCategory, sortConfig, cropCycles, suppliers, isInvoice]);
    
    const totalAmount = React.useMemo(() => processedTransactions.reduce((sum, t) => sum + t.amount, 0), [processedTransactions]);

    const handleSave = React.useCallback((transaction: Omit<Transaction, 'id'> | Transaction) => {
        if ('id' in transaction) {
            updateTransaction(transaction);
        } else {
            addTransaction(transaction);
        }
        setIsModalOpen(false);
        setEditingTransaction(undefined);
    }, [addTransaction, updateTransaction]);

    const handleEdit = React.useCallback((transaction: Transaction) => {
        setEditingTransaction(transaction);
        setIsModalOpen(true);
    }, []);
    
    const handleDelete = React.useCallback((id: string) => {
        setDeletingId(id);
    }, []);

    const confirmDelete = React.useCallback(() => {
        if (deletingId) {
            deleteTransaction(deletingId);
        }
        setDeletingId(null);
    }, [deletingId, deleteTransaction]);
    
    const requestSort = React.useCallback((key: SortableKeys) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    }, [sortConfig]);

    const getSortIcon = (key: SortableKeys) => {
        if (sortConfig.key !== key) return <div className="w-4 h-4" />;
        return sortConfig.direction === 'ascending' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />;
    };

    const TableHeader: React.FC<{ sortKey: SortableKeys; children: React.ReactNode; }> = ({ sortKey, children }) => (
        <th className="py-3 px-4 text-right font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort(sortKey)}>
            <div className="flex items-center">
                <span>{children}</span>
                <span className="mr-2">{getSortIcon(sortKey)}</span>
            </div>
        </th>
    );

    const renderContent = () => {
        if (loading) return <SkeletonList />;
        
        if (processedTransactions.length === 0) {
            return (
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <div className="flex justify-center mb-4 text-slate-400 dark:text-slate-500">
                        {isInvoice ? <InvoiceIcon className="w-16 h-16"/> : <ReceiptIcon className="w-16 h-16"/>}
                    </div>
                    <p className="text-lg font-semibold text-slate-600 dark:text-slate-300">{isInvoice ? "لا توجد فواتير للعروات النشطة" : "لم تقم بإضافة أي مصروفات بعد"}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{isInvoice ? "ابدأ بإضافة فاتورة لبيع المحصول في عروة نشطة." : "ابدأ بإضافة المصروفات لتتبع تكاليفك."}</p>
                </div>
            );
        }
        
        const totalPages = Math.ceil(processedTransactions.length / ITEMS_PER_PAGE);
        const currentTransactions = processedTransactions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

        return (
            <>
                <div className="hidden md:block bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700/50">
                                <tr>
                                    <TableHeader sortKey="date">التاريخ</TableHeader>
                                    <TableHeader sortKey="description">الوصف</TableHeader>
                                    <TableHeader sortKey="cropCycleName">العروة</TableHeader>
                                    {isInvoice && <TableHeader sortKey="quantity">الكمية (ك.ج)</TableHeader>}
                                    {!isInvoice && <TableHeader sortKey="category">الفئة</TableHeader>}
                                    {!isInvoice && <TableHeader sortKey="supplierName">المورد</TableHeader>}
                                    <TableHeader sortKey="amount">المبلغ</TableHeader>
                                    <th className="py-3 px-4 text-right font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {currentTransactions.map((t, index) => (
                                   isInvoice 
                                    ? <InvoiceRowDesktop key={t.id} transaction={t} onEdit={handleEdit} onDelete={handleDelete} index={index} />
                                    : <ExpenseRowDesktop key={t.id} transaction={t} onEdit={handleEdit} onDelete={handleDelete} index={index} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="md:hidden space-y-4">
                    {currentTransactions.map((t, index) => (
                        isInvoice
                         ? <InvoiceRowMobile key={t.id} transaction={t} onEdit={handleEdit} onDelete={handleDelete} index={index} />
                         : <ExpenseRowMobile key={t.id} transaction={t} onEdit={handleEdit} onDelete={handleDelete} index={index} />
                    ))}
                </div>
                 <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </>
        );
    }
    
    return (
        <div className="space-y-6">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard 
                    title={isInvoice ? "إجمالي الإيرادات (للعروات النشطة)" : "إجمالي المصروفات (للعروات النشطة)"}
                    value={totalAmount} 
                    icon={isInvoice ? <RevenueIcon className="h-8 w-8 text-green-500"/> : <ExpenseIcon className="h-8 w-8 text-red-500"/>} 
                    color={isInvoice ? "border-green-500" : "border-red-500"} 
                />
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                 <button onClick={() => { setEditingTransaction(undefined); setIsModalOpen(true); }} className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
                    <AddIcon className="w-5 h-5 ml-2" />
                    <span>{isInvoice ? 'إضافة فاتورة' : 'إضافة مصروف'}</span>
                </button>
                <div className="flex-grow flex flex-col sm:flex-row gap-4">
                     {!isInvoice && (
                        <div className="flex-1 min-w-[150px]">
                            <select id="filterCategory" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className={formInputClass.replace('mt-1', '')}>
                                <option value="all">كل الفئات</option>
                                {settings.expenseCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                     )}
                     <div className={isInvoice ? "flex-1 min-w-[150px] sm:max-w-xs" : "flex-1 min-w-[150px]"}>
                        <select id="filterCycle" value={filterCycle} onChange={e => setFilterCycle(e.target.value)} className={formInputClass.replace('mt-1', '')}>
                            <option value="all">كل العروات النشطة</option>
                            {cropCycles.filter(c => c.status === CropCycleStatus.ACTIVE).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>
            
            {renderContent()}

            {isModalOpen && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto modal-scroll-contain">
                        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">{isInvoice ? (editingTransaction ? 'تعديل فاتورة' : 'إضافة فاتورة جديدة') : (editingTransaction ? 'تعديل مصروف' : 'إضافة مصروف جديد')}</h2>
                        {isInvoice ? (
                            <InvoiceForm
                                invoice={editingTransaction}
                                onSave={handleSave} 
                                onCancel={() => setIsModalOpen(false)} 
                                cycles={cropCycles}
                                fertilizationPrograms={fertilizationPrograms}
                            />
                        ) : (
                            <ExpenseForm
                                expense={editingTransaction}
                                onSave={handleSave} 
                                onCancel={() => setIsModalOpen(false)} 
                                cycles={cropCycles}
                                suppliers={suppliers}
                                fertilizationPrograms={fertilizationPrograms}
                                settings={settings}
                                transactions={transactions}
                            />
                        )}
                    </div>
                </div>
            )}
            
            <ConfirmationModal
                isOpen={!!deletingId}
                onClose={() => setDeletingId(null)}
                onConfirm={confirmDelete}
                title={isInvoice ? "تأكيد حذف الفاتورة" : "تأكيد حذف المصروف"}
                message={isInvoice ? "هل أنت متأكد من حذف هذه الفاتورة؟" : "هل أنت متأكد من حذف هذا المصروف؟"}
            />
        </div>
    );
};

export default TransactionListPage;