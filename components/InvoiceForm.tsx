import React from 'react';
import { AppContext } from '../App';
import { AppContextType, Transaction, CropCycle, TransactionType, CropCycleStatus, FertilizationProgram } from '../types';
import { ToastContext, ToastContextType } from '../context/ToastContext';
import { AddIcon, CloseIcon } from './Icons';

const formInputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500";

const InvoiceForm: React.FC<{
    invoice?: Transaction;
    onSave: (invoice: Omit<Transaction, 'id'> | Transaction) => void;
    onCancel: () => void;
    cycles: CropCycle[];
    fertilizationPrograms: FertilizationProgram[];
    initialCycleId?: string;
}> = ({ invoice, onSave, onCancel, cycles, fertilizationPrograms, initialCycleId }) => {
    const { addToast } = React.useContext(ToastContext) as ToastContextType;
    const { settings } = React.useContext(AppContext) as AppContextType;
    
    const activeCycles = cycles.filter(c => c.status === CropCycleStatus.ACTIVE);

    const determineInitialCycleId = () => {
        if (invoice?.cropCycleId) return invoice.cropCycleId;
        if (initialCycleId) return initialCycleId;
        if (activeCycles.length === 1) return activeCycles[0].id;
        return '';
    };

    const [date, setDate] = React.useState(invoice?.date || new Date().toISOString().split('T')[0]);
    const [description, setDescription] = React.useState(invoice?.description || '');
    const [cropCycleId, setCropCycleId] = React.useState(determineInitialCycleId());
    const [discount, setDiscount] = React.useState(invoice?.discount?.toString() || '0');
    const [errors, setErrors] = React.useState<{ [key: string]: string }>({});
    const [fertilizationProgramId, setFertilizationProgramId] = React.useState(invoice?.fertilizationProgramId || '');
    
    const getInitialItems = () => {
        if (!invoice) {
            return [{ quantity: '', price: '' }];
        }
        
        let itemsFromInvoice: { quantity: string; price: string }[] = [];
        if (invoice.priceItems && invoice.priceItems.length > 0) {
            itemsFromInvoice = invoice.priceItems.map(p => ({ quantity: p.quantity.toString(), price: p.price.toString() }));
        } else {
            // Fallback for old data structure
            if (typeof invoice.quantityGrade1 === 'number' || typeof invoice.priceGrade1 === 'number') {
                itemsFromInvoice.push({ quantity: invoice.quantityGrade1?.toString() || '0', price: invoice.priceGrade1?.toString() || '0' });
            }
            if (typeof invoice.quantityGrade2 === 'number' || typeof invoice.priceGrade2 === 'number') {
                itemsFromInvoice.push({ quantity: invoice.quantityGrade2?.toString() || '0', price: invoice.priceGrade2?.toString() || '0' });
            }
        }

        // Ensure at least one item is present in the form UI
        if (itemsFromInvoice.length === 0) {
            itemsFromInvoice.push({ quantity: '', price: '' });
        }
        return itemsFromInvoice;
    };

    const [items, setItems] = React.useState(getInitialItems);
    
    const availablePrograms = React.useMemo(() => {
        if (!cropCycleId) return [];
        return fertilizationPrograms.filter(p => p.cropCycleId === cropCycleId);
    }, [cropCycleId, fertilizationPrograms]);

    React.useEffect(() => {
        // This effect runs when the form is for a new invoice and the available programs change (due to cropCycleId changing)
        if (!invoice && availablePrograms.length > 0) {
            const sortedPrograms = [...availablePrograms].sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
            setFertilizationProgramId(sortedPrograms[0].id);
        }
        // If available programs become empty (e.g., user switches to a cycle with no programs), clear the selection.
        else if (!invoice && availablePrograms.length === 0) {
            setFertilizationProgramId('');
        }
    }, [availablePrograms, invoice]);

    const handleItemChange = (index: number, field: 'quantity' | 'price', value: string) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { quantity: '', price: '' }]);
    };

    const removeItem = (index: number) => {
        if (items.length <= 1) {
            addToast('يجب أن تحتوي الفاتورة على بند واحد على الأقل.', 'warning');
            return;
        }
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };
    
    const { calculatedAmount, totalQuantity } = React.useMemo(() => {
        const d = Number(discount) || 0;
        let totalAmount = 0;
        let quantity = 0;
        for (const item of items) {
            const q = Number(item.quantity) || 0;
            const p = Number(item.price) || 0;
            totalAmount += q * p;
            quantity += q;
        }
        return { calculatedAmount: totalAmount - d, totalQuantity: quantity };
    }, [items, discount]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const validationErrors: { [key: string]: string } = {};
        if (!cropCycleId) validationErrors.cropCycleId = 'يجب ربط الفاتورة بعروة.';
        
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            addToast('يرجى ملء الحقول المطلوبة.', 'error');
            return;
        }

        if (!date) {
            addToast('يرجى تحديد تاريخ الفاتورة.', 'error');
            return;
        }
        
        if (calculatedAmount <= 0) {
            addToast('المبلغ الإجمالي للفاتورة يجب أن يكون أكبر من صفر.', 'error');
            return;
        }

        const priceItems = items
            .map(item => ({
                quantity: Number(item.quantity) || 0,
                price: Number(item.price) || 0
            }))
            .filter(item => item.quantity > 0 || item.price > 0);

        if (priceItems.length === 0) {
            addToast('يرجى إدخال بيانات بند واحد على الأقل.', 'error');
            return;
        }

        setErrors({});

        const data: Omit<Transaction, 'id' | 'type' | 'category' | 'quantityGrade1' | 'priceGrade1' | 'quantityGrade2' | 'priceGrade2'> & { type: TransactionType.REVENUE; category: 'أخرى' } = {
            date,
            description,
            cropCycleId,
            type: TransactionType.REVENUE,
            category: 'أخرى',
            amount: calculatedAmount,
            quantity: totalQuantity,
            priceItems,
            discount: Number(discount),
            fertilizationProgramId: fertilizationProgramId || null,
        };

        if (invoice) {
            onSave({ ...invoice, ...data });
        } else {
            onSave(data);
        }
    };
    
    const errorInputClass = "border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500";

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300">وصف الفاتورة</label>
                <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} className={formInputClass}/>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-slate-700 dark:text-slate-300">تاريخ الفاتورة</label>
                    <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className={formInputClass}/>
                </div>
                <div>
                    <label htmlFor="cropCycle" className="block text-sm font-medium text-slate-700 dark:text-slate-300">العروة</label>
                    <select id="cropCycle" value={cropCycleId} onChange={e => setCropCycleId(e.target.value)} disabled={cycles.length === 1} className={`${formInputClass} ${errors.cropCycleId ? errorInputClass : ''}`}>
                        <option value="" disabled>اختر عروة</option>
                        {cycles.filter(c => c.status === CropCycleStatus.ACTIVE || c.status === CropCycleStatus.CLOSED || c.id === invoice?.cropCycleId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">اختر البرنامج الذي أدى إلى هذا الحصاد لحساب ربحيته بدقة.</p>
                </div>
            )}

            <div className="space-y-3">
                {items.map((item, index) => (
                    <fieldset key={index} className="border border-slate-300 dark:border-slate-600 p-4 rounded-md relative group">
                        <legend className="px-2 text-sm font-medium text-slate-700 dark:text-slate-300">سعر {index + 1}</legend>
                        {items.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="absolute top-2 left-2 p-1 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label={`إزالة السعر ${index + 1}`}
                            >
                                <CloseIcon className="w-4 h-4" />
                            </button>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor={`quantity-${index}`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">الكمية (ك.ج)</label>
                                <input type="number" id={`quantity-${index}`} value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} min="0" className={formInputClass}/>
                            </div>
                             <div>
                                <label htmlFor={`price-${index}`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">سعر الكيلو</label>
                                <input type="number" id={`price-${index}`} value={item.price} onChange={e => handleItemChange(index, 'price', e.target.value)} min="0" step="0.01" className={formInputClass}/>
                            </div>
                        </div>
                    </fieldset>
                ))}
            </div>

            <div className="mt-4">
                <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-green-500 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                >
                    <AddIcon className="w-5 h-5 ml-2" />
                    <span>إضافة بند سعر</span>
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                 <div>
                    <label htmlFor="discount" className="block text-sm font-medium text-slate-700 dark:text-slate-300">الخصم (ج.م)</label>
                    <input type="number" id="discount" value={discount} onChange={e => setDiscount(e.target.value)} min="0" step="0.01" className={formInputClass}/>
                </div>
                 <div className="pt-1">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">الإجمالي</p>
                    <p className="text-2xl font-bold text-green-600">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP' }).format(calculatedAmount)}</p>
                </div>
            </div>

            <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">إلغاء</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">حفظ الفاتورة</button>
            </div>
        </form>
    );
};

export default InvoiceForm;