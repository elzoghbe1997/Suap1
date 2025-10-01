import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../App';
import { AppContextType, TransactionType, Farmer, FarmerWithdrawal } from '../types';
import { FarmerIcon, RevenueIcon, ExpenseIcon, ProfitIcon, AddIcon, EditIcon, DeleteIcon, ReportIcon, CloseIcon } from './Icons';
import ConfirmationModal from './ConfirmationModal';
import SkeletonCard from './SkeletonCard';

const formInputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500";

const FarmerForm: React.FC<{ farmer?: Farmer; onSave: (farmer: Omit<Farmer, 'id'> | Farmer) => void; onCancel: () => void }> = ({ farmer, onSave, onCancel }) => {
    const [name, setName] = useState(farmer?.name || '');

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

const FarmerStatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; }> = ({ title, value, icon }) => (
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

const WithdrawalsReportModal: React.FC<{ farmer: Farmer; withdrawals: FarmerWithdrawal[]; onClose: () => void }> = ({ farmer, withdrawals, onClose }) => {
    const { cropCycles } = useContext(AppContext) as AppContextType;
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP' }).format(amount);

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
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        {['التاريخ', 'الوصف', 'العروة', 'المبلغ'].map(h => 
                                        <th key={h} className="py-3 px-4 text-right font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{h}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {withdrawals.map(w => (
                                        <tr key={w.id}>
                                            <td className="py-3 px-4 whitespace-nowrap">{w.date}</td>
                                            <td className="py-3 px-4 whitespace-nowrap">{w.description}</td>
                                            <td className="py-3 px-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{cropCycles.find(c => c.id === w.cropCycleId)?.name ?? 'غير محدد'}</td>
                                            <td className="py-3 px-4 whitespace-nowrap font-medium text-indigo-600">{formatCurrency(w.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-3">
                             {withdrawals.map(w => (
                                <div key={w.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 pr-2">
                                            <p className="font-semibold text-gray-800 dark:text-white">{w.description}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {cropCycles.find(c => c.id === w.cropCycleId)?.name ?? 'غير محدد'}
                                            </p>
                                        </div>
                                        <p className="font-bold text-lg text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{formatCurrency(w.amount)}</p>
                                    </div>
                                    <div className="text-right text-xs text-gray-400 dark:text-gray-500 mt-2">
                                        {w.date}
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
    const { loading, settings, farmers, cropCycles, transactions, farmerWithdrawals, addFarmer, updateFarmer, deleteFarmer } = useContext(AppContext) as AppContextType;
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingFarmer, setEditingFarmer] = useState<Farmer | undefined>(undefined);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [reportingFarmer, setReportingFarmer] = useState<Farmer | undefined>(undefined);

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);

    const farmerAccountData = useMemo(() => {
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

            return {
                ...farmer,
                totalShare,
                totalWithdrawals,
                balance,
                cycleCount: associatedCycles.length,
            };
        });
    }, [farmers, cropCycles, transactions, farmerWithdrawals]);

    const handleSaveFarmer = (farmer: Omit<Farmer, 'id'> | Farmer) => {
        if ('id' in farmer) {
            updateFarmer(farmer);
        } else {
            addFarmer(farmer);
        }
        setIsFormModalOpen(false);
        setEditingFarmer(undefined);
    };

    const handleEditFarmer = (farmer: Farmer) => {
        setEditingFarmer(farmer);
        setIsFormModalOpen(true);
    };

    const handleDeleteFarmer = (id: string) => {
        setDeletingId(id);
    };
    
    const confirmDeleteFarmer = () => {
        if (deletingId) {
            deleteFarmer(deletingId);
        }
        setDeletingId(null);
    };
    
    const getWithdrawalsForFarmer = (farmerId: string) => {
        const farmerCycleIds = new Set(cropCycles.filter(c => c.farmerId === farmerId).map(c => c.id));
        return farmerWithdrawals
            .filter(w => farmerCycleIds.has(w.cropCycleId))
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
                    {farmerAccountData.map(farmer => (
                        <div key={farmer.id} className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md transition-shadow hover:shadow-xl flex flex-col justify-between">
                            <div>
                                <div className="flex items-center mb-4">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full mr-3">
                                        <FarmerIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">{farmer.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">مشرف على {farmer.cycleCount} عروة</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <FarmerStatCard title="إجمالي الحصة" value={formatCurrency(farmer.totalShare)} icon={<RevenueIcon className="w-7 h-7 text-green-500" />} />
                                    <FarmerStatCard title="إجمالي المسحوبات" value={formatCurrency(farmer.totalWithdrawals)} icon={<ExpenseIcon className="w-7 h-7 text-red-500" />} />
                                    <FarmerStatCard title="الرصيد المتبقي" value={formatCurrency(farmer.balance)} icon={<ProfitIcon className={`w-7 h-7 ${farmer.balance >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />} />
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
                                    <button onClick={() => handleDeleteFarmer(farmer.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        <DeleteIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }
        return (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <div className="flex justify-center mb-4 text-gray-400 dark:text-gray-500">
                    <FarmerIcon className="w-16 h-16"/>
                </div>
                <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">لا يوجد مزارعين مسجلين</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">انقر على "إضافة مزارع" لبدء تسجيل حساباتهم.</p>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">إدارة وحسابات المزارعين</h1>
                    <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">ملخص مالي وإداري شامل لجميع المزارعين.</p>
                </div>
                <button onClick={() => { setEditingFarmer(undefined); setIsFormModalOpen(true); }} className="flex-shrink-0 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
                    <AddIcon className="w-5 h-5 ml-2" />
                    <span>إضافة مزارع</span>
                </button>
            </div>
            
            {renderContent()}

            {isFormModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">{editingFarmer ? 'تعديل مزارع' : 'إضافة مزارع جديد'}</h2>
                        <FarmerForm 
                            farmer={editingFarmer}
                            onSave={handleSaveFarmer} 
                            onCancel={() => { setIsFormModalOpen(false); setEditingFarmer(undefined); }}
                        />
                    </div>
                </div>
            )}

            {reportingFarmer && (
                <WithdrawalsReportModal 
                    farmer={reportingFarmer}
                    withdrawals={getWithdrawalsForFarmer(reportingFarmer.id)}
                    onClose={() => setReportingFarmer(undefined)}
                />
            )}
            
            <ConfirmationModal
                isOpen={!!deletingId}
                onClose={() => setDeletingId(null)}
                onConfirm={confirmDeleteFarmer}
                title="تأكيد حذف المزارع"
                message="هل أنت متأكد من حذف هذا المزارع؟ سيتم فك ارتباطه من أي عروات حالية، لكن لن يتم حذف العروات نفسها."
            />
        </div>
    );
};

export default FarmerAccountsPage;