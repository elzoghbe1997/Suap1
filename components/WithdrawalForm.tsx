import React from 'react';
import { CropCycle, Farmer, FarmerWithdrawal, CropCycleStatus } from '../types';
import { ToastContext, ToastContextType } from '../context/ToastContext';

const formInputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500";

const WithdrawalForm: React.FC<{ 
    withdrawal?: FarmerWithdrawal; 
    onSave: (withdrawal: Omit<FarmerWithdrawal, 'id'> | FarmerWithdrawal) => void; 
    onCancel: () => void; 
    cycles: CropCycle[]; 
    farmers: Farmer[]; 
    preselectedFarmerId?: string; 
}> = ({ withdrawal, onSave, onCancel, cycles, farmers, preselectedFarmerId }) => {
    const { addToast } = React.useContext(ToastContext) as ToastContextType;
    const [date, setDate] = React.useState(withdrawal?.date || new Date().toISOString().split('T')[0]);
    const [description, setDescription] = React.useState(withdrawal?.description || '');
    const [amount, setAmount] = React.useState(withdrawal?.amount?.toString() || '');
    
    const initialFarmerId = React.useMemo(() => {
        if (withdrawal) {
            return cycles.find(c => c.id === withdrawal.cropCycleId)?.farmerId || '';
        }
        return preselectedFarmerId || '';
    }, [withdrawal, cycles, preselectedFarmerId]);

    const [selectedFarmerId, setSelectedFarmerId] = React.useState(initialFarmerId);
    const [cropCycleId, setCropCycleId] = React.useState(withdrawal?.cropCycleId || '');

    const availableCycles = React.useMemo(() => {
        if (!selectedFarmerId) return [];
        return cycles.filter(c =>
            c.farmerId === selectedFarmerId &&
            (c.status === CropCycleStatus.ACTIVE || c.status === CropCycleStatus.CLOSED || c.id === withdrawal?.cropCycleId)
        );
    }, [selectedFarmerId, cycles, withdrawal]);

    React.useEffect(() => {
        // If we're creating a new withdrawal
        if (!withdrawal) {
            const activeCyclesForFarmer = availableCycles.filter(c => c.status === CropCycleStatus.ACTIVE);
            // If there's exactly one active cycle for the selected farmer, select it by default.
            if (activeCyclesForFarmer.length === 1) {
                setCropCycleId(activeCyclesForFarmer[0].id);
            } else {
                // Otherwise, if the previously selected cycle is not valid for the new farmer, clear it.
                if (cropCycleId && !availableCycles.some(c => c.id === cropCycleId)) {
                    setCropCycleId('');
                }
            }
        }
    }, [selectedFarmerId, availableCycles, withdrawal, cropCycleId]);


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
                    <label htmlFor="date" className="block text-sm font-medium text-slate-700 dark:text-slate-300">تاريخ السحب</label>
                    <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className={formInputClass}/>
                </div>
                 <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-slate-700 dark:text-slate-300">المبلغ (ج.م)</label>
                    <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)} required min="0" step="0.01" className={formInputClass}/>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="farmer" className="block text-sm font-medium text-slate-700 dark:text-slate-300">المزارع</label>
                    <select id="farmer" value={selectedFarmerId} onChange={e => setSelectedFarmerId(e.target.value)} required className={formInputClass}>
                        <option value="" disabled>اختر مزارعًا</option>
                        {farmers.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="cropCycle" className="block text-sm font-medium text-slate-700 dark:text-slate-300">العروة</label>
                    <select id="cropCycle" value={cropCycleId} onChange={e => setCropCycleId(e.target.value)} required className={formInputClass} disabled={!selectedFarmerId}>
                        <option value="" disabled>اختر عروة</option>
                        {availableCycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {selectedFarmerId && availableCycles.length === 0 && <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">لا توجد عروات متاحة لهذا المزارع.</p>}
                </div>
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300">الوصف</label>
                <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} required className={formInputClass}/>
            </div>
            <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">إلغاء</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">حفظ</button>
            </div>
        </form>
    );
};

export default WithdrawalForm;