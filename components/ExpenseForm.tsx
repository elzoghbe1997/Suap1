import React from 'react';
import { AppContext } from '../App';
import { AppContextType, Transaction, CropCycle, TransactionType, Supplier, CropCycleStatus, FertilizationProgram } from '../types';
import { ToastContext, ToastContextType } from '../context/ToastContext';

const formInputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500";

const ExpenseForm: React.FC<{
    expense?: Transaction;
    onSave: (expense: Omit<Transaction, 'id'> | Transaction) => void;
    onCancel: () => void;
    cycles: CropCycle[];
    suppliers: Supplier[];
    fertilizationPrograms: FertilizationProgram[];
    settings: AppContextType['settings'];
    transactions: Transaction[];
    initialCycleId?: string;
}> = ({ expense, onSave, onCancel, cycles, suppliers, fertilizationPrograms, settings, transactions, initialCycleId }) => {
    const { addToast } = React.useContext(ToastContext) as ToastContextType;
    const expenseCategories = settings.expenseCategories || [];
    const otherCategoryName = expenseCategories.find(c => c.name === 'أخرى')?.name || expenseCategories[0]?.name || '';

    const activeCycles = cycles.filter(c => c.status === CropCycleStatus.ACTIVE);
    
    const determineInitialCycleId = () => {
        if (expense?.cropCycleId) return expense.cropCycleId;
        if (initialCycleId) return initialCycleId;
        if (activeCycles.length === 1) return activeCycles[0].id;
        return '';
    };

    const [date, setDate] = React.useState(expense?.date || new Date().toISOString().split('T')[0]);
    const [description, setDescription] = React.useState(expense?.description || '');
    const [amount, setAmount] = React.useState(expense?.amount?.toString() || '');
    const [cropCycleId, setCropCycleId] = React.useState(determineInitialCycleId());
    const [category, setCategory] = React.useState<string>(expense?.category || otherCategoryName);
    
    const [fertilizationProgramId, setFertilizationProgramId] = React.useState(expense?.fertilizationProgramId || '');
    const [errors, setErrors] = React.useState<{ [key: string]: string }>({});

    const showSupplierField = settings.isSupplierSystemEnabled && (category === 'أسمدة ومغذيات' || category === 'مبيدات');
    const errorInputClass = "border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500";

    const latestUsedSupplierId = React.useMemo(() => {
        if (expense) return ''; // No default on edit
        // If a cycle is pre-selected, find the latest supplier for THAT cycle
        if (cropCycleId) {
            const latestInCycle = transactions
                .filter(t => t.cropCycleId === cropCycleId && t.type === TransactionType.EXPENSE && t.supplierId)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            if (latestInCycle.length > 0 && latestInCycle[0].supplierId) return latestInCycle[0].supplierId;
        }
        // Fallback: find latest expense with supplier overall
        const latestOverall = transactions.find(t => t.type === TransactionType.EXPENSE && t.supplierId);
        return latestOverall?.supplierId || '';
    }, [transactions, cropCycleId, expense]);
    const [supplierId, setSupplierId] = React.useState(expense?.supplierId || latestUsedSupplierId);

    React.useEffect(() => {
        // When crop cycle changes on a NEW form, update the default supplier
        if (!expense) {
            setSupplierId(latestUsedSupplierId);
        }
    }, [cropCycleId, latestUsedSupplierId, expense]);

    const availablePrograms = React.useMemo(() => {
        if (!cropCycleId) return [];
        return fertilizationPrograms.filter(p => p.cropCycleId === cropCycleId);
    }, [cropCycleId, fertilizationPrograms]);

    React.useEffect(() => {
        // Reset program if cycle changes and the program is no longer valid
        if (cropCycleId && !availablePrograms.some(p => p.id === fertilizationProgramId)) {
            setFertilizationProgramId('');
        }
    }, [cropCycleId, availablePrograms, fertilizationProgramId]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const validationErrors: { [key: string]: string } = {};
        if (!description.trim()) validationErrors.description = 'وصف المصروف مطلوب.';
        if (!amount || Number(amount) <= 0) validationErrors.amount = 'المبلغ يجب أن يكون أكبر من صفر.';
        if (!cropCycleId) validationErrors.cropCycleId = 'يجب ربط المصروف بعروة.';

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            addToast('يرجى ملء الحقول المطلوبة.', 'error');
            return;
        }
        setErrors({});

        const numericAmount = Number(amount);
        
        const data: Omit<Transaction, 'id' | 'type'> & { type: TransactionType.EXPENSE } = {
            date,
            description,
            amount: numericAmount,
            cropCycleId,
            category,
            type: TransactionType.EXPENSE,
            supplierId: showSupplierField ? supplierId || null : null,
            fertilizationProgramId: fertilizationProgramId || null,
        };

        if (expense) {
            onSave({ ...expense, ...data });
        } else {
            onSave(data);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300">وصف المصروف</label>
                <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} className={`${formInputClass} ${errors.description ? errorInputClass : ''}`}/>
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>
            
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-slate-700 dark:text-slate-300">تاريخ المصروف</label>
                    <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className={formInputClass}/>
                </div>
                 <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-slate-700 dark:text-slate-300">المبلغ (ج.م)</label>
                    <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)} min="0" step="0.01" className={`${formInputClass} ${errors.amount ? errorInputClass : ''}`}/>
                    {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-slate-700 dark:text-slate-300">الفئة</label>
                    <select id="category" value={category} onChange={e => setCategory(e.target.value)} required className={formInputClass}>
                        {expenseCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="cropCycle" className="block text-sm font-medium text-slate-700 dark:text-slate-300">العروة</label>
                    <select id="cropCycle" value={cropCycleId} onChange={e => setCropCycleId(e.target.value)} disabled={cycles.length === 1} className={`${formInputClass} ${errors.cropCycleId ? errorInputClass : ''}`}>
                        <option value="" disabled>اختر عروة</option>
                         {cycles.filter(c => c.status === CropCycleStatus.ACTIVE || c.status === CropCycleStatus.CLOSED || c.id === expense?.cropCycleId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {errors.cropCycleId && <p className="mt-1 text-sm text-red-600">{errors.cropCycleId}</p>}
                </div>
            </div>

             {settings.isAgriculturalProgramsSystemEnabled && cropCycleId && availablePrograms.length > 0 && (
                <div>
                    <label htmlFor="fertilizationProgram" className="block text-sm font-medium text-slate-700 dark:text-slate-300">البرنامج الزراعي (اختياري)</label>
                    <select id="fertilizationProgram" value={fertilizationProgramId || ''} onChange={e => setFertilizationProgramId(e.target.value)} className={formInputClass}>
                        <option value="">بدون برنامج</option>
                        {availablePrograms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
            )}
            
            {showSupplierField && (
                <div>
                    <label htmlFor="supplier" className="block text-sm font-medium text-slate-700 dark:text-slate-300">المورد (آجل)</label>
                    <select id="supplier" value={supplierId || ''} onChange={e => setSupplierId(e.target.value)} className={formInputClass}>
                        <option value="">نقدي (بدون مورد)</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            )}

            <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">إلغاء</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">حفظ المصروف</button>
            </div>
        </form>
    );
};

export default ExpenseForm;