import React from 'react';
import { AppContext } from '../App';
import { AppContextType, Advance, CropCycle, CropCycleStatus, Person } from '../types';
import { ToastContext, ToastContextType } from '../context/ToastContext';
import { AddIcon, EditIcon, DeleteIcon, AdvanceIcon, ExpenseIcon, FarmerIcon } from './Icons';
import ConfirmationModal from './ConfirmationModal';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter';
import PeopleManagerModal from './PeopleManagerModal';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);
const formInputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500";

const AnimatedNumber: React.FC<{ value: number }> = React.memo(({ value }) => {
    const count = useAnimatedCounter(value);
    return <>{formatCurrency(count)}</>;
});


const AdvanceForm: React.FC<{ advance?: Advance; onSave: (data: Omit<Advance, 'id'> | Advance) => void; onClose: () => void; cropCycles: CropCycle[]; people: Person[]; onAddPerson: () => void; }> = ({ advance, onSave, onClose, cropCycles, people, onAddPerson }) => {
    const { addToast } = React.useContext(ToastContext) as ToastContextType;
    const [date, setDate] = React.useState(advance?.date || new Date().toISOString().split('T')[0]);
    const [amount, setAmount] = React.useState(advance?.amount?.toString() || '');
    const [description, setDescription] = React.useState(advance?.description || '');
    const [cropCycleId, setCropCycleId] = React.useState(advance?.cropCycleId || '');
    const [personId, setPersonId] = React.useState(advance?.personId || '');

    const selectableCycles = React.useMemo(() => {
        const available = cropCycles.filter(
            c => c.status === CropCycleStatus.ACTIVE || c.status === CropCycleStatus.CLOSED
        );
        if (advance?.cropCycleId) {
            const existingCycle = cropCycles.find(c => c.id === advance.cropCycleId);
            if (existingCycle && !available.some(ac => ac.id === existingCycle.id)) {
                return [...available, existingCycle].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
            }
        }
        return available.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    }, [cropCycles, advance]);
    
    React.useEffect(() => {
        if (!advance && selectableCycles.length === 1) {
            setCropCycleId(selectableCycles[0].id);
        }
    }, [advance, selectableCycles]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (Number(amount) <= 0) {
            addToast('المبلغ يجب أن يكون أكبر من صفر.', 'error');
            return;
        }
        if (!cropCycleId) {
            addToast('يجب اختيار الصندوق الذي سيتم الخصم منه.', 'error');
            return;
        }
        if (!personId) {
            addToast('يجب اختيار الشخص.', 'error');
            return;
        }
        const data = { date, amount: Number(amount), description, cropCycleId, personId };
        onSave(advance ? { ...advance, ...data } : data);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div>
                <label htmlFor="personId" className="block text-sm font-medium">الشخص</label>
                <div className="flex items-center gap-2">
                    <select id="personId" value={personId} onChange={e => setPersonId(e.target.value)} required className={`${formInputClass} flex-grow`}>
                        <option value="" disabled>اختر شخصًا</option>
                        {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <button type="button" onClick={onAddPerson} className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-md hover:bg-emerald-200 dark:hover:bg-emerald-900" title="إضافة شخص جديد">
                        <AddIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>
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
                <label htmlFor="cropCycleId" className="block text-sm font-medium">الصندوق (العروة)</label>
                <select id="cropCycleId" value={cropCycleId} onChange={e => setCropCycleId(e.target.value)} required className={formInputClass}>
                    <option value="" disabled>اختر صندوقًا للخصم منه</option>
                    {selectableCycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
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
    const { advances, cropCycles, people, addAdvance, updateAdvance, deleteAdvance } = React.useContext(AppContext) as AppContextType;
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [isPeopleManagerOpen, setIsPeopleManagerOpen] = React.useState(false);
    const [editingAdvance, setEditingAdvance] = React.useState<Advance | undefined>(undefined);
    const [deletingId, setDeletingId] = React.useState<string | null>(null);
    const [peopleManagerInitialView, setPeopleManagerInitialView] = React.useState<'list' | 'form'>('list');
    const modalRef = React.useRef<HTMLDivElement>(null);


    React.useEffect(() => {
        const isAnyModalOpen = isModalOpen || !!deletingId || isPeopleManagerOpen;
        if (isAnyModalOpen) {
            document.body.classList.add('body-no-scroll');
        } else {
            document.body.classList.remove('body-no-scroll');
        }
        return () => {
            document.body.classList.remove('body-no-scroll');
        };
    }, [isModalOpen, deletingId, isPeopleManagerOpen]);

    // Focus Trap and Escape key handler for modal
    React.useEffect(() => {
        if (!isModalOpen) return;
        
        const modalNode = modalRef.current;
        if (!modalNode) return;

        const focusableElements = modalNode.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsModalOpen(false);
            if (e.key === 'Tab') {
                if (e.shiftKey) { if (document.activeElement === firstElement) { lastElement.focus(); e.preventDefault(); }
                } else { if (document.activeElement === lastElement) { firstElement.focus(); e.preventDefault(); } }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        firstElement?.focus();
        
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isModalOpen]);
    
    const handleOpenPeopleManager = (view: 'list' | 'form' = 'list') => {
        setPeopleManagerInitialView(view);
        setIsPeopleManagerOpen(true);
    };

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

    const activeAdvances = React.useMemo(() => {
        const activeCycleIds = new Set(cropCycles.filter(c => c.status === CropCycleStatus.ACTIVE).map(c => c.id));
        return advances.filter(a => activeCycleIds.has(a.cropCycleId));
    }, [advances, cropCycles]);

    const totalAdvances = React.useMemo(() => activeAdvances.reduce((sum, a) => sum + a.amount, 0), [activeAdvances]);

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">إدارة السلف الشخصية</h1>
                <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">تسجيل وتتبع السلف التي تخصم من صناديق العروات النشطة.</p>
            </header>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-5 border-r-4 border-rose-500">
                    <div className="flex items-center">
                        <div className="flex-shrink-0"><ExpenseIcon className="h-8 w-8 text-rose-500"/></div>
                        <div className="mr-4">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">إجمالي السلف (للعروات النشطة)</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                                <AnimatedNumber value={totalAdvances} />
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2">
                 <button onClick={() => handleOpenPeopleManager('list')} className="flex items-center justify-center px-4 py-2 bg-slate-600 text-white rounded-md shadow-sm hover:bg-slate-700 transition-colors">
                    <FarmerIcon className="w-5 h-5 ml-2" />
                    <span>إدارة الأشخاص</span>
                </button>
                <button onClick={() => { setEditingAdvance(undefined); setIsModalOpen(true); }} className="flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-md shadow-sm hover:bg-emerald-700 transition-colors">
                    <AddIcon className="w-5 h-5 ml-2" />
                    <span>إضافة سلفة</span>
                </button>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow">
                 {activeAdvances.length > 0 ? (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="py-3 px-4 text-right font-medium text-slate-500 dark:text-slate-300">التاريخ</th>
                                        <th className="py-3 px-4 text-right font-medium text-slate-500 dark:text-slate-300">اسم الشخص</th>
                                        <th className="py-3 px-4 text-right font-medium text-slate-500 dark:text-slate-300">الوصف</th>
                                        <th className="py-3 px-4 text-right font-medium text-slate-500 dark:text-slate-300">الصندوق</th>
                                        <th className="py-3 px-4 text-right font-medium text-slate-500 dark:text-slate-300">المبلغ</th>
                                        <th className="py-3 px-4 text-right font-medium text-slate-500 dark:text-slate-300">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {activeAdvances.map(a => {
                                        const cropCycleName = cropCycles.find(c => c.id === a.cropCycleId)?.name || 'غير معروف';
                                        const personName = people.find(p => p.id === a.personId)?.name || 'غير معروف';
                                        return (
                                            <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                                <td className="py-3 px-4 whitespace-nowrap">{a.date}</td>
                                                <td className="py-3 px-4 whitespace-nowrap font-medium">{personName}</td>
                                                <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400">{a.description}</td>
                                                <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400">{cropCycleName}</td>
                                                <td className="py-3 px-4 whitespace-nowrap font-medium text-rose-600">{formatCurrency(a.amount)}</td>
                                                <td className="py-3 px-4 whitespace-nowrap">
                                                    <div className="flex items-center space-x-2 space-x-reverse">
                                                        <button onClick={() => { setEditingAdvance(a); setIsModalOpen(true); }} className="p-1 text-slate-400 hover:text-blue-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" aria-label={`تعديل السلفة`}><EditIcon className="w-5 h-5"/></button>
                                                        <button onClick={() => setDeletingId(a.id)} className="p-1 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" aria-label={`حذف السلفة`}><DeleteIcon className="w-5 h-5"/></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {/* Mobile Cards */}
                        <div className="md:hidden p-4 space-y-3">
                            {activeAdvances.map(a => {
                                const cropCycleName = cropCycles.find(c => c.id === a.cropCycleId)?.name || 'غير معروف';
                                const personName = people.find(p => p.id === a.personId)?.name || 'غير معروف';
                                return (
                                    <div key={a.id} className="bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-lg space-y-3">
                                        <div className="flex justify-between items-start">
                                            <p className="font-bold text-slate-800 dark:text-white flex-1 pr-2">{personName}</p>
                                            <p className="font-semibold text-rose-600 whitespace-nowrap">{formatCurrency(a.amount)}</p>
                                        </div>
                                        <div className="text-sm text-slate-600 dark:text-slate-400">
                                            <p><strong className="font-medium text-slate-700 dark:text-slate-300">السبب:</strong> {a.description}</p>
                                            <p><strong className="font-medium text-slate-700 dark:text-slate-300">الصندوق:</strong> {cropCycleName}</p>
                                        </div>
                                        <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700 pt-3 mt-3">
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{a.date}</p>
                                            <div className="flex items-center space-x-2 space-x-reverse">
                                                <button onClick={() => { setEditingAdvance(a); setIsModalOpen(true); }} className="text-blue-500 hover:text-blue-700 p-1 rounded-full" aria-label={`تعديل السلفة`}><EditIcon className="w-5 h-5"/></button>
                                                <button onClick={() => setDeletingId(a.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full" aria-label={`حذف السلفة`}><DeleteIcon className="w-5 h-5"/></button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                 ) : (
                    <div className="text-center py-16">
                        <AdvanceIcon className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-4"/>
                        <p className="font-semibold text-slate-600 dark:text-slate-300">لا توجد سلف مسجلة للعروات النشطة.</p>
                    </div>
                 )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
                    <div ref={modalRef} className="bg-slate-50 dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-6 pb-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                           <h2 className="text-2xl font-bold mb-4">{editingAdvance ? 'تعديل سلفة' : 'إضافة سلفة جديدة'}</h2>
                        </div>
                         <div className="p-6 flex-grow overflow-y-auto modal-scroll-contain">
                           <AdvanceForm advance={editingAdvance} onSave={handleSave} onClose={() => setIsModalOpen(false)} cropCycles={cropCycles} people={people} onAddPerson={() => handleOpenPeopleManager('form')} />
                        </div>
                    </div>
                </div>
            )}
            <ConfirmationModal isOpen={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={confirmDelete} title="تأكيد حذف السلفة" message="هل أنت متأكد من حذف هذه السلفة؟" />
            <PeopleManagerModal isOpen={isPeopleManagerOpen} onClose={() => setIsPeopleManagerOpen(false)} initialView={peopleManagerInitialView} />
        </div>
    );
};

export default AdvancesPage;