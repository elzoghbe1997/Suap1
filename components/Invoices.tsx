import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { AppContextType, Transaction, CropCycle, TransactionType, CropCycleStatus, FertilizationProgram } from '../types';
import { ToastContext, ToastContextType } from '../context/ToastContext';
import { AddIcon, EditIcon, DeleteIcon, RevenueIcon, ArrowUpIcon, ArrowDownIcon, CloseIcon, InvoiceIcon } from './Icons';
import ConfirmationModal from './ConfirmationModal';
import Pagination from './Pagination';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter';
import InvoiceForm from './InvoiceForm';

const formInputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500";
const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP' }).format(amount);


const AnimatedNumber: React.FC<{ value: number }> = React.memo(({ value }) => {
    const count = useAnimatedCounter(value);
    return <>{formatCurrency(count)}</>;
});


const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string }> = React.memo(({ title, value, icon, color }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border-r-4 ${color}`}>
        <div className="flex items-center">
            <div className="flex-shrink-0">{icon}</div>
            <div className="mr-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    <AnimatedNumber value={value} />
                </p>
            </div>
        </div>
    </div>
));


// Skeleton component for loading state
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

interface InvoiceRowProps {
    invoice: Transaction;
    cropCycleName: string;
    onEdit: (invoice: Transaction) => void;
    onDelete: (id: string) => void;
    index: number;
}

const InvoiceRowDesktop: React.FC<InvoiceRowProps> = React.memo(({ invoice, cropCycleName, onEdit, onDelete, index }) => (
    <tr style={{ animationDelay: `${index * 50}ms` }} className="even:bg-gray-50 dark:even:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors duration-200 animate-fadeInSlideUp">
        <td className="py-4 px-4 whitespace-nowrap">{invoice.date}</td>
        <td className="py-4 px-4 whitespace-nowrap">{invoice.description}</td>
        <td className="py-4 px-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{cropCycleName}</td>
        <td className="py-4 px-4 whitespace-nowrap">{invoice.quantity?.toLocaleString() ?? '-'}</td>
        <td className="py-4 px-4 whitespace-nowrap font-medium text-green-600">{formatCurrency(invoice.amount)}</td>
        <td className="py-4 px-4 whitespace-nowrap font-medium">
            <div className="flex items-center space-x-2 space-x-reverse">
                <button onClick={() => onEdit(invoice)} className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50"><EditIcon className="w-5 h-5"/></button>
                <button onClick={() => onDelete(invoice.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"><DeleteIcon className="w-5 h-5"/></button>
            </div>
        </td>
    </tr>
));

const InvoiceRowMobile: React.FC<InvoiceRowProps> = React.memo(({ invoice, cropCycleName, onEdit, onDelete, index }) => (
    <div style={{ animationDelay: `${index * 50}ms` }} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 space-y-3 animate-fadeInSlideUp">
        <div className="flex justify-between items-start">
            <p className="font-bold text-gray-800 dark:text-white flex-1 pr-2">{invoice.description}</p>
            <p className="font-semibold text-green-600 whitespace-nowrap">{formatCurrency(invoice.amount)}</p>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
            <p><strong className="font-medium text-gray-700 dark:text-gray-300">العروة:</strong> {cropCycleName}</p>
            <p><strong className="font-medium text-gray-700 dark:text-gray-300">الكمية:</strong> {invoice.quantity?.toLocaleString() ?? '-'} ك.ج</p>
        </div>
        <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">{invoice.date}</p>
            <div className="flex items-center space-x-2 space-x-reverse">
                <button onClick={() => onEdit(invoice)} className="text-blue-500 hover:text-blue-700 p-1 rounded-full"><EditIcon className="w-5 h-5"/></button>
                <button onClick={() => onDelete(invoice.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full"><DeleteIcon className="w-5 h-5"/></button>
            </div>
        </div>
    </div>
));


// Main page component
const InvoicesPage: React.FC = () => {
    const { loading, transactions, cropCycles, fertilizationPrograms, addTransaction, updateTransaction, deleteTransaction } = React.useContext(AppContext) as AppContextType;
    const location = useLocation();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingInvoice, setEditingInvoice] = React.useState<Transaction | undefined>(undefined);
    const [deletingId, setDeletingId] = React.useState<string | null>(null);
    
    const [filterCycle, setFilterCycle] = React.useState('all');

    type SortDirection = 'ascending' | 'descending';
    type SortableKeys = 'date' | 'description' | 'cropCycleName' | 'quantity' | 'amount';
    const [sortConfig, setSortConfig] = React.useState<{ key: SortableKeys, direction: SortDirection } | null>({ key: 'date', direction: 'descending' });
    
    const [currentPage, setCurrentPage] = React.useState(1);
    const ITEMS_PER_PAGE = 10;
    
    React.useEffect(() => {
        const state = location.state as { action?: string };
        if (state?.action === 'add-invoice') {
            setEditingInvoice(undefined);
            setIsModalOpen(true);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate]);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [filterCycle]);

    const invoices = React.useMemo(() => {
        const activeCycleIds = new Set(cropCycles.filter(c => c.status === CropCycleStatus.ACTIVE).map(c => c.id));
        
        let filtered = transactions.filter(t => t.type === TransactionType.REVENUE && activeCycleIds.has(t.cropCycleId));
        
        if (filterCycle !== 'all') {
            filtered = filtered.filter(t => t.cropCycleId === filterCycle);
        }

        if (sortConfig !== null) {
            filtered.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                if (sortConfig.key === 'cropCycleName') {
                    aValue = cropCycles.find(c => c.id === a.cropCycleId)?.name ?? '';
                    bValue = cropCycles.find(c => c.id === b.cropCycleId)?.name ?? '';
                } else {
                    aValue = a[sortConfig.key as keyof Transaction];
                    bValue = b[sortConfig.key as keyof Transaction];
                }

                if (aValue === null || aValue === undefined) aValue = -Infinity;
                if (bValue === null || bValue === undefined) bValue = -Infinity;

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        
        return filtered;
    }, [transactions, filterCycle, sortConfig, cropCycles]);
    
    const totalRevenue = React.useMemo(() => invoices.reduce((sum, t) => sum + t.amount, 0), [invoices]);


    const handleSave = React.useCallback((invoice: Omit<Transaction, 'id'> | Transaction) => {
        if ('id' in invoice) {
            updateTransaction(invoice);
        } else {
            addTransaction(invoice);
        }
        setIsModalOpen(false);
        setEditingInvoice(undefined);
    }, [addTransaction, updateTransaction]);

    const handleEdit = React.useCallback((invoice: Transaction) => {
        setEditingInvoice(invoice);
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
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    }, [sortConfig]);

    const getSortIcon = (key: SortableKeys) => {
        if (!sortConfig || sortConfig.key !== key) {
             return <div className="w-4 h-4" />;
        }
        if (sortConfig.direction === 'ascending') {
            return <ArrowUpIcon className="w-4 h-4" />;
        }
        return <ArrowDownIcon className="w-4 h-4" />;
    };
    
    const TableHeader: React.FC<{ sortKey: SortableKeys; children: React.ReactNode; className?: string }> = ({ sortKey, children, className }) => (
        <th
            className={`py-3 px-4 text-right font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer ${className}`}
            onClick={() => requestSort(sortKey)}
        >
            <div className="flex items-center">
                <span>{children}</span>
                <span className="mr-2">{getSortIcon(sortKey)}</span>
            </div>
        </th>
    );


    const renderContent = () => {
        if (loading) return <SkeletonList />;

        if (invoices.length === 0) {
            return (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <div className="flex justify-center mb-4 text-gray-400 dark:text-gray-500">
                        <InvoiceIcon className="w-16 h-16"/>
                    </div>
                    <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">لا توجد فواتير للعروات النشطة</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">ابدأ بإضافة فاتورة لبيع المحصول في عروة نشطة.</p>
                </div>
            );
        }

        const totalPages = Math.ceil(invoices.length / ITEMS_PER_PAGE);
        const currentInvoices = invoices.slice(
            (currentPage - 1) * ITEMS_PER_PAGE,
            currentPage * ITEMS_PER_PAGE
        );

        return (
            <>
                {/* Desktop Table View */}
                <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <TableHeader sortKey="date">التاريخ</TableHeader>
                                    <TableHeader sortKey="description">الوصف</TableHeader>
                                    <TableHeader sortKey="cropCycleName">العروة</TableHeader>
                                    <TableHeader sortKey="quantity">الكمية (ك.ج)</TableHeader>
                                    <TableHeader sortKey="amount">المبلغ</TableHeader>
                                    <th className="py-3 px-4 text-right font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {currentInvoices.map((t, index) => (
                                    <InvoiceRowDesktop
                                        key={t.id}
                                        invoice={t}
                                        cropCycleName={cropCycles.find(c => c.id === t.cropCycleId)?.name ?? 'غير محدد'}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        index={index}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                    {currentInvoices.map((t, index) => (
                        <InvoiceRowMobile
                           key={t.id}
                           invoice={t}
                           cropCycleName={cropCycles.find(c => c.id === t.cropCycleId)?.name ?? 'غير محدد'}
                           onEdit={handleEdit}
                           onDelete={handleDelete}
                           index={index}
                        />
                    ))}
                </div>
                <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </>
        );
    }
    
    return (
        <div className="space-y-6">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 <StatCard 
                    title="إجمالي الإيرادات (للعروات النشطة)" 
                    value={totalRevenue} 
                    icon={<RevenueIcon className="h-8 w-8 text-green-500"/>} 
                    color="border-green-500" 
                />
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                 <button onClick={() => { setEditingInvoice(undefined); setIsModalOpen(true); }} className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
                    <AddIcon className="w-5 h-5 ml-2" />
                    <span>إضافة فاتورة</span>
                </button>
                 <div className="flex-1 min-w-[150px] sm:max-w-xs">
                    <select id="filterCycle" value={filterCycle} onChange={e => setFilterCycle(e.target.value)} className={formInputClass.replace('mt-1', '')}>
                        <option value="all">كل العروات النشطة</option>
                        {cropCycles.filter(c => c.status === CropCycleStatus.ACTIVE).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>
            
            {renderContent()}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">{editingInvoice ? 'تعديل فاتورة' : 'إضافة فاتورة جديدة'}</h2>
                        <InvoiceForm
                            invoice={editingInvoice}
                            onSave={handleSave} 
                            onCancel={() => { setIsModalOpen(false); setEditingInvoice(undefined); }} 
                            cycles={cropCycles}
                            fertilizationPrograms={fertilizationPrograms}
                        />
                    </div>
                </div>
            )}
            
            <ConfirmationModal
                isOpen={!!deletingId}
                onClose={() => setDeletingId(null)}
                onConfirm={confirmDelete}
                title="تأكيد حذف الفاتورة"
                message="هل أنت متأكد من حذف هذه الفاتورة؟"
            />
        </div>
    );
};

export default InvoicesPage;