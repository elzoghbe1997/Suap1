import React, { useState, useMemo, useEffect, useCallback, useRef, useContext } from 'react';
import { AppContext } from '../App';
import { AppContextType, TransactionType, Supplier, SupplierPayment, Transaction, CropCycle, CropCycleStatus } from '../types';
import { SupplierIcon, InvoiceIcon, ExpenseIcon, ProfitIcon, AddIcon, EditIcon, DeleteIcon, ReportIcon, CloseIcon } from './Icons';
import { ToastContext, ToastContextType } from '../context/ToastContext';
import ConfirmationModal from './ConfirmationModal';
import SkeletonCard from './SkeletonCard';
import Pagination from './Pagination';

const formInputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500";
const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP' }).format(amount);


// Supplier Form
const SupplierForm: React.FC<{ supplier?: Supplier; onSave: (supplier: Omit<Supplier, 'id'> | Supplier) => void; onCancel: () => void }> = ({ supplier, onSave, onCancel }) => {
    const [name, setName] = useState(supplier?.name || '');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(supplier ? { ...supplier, name } : { name });
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">اسم المورد</label>
                <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className={formInputClass}/>
            </div>
            <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">إلغاء</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">حفظ</button>
            </div>
        </form>
    );
};

// Payment Form
const PaymentForm: React.FC<{ payment?: SupplierPayment; suppliers: Supplier[]; onSave: (payment: Omit<SupplierPayment, 'id'> | SupplierPayment) => void; onCancel: () => void; cropCycles: CropCycle[]; }> = ({ payment, suppliers, onSave, onCancel, cropCycles }) => {
    const { addToast } = useContext(ToastContext) as ToastContextType;
    const { transactions } = useContext(AppContext) as AppContextType;

    const [date, setDate] = useState(payment?.date || new Date().toISOString().split('T')[0]);
    const [amount, setAmount] = useState(payment?.amount?.toString() || '');
    const [supplierId, setSupplierId] = useState(payment?.supplierId || '');
    const [cropCycleId, setCropCycleId] = useState(payment?.cropCycleId || '');
    const [description, setDescription] = useState(payment?.description || '');

    const [linkedExpenseIds, setLinkedExpenseIds] = useState<string[]>(payment?.linkedExpenseIds || []);
    const [showLinker, setShowLinker] = useState(false);

    const selectableCycles = useMemo(() => {
        const available = cropCycles.filter(
            c => c.status === CropCycleStatus.ACTIVE || c.status === CropCycleStatus.CLOSED
        );
        if (payment?.cropCycleId) {
            const existingCycle = cropCycles.find(c => c.id === payment.cropCycleId);
            if (existingCycle && !available.some(ac => ac.id === existingCycle.id)) {
                return [...available, existingCycle].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
            }
        }
        return available.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    }, [cropCycles, payment]);

    useEffect(() => {
        if (!payment && selectableCycles.length === 1) {
            setCropCycleId(selectableCycles[0].id);
        }
    }, [selectableCycles, payment]);

    const availableExpenses = useMemo(() => {
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
        if (!cropCycleId) {
            addToast('يجب اختيار العروة.', 'error');
            return;
        }
        const data = { date, amount: Number(amount), supplierId, description, cropCycleId, linkedExpenseIds };
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
                    <label htmlFor="cropCycleId" className="block text-sm font-medium">العروة</label>
                    <select id="cropCycleId" value={cropCycleId} onChange={e => setCropCycleId(e.target.value)} required className={formInputClass}>
                        <option value="" disabled>اختر عروة</option>
                        {selectableCycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="amount" className="block text-sm font-medium">المبلغ (ج.م)</label>
                    <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)} required min="0.01" step="0.01" className={formInputClass}/>
                </div>
                <div>
                    <label htmlFor="date" className="block text-sm font-medium">تاريخ الدفعة</label>
                    <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className={formInputClass}/>
                </div>
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium">الوصف</label>
                <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} required className={formInputClass}/>
            </div>

            <div className="mt-4">
                <button type="button" onClick={() => setShowLinker(!showLinker)} className="w-full text-sm text-green-600 dark:text-green-400 hover:underline disabled:text-slate-400 disabled:no-underline" disabled={!supplierId}>
                    {showLinker ? 'إخفاء الفواتير' : '+ ربط بفواتير مشتريات'}
                </button>
            </div>

            {showLinker && supplierId && (
                <div className="mt-2 border-t dark:border-slate-700 pt-4">
                    <h3 className="text-md font-medium text-slate-700 dark:text-slate-300 mb-2">اختر الفواتير لربطها بهذه الدفعة:</h3>
                    {availableExpenses.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto p-2 border rounded-md dark:border-slate-600">
                            {availableExpenses.map(exp => (
                                <label key={exp.id} htmlFor={`exp-${exp.id}`} className="flex items-center p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        id={`exp-${exp.id}`}
                                        checked={linkedExpenseIds.includes(exp.id)}
                                        onChange={() => handleLinkToggle(exp.id)}
                                        className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                                    />
                                    <div className="mr-3 flex-grow">
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{exp.description}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{exp.date} - {formatCurrency(exp.amount)}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-center text-slate-500 dark:text-slate-400 py-4">لا توجد فواتير آجلة لهذا المورد.</p>
                    )}
                </div>
            )}

            <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">إلغاء</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">حفظ الدفعة</button>
            </div>
        </form>
    );
};


// Stat Card
const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
        <div className="flex items-center">
            {icon}
            <div className="mr-3">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-200">{value}</p>
            </div>
        </div>
    </div>
);

// Details Modal
const DetailsModal: React.FC<{ supplier: Supplier; transactions: Transaction[]; payments: SupplierPayment[]; onClose: () => void }> = ({ supplier, transactions, payments, onClose }) => {
    const { cropCycles } = useContext(AppContext) as AppContextType;
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    
    const combinedLedger = useMemo(() => {
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

    const totalInvoices = useMemo(() => transactions.reduce((sum, t) => sum + t.amount, 0), [transactions]);
    const totalPayments = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments]);
    const balance = totalInvoices - totalPayments;

    const totalPages = Math.ceil(combinedLedger.length / ITEMS_PER_PAGE);
    const currentLedgerItems = combinedLedger.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">كشف حساب: {supplier.name}</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><CloseIcon className="w-6 h-6" /></button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <StatCard title="إجمالي الفواتير" value={formatCurrency(totalInvoices)} icon={<InvoiceIcon className="w-7 h-7 text-red-500" />} />
                    <StatCard title="إجمالي المدفوعات" value={formatCurrency(totalPayments)} icon={<ExpenseIcon className="w-7 h-7 text-green-500" />} />
                    <StatCard title="الرصيد النهائي" value={formatCurrency(balance)} icon={<ProfitIcon className={`w-7 h-7 ${balance > 0 ? 'text-red-500' : (balance < 0 ? 'text-blue-500' : 'text-slate-500')}`} />} />
                </div>

                <div className="flex-grow overflow-y-auto pr-2 modal-scroll-contain">
                {combinedLedger.length > 0 ? (
                    <>
                        <div className="space-y-3">
                            {currentLedgerItems.map((item) =>
                                item.type === 'invoice'
                                ? (
                                    <div key={`ledger-${item.id}`} className="p-3 bg-red-50 dark:bg-red-900/30 rounded-md">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-slate-800 dark:text-white">{item.description}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{item.date} - فاتورة مشتريات (من عروة: {cropCycles.find(c => c.id === item.cropCycleId)?.name || 'غير محدد'})</p>
                                            </div>
                                            <p className="font-bold text-red-600 dark:text-red-400">-{formatCurrency(item.amount)}</p>
                                        </div>
                                        {item.remainingAmount > 0 && <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">المتبقي للدفع من هذه الفاتورة: {formatCurrency(item.remainingAmount)}</p>}
                                    </div>
                                )
                                : ( // payment
                                    <div key={`ledger-${item.id}`} className="p-3 bg-green-50 dark:bg-green-900/30 rounded-md">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-slate-800 dark:text-white">{item.description}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{item.date} - دفعة مورد (من عروة: {cropCycles.find(c => c.id === item.cropCycleId)?.name || 'غير محدد'})</p>
                                            </div>
                                            <p className="font-bold text-green-600 dark:text-green-400">+{formatCurrency(item.amount)}</p>
                                        </div>
                                        {item.linkedInvoices && item.linkedInvoices.length > 0 && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">مرتبطة بفاتورة: {item.linkedInvoices.map(inv => inv.description).join(', ')}</p>}
                                    </div>
                                )
                            )}
                        </div>
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </>
                ) : (
                    <p className="text-center py-10 text-slate-500 dark:text-slate-400">لا توجد معاملات لهذا المورد.</p>
                )}
                </div>
            </div>
        </div>
    );
};

// Supplier Card
const SupplierCard: React.FC<{
    supplierData: { id: string; name: string; totalInvoices: number; totalPayments: number; balance: number; isDeletable: boolean; };
    onEdit: (supplier: Supplier) => void;
    onDelete: (id: string) => void;
    onDetails: (supplier: Supplier) => void;
}> = React.memo(({ supplierData, onEdit, onDelete, onDetails }) => {
    const supplier = {id: supplierData.id, name: supplierData.name};
    
    return (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between">
            <div>
                <div className="flex items-center mb-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full mr-3">
                        <SupplierIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">{supplierData.name}</h3>
                </div>
                <div className="space-y-3">
                    <StatCard title="إجمالي الفواتير" value={formatCurrency(supplierData.totalInvoices)} icon={<InvoiceIcon className="w-7 h-7 text-red-500" />} />
                    <StatCard title="إجمالي المدفوعات" value={formatCurrency(supplierData.totalPayments)} icon={<ExpenseIcon className="w-7 h-7 text-green-500" />} />
                    <StatCard title="الرصيد المستحق" value={formatCurrency(supplierData.balance)} icon={<ProfitIcon className={`w-7 h-7 ${supplierData.balance > 0 ? 'text-red-500' : 'text-slate-500'}`} />} />
                </div>
            </div>
            <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-3 flex justify-between items-center">
                <button onClick={() => onDetails(supplier)} className="flex items-center px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600">
                    <ReportIcon className="w-4 h-4 ml-1.5"/><span>كشف حساب</span>
                </button>
                <div className="flex items-center space-x-1 space-x-reverse">
                    <button onClick={() => onEdit(supplier)} className="p-2 text-slate-400 hover:text-blue-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" aria-label={`تعديل ${supplier.name}`}><EditIcon className="w-5 h-5"/></button>
                    <button
                        onClick={() => onDelete(supplier.id)}
                        disabled={!supplierData.isDeletable}
                        className={`p-2 text-slate-400 rounded-full transition-colors ${
                            !supplierData.isDeletable
                            ? 'cursor-not-allowed text-slate-300 dark:text-slate-600'
                            : 'hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                        title={!supplierData.isDeletable ? 'لا يمكن حذف مورد رصيده غير صفري' : 'حذف المورد'}
                        aria-label={`حذف ${supplier.name}`}
                    >
                        <DeleteIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        </div>
    );
});

// Main Page Component
const SuppliersPage: React.FC = () => {
    const { loading, suppliers, transactions, supplierPayments, cropCycles, addSupplier, updateSupplier, deleteSupplier, addSupplierPayment, updateSupplierPayment, deleteSupplierPayment, settings } = useContext(AppContext) as AppContextType;

    const [modal, setModal] = useState<'ADD_SUPPLIER' | 'EDIT_SUPPLIER' | 'ADD_PAYMENT' | 'EDIT_PAYMENT' | 'DETAILS' | null>(null);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | undefined>(undefined);
    const [selectedPayment, setSelectedPayment] = useState<SupplierPayment | undefined>(undefined);
    // FIX: Rewrote useState call to use type assertion on the initial value instead of a generic type argument to work around a potential tooling issue.
    const [deletingId, setDeletingId] = useState(null as {id: string, type: 'supplier' | 'payment'} | null);
    const modalRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        const isAnyModalOpen = modal !== null || !!deletingId;
        if (isAnyModalOpen) {
            document.body.classList.add('body-no-scroll');
        } else {
            document.body.classList.remove('body-no-scroll');
        }
        return () => {
            document.body.classList.remove('body-no-scroll');
        };
    }, [modal, deletingId]);

    // Focus Trap and Escape key handler for forms
    useEffect(() => {
        const isFormOpen = modal === 'ADD_SUPPLIER' || modal === 'EDIT_SUPPLIER' || modal === 'ADD_PAYMENT' || modal === 'EDIT_PAYMENT';
        if (!isFormOpen) return;
        
        const modalNode = modalRef.current;
        if (!modalNode) return;

        const focusableElements = modalNode.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableElements.length === 0) return;
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setModal(null);
            if (e.key === 'Tab') {
                if (e.shiftKey) { if (document.activeElement === firstElement) { lastElement.focus(); e.preventDefault(); }
                } else { if (document.activeElement === lastElement) { firstElement.focus(); e.preventDefault(); } }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        firstElement?.focus();
        
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [modal]);

    const supplierAccountData = useMemo(() => {
        const transactionsBySupplier = new Map<string, Transaction[]>();
        transactions.forEach(t => {
            if (t.supplierId && t.type === TransactionType.EXPENSE) {
                if (!transactionsBySupplier.has(t.supplierId)) {
                    transactionsBySupplier.set(t.supplierId, []);
                }
                transactionsBySupplier.get(t.supplierId)!.push(t);
            }
        });

        const paymentsBySupplier = new Map<string, SupplierPayment[]>();
        supplierPayments.forEach(p => {
            if (!paymentsBySupplier.has(p.supplierId)) {
                paymentsBySupplier.set(p.supplierId, []);
            }
            paymentsBySupplier.get(p.supplierId)!.push(p);
        });

        return suppliers.map(supplier => {
            const supplierTransactions = transactionsBySupplier.get(supplier.id) || [];
            const totalInvoices = supplierTransactions.reduce((sum, t) => sum + t.amount, 0);
            
            const payments = paymentsBySupplier.get(supplier.id) || [];
            const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
            
            const balance = totalInvoices - totalPayments;
            const isDeletable = Math.abs(balance) < 0.01;
            return { ...supplier, totalInvoices, totalPayments, balance, isDeletable };
        });
    }, [suppliers, transactions, supplierPayments]);

    const handleSaveSupplier = useCallback((supplier: Omit<Supplier, 'id'> | Supplier) => {
        if ('id' in supplier) updateSupplier(supplier); else addSupplier(supplier);
        setModal(null);
    }, [updateSupplier, addSupplier]);

    const handleSavePayment = useCallback((payment: Omit<SupplierPayment, 'id'> | SupplierPayment) => {
        if ('id' in payment) updateSupplierPayment(payment); else addSupplierPayment(payment);
        setModal(null);
    }, [updateSupplierPayment, addSupplierPayment]);

    const confirmDelete = useCallback(() => {
        if (!deletingId) return;
        if (deletingId.type === 'supplier') deleteSupplier(deletingId.id);
        else deleteSupplierPayment(deletingId.id);
        setDeletingId(null);
    }, [deletingId, deleteSupplier, deleteSupplierPayment]);
    
    const handleEdit = useCallback((supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setModal('EDIT_SUPPLIER');
    }, []);

    const handleDelete = useCallback((id: string) => {
        setDeletingId({ id, type: 'supplier' });
    }, []);

    const handleDetails = useCallback((supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setModal('DETAILS');
    }, []);


    if (!settings.isSupplierSystemEnabled) {
        return (
             <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">نظام الموردين غير مفعل</h2>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                    يرجى تفعيل "نظام الموردين" من صفحة <a href="#/settings" className="text-green-600 hover:underline">الإعدادات</a> لعرض هذه الصفحة.
                </p>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">حسابات الموردين</h1>
                    <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">إدارة ومتابعة فواتير الموردين الآجلة والمدفوعات.</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                    <button onClick={() => setModal('ADD_SUPPLIER')} className="flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-md shadow-sm hover:bg-emerald-700">
                        <AddIcon className="w-5 h-5 ml-2" /><span>إضافة مورد</span>
                    </button>
                     <button onClick={() => setModal('ADD_PAYMENT')} className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700">
                        <AddIcon className="w-5 h-5 ml-2" /><span>إضافة دفعة</span>
                    </button>
                </div>
            </div>

            {loading ? <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">{[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}</div> : supplierAccountData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {supplierAccountData.map(s => (
                        <SupplierCard key={s.id} supplierData={s} 
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onDetails={handleDetails}
                        />
                    ))}
                </div>
            ) : (
                 <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <SupplierIcon className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-500 mb-4"/>
                    <p className="text-lg font-semibold text-slate-600 dark:text-slate-300">لا يوجد موردين مسجلين</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">ابدأ بإضافة مورد جديد لتتبع فواتيره.</p>
                </div>
            )}
            
            {(modal === 'ADD_SUPPLIER' || modal === 'EDIT_SUPPLIER') && <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={() => setModal(null)}><div ref={modalRef} className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}><div className="p-6 pb-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0"><h2 className="text-2xl font-bold">{modal === 'EDIT_SUPPLIER' ? 'تعديل مورد' : 'إضافة مورد جديد'}</h2></div><div className="p-6 flex-grow overflow-y-auto modal-scroll-contain"><SupplierForm supplier={selectedSupplier} onSave={handleSaveSupplier} onCancel={() => setModal(null)} /></div></div></div>}
            {(modal === 'ADD_PAYMENT' || modal === 'EDIT_PAYMENT') && <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={() => setModal(null)}><div ref={modalRef} className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}><div className="p-6 pb-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0"><h2 className="text-2xl font-bold">{modal === 'EDIT_PAYMENT' ? 'تعديل دفعة' : 'إضافة دفعة جديدة'}</h2></div><div className="p-6 flex-grow overflow-y-auto modal-scroll-contain"><PaymentForm payment={selectedPayment} suppliers={suppliers} cropCycles={cropCycles} onSave={handleSavePayment} onCancel={() => setModal(null)} /></div></div></div>}
            {modal === 'DETAILS' && selectedSupplier && <DetailsModal supplier={selectedSupplier} transactions={transactions.filter(t=>t.supplierId === selectedSupplier.id)} payments={supplierPayments.filter(p=>p.supplierId === selectedSupplier.id)} onClose={() => setModal(null)} />}
            <ConfirmationModal isOpen={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={confirmDelete} title="تأكيد الحذف" message={`هل أنت متأكد من حذف هذا ${deletingId?.type === 'supplier' ? 'المورد' : 'الدفعة'}؟`} />
        </div>
    );
};

export default SuppliersPage;