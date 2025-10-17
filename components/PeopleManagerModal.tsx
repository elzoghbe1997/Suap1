import React from 'react';
import { AppContext } from '../App';
import { AppContextType, Person } from '../types';
import { AddIcon, EditIcon, DeleteIcon, CloseIcon } from './Icons';
import ConfirmationModal from './ConfirmationModal';

const formInputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500";

interface PeopleManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialView?: 'list' | 'form';
}


const PeopleManagerModal: React.FC<PeopleManagerModalProps> = ({ isOpen, onClose, initialView = 'list' }) => {
    const { people, advances, addPerson, updatePerson, deletePerson } = React.useContext(AppContext) as AppContextType;
    
    const [view, setView] = React.useState<'list' | 'form'>(initialView);
    const [editingPerson, setEditingPerson] = React.useState<Person | undefined>(undefined);
    const [deletingId, setDeletingId] = React.useState<string | null>(null);
    const [name, setName] = React.useState('');
    
    React.useEffect(() => {
        if (isOpen) {
            setView(initialView);
             // If we open directly to the form, but it's not an edit, clear the name field.
            if (initialView === 'form' && !editingPerson) {
                setName('');
            }
        }
    }, [isOpen, initialView, editingPerson]);

    const handleOpenForm = (person?: Person) => {
        setEditingPerson(person);
        setName(person?.name || '');
        setView('form');
    };

    const handleCloseForm = () => {
        setEditingPerson(undefined);
        setName('');
        setView('list');
    };
    
    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const data = { name };
        if (editingPerson) {
            updatePerson({ ...editingPerson, ...data });
        } else {
            addPerson(data);
        }
        handleCloseForm();
    };

    const confirmDelete = () => {
        if (deletingId) {
            deletePerson(deletingId);
        }
        setDeletingId(null);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4" onClick={onClose}>
                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                           {view === 'list' ? 'إدارة الأشخاص' : (editingPerson ? 'تعديل شخص' : 'إضافة شخص جديد')}
                        </h2>
                        {view === 'list' && (
                            <button onClick={() => handleOpenForm()} className="flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-md shadow-sm hover:bg-emerald-700">
                                <AddIcon className="w-5 h-5 ml-2" />
                                <span>إضافة شخص</span>
                            </button>
                        )}
                         {view === 'form' ? (
                             <button onClick={handleCloseForm} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                                <CloseIcon className="w-6 h-6" />
                            </button>
                         ) : (
                             <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                                <CloseIcon className="w-6 h-6" />
                            </button>
                         )}
                    </div>

                     <div className="flex-grow overflow-y-auto pr-2 modal-scroll-contain">
                        {view === 'list' ? (
                             people.length > 0 ? (
                                <ul role="list" className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {people.map((person) => {
                                        const hasAdvances = advances.some(a => a.personId === person.id);
                                        return (
                                            <li key={person.id} className="py-3 sm:py-4">
                                                <div className="flex items-center space-x-4 space-x-reverse">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-md font-medium text-slate-900 dark:text-white truncate">{person.name}</p>
                                                    </div>
                                                    <div className="flex-shrink-0">
                                                        <button onClick={() => handleOpenForm(person)} className="p-2 text-slate-400 hover:text-blue-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><EditIcon className="w-5 h-5"/></button>
                                                        <button onClick={() => setDeletingId(person.id)} disabled={hasAdvances} className="p-2 text-slate-400 rounded-full transition-colors disabled:cursor-not-allowed disabled:text-slate-300 dark:disabled:text-slate-600 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700" title={hasAdvances ? "لا يمكن حذف شخص مرتبط بسلف" : "حذف"}><DeleteIcon className="w-5 h-5"/></button>
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <p className="text-center text-slate-500 dark:text-slate-400 py-12">لا يوجد أشخاص مسجلين.</p>
                            )
                        ) : (
                            <form onSubmit={handleSave} className="space-y-4 pt-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">اسم الشخص</label>
                                    <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required autoFocus className={formInputClass}/>
                                </div>
                                <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                                    <button type="button" onClick={handleCloseForm} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 rounded-md">إلغاء</button>
                                    <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-md">حفظ</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
            <ConfirmationModal isOpen={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={confirmDelete} title="تأكيد الحذف" message="هل أنت متأكد من حذف هذا الشخص؟ لا يمكن حذف شخص مرتبط بسلف مسجلة." />
        </>
    );
};

export default PeopleManagerModal;