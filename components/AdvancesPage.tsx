import React from 'react';
import { AppContext } from '../App';
import { AppContextType, Advance } from '../types';
import { ToastContext, ToastContextType } from '../context/ToastContext';
import { AddIcon, EditIcon, DeleteIcon, AdvanceIcon, ExpenseIcon } from './Icons';
import ConfirmationModal from './ConfirmationModal';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);
const formInputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500";

const AnimatedNumber: React.FC<{ value: number }> = React.memo(({ value }) => {
    const count = useAnimatedCounter(value);
    return <>{formatCurrency(count)}</>;
});

const AdvanceForm: React.FC<{ advance?: Advance; onSave: (data: Omit<Advance, 'id'> | Advance) => void; onClose: () => void; }> = ({ advance, onSave, onClose }) => {
    const { addToast } = React.useContext(ToastContext) as ToastContextType;
    const [date, setDate] = React.useState(advance?.date || new Date().toISOString().split('T')[0]);
    const [amount, setAmount] = React.useState(advance?.amount?.toString() || '');
    const [description, setDescription] = React.useState(advance?.description || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (Number(amount) <= 0) {
            addToast('المبلغ يجب أن يكون أكبر من صفر.', 'error');
            return;
        }
        const data = { date, amount: Number(amount), description };
        onSave(advance ? { ...advance, ...data } : data);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="date" className="block text-sm font-medium">التاريخ</label>
                    <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className={formInputClass} />
                </div>
                <div>
                    <label htmlFor="amount" className="block text-sm font-medium">المبلغ (ج.م)</label>
                    <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)} required min="0.01" step="0.01" className={formInputClass} />
                </div>
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium">الوصف/السبب</label>
                <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} required className={formInputClass} />
            </div>
            <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 rounded-md">إلغاء</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-md">حفظ</button>
            </div>
        </form>
    );
};

const AdvancesPage: React.FC = () => {
    const { advances, addAdvance, updateAdvance, deleteAdvance } = React.useContext(AppContext) as AppContextType;
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingAdvance, setEditingAdvance] = React.useState<Advance | undefined>(undefined);
    const [deletingId, setDeletingId] = React.useState<string | null>(null);

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

    const handleSave = (data: Omit<Advance, 'id'> | Advance) => {
        if ('id' in data) {
            updateAdvance(data);
        } else {
            addAdvance(data);
        }
        setIsModalOpen(false);
    };

    const confirmDelete = () => {
        if (deletingId) {
            deleteAdvance(deletingId);
        }
        setDeletingId(null);
    };

    const totalAdvances = React.useMemo(() => advances.reduce((sum, a) => sum + a.amount, 0), [advances]);

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">إدارة السلف الشخصية</h1>
                <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">تسجيل وتتبع السلف التي تخصم من الرصيد الإجمالي للخزنة.</p>
            </header>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-5 border-r-4 border-rose-500">
                    <div className="flex items-center">
                        <div className="flex-shrink-0"><ExpenseIcon className="h-8 w-8 text-rose-500"/></div>
                        <div className="mr-4">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">إجمالي السلف والمسحوبات</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                                <AnimatedNumber value={totalAdvances} />
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button onClick={() => { setEditingAdvance(undefined); setIsModalOpen(true); }} className="flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-md shadow-sm hover:bg-emerald-700">
                    <AddIcon className="w-5 h-5 ml-2" />
                    <span>إضافة سلفة</span>
                </button>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow">
                 {advances.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="py-3 px-4 text-right font-medium text-slate-500 dark:text-slate-300">التاريخ</th>
                                    <th className="py-3 px-4 text-right font-medium text-slate-500 dark:text-slate-300">الوصف</th>
                                    <th className="py-3 px-4 text-right font-medium text-slate-500 dark:text-slate-300">المبلغ</th>
                                    <th className="py-3 px-4 text-right font-medium text-slate-500 dark:text-slate-300">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {advances.map(a => (
                                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                        <td className="py-3 px-4 whitespace-nowrap">{a.date}</td>
                                        <td className="py-3 px-4 whitespace-nowrap">{a.description}</td>
                                        <td className="py-3 px-4 whitespace-nowrap font-medium text-rose-600">{formatCurrency(a.amount)}</td>
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2 space-x-reverse">
                                                <button onClick={() => { setEditingAdvance(a); setIsModalOpen(true); }} className="p-1 text-slate-400 hover:text-blue-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" aria-label={`تعديل السلفة ${a.description}`}><EditIcon className="w-5 h-5"/></button>
                                                <button onClick={() => setDeletingId(a.id)} className="p-1 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" aria-label={`حذف السلفة ${a.description}`}><DeleteIcon className="w-5 h-5"/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 ) : (
                    <div className="text-center py-16">
                        <AdvanceIcon className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-4"/>
                        <p className="font-semibold text-slate-600 dark:text-slate-300">لم تقم بتسجيل أي سلف بعد.</p>
                    </div>
                 )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold mb-4">{editingAdvance ? 'تعديل سلفة' : 'إضافة سلفة جديدة'}</h2>
                        <AdvanceForm advance={editingAdvance} onSave={handleSave} onClose={() => setIsModalOpen(false)} />
                    </div>
                </div>
            )}
            <ConfirmationModal isOpen={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={confirmDelete} title="تأكيد حذف السلفة" message="هل أنت متأكد من حذف هذه السلفة؟" />
        </div>
    );
};

export default AdvancesPage;