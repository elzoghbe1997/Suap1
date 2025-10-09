import React from 'react';
import { AppContext } from '../App';
import { AppContextType, ExpenseCategorySetting } from '../types';
import { AddIcon, EditIcon, DeleteIcon, ReceiptIcon, CloseIcon } from './Icons';
import ConfirmationModal from './ConfirmationModal';

// Modal for Add/Edit
const CategoryFormModal: React.FC<{
    category?: ExpenseCategorySetting;
    onSave: (name: string, isFoundational: boolean) => void;
    onClose: () => void;
}> = ({ category, onSave, onClose }) => {
    const [name, setName] = React.useState(category?.name || '');
    const [isFoundational, setIsFoundational] = React.useState(category?.isFoundational || false);
    const [isAnimating, setIsAnimating] = React.useState(false);

    React.useEffect(() => {
        const timer = setTimeout(() => setIsAnimating(true), 10);
        return () => clearTimeout(timer);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave(name.trim(), isFoundational);
        }
    };

    return (
        <div className={`absolute inset-0 flex items-center justify-center z-60 p-4 transition-opacity duration-300 ease-out ${isAnimating ? 'bg-black bg-opacity-60' : 'bg-black bg-opacity-0'}`} onClick={onClose}>
            <div className={`bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md transform transition-all duration-300 ease-out ${isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">{category ? 'تعديل فئة' : 'إضافة فئة جديدة'}</h2>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="category-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">اسم الفئة</label>
                    <input
                        id="category-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        autoFocus
                    />
                     <div className="mt-4">
                        <label htmlFor="is-foundational" className="flex items-center cursor-pointer">
                            <input
                                id="is-foundational"
                                type="checkbox"
                                checked={isFoundational}
                                onChange={(e) => setIsFoundational(e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="mr-3 block text-sm text-slate-900 dark:text-slate-300">
                                اعتبار هذه الفئة كمصروف تأسيسي
                            </span>
                        </label>
                        <p className="mt-1 mr-7 text-xs text-slate-500 dark:text-slate-400">المصروفات التأسيسية (مثل البذور) لا تُخصم عند حساب رصيد الخزنة.</p>
                    </div>
                    <div className="flex justify-end space-x-2 space-x-reverse pt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">إلغاء</button>
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">حفظ</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface ExpenseCategoryManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

const ExpenseCategoryManager: React.FC<ExpenseCategoryManagerProps> = ({ isOpen, onClose }) => {
    const { settings, addExpenseCategory, updateExpenseCategory, deleteExpenseCategory } = React.useContext(AppContext) as AppContextType;
    const [editingCategory, setEditingCategory] = React.useState<ExpenseCategorySetting | undefined>(undefined);
    const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);
    const [deletingId, setDeletingId] = React.useState<string | null>(null);
    const [isAnimating, setIsAnimating] = React.useState(false);

    React.useEffect(() => {
        if (isOpen) {
            document.body.classList.add('body-no-scroll');
            const timer = setTimeout(() => setIsAnimating(true), 10);
            return () => clearTimeout(timer);
        } else {
            document.body.classList.remove('body-no-scroll');
            setIsAnimating(false);
        }
        return () => {
             document.body.classList.remove('body-no-scroll');
        };
    }, [isOpen]);

    const handleOpenAddModal = () => {
        setEditingCategory(undefined);
        setIsFormModalOpen(true);
    };

    const handleOpenEditModal = (category: ExpenseCategorySetting) => {
        setEditingCategory(category);
        setIsFormModalOpen(true);
    };

    const handleSave = (name: string, isFoundational: boolean) => {
        if (editingCategory) {
            updateExpenseCategory({ ...editingCategory, name, isFoundational });
        } else {
            addExpenseCategory({ name, isFoundational });
        }
        setIsFormModalOpen(false);
    };

    const confirmDelete = () => {
        if (deletingId) {
            deleteExpenseCategory(deletingId);
        }
        setDeletingId(null);
    };

    const expenseCategories = settings.expenseCategories || [];
    
    if (!isOpen) return null;

    return (
        <div className={`absolute inset-0 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-out ${isAnimating ? 'bg-black bg-opacity-60' : 'bg-black bg-opacity-0'}`} onClick={onClose}>
            <div className={`bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-out ${isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">إدارة فئات المصروفات</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex-grow overflow-y-auto space-y-4 modal-scroll-contain">
                    <div className="flex justify-end">
                         <button
                            onClick={handleOpenAddModal}
                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 transition-colors"
                        >
                            <AddIcon className="w-5 h-5 ml-2" />
                            <span>إضافة فئة</span>
                        </button>
                    </div>

                    {expenseCategories.length > 0 ? (
                        <ul role="list" className="divide-y divide-slate-200 dark:divide-slate-700">
                            {expenseCategories.map((category) => (
                                <li key={category.id} className="py-3 sm:py-4">
                                    <div className="flex items-center space-x-4 space-x-reverse">
                                        <div className="flex-shrink-0">
                                            <ReceiptIcon className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-md font-medium text-slate-900 dark:text-white truncate">{category.name}</p>
                                            {category.isFoundational && (
                                                <span className="text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded-full">تأسيسي</span>
                                            )}
                                        </div>
                                        <div className="flex-shrink-0">
                                            <button onClick={() => handleOpenEditModal(category)} className="p-2 text-slate-400 hover:text-blue-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><EditIcon className="w-5 h-5"/></button>
                                            <button onClick={() => setDeletingId(category.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><DeleteIcon className="w-5 h-5"/></button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-slate-500 dark:text-slate-400 py-12">لا توجد فئات مصروفات. أضف فئة جديدة للبدء.</p>
                    )}
                </div>
            </div>

            {isFormModalOpen && <CategoryFormModal category={editingCategory} onSave={handleSave} onClose={() => setIsFormModalOpen(false)} />}
            
            <ConfirmationModal
                isOpen={!!deletingId}
                onClose={() => setDeletingId(null)}
                onConfirm={confirmDelete}
                title="تأكيد حذف الفئة"
                message="هل أنت متأكد من حذف هذه الفئة؟ لا يمكن حذف الفئة إذا كانت مستخدمة في أي مصروفات."
            />
        </div>
    );
};

export default ExpenseCategoryManager;
