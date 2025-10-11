import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppContext } from '../App.tsx';
import { AppContextType, TransactionType, Farmer, FarmerWithdrawal, CropCycle, CropCycleStatus, Transaction } from '../types.ts';
import { FarmerIcon, RevenueIcon, ExpenseIcon, ProfitIcon, AddIcon, EditIcon, DeleteIcon, ReportIcon, CloseIcon } from './Icons.tsx';
import { ToastContext, ToastContextType } from '../context/ToastContext.tsx';
import ConfirmationModal from './ConfirmationModal.tsx';
import SkeletonCard from './SkeletonCard.tsx';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter.ts';
import WithdrawalForm from './WithdrawalForm.tsx';

const formInputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500";

const FarmerForm: React.FC<{ farmer?: Farmer; onSave: (farmer: Omit<Farmer, 'id'> | Farmer) => void; onCancel: () => void }> = ({ farmer, onSave, onCancel }) => {
    const [name, setName] = React.useState(farmer?.name || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data = { name };
        if (farmer) {
            onSave({ ...farmer, ...data });
        } else {
            onSave(data);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">اسم المزارع</label>
                <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className={formInputClass}/>
            </div>
            <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">إلغاء</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">حفظ</button>
            </div>
        </form>
    );
};

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);

const AnimatedNumber: React.FC<{ value: number }> = React.memo(({ value }) => {
    const count = useAnimatedCounter(value);
    return <>{formatCurrency(count)}</>;
});

const FarmerStatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
        <div className="flex items-center">
            {icon}
            <div className="mr-3">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-200">
                    <AnimatedNumber value={value} />
                </p>
            </div>
        </div>
    </div>
);

const WithdrawalsReportModal: React.FC<{ farmer: Farmer; withdrawals: FarmerWithdrawal[]; onClose: () => void; onEdit: (w: FarmerWithdrawal) => void; onDelete: (id: string) => void; }> = ({ farmer, withdrawals, onClose, onEdit, onDelete }) => {
    const { cropCycles } = React.useContext(AppContext) as AppContextType;

    return (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto modal-scroll-contain" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">تقرير سحوبات: {farmer.name}</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                {withdrawals.length > 0 ? (
                    <div>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-700/50">
                                    <tr>
                                        {['التاريخ', 'الوصف', 'العروة', 'المبلغ', 'الإجراءات'].map(h => 
                                        <th key={h} className="py-3 px-4 text-right font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{h}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {withdrawals.map(w => (
                                        <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                            <td className="py-3 px-4 whitespace-nowrap">{w.date}</td>
                                            <td className="py-3 px-4 whitespace-nowrap">{w.description}</td>
                                            <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400">{cropCycles.find(c => c.id === w.cropCycleId)?.name ?? 'غير محدد'}</td>
                                            <td className="py-3 px-4 whitespace-nowrap font-medium text-indigo-600">{formatCurrency(w.amount)}</td>
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-2 space-x-reverse">
                                                    <button onClick={() => onEdit(w)} className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50" aria-label={`تعديل السحب ${w.description}`}><EditIcon className="w-5 h-5"/></button>
                                                    <button onClick={() => onDelete(w.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" aria-label={`حذف السحب ${w.description}`}><DeleteIcon className="w-5 h-5"/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                         {/* Mobile Card View */}
                        <div className="md:hidden space-y-4">
                             {withdrawals.map(w => (
                                <div key={w.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <p className="font-bold text-slate-800 dark:text-white flex-1 pr-2">{w.description}</p>
                                        <p className="font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{formatCurrency(w.amount)}</p>
                                    </div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400">
                                        <p><strong className="font-medium text-slate-700 dark:text-slate-300">العروة:</strong> {cropCycles.find(c => c.id === w.cropCycleId)?.name ?? 'غير محدد'}</p>
                                    </div>
                                    <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700 pt-3 mt-3">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{w.date}</p>
                                        <div className="flex items-center space-x-2 space-x-reverse">
                                            <button onClick={() => onEdit(w)} className="text-blue-500 hover:text-blue-700 p-1 rounded-full" aria-label={`تعديل السحب ${w.description}`}><EditIcon className="w-5 h-5"/></button>
                                            <button onClick={() => onDelete(w.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full" aria-label={`حذف السحب ${w.description}`}><DeleteIcon className="w-5 h-5"/></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p className="text-center text-slate-500 dark:text-slate-400 py-8">لا توجد سحوبات مسجلة لهذا المزارع.</p>
                )}
            </div>
        </div>
    );
};


const FarmerAccountsPage: React.FC = () => {
    const { loading, settings, farmers, cropCycles, transactions, farmerWithdrawals, addFarmer, updateFarmer, deleteFarmer, addFarmerWithdrawal, updateFarmerWithdrawal, deleteFarmerWithdrawal } = React.useContext(AppContext) as AppContextType;
    
    const location = useLocation();
    const navigate = useNavigate();

    const [isFarmerFormOpen, setIsFarmerFormOpen] = React.useState(false);
    const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = React.useState(false);

    const [editingFarmer, setEditingFarmer] = React.useState<Farmer | undefined>(undefined);
    const [editingWithdrawal, setEditingWithdrawal] = React.useState<FarmerWithdrawal | undefined>(undefined);
    
    const [deletingFarmerId, setDeletingFarmerId] = React.useState<string | null>(null);
    const [deletingWithdrawalId, setDeletingWithdrawalId] = React.useState<string | null>(null);

    const [reportingFarmer, setReportingFarmer] = React.useState<Farmer | undefined>(undefined);
    const [highlightedFarmerId, setHighlightedFarmerId] = React.useState<string | null>(null);
    const [preselectedFarmerId, setPreselectedFarmerId] = React.useState<string>('');

    React.useEffect(() => {
        const isAnyModalOpen = isFarmerFormOpen || isWithdrawalModalOpen || !!deletingFarmerId || !!deletingWithdrawalId || !!reportingFarmer;
        if (isAnyModalOpen) {
            document.body.classList.add('body-no-scroll');
        } else {
            document.body.classList.remove('body-no-scroll');
        }
        return () => {
            document.body.classList.remove('body-no-scroll');
        };
    }, [isFarmerFormOpen, isWithdrawalModalOpen, deletingFarmerId, deletingWithdrawalId, reportingFarmer]);

    React.useEffect(() => {
        const state = location.state as { action?: string, highlightFarmerId?: string };

        if (state?.action === 'add-withdrawal') {
            setEditingWithdrawal(undefined);
            setIsWithdrawalModalOpen(true);
            navigate(location.pathname, { replace: true, state: {} });
        }

        if (state?.highlightFarmerId) {
            const farmerId = state.highlightFarmerId;
            setHighlightedFarmerId(farmerId);
            navigate(location.pathname, { replace: true, state: {} }); // Clear state
            
            const timer = setTimeout(() => {
                setHighlightedFarmerId(null);
            }, 3000); // Highlight for 3 seconds
            
            return () => clearTimeout(timer);
        }
    }, [location, navigate]);

    React.useEffect(() => {
        if (highlightedFarmerId) {
            const element = document.getElementById(`farmer-card-${highlightedFarmerId}`);
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [highlightedFarmerId]);


    const farmerAccountData = React.useMemo(() => {
        return farmers.map(farmer => {
            const associatedCycles = cropCycles.filter(c => c.farmerId === farmer.id);
            const associatedCycleIds = new Set(associatedCycles.map(c => c.id));
            
            let totalShare = 0;
            
            associatedCycles.forEach(cycle => {
                const revenue = transactions
                    .filter(t => t.cropCycleId === cycle.id && t.type === TransactionType.REVENUE)
                    .reduce((sum, t) => sum + t.amount, 0);
                
                if (cycle.farmerSharePercentage != null) {
                    totalShare += revenue * (cycle.farmerSharePercentage / 100);
                }
            });

            const totalWithdrawals = farmerWithdrawals
                .filter(w => associatedCycleIds.has(w.cropCycleId))
                .reduce((sum, w) => sum + w.amount, 0);

            const balance = totalShare - totalWithdrawals;

            return { ...farmer, totalShare, totalWithdrawals, balance, cycleCount: associatedCycles.length };
        });
    }, [farmers, cropCycles, transactions, farmerWithdrawals]);

    // Farmer handlers
    const handleSaveFarmer = (farmer: Omit<Farmer, 'id'> | Farmer) => {
        if ('id' in farmer) updateFarmer(farmer);
        else addFarmer(farmer);
        setIsFarmerFormOpen(false);
        setEditingFarmer(undefined);
    };
    const handleEditFarmer = (farmer: Farmer) => {
        setEditingFarmer(farmer);
        setIsFarmerFormOpen(true);
    };
    const confirmDeleteFarmer = () => {
        if (deletingFarmerId) deleteFarmer(deletingFarmerId);
        setDeletingFarmerId(null);
    };

    // Withdrawal handlers
    const handleSaveWithdrawal = (withdrawal: Omit<FarmerWithdrawal, 'id'> | FarmerWithdrawal) => {
        if ('id' in withdrawal) updateFarmerWithdrawal(withdrawal);
        else addFarmerWithdrawal(withdrawal);
        setIsWithdrawalModalOpen(false);
        setEditingWithdrawal(undefined);
    };
    const handleEditWithdrawal = (withdrawal: FarmerWithdrawal) => {
        setReportingFarmer(undefined); // Close report modal
        setEditingWithdrawal(withdrawal);
        setIsWithdrawalModalOpen(true);
    };
    const handleDeleteWithdrawal = (id: string) => {
        setReportingFarmer(undefined); // Close report modal
        setDeletingWithdrawalId(id);
    };
    const confirmDeleteWithdrawal = () => {
        if (deletingWithdrawalId) deleteFarmerWithdrawal(deletingWithdrawalId);
        setDeletingWithdrawalId(null);
    };

    const getWithdrawalsForFarmer = (farmerId: string) => {
        const farmerCycleIds = new Set(cropCycles.filter(c => c.farmerId === farmerId).map(c => c.id));
        return farmerWithdrawals
            .filter(w => farmerCycleIds.has(w.cropCycleId))
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };

    const handleQuickAddWithdrawal = (farmerId: string) => {
        setPreselectedFarmerId(farmerId);
        setEditingWithdrawal(undefined);
        setIsWithdrawalModalOpen(true);
    };

    if (!settings.isFarmerSystemEnabled) {
        return (
             <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">نظام المزارعين غير مفعل</h2>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                    يرجى تفعيل "نظام حصة المزارع" من صفحة <a href="#/settings" className="text-green-600 hover:underline">الإعدادات</a> لعرض هذه الصفحة.
                </p>
            </div>
        );
    }

    const renderContent = () => {
        if (loading) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
            );
        }
        if (farmerAccountData.length > 0) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {farmerAccountData.map(farmer => {
                        const associatedCycles = cropCycles.filter(c => c.farmerId === farmer.id);
                        const associatedCycleIds = new Set(associatedCycles.map(c => c.id));
                        const hasFinancials = transactions.some(t => associatedCycleIds.has(t.cropCycleId)) || farmerWithdrawals.some(w => associatedCycleIds.has(w.cropCycleId));

                        return (
                            <div
                                key={farmer.id}
                                id={`farmer-card-${farmer.id}`}
                                className={`bg-white dark:bg-slate-800 p-5 rounded-lg shadow-md transition-all duration-300 flex flex-col justify-between ${
                                    highlightedFarmerId === farmer.id ? 'ring-2 ring-green-500 shadow-lg' : 'hover:shadow-xl'
                                }`}
                            >
                                <div>
                                    <div className="flex items-center mb-4">
                                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-full mr-3">
                                            <FarmerIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{farmer.name}</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">يعمل على {farmer.cycleCount} عروة</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <FarmerStatCard title="إجمالي الحصة" value={farmer.totalShare} icon={<RevenueIcon className="w-7 h-7 text-emerald-500" />} />
                                        <FarmerStatCard title="إجمالي المسحوبات" value={farmer.totalWithdrawals} icon={<ExpenseIcon className="w-7 h-7 text-rose-500" />} />
                                        <FarmerStatCard title="الرصيد المتبقي" value={farmer.balance} icon={<ProfitIcon className={`w-7 h-7 ${farmer.balance >= 0 ? 'text-sky-500' : 'text-orange-500'}`} />} />
                                    </div>
                                </div>
                                <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-3 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <button onClick={() => setReportingFarmer(farmer)} className="flex items-center px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600">
                                            <ReportIcon className="w-4 h-4 ml-1.5"/><span>كشف السحوبات</span>
                                        </button>
                                        <div className="flex items-center space-x-1 space-x-reverse">
                                            <button onClick={() => handleEditFarmer(farmer)} className="p-2 text-slate-400 hover:text-blue-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" aria-label={`تعديل المزارع ${farmer.name}`}><EditIcon className="w-5 h-5"/></button>
                                            <button
                                                onClick={() => setDeletingFarmerId(farmer.id)}
                                                disabled={hasFinancials}
                                                className={`p-2 text-slate-400 rounded-full transition-colors ${
                                                    hasFinancials
                                                    ? 'cursor-not-allowed text-slate-300 dark:text-slate-600'
                                                    : 'hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                }`}
                                                title={hasFinancials ? 'لا يمكن حذف مزارع مرتبط بمعاملات' : 'حذف المزارع'}
                                                aria-label={`حذف المزارع ${farmer.name}`}
                                            >
                                                <DeleteIcon className="w-5 h-5"/>
                                            </button>
                                        </div>
                                    </div>
                                    <button onClick={() => handleQuickAddWithdrawal(farmer.id)} className="w-full flex items-center justify-center px-3 py-1.5 text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-900">
                                        <AddIcon className="w-4 h-4 ml-1.5"/><span>إضافة سحب سريع</span>
                                    </button>
                                </div>
                            </div>
                        )})}
                </div>
            );
        }
        return (
            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700">
                <FarmerIcon className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-500 mb-4"/>
                <p className="text-lg font-semibold text-slate-600 dark:text-slate-300">لا يوجد مزارعين مسجلين</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">ابدأ بإضافة مزارع جديد لتتبع حساباته.</p>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">حسابات المزارعين</h1>
                    <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">إدارة ومتابعة حصص المزارعين ومسحوباتهم المالية.</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                    <button onClick={() => { setEditingFarmer(undefined); setIsFarmerFormOpen(true); }} className="flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-md shadow-sm hover:bg-emerald-700">
                        <AddIcon className="w-5 h-5 ml-2" /><span>إضافة مزارع</span>
                    </button>
                     <button onClick={() => { setEditingWithdrawal(undefined); setIsWithdrawalModalOpen(true); setPreselectedFarmerId(''); }} className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700">
                        <AddIcon className="w-5 h-5 ml-2" /><span>إضافة سحب</span>
                    </button>
                </div>
            </div>
            {renderContent()}

            {isFarmerFormOpen && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4">{editingFarmer ? 'تعديل مزارع' : 'إضافة مزارع جديد'}</h2>
                        <FarmerForm farmer={editingFarmer} onSave={handleSaveFarmer} onCancel={() => setIsFarmerFormOpen(false)} />
                    </div>
                </div>
            )}
            {isWithdrawalModalOpen && (
                 <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto modal-scroll-contain">
                        <h2 className="text-2xl font-bold mb-4">{editingWithdrawal ? 'تعديل سحب' : 'إضافة سحب جديد'}</h2>
                        <WithdrawalForm withdrawal={editingWithdrawal} onSave={handleSaveWithdrawal} onCancel={() => setIsWithdrawalModalOpen(false)} cycles={cropCycles} farmers={farmers} preselectedFarmerId={preselectedFarmerId} />
                    </div>
                </div>
            )}
            {reportingFarmer && (
                <WithdrawalsReportModal 
                    farmer={reportingFarmer} 
                    withdrawals={getWithdrawalsForFarmer(reportingFarmer.id)} 
                    onClose={() => setReportingFarmer(undefined)}
                    onEdit={handleEditWithdrawal}
                    onDelete={handleDeleteWithdrawal}
                />
            )}
            <ConfirmationModal isOpen={!!deletingFarmerId} onClose={() => setDeletingFarmerId(null)} onConfirm={confirmDeleteFarmer} title="تأكيد حذف المزارع" message="هل أنت متأكد من حذف هذا المزارع؟ لا يمكن حذف مزارع مرتبط بمعاملات." />
            <ConfirmationModal isOpen={!!deletingWithdrawalId} onClose={() => setDeletingWithdrawalId(null)} onConfirm={confirmDeleteWithdrawal} title="تأكيد حذف السحب" message="هل أنت متأكد من حذف عملية السحب هذه؟" />
        </div>
    );
};

export default FarmerAccountsPage;