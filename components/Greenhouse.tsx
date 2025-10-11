import React from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../App.tsx';
import { AppContextType, Greenhouse } from '../types.ts';
import { ToastContext, ToastContextType } from '../context/ToastContext.tsx';
import { AddIcon, EditIcon, DeleteIcon, CostIcon, GreenhouseIcon, CycleIcon, ReportIcon } from './Icons.tsx';
import ConfirmationModal from './ConfirmationModal.tsx';
import SkeletonCard from './SkeletonCard.tsx';

const formInputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500";

const GreenhouseForm: React.FC<{ greenhouse?: Greenhouse; onSave: (greenhouse: Omit<Greenhouse, 'id'> | Greenhouse) => void; onCancel: () => void }> = ({ greenhouse, onSave, onCancel }) => {
    const { addToast } = React.useContext(ToastContext) as ToastContextType;
    const [name, setName] = React.useState(greenhouse?.name || '');
    const [initialCost, setInitialCost] = React.useState(greenhouse?.initialCost?.toString() || '');
    const [creationDate] = React.useState(greenhouse?.creationDate || new Date().toISOString().split('T')[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const numericCost = Number(initialCost);
        if (numericCost < 0) {
            addToast('التكلفة التأسيسية لا يمكن أن تكون سالبة.', 'error');
            return;
        }

        const data = { name, creationDate, initialCost: numericCost };
        if (greenhouse) {
            onSave({ ...greenhouse, ...data });
        } else {
            onSave(data);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">اسم الصوبة</label>
                <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className={formInputClass}/>
            </div>
            <div>
                <label htmlFor="initialCost" className="block text-sm font-medium text-slate-700 dark:text-slate-300">التكلفة التأسيسية (ج.م)</label>
                <input type="number" id="initialCost" value={initialCost} onChange={(e) => setInitialCost(e.target.value)} required min="0" className={formInputClass}/>
            </div>
            <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">إلغاء</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">حفظ</button>
            </div>
        </form>
    );
};

const GreenhouseCard: React.FC<{ greenhouse: Greenhouse; onEdit: () => void; onDelete: () => void; }> = ({ greenhouse, onEdit, onDelete }) => {
    const { cropCycles } = React.useContext(AppContext) as AppContextType;
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);
    
    const cycleCount = React.useMemo(() => {
        return cropCycles.filter(c => c.greenhouseId === greenhouse.id).length;
    }, [cropCycles, greenhouse.id]);

    return (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-md transition-shadow hover:shadow-xl flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3 space-x-reverse">
                        <GreenhouseIcon className="w-8 h-8 text-green-500" />
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{greenhouse.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">تاريخ الإنشاء: {greenhouse.creationDate}</p>
                        </div>
                    </div>
                </div>
                
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 grid grid-cols-2 gap-4">
                     <div className="flex items-center text-slate-700 dark:text-slate-300">
                        <CostIcon className="w-6 h-6 text-blue-500 ml-3 flex-shrink-0" />
                        <div>
                           <p className="text-sm text-slate-500 dark:text-slate-400">التكلفة التأسيسية</p>
                           <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(greenhouse.initialCost)}</p>
                        </div>
                     </div>
                     <div className="flex items-center text-slate-700 dark:text-slate-300">
                        <CycleIcon className="w-6 h-6 text-yellow-500 ml-3 flex-shrink-0" />
                        <div>
                           <p className="text-sm text-slate-500 dark:text-slate-400">عدد العروات</p>
                           <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">{cycleCount}</p>
                        </div>
                     </div>
                </div>
            </div>
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                <Link to={`/greenhouse/${greenhouse.id}/report`} className="flex items-center px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                    <ReportIcon className="w-4 h-4 ml-1.5"/>
                    <span>عرض التقرير</span>
                </Link>
                <div className="flex items-center space-x-1 space-x-reverse">
                    <button onClick={onEdit} className="p-2 text-slate-400 hover:text-blue-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" aria-label={`تعديل الصوبة ${greenhouse.name}`}>
                        <EditIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={onDelete} className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" aria-label={`حذف الصوبة ${greenhouse.name}`}>
                        <DeleteIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        </div>
    );
};


const GreenhousePage: React.FC = () => {
    const { loading, greenhouses, cropCycles, addGreenhouse, updateGreenhouse, deleteGreenhouse } = React.useContext(AppContext) as AppContextType;
    const { addToast } = React.useContext(ToastContext) as ToastContextType;
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingGreenhouse, setEditingGreenhouse] = React.useState<Greenhouse | undefined>(undefined);
    const [deletingId, setDeletingId] = React.useState<string | null>(null);

    React.useEffect(() => {
        const isAnyModalOpen = isModalOpen || !!deletingId;
        if (isAnyModalOpen) {
            document.body.classList.add('body-no-scroll');
        } else {
            document.body.classList.remove('body-no-scroll');
        }
        return () => {
            document.body.classList.remove('body-no-scroll');
        };
    }, [isModalOpen, deletingId]);

    const handleSave = (greenhouse: Omit<Greenhouse, 'id'> | Greenhouse) => {
        if ('id' in greenhouse) {
            updateGreenhouse(greenhouse);
        } else {
            addGreenhouse(greenhouse);
        }
        setIsModalOpen(false);
        setEditingGreenhouse(undefined);
    };

    const handleEdit = (greenhouse: Greenhouse) => {
        setEditingGreenhouse(greenhouse);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        const hasCycles = cropCycles.some(c => c.greenhouseId === id);
        if (hasCycles) {
            addToast('لا يمكن حذف الصوبة لأنها تحتوي على عروات. يجب حذف أو أرشفة العروات أولاً.', 'error');
        } else {
            setDeletingId(id);
        }
    };

    const confirmDelete = () => {
        if (deletingId) {
            deleteGreenhouse(deletingId);
        }
        setDeletingId(null);
    };
    
    const renderContent = () => {
        if (loading) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
            );
        }
        if (greenhouses.length > 0) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {greenhouses.map(g => 
                        <GreenhouseCard 
                            key={g.id} 
                            greenhouse={g} 
                            onEdit={() => handleEdit(g)}
                            onDelete={() => handleDelete(g.id)}
                        />
                    )}
                </div>
            );
        }
        return (
            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700">
                <div className="flex justify-center mb-4 text-slate-400 dark:text-slate-500">
                    <GreenhouseIcon className="w-16 h-16"/>
                </div>
                <p className="text-lg font-semibold text-slate-600 dark:text-slate-300">لم تقم بإضافة أي صوب بعد</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">ابدأ بإضافة أول صوبة لإدارة عرواتك.</p>
            </div>
        );
    };
    
    return (
        <div>
            <div className="flex justify-end items-center mb-6">
                <button onClick={() => { setEditingGreenhouse(undefined); setIsModalOpen(true); }} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
                    <AddIcon className="w-5 h-5 ml-2" />
                    <span>إضافة صوبة</span>
                </button>
            </div>
            
            {renderContent()}

            {isModalOpen && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">{editingGreenhouse ? 'تعديل الصوبة' : 'إضافة صوبة جديدة'}</h2>
                        <GreenhouseForm 
                            greenhouse={editingGreenhouse}
                            onSave={handleSave} 
                            onCancel={() => { setIsModalOpen(false); setEditingGreenhouse(undefined); }} 
                        />
                    </div>
                </div>
            )}
            
            <ConfirmationModal
                isOpen={!!deletingId}
                onClose={() => setDeletingId(null)}
                onConfirm={confirmDelete}
                title="تأكيد حذف الصوبة"
                message="هل أنت متأكد من حذف هذه الصوبة؟ لا يمكن التراجع عن هذا الإجراء."
            />

        </div>
    );
};

export default GreenhousePage;