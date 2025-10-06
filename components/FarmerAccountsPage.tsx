import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { AppContextType, TransactionType, Farmer, FarmerWithdrawal, CropCycle, CropCycleStatus, Transaction } from '../types';
import { FarmerIcon, RevenueIcon, ExpenseIcon, ProfitIcon, AddIcon, EditIcon, DeleteIcon, ReportIcon, CloseIcon } from './Icons';
import { ToastContext, ToastContextType } from '../context/ToastContext';
import ConfirmationModal from './ConfirmationModal';
import SkeletonCard from './SkeletonCard';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter';
import WithdrawalForm from './WithdrawalForm';

const formInputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500";

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
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">اسم المزارع</label>
                <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className={formInputClass}/>
            </div>
            <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">إلغاء</button>
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
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        <div className="flex items-center">
            {icon}
            <div className="mr-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-xl font-bold text-gray-800 dark:text-gray-200">
                    <AnimatedNumber value={value} />
                </p>
            </div>
        </div>
    </div>
);

const WithdrawalsReportModal: React.FC<{ farmer: Farmer; withdrawals: FarmerWithdrawal[]; onClose: () => void; onEdit: (w: FarmerWithdrawal) => void; onDelete: (id: string) => void; }> = ({ farmer, withdrawals, onClose, onEdit, onDelete }) => {
    const { cropCycles } = React.useContext(AppContext) as AppContextType;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">تقرير سحوبات: {farmer.name}</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                {withdrawals.length > 0 ? (
                    <div>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        {['التاريخ', 'الوصف', 'العروة', 'المبلغ', 'الإجراءات'].map(h => 
                                        <th key={h} className="py-3 px-4 text-right font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{h}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {withdrawals.map(w => (
                                        <tr key={w.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="py-3 px-4 whitespace-nowrap">{w.date}</td>
                                            <td className="py-3 px-4 whitespace-nowrap">{w.description}</td>
                                            <td className="py-3 px-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{cropCycles.find(c => c.id === w.cropCycleId)?.name ?? 'غير محدد'}</td>
                                            <td className="py-3 px-4 whitespace-nowrap font-medium text-indigo-600">{formatCurrency(w.amount)}</td>
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-2 space-x-reverse">
                                                    <button onClick={() => onEdit(w)} className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50"><EditIcon className="w-5 h-5"/></button>
                                                    <button onClick={() => onDelete(w.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"><DeleteIcon className="w-5 h-5"/></button>
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
                                <div key={w.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <p className="font-bold text-gray-800 dark:text-white flex-1 pr-2">{w.description}</p>
                                        <p className="font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{formatCurrency(w.amount)}</p>
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        <p><strong className="font-medium text-gray-700 dark:text-gray-300">العروة:</strong> {cropCycles.find(c => c.id === w.cropCycleId)?.name ?? 'غير محدد'}</p>
                                    </div>
                                    <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{w.date}</p>
                                        <div className="flex items-center space-x-2 space-x-reverse">
                                            <button onClick={() => onEdit(w)} className="text-blue-500 hover:text-blue-700 p-1 rounded-full"><EditIcon className="w-5 h-5"/></button>
                                            <button onClick={() => onDelete(w.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full"><DeleteIcon className="w-5 h-5"/></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">لا توجد سحوبات مسجلة لهذا المزارع.</p>
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
             <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">نظام المزارعين غير مفعل</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
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
                                className={`bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md transition-all duration-300 flex flex-col justify-between ${
                                    highlightedFarmerId === farmer.id ? 'ring-2 ring-green-500 shadow-lg' : 'hover:shadow-xl'
                                }`}
                            >
                                <div>
                                    <div className="flex items-center mb-4">
                                        <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full mr-3">
                                            <FarmerIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-xl font-bold text-gray-800 dark:text-white">{farmer.name}</h3>
                                                <button 
                                                    onClick={() => handleQuickAddWithdrawal(farmer.id)}
                                                    className="p-1.5 text-indigo-500 hover:text-indigo-700 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors -mr-1.5"
                                                    title="إضافة سحب لهذا المزارع"
                                                >
                                                    <AddIcon className="w-5 h-5"/>
                                                </button>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">مشرف على {farmer.cycleCount} عروة</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <FarmerStatCard title="إجمالي الحصة" value={farmer.totalShare} icon={<RevenueIcon className="w-7 h-7 text-green-500" />} />
                                        <FarmerStatCard title="إجمالي المسحوبات" value={farmer.totalWithdrawals} icon={<ExpenseIcon className="w-7 h-7 text-red-500" />} />
                                        <FarmerStatCard title="الرصيد المتبقي" value={farmer.balance} icon={<ProfitIcon className={`w-7 h-7 ${farmer.balance >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />} />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
                                    <button onClick={() => setReportingFarmer(farmer)} className="flex items-center px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                        <ReportIcon className="w-4 h-4 ml-1.5"/>
                                        <span>عرض السحوبات</span>
                                    </button>
                                    <div className="flex items-center space-x-1 space-x-reverse">
                                        <button onClick={() => handleEditFarmer(farmer)} className="p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                            <EditIcon className="w-5 h-5"/>
                                        </button>
                                        <button 
                                            onClick={() => setDeletingFarmerId(farmer.id)} 
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
                        );
                    })}
                </div>
            );
        }
        return (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <div className="flex justify-center mb-4 text-gray-400 dark:text-gray-500">
                    <FarmerIcon className="w-16 h-16"/>
                </div>
                <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">لا يوجد مزارعين مسجلين</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">ابدأ بإضافة المزارعين لتسجيل حساباتهم وسحوباتهم.</p>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">ادارة حساب المزارع</h1>
                    <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">ملخص مالي شامل وإدارة كاملة للمزارعين وسحوباتهم.</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                    <button onClick={() => { setEditingFarmer(undefined); setIsFarmerFormOpen(true); }} className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
                        <AddIcon className="w-5 h-5 ml-2" />
                        <span>إضافة مزارع</span>
                    </button>
                     <button onClick={() => { setPreselectedFarmerId(''); setEditingWithdrawal(undefined); setIsWithdrawalModalOpen(true); }} className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                        <AddIcon className="w-5 h-5 ml-2" />
                        <span>إضافة سحب</span>
                    </button>
                </div>
            </div>
            
            {renderContent()}

            {isFarmerFormOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">{editingFarmer ? 'تعديل مزارع' : 'إضافة مزارع جديد'}</h2>
                        <FarmerForm 
                            farmer={editingFarmer}
                            onSave={handleSaveFarmer} 
                            onCancel={() => { setIsFarmerFormOpen(false); setEditingFarmer(undefined); }}
                        />
                    </div>
                </div>
            )}
            
            {isWithdrawalModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">{editingWithdrawal ? 'تعديل سحب' : 'إضافة سحب جديد'}</h2>
                        <WithdrawalForm
                            withdrawal={editingWithdrawal}
                            onSave={handleSaveWithdrawal} 
                            onCancel={() => { setIsWithdrawalModalOpen(false); setEditingWithdrawal(undefined); setPreselectedFarmerId(''); }} 
                            cycles={cropCycles}
                            farmers={farmers}
                            preselectedFarmerId={preselectedFarmerId}
                        />
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
            
            <ConfirmationModal
                isOpen={!!deletingFarmerId}
                onClose={() => setDeletingFarmerId(null)}
                onConfirm={confirmDeleteFarmer}
                title="تأكيد حذف المزارع"
                message="هل أنت متأكد من حذف هذا المزارع؟ لا يمكن حذف المزارع إلا إذا لم يكن له أي سجلات مالية. سيتم رفض الحذف إذا كان مرتبطًا بمعاملات."
            />
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

export default FarmerAccountsPage;
