import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../App';
import { AppContextType, Transaction, TransactionType, ExpenseCategory, CropCycle } from '../types';
import { ToastContext, ToastContextType } from '../context/ToastContext';
import { AddIcon, EditIcon, DeleteIcon, DocumentSearchIcon } from './Icons';
import ConfirmationModal from './ConfirmationModal';
import SkeletonCard from './SkeletonCard';


const formInputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500";
const filterInputClass = "block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500";

const TransactionForm: React.FC<{ transaction?: Transaction; onSave: (transaction: Omit<Transaction, 'id'> | Transaction) => void; onCancel: () => void; cycles: CropCycle[] }> = ({ transaction, onSave, onCancel, cycles }) => {
    const { addToast } = useContext(ToastContext) as ToastContextType;
    const [date, setDate] = useState(transaction?.date || new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState(transaction?.description || '');
    const [category, setCategory] = useState<ExpenseCategory>(transaction?.category || ExpenseCategory.OTHER);
    const [amount, setAmount] = useState(transaction?.amount?.toString() || '');
    const [cropCycleId, setCropCycleId] = useState(transaction?.cropCycleId || (cycles.length > 0 ? cycles.find(c => c.status === 'نشطة')?.id || '' : ''));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const numericAmount = Number(amount);
        if (numericAmount <= 0) {
            addToast('المبلغ يجب أن يكون أكبر من صفر.', 'error');
            return;
        }
        if (!cropCycleId) {
            addToast('يرجى اختيار عروة.', 'error');
            return;
        }
        
        const data = { date, description, type: TransactionType.EXPENSE, category, amount: numericAmount, cropCycleId };
        if (transaction) {
            onSave({ ...transaction, ...data });
        } else {
            onSave(data);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">التاريخ</label>
                    <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className={formInputClass}/>
                </div>
                 <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">المبلغ (ج.م)</label>
                    <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)} required min="0" step="0.01" className={formInputClass}/>
                </div>
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">الوصف</label>
                <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} required className={formInputClass}/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">التصنيف</label>
                    <select id="category" value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)} required className={formInputClass}>
                        {Object.values(ExpenseCategory).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="cropCycle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">العروة</label>
                    <select id="cropCycle" value={cropCycleId} onChange={e => setCropCycleId(e.target.value)} required className={formInputClass}>
                        <option value="" disabled>اختر عروة</option>
                        {cycles.filter(c => c.status === 'نشطة').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">إلغاء</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">حفظ</button>
            </div>
        </form>
    );
};

const EmptyState: React.FC<{ message: string; subMessage: string; icon: React.ReactNode }> = ({ message, subMessage, icon }) => (
    <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
        <div className="flex justify-center mb-4 text-gray-400 dark:text-gray-500">{icon}</div>
        <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">{message}</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subMessage}</p>
    </div>
);

const SkeletonList: React.FC = () => (
    <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
             <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 space-y-3 animate-pulse">
                <div className="flex justify-between items-start">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/5"></div>
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/5"></div>
                </div>
                <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
                <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                        <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    </div>
                </div>
            </div>
        ))}
    </div>
);


const ExpensesPage: React.FC = () => {
    const { loading, transactions, cropCycles, addTransaction, updateTransaction, deleteTransaction } = useContext(AppContext) as AppContextType;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [filterCycle, setFilterCycle] = useState('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP' }).format(amount);
    
    const handleSave = (transaction: Omit<Transaction, 'id'> | Transaction) => {
        if ('id' in transaction) {
            updateTransaction(transaction);
        } else {
            addTransaction(transaction);
        }
        setIsModalOpen(false);
        setEditingTransaction(undefined);
    };

    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setIsModalOpen(true);
    };
    
    const handleDelete = (id: string) => {
        setDeletingId(id);
    };

    const confirmDelete = () => {
        if (deletingId) {
            deleteTransaction(deletingId);
        }
        setDeletingId(null);
    };

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const typeMatch = t.type === TransactionType.EXPENSE;
            const cycleMatch = filterCycle === 'all' || t.cropCycleId === filterCycle;
            
            let dateMatch = true;
            if (dateRange.start || dateRange.end) {
                const transactionDate = new Date(t.date);
                const startDate = dateRange.start ? new Date(dateRange.start) : null;
                const endDate = dateRange.end ? new Date(dateRange.end) : null;
                if (startDate) startDate.setHours(0, 0, 0, 0);
                if (endDate) endDate.setHours(23, 59, 59, 999);
                
                dateMatch = (!startDate || transactionDate >= startDate) && (!endDate || transactionDate <= endDate);
            }

            return typeMatch && cycleMatch && dateMatch;
        });
    }, [transactions, filterCycle, dateRange]);

    const renderContent = () => {
        if (loading) {
            return <SkeletonList />;
        }
        if (filteredTransactions.length > 0) {
            return (
                <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        {['التاريخ', 'الوصف', 'التصنيف', 'العروة', 'المبلغ', 'الإجراءات'].map(h => 
                                        <th key={h} className="py-3 px-4 text-right font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{h}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredTransactions.map(t => (
                                        <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="py-4 px-4 whitespace-nowrap">{t.date}</td>
                                            <td className="py-4 px-4 whitespace-nowrap">{t.description}</td>
                                            <td className="py-4 px-4 whitespace-nowrap">{t.category}</td>
                                            <td className="py-4 px-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{cropCycles.find(c => c.id === t.cropCycleId)?.name ?? 'غير محدد'}</td>
                                            <td className="py-4 px-4 whitespace-nowrap font-medium text-red-600">{formatCurrency(t.amount)}</td>
                                            <td className="py-4 px-4 whitespace-nowrap font-medium">
                                                <div className="flex items-center space-x-2 space-x-reverse">
                                                    <button onClick={() => handleEdit(t)} className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50"><EditIcon className="w-5 h-5"/></button>
                                                    <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"><DeleteIcon className="w-5 h-5"/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                        {filteredTransactions.map(t => (
                            <div key={t.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <p className="font-bold text-gray-800 dark:text-white flex-1 pr-2">{t.description}</p>
                                    <p className="font-semibold text-red-600 whitespace-nowrap">{formatCurrency(t.amount)}</p>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                <p><strong className="font-medium text-gray-700 dark:text-gray-300">التصنيف:</strong> {t.category}</p>
                                <p><strong className="font-medium text-gray-700 dark:text-gray-300">العروة:</strong> {cropCycles.find(c => c.id === t.cropCycleId)?.name ?? 'غير محدد'}</p>
                                </div>
                                <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.date}</p>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <button onClick={() => handleEdit(t)} className="text-blue-500 hover:text-blue-700 p-1 rounded-full"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full"><DeleteIcon className="w-5 h-5"/></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            );
        }
        return (
             <EmptyState
                message="لا توجد مصروفات تطابق بحثك"
                subMessage="جرّب تغيير الفلاتر أو إضافة مصروف جديد."
                icon={<DocumentSearchIcon className="w-16 h-16"/>}
            />
        );
    };


    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <button onClick={() => { setEditingTransaction(undefined); setIsModalOpen(true); }} className="flex-shrink-0 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
                    <AddIcon className="w-5 h-5 ml-2" />
                    <span>إضافة مصروف</span>
                </button>
                <div className="flex-grow flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 min-w-[150px]">
                        <label htmlFor="filterCycle" className="sr-only">فلترة حسب العروة</label>
                        <select id="filterCycle" value={filterCycle} onChange={e => setFilterCycle(e.target.value)} className={filterInputClass}>
                            <option value="all">كل العروات</option>
                            {cropCycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                     <div className="flex-1 min-w-[150px]">
                        <label htmlFor="startDate" className="sr-only">من تاريخ</label>
                        <input type="date" id="startDate" value={dateRange.start} onChange={e => setDateRange(prev => ({...prev, start: e.target.value}))} className={filterInputClass}/>
                    </div>
                     <div className="flex-1 min-w-[150px]">
                        <label htmlFor="endDate" className="sr-only">إلى تاريخ</label>
                        <input type="date" id="endDate" value={dateRange.end} onChange={e => setDateRange(prev => ({...prev, end: e.target.value}))} className={filterInputClass}/>
                    </div>
                </div>
            </div>

            {renderContent()}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">{editingTransaction ? 'تعديل مصروف' : 'إضافة مصروف جديد'}</h2>
                        <TransactionForm 
                            transaction={editingTransaction}
                            onSave={handleSave} 
                            onCancel={() => { setIsModalOpen(false); setEditingTransaction(undefined); }} 
                            cycles={cropCycles} 
                        />
                    </div>
                </div>
            )}
            
            <ConfirmationModal
                isOpen={!!deletingId}
                onClose={() => setDeletingId(null)}
                onConfirm={confirmDelete}
                title="تأكيد الحذف"
                message="هل أنت متأكد من حذف هذا المصروف؟ لا يمكن التراجع عن هذا الإجراء."
            />
        </div>
    );
};

export default ExpensesPage;