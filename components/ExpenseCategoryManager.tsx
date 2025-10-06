import React from 'react';
import { AppContext } from '../App';
import { AppContextType, ExpenseCategorySetting } from '../types';
import { AddIcon, EditIcon, DeleteIcon, ReceiptIcon, CloseIcon } from './Icons';
import ConfirmationModal from './ConfirmationModal';

// Modal for Add/Edit
const CategoryFormModal: React.FC<{
    category?: ExpenseCategorySetting;
    onSave: (name: string) => void;
    onClose: () => void;
}> = ({ category, onSave, onClose }) => {
    const [name, setName] = React.useState(category?.name || '');
    const [isAnimating, setIsAnimating] = React.useState(false);

    React.useEffect(() => {
        const timer = setTimeout(() => setIsAnimating(true), 10);
        return () => clearTimeout(timer);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave(name.trim());
        }
    };

    return (
        <div className={`fixed inset-0 flex items-center justify-center z-60 p-4 transition-opacity duration-300 ease-out ${isAnimating ? 'bg-black bg-opacity-60' : 'bg-black bg-opacity-0'}`} onClick={onClose}>
            <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md transform transition-all duration-300 ease-out ${isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">{category ? 'تعديل فئة' : 'إضافة فئة جديدة'}</h2>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="category-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">اسم الفئة</label>
                    <input
                        id="category-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        autoFocus
                    />
                    <div className="flex justify-end space-x-2 space-x-reverse pt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">إلغاء</button>
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
            const timer = setTimeout(() => setIsAnimating(true), 10);
            return () => clearTimeout(timer);
        } else {
            setIsAnimating(false);
        }
    }, [isOpen]);

    const handleOpenAddModal = () => {
        setEditingCategory(undefined);
        setIsFormModalOpen(true);
    };

    const handleOpenEditModal = (category: ExpenseCategorySetting) => {
        setEditingCategory(category);
        setIsFormModalOpen(true);
    };

    const handleSave = (name: string) => {
        if (editingCategory) {
            updateExpenseCategory({ ...editingCategory, name });
        } else {
            addExpenseCategory({ name });
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
        <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-out ${isAnimating ? 'bg-black bg-opacity-60' : 'bg-black bg-opacity-0'}`} onClick={onClose}>
            <div className={`bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-out ${isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">إدارة فئات المصروفات</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex-grow overflow-y-auto space-y-4">
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
                                            <ReceiptIcon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-md font-medium text-gray-900 dark:text-white truncate">{category.name}</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <button onClick={() => handleOpenEditModal(category)} className="p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><EditIcon className="w-5 h-5"/></button>
                                            <button onClick={() => setDeletingId(category.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><DeleteIcon className="w-5 h-5"/></button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-12">لا توجد فئات مصروفات. أضف فئة جديدة للبدء.</p>
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