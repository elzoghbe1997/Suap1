import React from 'react';
import { AppContext } from '../App';
import { AppContextType, FertilizationProgram, CropCycle, TransactionType, Transaction, Farmer, CropCycleStatus } from '../types';
import { ToastContext, ToastContextType } from '../context/ToastContext';
import { AddIcon, EditIcon, DeleteIcon, ProgramIcon, ReportIcon, CalendarIcon, RevenueIcon, ExpenseIcon, ProfitIcon, CloseIcon, FarmerIcon } from './Icons';
import ConfirmationModal from './ConfirmationModal';
import SkeletonCard from './SkeletonCard';

const formInputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500";
const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);

// Form for adding/editing programs
const ProgramForm: React.FC<{
    program?: FertilizationProgram;
    onSave: (program: Omit<FertilizationProgram, 'id'> | FertilizationProgram) => void;
    onCancel: () => void;
    cropCycles: CropCycle[];
}> = ({ program, onSave, onCancel, cropCycles }) => {
    const { addToast } = React.useContext(ToastContext) as ToastContextType;
    const [name, setName] = React.useState(program?.name || '');
    const [startDate, setStartDate] = React.useState(program?.startDate || '');
    const [endDate, setEndDate] = React.useState(program?.endDate || '');
    const [cropCycleId, setCropCycleId] = React.useState(program?.cropCycleId || '');

    const activeCycles = cropCycles.filter(c => c.status === CropCycleStatus.ACTIVE);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (new Date(endDate) < new Date(startDate)) {
            addToast('تاريخ النهاية يجب أن يكون بعد تاريخ البداية.', 'error');
            return;
        }
        const data = { name, startDate, endDate, cropCycleId };
        onSave(program ? { ...program, ...data } : data);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium">اسم البرنامج</label>
                <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className={formInputClass} />
            </div>
            <div>
                <label htmlFor="cropCycleId" className="block text-sm font-medium">العروة</label>
                <select id="cropCycleId" value={cropCycleId} onChange={e => setCropCycleId(e.target.value)} required className={formInputClass}>
                    <option value="" disabled>اختر عروة</option>
                    {activeCycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium">تاريخ البدء</label>
                    <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} required className={formInputClass} />
                </div>
                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium">تاريخ النهاية</label>
                    <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} required className={formInputClass} />
                </div>
            </div>
            <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 rounded-md">إلغاء</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-md">حفظ</button>
            </div>
        </form>
    );
};

// Report Modal
const ProgramReportModal: React.FC<{
    program: FertilizationProgram;
    onClose: () => void;
}> = ({ program, onClose }) => {
    const { transactions, cropCycles, farmers, settings } = React.useContext(AppContext) as AppContextType;
    
    const reportData = React.useMemo(() => {
        const cycle = cropCycles.find(c => c.id === program.cropCycleId);
        if (!cycle) return null;

        const expenses = transactions.filter(t => t.fertilizationProgramId === program.id && t.type === TransactionType.EXPENSE);
        const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
        
        const revenues = transactions.filter(t => t.fertilizationProgramId === program.id && t.type === TransactionType.REVENUE);
        const totalRevenue = revenues.reduce((sum, t) => sum + t.amount, 0);

        let farmerShare = 0;
        if (settings.isFarmerSystemEnabled && cycle.farmerId && cycle.farmerSharePercentage) {
            farmerShare = totalRevenue * (cycle.farmerSharePercentage / 100);
        }
        const ownerProfit = totalRevenue - totalExpenses - farmerShare;

        return { expenses, revenues, totalExpenses, totalRevenue, farmerShare, ownerProfit, cycle };
    }, [program, transactions, cropCycles, settings]);

    if (!reportData) {
        return <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"><div className="bg-white p-4 rounded-lg">خطأ في تحميل بيانات التقرير.</div></div>;
    }

    const { expenses, revenues, totalExpenses, totalRevenue, farmerShare, ownerProfit, cycle } = reportData;

    return (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">تقرير البرنامج: {program.name}</h2>
                        <p className="text-slate-500 dark:text-slate-400">{cycle.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><CloseIcon className="w-6 h-6" /></button>
                </div>

                <div className="flex-grow overflow-y-auto space-y-6 modal-scroll-contain">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg flex items-center"><ExpenseIcon className="w-7 h-7 text-rose-500 ml-3"/><div className="text-right"><p className="text-sm text-slate-500">إجمالي مصروفات البرنامج</p><p className="text-xl font-bold">{formatCurrency(totalExpenses)}</p></div></div>
                        <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg flex items-center"><RevenueIcon className="w-7 h-7 text-emerald-500 ml-3"/><div className="text-right"><p className="text-sm text-slate-500">إيرادات البرنامج المرتبطة</p><p className="text-xl font-bold">{formatCurrency(totalRevenue)}</p></div></div>
                        <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg flex items-center"><ProfitIcon className={`w-7 h-7 ${ownerProfit >= 0 ? 'text-sky-500' : 'text-orange-500'} ml-3`}/><div className="text-right"><p className="text-sm text-slate-500">صافي ربح المالك (من البرنامج)</p><p className="text-xl font-bold">{formatCurrency(ownerProfit)}</p></div></div>
                    </div>
                    {settings.isFarmerSystemEnabled && cycle.farmerId && <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg flex items-center"><FarmerIcon className="w-7 h-7 text-indigo-500 ml-3"/><div className="text-right"><p className="text-sm text-slate-500">حصة المزارع ({cycle.farmerSharePercentage}%)</p><p className="text-xl font-bold">{formatCurrency(farmerShare)}</p></div></div>}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-2">المصروفات ({expenses.length})</h3>
                            <div className="border rounded-lg dark:border-slate-700 max-h-60 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <tbody>
                                        {expenses.length > 0 ? expenses.map(t => (
                                            <tr key={t.id} className="border-b dark:border-slate-700 last:border-b-0"><td className="p-2">{t.description}</td><td className="p-2 text-left font-semibold">{formatCurrency(t.amount)}</td></tr>
                                        )) : <tr className="text-center text-slate-500 p-4"><td colSpan={2} className="p-4">لا توجد مصروفات.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2">الإيرادات ({revenues.length})</h3>
                            <div className="border rounded-lg dark:border-slate-700 max-h-60 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <tbody>
                                        {revenues.length > 0 ? revenues.map(t => (
                                            <tr key={t.id} className="border-b dark:border-slate-700 last:border-b-0"><td className="p-2">{t.description}</td><td className="p-2 text-left font-semibold">{formatCurrency(t.amount)}</td></tr>
                                        )) : <tr className="text-center text-slate-500 p-4"><td colSpan={2} className="p-4">لا توجد إيرادات.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const FertilizationProgramsPage: React.FC = () => {
    const context = React.useContext(AppContext) as AppContextType;
    const { loading, fertilizationPrograms, cropCycles, transactions, addFertilizationProgram, updateFertilizationProgram, deleteFertilizationProgram, settings } = context;

    const [modal, setModal] = React.useState<'ADD' | 'EDIT' | 'VIEW_REPORT' | null>(null);
    const [selectedProgram, setSelectedProgram] = React.useState<FertilizationProgram | undefined>(undefined);
    const [deletingId, setDeletingId] = React.useState<string | null>(null);

    React.useEffect(() => {
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

    const handleSave = (program: Omit<FertilizationProgram, 'id'> | FertilizationProgram) => {
        if ('id' in program) {
            updateFertilizationProgram(program);
        } else {
            addFertilizationProgram(program);
        }
        setModal(null);
    };

    const confirmDelete = () => {
        if (deletingId) {
            deleteFertilizationProgram(deletingId);
        }
        setDeletingId(null);
    };
    
    const programsByCycle = React.useMemo(() => {
        const activeCycles = cropCycles.filter(c => c.status === CropCycleStatus.ACTIVE);
        return activeCycles.map(cycle => ({
            ...cycle,
            programs: fertilizationPrograms
                .filter(p => p.cropCycleId === cycle.id)
                .sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        })).filter(cycle => cycle.programs.length > 0);
    }, [fertilizationPrograms, cropCycles]);

    const renderContent = () => {
        if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">{[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}</div>;
        if (programsByCycle.length === 0) return (
            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700">
                <ProgramIcon className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-500 mb-4"/>
                <p className="text-lg font-semibold text-slate-600 dark:text-slate-300">لا توجد برامج مسجلة</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">ابدأ بإضافة برنامج جديد لتتبع تكاليفه وربحيته.</p>
            </div>
        );

        return (
            <div className="space-y-8">
                {programsByCycle.map(cycle => (
                    <div key={cycle.id}>
                        <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">{cycle.name}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {cycle.programs.map(program => {
                                const programExpenses = transactions
                                    .filter(t => t.fertilizationProgramId === program.id && t.type === TransactionType.EXPENSE)
                                    .reduce((sum, t) => sum + t.amount, 0);
                                
                                const programRevenues = transactions
                                    .filter(t => t.fertilizationProgramId === program.id && t.type === TransactionType.REVENUE)
                                    .reduce((sum, t) => sum + t.amount, 0);

                                let farmerShare = 0;
                                if (settings.isFarmerSystemEnabled && cycle.farmerId && cycle.farmerSharePercentage) {
                                    farmerShare = programRevenues * (cycle.farmerSharePercentage / 100);
                                }
                                const ownerProfit = programRevenues - programExpenses - farmerShare;


                                let profitabilityPercentage: number;
                                let profitabilityColor: string;

                                if (programExpenses === 0) {
                                    profitabilityPercentage = programRevenues > 0 ? 100 : 50;
                                    profitabilityColor = programRevenues > 0 ? 'bg-emerald-500' : 'bg-slate-400';
                                } else {
                                    const ratio = programRevenues / programExpenses;
                                    if (ratio >= 1) {
                                        profitabilityPercentage = 50 + Math.min((ratio - 1), 1) * 50;
                                    } else {
                                        profitabilityPercentage = ratio * 50;
                                    }

                                    if (profitabilityPercentage > 75) {
                                        profitabilityColor = 'bg-emerald-500';
                                    } else if (profitabilityPercentage > 40) {
                                        profitabilityColor = 'bg-yellow-500';
                                    } else {
                                        profitabilityColor = 'bg-rose-500';
                                    }
                                }

                                return (
                                <div key={program.id} className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-md hover:shadow-xl transition-shadow flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">{program.name}</h3>
                                        <p className="flex items-center mt-2 text-sm text-slate-500 dark:text-slate-400">
                                            <CalendarIcon className="w-4 h-4 ml-2"/>
                                            {program.startDate} إلى {program.endDate}
                                        </p>
                                        <div className="mt-4">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">ربحية البرنامج</span>
                                                <span className={`text-sm font-bold ${
                                                    profitabilityPercentage > 75 ? 'text-emerald-600 dark:text-emerald-400' : 
                                                    profitabilityPercentage > 40 ? 'text-yellow-600 dark:text-yellow-400' : 'text-rose-600 dark:text-rose-400'
                                                }`}>{Math.round(profitabilityPercentage)}%</span>
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                                                <div 
                                                    className={`${profitabilityColor} h-2.5 rounded-full transition-all duration-500 ease-out`} 
                                                    style={{ width: `${profitabilityPercentage}%` }}
                                                    role="progressbar"
                                                    aria-valuenow={profitabilityPercentage}
                                                    aria-valuemin={0}
                                                    aria-valuemax={100}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-3 grid grid-cols-3 gap-2 text-center">
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">المصروفات</p>
                                                <p className="text-sm font-semibold text-rose-600">{formatCurrency(programExpenses)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">الإيرادات</p>
                                                <p className="text-sm font-semibold text-emerald-600">{formatCurrency(programRevenues)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">ربح المالك</p>
                                                <p className={`text-sm font-semibold ${ownerProfit >= 0 ? 'text-sky-600' : 'text-orange-500'}`}>{formatCurrency(ownerProfit)}</p>
                                            </div>
                                        </div>

                                    </div>
                                    <div className="flex justify-between items-center mt-4 border-t border-slate-200 dark:border-slate-700 pt-3">
                                        <button onClick={() => { setSelectedProgram(program); setModal('VIEW_REPORT'); }} className="flex items-center px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600"><ReportIcon className="w-4 h-4 ml-1.5"/><span>عرض التقرير</span></button>
                                        <div className="flex items-center space-x-1 space-x-reverse">
                                            <button onClick={() => { setSelectedProgram(program); setModal('EDIT'); }} className="p-2 text-slate-400 hover:text-blue-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" aria-label={`تعديل البرنامج ${program.name}`}><EditIcon className="w-5 h-5"/></button>
                                            <button onClick={() => setDeletingId(program.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" aria-label={`حذف البرنامج ${program.name}`}><DeleteIcon className="w-5 h-5"/></button>
                                        </div>
                                    </div>
                                </div>
                            )})}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button onClick={() => { setSelectedProgram(undefined); setModal('ADD'); }} className="flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-md shadow-sm hover:bg-emerald-700">
                    <AddIcon className="w-5 h-5 ml-2" /><span>إضافة برنامج</span>
                </button>
            </div>

            {renderContent()}

            {(modal === 'ADD' || modal === 'EDIT') && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-lg" onClick={e=>e.stopPropagation()}>
                        <h2 className="text-2xl font-bold mb-4">{modal === 'EDIT' ? 'تعديل البرنامج' : 'إضافة برنامج جديد'}</h2>
                        <ProgramForm 
                            program={selectedProgram} 
                            onSave={handleSave} 
                            onCancel={() => setModal(null)}
                            cropCycles={cropCycles} 
                        />
                    </div>
                </div>
            )}
            {modal === 'VIEW_REPORT' && selectedProgram && (
                <ProgramReportModal program={selectedProgram} onClose={() => setModal(null)} />
            )}
            <ConfirmationModal isOpen={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={confirmDelete} title="تأكيد حذف البرنامج" message="هل أنت متأكد من حذف هذا البرنامج؟ لا يمكن حذف برنامج مرتبط بمصروفات."/>
        </div>
    );
};

export default FertilizationProgramsPage;
