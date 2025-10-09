import React from 'react';
import { AppContext } from '../../App';
import { AppContextType, CropCycle, FarmerWithdrawal, TransactionType } from '../../types';
import { ToastContext, ToastContextType } from '../../context/ToastContext';
import { AddIcon, EditIcon, DeleteIcon, RevenueIcon, ExpenseIcon, ProfitIcon } from '../Icons';
import ConfirmationModal from '../ConfirmationModal';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);
const formInputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500";


const ReportStatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <div className="bg-slate-100 dark:bg-slate-700/50 rounded-lg p-4">
        <div className="flex items-center">
            {icon}
            <div className="mr-3">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-200">{value}</p>
            </div>
        </div>
    </div>
);

const WithdrawalFormModal: React.FC<{withdrawal?: FarmerWithdrawal; onSave: (w: Omit<FarmerWithdrawal, 'id'> | FarmerWithdrawal) => void; onClose: () => void; cycle: CropCycle;}> = ({ withdrawal, onSave, onClose, cycle }) => {
    const { addToast } = React.useContext(ToastContext) as ToastContextType;
    const [date, setDate] = React.useState(withdrawal?.date || new Date().toISOString().split('T')[0]);
    const [description, setDescription] = React.useState(withdrawal?.description || '');
    const [amount, setAmount] = React.useState(withdrawal?.amount?.toString() || '');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (Number(amount) <= 0) { addToast('المبلغ يجب أن يكون أكبر من صفر.', 'error'); return; }
        const data = { date, description, amount: Number(amount), cropCycleId: cycle.id };
        onSave(withdrawal ? { ...withdrawal, ...data } : data);
    };
    return <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}><div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-lg" onClick={e=>e.stopPropagation()}><h2 className="text-2xl font-bold mb-4">{withdrawal ? 'تعديل السحب' : 'إضافة سحب جديد'}</h2><form onSubmit={handleSubmit} className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label htmlFor="date">تاريخ السحب</label><input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className={formInputClass}/></div><div><label htmlFor="amount">المبلغ</label><input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)} required min="0.01" step="0.01" className={formInputClass}/></div></div><div><label htmlFor="description">الوصف</label><input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} required className={formInputClass}/></div><div className="flex justify-end space-x-2 space-x-reverse pt-4"><button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 rounded-md">إلغاء</button><button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-md">حفظ</button></div></form></div></div>
}

const FarmerTab: React.FC<{ cycle: CropCycle }> = ({ cycle }) => {
    const { transactions, farmerWithdrawals, farmers, addFarmerWithdrawal, updateFarmerWithdrawal, deleteFarmerWithdrawal } = React.useContext(AppContext) as AppContextType;

    const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = React.useState(false);
    const [editingWithdrawal, setEditingWithdrawal] = React.useState<FarmerWithdrawal | undefined>(undefined);
    const [deletingWithdrawalId, setDeletingWithdrawalId] = React.useState<string | null>(null);

    React.useEffect(() => {
        const isAnyModalOpen = isWithdrawalModalOpen || !!deletingWithdrawalId;
        if (isAnyModalOpen) {
            document.body.classList.add('body-no-scroll');
        } else {
            document.body.classList.remove('body-no-scroll');
        }
        return () => {
            document.body.classList.remove('body-no-scroll');
        };
    }, [isWithdrawalModalOpen, deletingWithdrawalId]);

    const farmer = React.useMemo(() => farmers.find(f => f.id === cycle.farmerId), [farmers, cycle.farmerId]);

    const { farmerShare, totalWithdrawals, balance, cycleWithdrawals } = React.useMemo(() => {
        const totalRevenue = transactions
            .filter(t => t.cropCycleId === cycle.id && t.type === TransactionType.REVENUE)
            .reduce((sum, t) => sum + t.amount, 0);
        
        const farmerShare = totalRevenue * ((cycle.farmerSharePercentage || 0) / 100);

        const cycleWithdrawals = farmerWithdrawals
            .filter(w => w.cropCycleId === cycle.id)
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const totalWithdrawals = cycleWithdrawals.reduce((sum, w) => sum + w.amount, 0);
        const balance = farmerShare - totalWithdrawals;

        return { farmerShare, totalWithdrawals, balance, cycleWithdrawals };
    }, [transactions, farmerWithdrawals, cycle]);

    const handleSaveWithdrawal = (withdrawal: Omit<FarmerWithdrawal, 'id'> | FarmerWithdrawal) => {
        if ('id' in withdrawal) {
            updateFarmerWithdrawal(withdrawal);
        } else {
            addFarmerWithdrawal(withdrawal);
        }
        setIsWithdrawalModalOpen(false);
        setEditingWithdrawal(undefined);
    };

    const confirmDeleteWithdrawal = () => {
        if (deletingWithdrawalId) {
            deleteFarmerWithdrawal(deletingWithdrawalId);
        }
        setDeletingWithdrawalId(null);
    };

    if (!farmer) return <p className="text-center py-10 text-slate-500">لم يتم العثور على المزارع المرتبط بهذه العروة.</p>;

    return (
        <div className="space-y-6 animate-fadeInSlideUp">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">ملخص حساب {farmer.name} لهذه العروة</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ReportStatCard title="إجمالي الحصة" value={formatCurrency(farmerShare)} icon={<RevenueIcon className="w-7 h-7 text-emerald-500" />} />
                <ReportStatCard title="إجمالي المسحوبات" value={formatCurrency(totalWithdrawals)} icon={<ExpenseIcon className="w-7 h-7 text-rose-500" />} />
                <ReportStatCard title="الرصيد المتبقي" value={formatCurrency(balance)} icon={<ProfitIcon className={`w-7 h-7 ${balance >= 0 ? 'text-sky-500' : 'text-orange-500'}`} />} />
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xl font-semibold">قائمة السحوبات ({cycleWithdrawals.length})</h4>
                    <button onClick={() => { setEditingWithdrawal(undefined); setIsWithdrawalModalOpen(true); }} className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700">
                        <AddIcon className="w-5 h-5 ml-2" /><span>إضافة سحب</span>
                    </button>
                </div>
                 {cycleWithdrawals.length > 0 ? (
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {cycleWithdrawals.map(w => (
                            <div key={w.id} className="py-3 flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-slate-800 dark:text-slate-200">{w.description}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{w.date}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <p className="font-semibold text-indigo-600 dark:text-indigo-400">{formatCurrency(w.amount)}</p>
                                    <div>
                                        <button onClick={() => { setEditingWithdrawal(w); setIsWithdrawalModalOpen(true); }} className="p-1 text-slate-400 hover:text-blue-500"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => setDeletingWithdrawalId(w.id)} className="p-1 text-slate-400 hover:text-red-500"><DeleteIcon className="w-5 h-5"/></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                 ) : (
                    <p className="text-center py-8 text-slate-500 dark:text-slate-400">لا توجد سحوبات مسجلة لهذه العروة.</p>
                 )}
            </div>

            {isWithdrawalModalOpen && (
                <WithdrawalFormModal 
                    withdrawal={editingWithdrawal}
                    onSave={handleSaveWithdrawal}
                    onClose={() => { setIsWithdrawalModalOpen(false); setEditingWithdrawal(undefined); }}
                    cycle={cycle}
                />
            )}
             <ConfirmationModal
                isOpen={!!deletingWithdrawalId}
                onClose={() => setDeletingWithdrawalId(null)}
                onConfirm={confirmDeleteWithdrawal}
                title="تأكيد حذف السحب"
                message="هل أنت متأكد من حذف عملية السحب هذه؟"
            />
        </div>
    );
};

export default FarmerTab;