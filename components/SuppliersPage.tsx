import React from 'react';
import { AppContext } from '../App';
import { AppContextType, TransactionType, Supplier, SupplierPayment, Transaction } from '../types';
import { SupplierIcon, InvoiceIcon, ExpenseIcon, ProfitIcon, AddIcon, EditIcon, DeleteIcon, ReportIcon, CloseIcon } from './Icons';
import { ToastContext, ToastContextType } from '../context/ToastContext';
import ConfirmationModal from './ConfirmationModal';
import SkeletonCard from './SkeletonCard';
import Pagination from './Pagination';

const formInputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500";
const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP' }).format(amount);


// Supplier Form
const SupplierForm: React.FC<{ supplier?: Supplier; onSave: (supplier: Omit<Supplier, 'id'> | Supplier) => void; onCancel: () => void }> = ({ supplier, onSave, onCancel }) => {
    const [name, setName] = React.useState(supplier?.name || '');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(supplier ? { ...supplier, name } : { name });
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">اسم المورد</label>
                <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className={formInputClass}/>
            </div>
            <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">إلغاء</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">حفظ</button>
            </div>
        </form>
    );
};

// Payment Form
const PaymentForm: React.FC<{ payment?: SupplierPayment; suppliers: Supplier[]; onSave: (payment: Omit<SupplierPayment, 'id'> | SupplierPayment) => void; onCancel: () => void }> = ({ payment, suppliers, onSave, onCancel }) => {
    const { addToast } = React.useContext(ToastContext) as ToastContextType;
    const { transactions } = React.useContext(AppContext) as AppContextType;

    const [date, setDate] = React.useState(payment?.date || new Date().toISOString().split('T')[0]);
    const [amount, setAmount] = React.useState(payment?.amount?.toString() || '');
    const [supplierId, setSupplierId] = React.useState(payment?.supplierId || '');
    const [description, setDescription] = React.useState(payment?.description || '');

    const [linkedExpenseIds, setLinkedExpenseIds] = React.useState<string[]>(payment?.linkedExpenseIds || []);
    const [showLinker, setShowLinker] = React.useState(false);

    const availableExpenses = React.useMemo(() => {
        if (!supplierId) return [];
        return transactions
            .filter(t => t.supplierId === supplierId && t.type === TransactionType.EXPENSE)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [supplierId, transactions]);

    const handleLinkToggle = (expenseId: string) => {
        setLinkedExpenseIds(prev => 
            prev.includes(expenseId) 
                ? prev.filter(id => id !== expenseId) 
                : [...prev, expenseId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (Number(amount) <= 0) {
            addToast('المبلغ يجب أن يكون أكبر من صفر.', 'error');
            return;
        }
        const data = { date, amount: Number(amount), supplierId, description, linkedExpenseIds };
        onSave(payment ? { ...payment, ...data } : data);
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="supplierId" className="block text-sm font-medium">المورد</label>
                    <select id="supplierId" value={supplierId} onChange={e => setSupplierId(e.target.value)} required className={formInputClass}>
                        <option value="" disabled>اختر موردًا</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="date" className="block text-sm font-medium">تاريخ الدفعة</label>
                    <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className={formInputClass}/>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="amount" className="block text-sm font-medium">المبلغ (ج.م)</label>
                    <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)} required min="0.01" step="0.01" className={formInputClass}/>
                </div>
                 <div>
                    <label htmlFor="description" className="block text-sm font-medium">الوصف</label>
                    <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} required className={formInputClass}/>
                </div>
            </div>

            <div className="mt-4">
                <button type="button" onClick={() => setShowLinker(!showLinker)} className="w-full text-sm text-green-600 dark:text-green-400 hover:underline disabled:text-gray-400 disabled:no-underline" disabled={!supplierId}>
                    {showLinker ? 'إخفاء الفواتير' : '+ ربط بفواتير مشتريات'}
                </button>
            </div>

            {showLinker && supplierId && (
                <div className="mt-2 border-t dark:border-gray-700 pt-4">
                    <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">اختر الفواتير لربطها بهذه الدفعة:</h3>
                    {availableExpenses.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto p-2 border rounded-md dark:border-gray-600">
                            {availableExpenses.map(exp => (
                                <label key={exp.id} htmlFor={`exp-${exp.id}`} className="flex items-center p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        id={`exp-${exp.id}`}
                                        checked={linkedExpenseIds.includes(exp.id)}
                                        onChange={() => handleLinkToggle(exp.id)}
                                        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                    />
                                    <div className="mr-3 flex-grow">
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{exp.description}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{exp.date} - {formatCurrency(exp.amount)}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-4">لا توجد فواتير آجلة لهذا المورد.</p>
                    )}
                </div>
            )}

            <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">إلغاء</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">حفظ الدفعة</button>
            </div>
        </form>
    );
};


// Stat Card
const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        <div className="flex items-center">
            {icon}
            <div className="mr-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-xl font-bold text-gray-800 dark:text-gray-200">{value}</p>
            </div>
        </div>
    </div>
);

// Details Modal
const DetailsModal: React.FC<{ supplier: Supplier; transactions: Transaction[]; payments: SupplierPayment[]; onClose: () => void }> = ({ supplier, transactions, payments, onClose }) => {
    const { cropCycles } = React.useContext(AppContext) as AppContextType;
    const [currentPage, setCurrentPage] = React.useState(1);
    const ITEMS_PER_PAGE = 10;
    
    const combinedLedger = React.useMemo(() => {
        const invoices = transactions.map(t => {
            const linkedPayments = payments.filter(p => p.linkedExpenseIds?.includes(t.id));
            const paidAmount = linkedPayments.reduce((sum, p) => sum + p.amount, 0);
            return {
                ...t, 
                type: 'invoice' as const, 
                paidAmount,
                remainingAmount: t.amount - paidAmount
            };
        });

        const paid = payments.map(p => {
            const linkedInvoices = p.linkedExpenseIds
                ?.map(id => transactions.find(t => t.id === id))
                .filter((t): t is Transaction => !!t);
            return { ...p, type: 'payment' as const, linkedInvoices };
        });

        return [...invoices, ...paid].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, payments]);

    const totalInvoices = React.useMemo(() => transactions.reduce((sum, t) => sum + t.amount, 0), [transactions]);
    const totalPayments = React.useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments]);
    const balance = totalInvoices - totalPayments;

    const totalPages = Math.ceil(combinedLedger.length / ITEMS_PER_PAGE);
    const currentLedgerItems = combinedLedger.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">كشف حساب: {supplier.name}</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><CloseIcon className="w-6 h-6" /></button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <StatCard title="إجمالي الفواتير" value={formatCurrency(totalInvoices)} icon={<InvoiceIcon className="w-7 h-7 text-red-500" />} />
                    <StatCard title="إجمالي المدفوعات" value={formatCurrency(totalPayments)} icon={<ExpenseIcon className="w-7 h-7 text-green-500" />} />
                    <StatCard title="الرصيد النهائي" value={formatCurrency(balance)} icon={<ProfitIcon className={`w-7 h-7 ${balance > 0 ? 'text-red-500' : (balance < 0 ? 'text-blue-500' : 'text-gray-500')}`} />} />
                </div>

                <div className="flex-grow overflow-y-auto pr-2">
                {combinedLedger.length > 0 ? (
                    <>
                        <div className="space-y-3">
                            {currentLedgerItems.map(item => (
                                <div key={`${item.type}-${item.id}`} className="p-3 rounded-md border dark:border-gray-700 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                    <div className="flex-grow">
                                        <p className={`font-semibold ${item.type === 'invoice' ? 'text-red-600' : 'text-green-600'}`}>{item.type === 'invoice' ? 'فاتورة مشتريات' : 'دفعة مسددة'}</p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                          {item.description}
                                          {item.type === 'invoice' && <span className="text-gray-500 dark:text-gray-400"> ({cropCycles.find(c => c.id === item.cropCycleId)?.name || 'عروة محذوفة'})</span>}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.date}</p>
                                        {item.type === 'payment' && item.linkedInvoices && item.linkedInvoices.length > 0 && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                                                يسدد: {item.linkedInvoices.map(inv => inv.description).join(', ')}
                                            </p>
                                        )}
                                        {item.type === 'invoice' && item.paidAmount > 0 && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-4">
                                                <span>مدفوع: <span className="font-medium text-green-600">{formatCurrency(item.paidAmount)}</span></span>
                                                <span>متبقي: <span className="font-medium text-red-600">{formatCurrency(item.remainingAmount)}</span></span>
                                            </div>
                                        )}
                                    </div>
                                    <p className={`text-lg font-bold whitespace-nowrap ${item.type === 'invoice' ? 'text-red-600' : 'text-green-600'}`}>
                                        {item.type === 'invoice' ? '-' : '+'} {formatCurrency(item.amount)}
                                    </p>
                                </div>
                            ))}
                        </div>
                         <Pagination 
                           currentPage={currentPage}
                           totalPages={totalPages}
                           onPageChange={setCurrentPage}
                        />
                    </>
                 ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-16">لا توجد معاملات مسجلة لهذا المورد.</p>
                 )}
                </div>
            </div>
        </div>
    );
};


// Main Page
const SuppliersPage: React.FC = () => {
    const context = React.useContext(AppContext);
    if (!context) return null;
    const { loading, settings, suppliers, transactions, supplierPayments, addSupplier, updateSupplier, deleteSupplier, addSupplierPayment, updateSupplierPayment, deleteSupplierPayment } = context;

    const [modal, setModal] = React.useState<'ADD_SUPPLIER' | 'EDIT_SUPPLIER' | 'ADD_PAYMENT' | 'VIEW_DETAILS' | null>(null);
    const [selectedSupplier, setSelectedSupplier] = React.useState<Supplier | undefined>(undefined);
    const [deletingId, setDeletingId] = React.useState<string | null>(null);


    const supplierAccountData = React.useMemo(() => {
        return suppliers.map(supplier => {
            const supplierInvoices = transactions.filter(t => t.supplierId === supplier.id && t.type === TransactionType.EXPENSE && (t.category === 'أسمدة ومغذيات' || t.category === 'مبيدات'));
            const supplierPaymentsList = supplierPayments.filter(p => p.supplierId === supplier.id);
            
            const totalInvoices = supplierInvoices.reduce((sum, t) => sum + t.amount, 0);
            const totalPayments = supplierPaymentsList.reduce((sum, p) => sum + p.amount, 0);
            const balance = totalInvoices - totalPayments;

            return { ...supplier, totalInvoices, totalPayments, balance, invoices: supplierInvoices, payments: supplierPaymentsList };
        });
    }, [suppliers, transactions, supplierPayments]);

    const handleSaveSupplier = (data: Omit<Supplier, 'id'> | Supplier) => {
        if ('id' in data) updateSupplier(data);
        else addSupplier(data);
        setModal(null);
    };

    const handleSavePayment = (data: Omit<SupplierPayment, 'id'> | SupplierPayment) => {
        if ('id' in data) updateSupplierPayment(data as SupplierPayment);
        else addSupplierPayment(data);
        setModal(null);
    };

    const confirmDelete = () => {
        if (deletingId) deleteSupplier(deletingId);
        setDeletingId(null);
    };
    
     if (!settings.isSupplierSystemEnabled) {
        return (
             <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">نظام الموردين غير مفعل</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    يرجى تفعيل "نظام الموردين" من صفحة <a href="#/settings" className="text-green-600 hover:underline">الإعدادات</a> لعرض هذه الصفحة.
                </p>
            </div>
        );
    }

    const renderContent = () => {
        if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">{[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}</div>;
        if (supplierAccountData.length === 0) return (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
                <SupplierIcon className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4"/>
                <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">لا يوجد موردين مسجلين</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">ابدأ بإضافة الموردين لتتبع حساباتهم.</p>
            </div>
        );
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {supplierAccountData.map(s => {
                    const hasFinancials = s.invoices.length > 0 || s.payments.length > 0;
                    return (
                        <div key={s.id} className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md hover:shadow-xl transition-shadow flex flex-col justify-between">
                            <div>
                                <div className="flex items-center mb-4">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full mr-3"><SupplierIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" /></div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">{s.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">مورد أسمدة ومبيدات</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <StatCard title="إجمالي الفواتير" value={formatCurrency(s.totalInvoices)} icon={<InvoiceIcon className="w-7 h-7 text-red-500" />} />
                                    <StatCard title="إجمالي المدفوعات" value={formatCurrency(s.totalPayments)} icon={<ExpenseIcon className="w-7 h-7 text-green-500" />} />
                                    <StatCard title="الرصيد المتبقي" value={formatCurrency(s.balance)} icon={<ProfitIcon className={`w-7 h-7 ${s.balance > 0 ? 'text-red-500' : (s.balance < 0 ? 'text-blue-500' : 'text-gray-500')}`} />} />
                                </div>
                            </div>
                            <div className="flex justify-between items-center mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
                                <button onClick={() => { setSelectedSupplier(s); setModal('VIEW_DETAILS'); }} className="flex items-center px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">
                                    <ReportIcon className="w-4 h-4 ml-1.5"/><span>كشف حساب</span>
                                </button>
                                <div className="flex items-center space-x-1 space-x-reverse">
                                    <button onClick={() => { setSelectedSupplier(s); setModal('EDIT_SUPPLIER'); }} className="p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><EditIcon className="w-5 h-5"/></button>
                                    <button 
                                        onClick={() => setDeletingId(s.id)}
                                        disabled={hasFinancials}
                                        className={`p-2 text-gray-400 rounded-full transition-colors ${
                                            hasFinancials
                                            ? 'cursor-not-allowed text-gray-300 dark:text-gray-600'
                                            : 'hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        <DeleteIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">حسابات الموردين</h1>
                    <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">إدارة ومتابعة الفواتير الآجلة والمدفوعات للموردين.</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                    <button onClick={() => { setSelectedSupplier(undefined); setModal('ADD_SUPPLIER'); }} className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700">
                        <AddIcon className="w-5 h-5 ml-2" /><span>إضافة مورد</span>
                    </button>
                     <button onClick={() => setModal('ADD_PAYMENT')} className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700">
                        <AddIcon className="w-5 h-5 ml-2" /><span>إضافة دفعة</span>
                    </button>
                </div>
            </div>
            {renderContent()}

            {/* Modals */}
            {(modal === 'ADD_SUPPLIER' || modal === 'EDIT_SUPPLIER') && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4">{modal === 'EDIT_SUPPLIER' ? 'تعديل مورد' : 'إضافة مورد جديد'}</h2>
                        <SupplierForm supplier={selectedSupplier} onSave={handleSaveSupplier} onCancel={() => setModal(null)} />
                    </div>
                </div>
            )}
            {modal === 'ADD_PAYMENT' && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4">إضافة دفعة للمورد</h2>
                        <PaymentForm suppliers={suppliers} onSave={handleSavePayment} onCancel={() => setModal(null)} />
                    </div>
                </div>
            )}
            {modal === 'VIEW_DETAILS' && selectedSupplier && (
                <DetailsModal supplier={selectedSupplier} transactions={supplierAccountData.find(s=>s.id === selectedSupplier.id)?.invoices || []} payments={supplierAccountData.find(s=>s.id === selectedSupplier.id)?.payments || []} onClose={() => setModal(null)} />
            )}
            <ConfirmationModal isOpen={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={confirmDelete} title="تأكيد حذف المورد" message="هل أنت متأكد من حذف هذا المورد؟ لا يمكن التراجع عن هذا الإجراء." />
        </div>
    );
};

export default SuppliersPage;