import React from 'react';
import { AppContext } from '../../App';
import { AppContextType, CropCycle, FertilizationProgram, Transaction, TransactionType } from '../../types';
import { ToastContext, ToastContextType } from '../../context/ToastContext';
import { AddIcon, EditIcon, DeleteIcon, ProgramIcon, ReportIcon, CalendarIcon, RevenueIcon, ExpenseIcon, ProfitIcon, CloseIcon, FarmerIcon } from '../Icons';
import ConfirmationModal from '../ConfirmationModal';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);
const formInputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500";


const ProgramFormModal: React.FC<{program?: FertilizationProgram; onSave: (p: Omit<FertilizationProgram, 'id'> | FertilizationProgram) => void; onClose: () => void; cycle: CropCycle;}> = ({ program, onSave, onClose, cycle }) => {
    const { addToast } = React.useContext(ToastContext) as ToastContextType;
    const [name, setName] = React.useState(program?.name || '');
    const [startDate, setStartDate] = React.useState(program?.startDate || '');
    const [endDate, setEndDate] = React.useState(program?.endDate || '');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (new Date(endDate) < new Date(startDate)) { addToast('تاريخ النهاية يجب أن يكون بعد تاريخ البداية.', 'error'); return; }
        const data = { name, startDate, endDate, cropCycleId: cycle.id };
        onSave(program ? { ...program, ...data } : data);
    };

    return <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}><div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-lg" onClick={e=>e.stopPropagation()}><h2 className="text-2xl font-bold mb-4">{program ? 'تعديل البرنامج' : 'إضافة برنامج جديد'}</h2><form onSubmit={handleSubmit} className="space-y-4"><div><label htmlFor="name" className="block text-sm font-medium">اسم البرنامج</label><input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className={formInputClass} /></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label htmlFor="startDate" className="block text-sm font-medium">تاريخ البدء</label><input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} required className={formInputClass} /></div><div><label htmlFor="endDate" className="block text-sm font-medium">تاريخ النهاية</label><input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} required className={formInputClass} /></div></div><div className="flex justify-end space-x-2 space-x-reverse pt-4"><button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 rounded-md">إلغاء</button><button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-md">حفظ</button></div></form></div></div>
}

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


const ProgramReportModal: React.FC<{program: FertilizationProgram; onClose: () => void;}> = ({ program, onClose }) => {
    const { transactions, cropCycles, settings } = React.useContext(AppContext) as AppContextType;
    const reportData = React.useMemo(() => {
        const cycle = cropCycles.find(c => c.id === program.cropCycleId); if (!cycle) return null;
        const expenses = transactions.filter(t => t.fertilizationProgramId === program.id && t.type === TransactionType.EXPENSE);
        const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
        const revenues = transactions.filter(t => t.fertilizationProgramId === program.id && t.type === TransactionType.REVENUE);
        const totalRevenue = revenues.reduce((sum, t) => sum + t.amount, 0);
        let farmerShare = 0;
        if (settings.isFarmerSystemEnabled && cycle.farmerId && cycle.farmerSharePercentage) farmerShare = totalRevenue * (cycle.farmerSharePercentage / 100);
        const ownerProfit = totalRevenue - totalExpenses - farmerShare;
        return { expenses, revenues, totalExpenses, totalRevenue, farmerShare, ownerProfit, cycle };
    }, [program, transactions, cropCycles, settings]);

    if (!reportData) return <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"><div className="bg-white p-4 rounded-lg">خطأ.</div></div>;
    const { expenses, revenues, totalExpenses, totalRevenue, farmerShare, ownerProfit, cycle } = reportData;

    return <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}><div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e=>e.stopPropagation()}><div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200 dark:border-slate-700"><h2 className="text-2xl font-bold text-slate-800 dark:text-white">تقرير: {program.name}</h2><button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><CloseIcon className="w-6 h-6" /></button></div><div className="flex-grow overflow-y-auto space-y-6 modal-scroll-contain"><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><ReportStatCard title="إجمالي مصروفات البرنامج" value={formatCurrency(totalExpenses)} icon={<ExpenseIcon className="w-7 h-7 text-rose-500" />} /><ReportStatCard title="إيرادات البرنامج" value={formatCurrency(totalRevenue)} icon={<RevenueIcon className="w-7 h-7 text-emerald-500" />} /><ReportStatCard title="صافي ربح المالك" value={formatCurrency(ownerProfit)} icon={<ProfitIcon className={`w-7 h-7 ${ownerProfit >= 0 ? 'text-sky-500' : 'text-orange-500'}`} />} /></div>{settings.isFarmerSystemEnabled && cycle.farmerId && <ReportStatCard title={`حصة المزارع (${cycle.farmerSharePercentage}%)`} value={formatCurrency(farmerShare)} icon={<FarmerIcon className="w-7 h-7 text-indigo-500" />} />}<div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div><h3 className="text-lg font-semibold mb-2">المصروفات ({expenses.length})</h3><div className="border rounded-lg dark:border-slate-700 max-h-60 overflow-y-auto"><table className="w-full text-sm"><tbody>{expenses.length > 0 ? expenses.map(t => (<tr key={t.id} className="border-b dark:border-slate-700 last:border-b-0"><td className="p-2">{t.description}</td><td className="p-2 text-left font-semibold">{formatCurrency(t.amount)}</td></tr>)) : <tr><td colSpan={2} className="p-4 text-center text-slate-500">لا توجد مصروفات.</td></tr>}</tbody></table></div></div><div><h3 className="text-lg font-semibold mb-2">الإيرادات ({revenues.length})</h3><div className="border rounded-lg dark:border-slate-700 max-h-60 overflow-y-auto"><table className="w-full text-sm"><tbody>{revenues.length > 0 ? revenues.map(t => (<tr key={t.id} className="border-b dark:border-slate-700 last:border-b-0"><td className="p-2">{t.description}</td><td className="p-2 text-left font-semibold">{formatCurrency(t.amount)}</td></tr>)) : <tr><td colSpan={2} className="p-4 text-center text-slate-500">لا توجد إيرادات.</td></tr>}</tbody></table></div></div></div></div></div></div>
};

const ProgramsTab: React.FC<{ cycle: CropCycle }> = ({ cycle }) => {
    const { fertilizationPrograms, transactions, addFertilizationProgram, updateFertilizationProgram, deleteFertilizationProgram, settings } = React.useContext(AppContext) as AppContextType;

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

    const cyclePrograms = React.useMemo(() => {
        return fertilizationPrograms
            .filter(p => p.cropCycleId === cycle.id)
            .sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }, [fertilizationPrograms, cycle.id]);

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

    return (
        <div className="space-y-6 animate-fadeInSlideUp">
            <div className="flex justify-end">
                <button onClick={() => { setSelectedProgram(undefined); setModal('ADD'); }} className="flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-md shadow-sm hover:bg-emerald-700">
                    <AddIcon className="w-5 h-5 ml-2" /><span>إضافة برنامج</span>
                </button>
            </div>

            {cyclePrograms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {cyclePrograms.map(program => {
                        const programExpenses = transactions.filter(t => t.fertilizationProgramId === program.id && t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
                        const programRevenues = transactions.filter(t => t.fertilizationProgramId === program.id && t.type === TransactionType.REVENUE).reduce((sum, t) => sum + t.amount, 0);
                        let farmerShare = 0;
                        if (settings.isFarmerSystemEnabled && cycle.farmerId && cycle.farmerSharePercentage) {
                            farmerShare = programRevenues * (cycle.farmerSharePercentage / 100);
                        }
                        const ownerProfit = programRevenues - programExpenses - farmerShare;
                        return (
                            <div key={program.id} className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-md hover:shadow-xl transition-shadow flex flex-col justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">{program.name}</h3>
                                    <p className="flex items-center mt-2 text-sm text-slate-500 dark:text-slate-400">
                                        <CalendarIcon className="w-4 h-4 ml-2"/>
                                        {program.startDate} إلى {program.endDate}
                                    </p>
                                    <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-3 grid grid-cols-3 gap-2 text-center">
                                        <div><p className="text-xs text-slate-500">المصروفات</p><p className="text-sm font-semibold text-rose-600">{formatCurrency(programExpenses)}</p></div>
                                        <div><p className="text-xs text-slate-500">الإيرادات</p><p className="text-sm font-semibold text-emerald-600">{formatCurrency(programRevenues)}</p></div>
                                        <div><p className="text-xs text-slate-500">ربح المالك</p><p className={`text-sm font-semibold ${ownerProfit >= 0 ? 'text-sky-600' : 'text-orange-500'}`}>{formatCurrency(ownerProfit)}</p></div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mt-4 border-t border-slate-200 dark:border-slate-700 pt-3">
                                    <button onClick={() => { setSelectedProgram(program); setModal('VIEW_REPORT'); }} className="flex items-center px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600"><ReportIcon className="w-4 h-4 ml-1.5"/><span>عرض التقرير</span></button>
                                    <div>
                                        <button onClick={() => { setSelectedProgram(program); setModal('EDIT'); }} className="p-2 text-slate-400 hover:text-blue-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => setDeletingId(program.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><DeleteIcon className="w-5 h-5"/></button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <ProgramIcon className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-500 mb-4"/>
                    <p className="text-lg font-semibold text-slate-600 dark:text-slate-300">لا توجد برامج مسجلة لهذه العروة</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">أضف برنامجًا جديدًا من الزر أعلاه.</p>
                </div>
            )}
            
            {(modal === 'ADD' || modal === 'EDIT') && (
                <ProgramFormModal program={selectedProgram} onSave={handleSave} onClose={() => setModal(null)} cycle={cycle} />
            )}
            {modal === 'VIEW_REPORT' && selectedProgram && (
                <ProgramReportModal program={selectedProgram} onClose={() => setModal(null)} />
            )}
            <ConfirmationModal isOpen={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={confirmDelete} title="تأكيد حذف البرنامج" message="هل أنت متأكد من حذف هذا البرنامج؟ لا يمكن حذف برنامج مرتبط بمعاملات."/>
        </div>
    );
}

export default ProgramsTab;
