// FIX: Imported useMemo to resolve 'Cannot find name' errors.
import React, { useState, useContext, useEffect, useMemo } from 'react';
import { AppContext } from '../App';
import { AppContextType, FarmerWithdrawal, CropCycle, Farmer } from '../types';
import { ToastContext, ToastContextType } from '../context/ToastContext';
import { AddIcon, EditIcon, DeleteIcon } from './Icons';
import ConfirmationModal from './ConfirmationModal';

const formInputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500";

const WithdrawalForm: React.FC<{ withdrawal?: FarmerWithdrawal; onSave: (withdrawal: Omit<FarmerWithdrawal, 'id'> | FarmerWithdrawal) => void; onCancel: () => void; cycles: CropCycle[]; farmers: Farmer[] }> = ({ withdrawal, onSave, onCancel, cycles, farmers }) => {
    const { addToast } = useContext(ToastContext) as ToastContextType;
    const [date, setDate] = useState(withdrawal?.date || new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState(withdrawal?.description || '');
    const [amount, setAmount] = useState(withdrawal?.amount?.toString() || '');
    
    const initialFarmerId = useMemo(() => {
        if (withdrawal) {
            return cycles.find(c => c.id === withdrawal.cropCycleId)?.farmerId || '';
        }
        return '';
    }, [withdrawal, cycles]);

    const [selectedFarmerId, setSelectedFarmerId] = useState(initialFarmerId);
    const [cropCycleId, setCropCycleId] = useState(withdrawal?.cropCycleId || '');

    const availableCycles = useMemo(() => {
        if (!selectedFarmerId) return [];
        return cycles.filter(c =>
            c.farmerId === selectedFarmerId &&
            (c.status === 'نشطة' || c.id === withdrawal?.cropCycleId)
        );
    }, [selectedFarmerId, cycles, withdrawal]);

    useEffect(() => {
        // If the selected crop cycle is no longer valid after a farmer change, reset it.
        if (cropCycleId && !availableCycles.some(c => c.id === cropCycleId)) {
            setCropCycleId('');
        }
    }, [availableCycles, cropCycleId]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const numericAmount = Number(amount);
        if (numericAmount <= 0) {
            addToast('مبلغ السحب يجب أن يكون أكبر من صفر.', 'error');
            return;
        }
        if (!cropCycleId || !selectedFarmerId) {
            addToast('يرجى اختيار المزارع والعروة.', 'error');
            return;
        }

        const data = { date, description, amount: numericAmount, cropCycleId };
        if (withdrawal) {
            onSave({ ...withdrawal, ...data });
        } else {
            onSave(data);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">تاريخ السحب</label>
                    <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className={formInputClass}/>
                </div>
                 <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">المبلغ (ج.م)</label>
                    <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)} required min="0" step="0.01" className={formInputClass}/>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="farmer" className="block text-sm font-medium text-gray-700 dark:text-gray-300">المزارع</label>
                    <select id="farmer" value={selectedFarmerId} onChange={e => setSelectedFarmerId(e.target.value)} required className={formInputClass}>
                        <option value="" disabled>اختر مزارعًا</option>
                        {farmers.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="cropCycle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">العروة</label>
                    <select id="cropCycle" value={cropCycleId} onChange={e => setCropCycleId(e.target.value)} required className={formInputClass} disabled={!selectedFarmerId}>
                        <option value="" disabled>اختر عروة</option>
                        {availableCycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {selectedFarmerId && availableCycles.length === 0 && <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">لا توجد عروات متاحة لهذا المزارع.</p>}
                </div>
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">الوصف</label>
                <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} required className={formInputClass}/>
            </div>
            <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">إلغاء</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">حفظ</button>
            </div>
        </form>
    );
};

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


const FarmerWithdrawalsPage: React.FC = () => {
    const { loading, settings, farmerWithdrawals, cropCycles, farmers, addFarmerWithdrawal, updateFarmerWithdrawal, deleteFarmerWithdrawal } = useContext(AppContext) as AppContextType;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWithdrawal, setEditingWithdrawal] = useState<FarmerWithdrawal | undefined>(undefined);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [filterCycle, setFilterCycle] = useState('all');
    
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP' }).format(amount);
    
    const handleSave = (withdrawal: Omit<FarmerWithdrawal, 'id'> | FarmerWithdrawal) => {
        if ('id' in withdrawal) {
            updateFarmerWithdrawal(withdrawal);
        } else {
            addFarmerWithdrawal(withdrawal);
        }
        setIsModalOpen(false);
        setEditingWithdrawal(undefined);
    };

    const handleEdit = (withdrawal: FarmerWithdrawal) => {
        setEditingWithdrawal(withdrawal);
        setIsModalOpen(true);
    };
    
    const handleDelete = (id: string) => {
        setDeletingId(id);
    };

    const confirmDelete = () => {
        if (deletingId) {
            deleteFarmerWithdrawal(deletingId);
        }
        setDeletingId(null);
    };

    const filteredWithdrawals = farmerWithdrawals.filter(w => {
        return filterCycle === 'all' || w.cropCycleId === filterCycle;
    });
    
    if (!settings.isFarmerSystemEnabled) {
        return (
             <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">نظام المزارعين غير مفعل</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    يرجى تفعيل "نظام حصة المزارع" من صفحة <a href="#/settings" className="text-green-600 hover:underline">الإعدادات</a> لعرض وإدارة هذه الصفحة.
                </p>
            </div>
        );
    }

    const renderContent = () => {
        if (loading) {
            return <SkeletonList />;
        }
        return (
            <>
                {/* Desktop Table View */}
                <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    {['التاريخ', 'الوصف', 'المزارع', 'العروة', 'المبلغ', 'الإجراءات'].map(h => 
                                    <th key={h} className="py-3 px-4 text-right font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{h}</th>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredWithdrawals.map(w => {
                                    const cycle = cropCycles.find(c => c.id === w.cropCycleId);
                                    const farmer = cycle ? farmers.find(f => f.id === cycle.farmerId) : null;
                                    return (
                                    <tr key={w.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="py-4 px-4 whitespace-nowrap">{w.date}</td>
                                        <td className="py-4 px-4 whitespace-nowrap">{w.description}</td>
                                        <td className="py-4 px-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{farmer?.name ?? 'غير محدد'}</td>
                                        <td className="py-4 px-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{cycle?.name ?? 'غير محدد'}</td>
                                        <td className="py-4 px-4 whitespace-nowrap font-medium text-indigo-600">{formatCurrency(w.amount)}</td>
                                        <td className="py-4 px-4 whitespace-nowrap font-medium">
                                            <div className="flex items-center space-x-2 space-x-reverse">
                                                <button onClick={() => handleEdit(w)} className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50"><EditIcon className="w-5 h-5"/></button>
                                                <button onClick={() => handleDelete(w.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"><DeleteIcon className="w-5 h-5"/></button>
                                            </div>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                    {filteredWithdrawals.map(w => {
                        const cycle = cropCycles.find(c => c.id === w.cropCycleId);
                        const farmer = cycle ? farmers.find(f => f.id === cycle.farmerId) : null;
                        return (
                        <div key={w.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <p className="font-bold text-gray-800 dark:text-white flex-1 pr-2">{w.description}</p>
                                <p className="font-semibold text-indigo-600 whitespace-nowrap">{formatCurrency(w.amount)}</p>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <p><strong className="font-medium text-gray-700 dark:text-gray-300">المزارع:</strong> {farmer?.name ?? 'غير محدد'}</p>
                            <p><strong className="font-medium text-gray-700 dark:text-gray-300">العروة:</strong> {cycle?.name ?? 'غير محدد'}</p>
                            </div>
                            <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                                <p className="text-xs text-gray-500 dark:text-gray-400">{w.date}</p>
                                <div className="flex items-center space-x-2 space-x-reverse">
                                    <button onClick={() => handleEdit(w)} className="text-blue-500 hover:text-blue-700 p-1 rounded-full"><EditIcon className="w-5 h-5"/></button>
                                    <button onClick={() => handleDelete(w.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full"><DeleteIcon className="w-5 h-5"/></button>
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            </>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                 <button onClick={() => { setEditingWithdrawal(undefined); setIsModalOpen(true); }} className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
                    <AddIcon className="w-5 h-5 ml-2" />
                    <span>إضافة سحب</span>
                </button>
                 <div className="flex-1 min-w-[150px] sm:max-w-xs">
                    <select id="filterCycle" value={filterCycle} onChange={e => setFilterCycle(e.target.value)} className={formInputClass.replace('mt-1', '')}>
                        <option value="all">كل العروات</option>
                        {cropCycles.filter(c => c.farmerId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>
            
            {renderContent()}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">{editingWithdrawal ? 'تعديل سحب' : 'إضافة سحب جديد'}</h2>
                        <WithdrawalForm
                            withdrawal={editingWithdrawal}
                            onSave={handleSave} 
                            onCancel={() => { setIsModalOpen(false); setEditingWithdrawal(undefined); }} 
                            cycles={cropCycles}
                            farmers={farmers}
                        />
                    </div>
                </div>
            )}
            
            <ConfirmationModal
                isOpen={!!deletingId}
                onClose={() => setDeletingId(null)}
                onConfirm={confirmDelete}
                title="تأكيد الحذف"
                message="هل أنت متأكد من حذف عملية السحب هذه؟"
            />
        </div>
    );
};

export default FarmerWithdrawalsPage;