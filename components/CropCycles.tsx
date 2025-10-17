import React, { useState, useContext, useEffect, FormEvent, memo, useRef, MouseEvent, useCallback, useMemo, FC } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AppContext } from '../App.tsx';
import { AppContextType, CropCycle, CropCycleStatus, TransactionType, Greenhouse, Farmer, Transaction, FarmerWithdrawal } from '../types.ts';
import { ToastContext, ToastContextType } from '../context/ToastContext.tsx';
import { AddIcon, SeedIcon, GreenhouseIcon, CalendarIcon, CalendarCheckIcon, ReportIcon, CloseIcon, FarmerIcon, DocumentSearchIcon, MenuVerticalIcon, DeleteIcon, EditIcon, ArrowRightIcon } from './Icons.tsx';
import SkeletonCard from './SkeletonCard.tsx';
import ConfirmationModal from './ConfirmationModal.tsx';


const formInputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500";
const searchInputClass = "block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500";

const CropCycleForm: FC<{ cycle?: CropCycle; onSave: (cycle: Omit<CropCycle, 'id'> | CropCycle) => void; onCancel: () => void; greenhouses: Greenhouse[]; farmers: Farmer[]; isFarmerSystemEnabled: boolean; }> = ({ cycle, onSave, onCancel, greenhouses, farmers, isFarmerSystemEnabled }) => {
    const { addToast } = useContext(ToastContext) as ToastContextType;
    const [name, setName] = useState(cycle?.name || '');
    const [seedType, setSeedType] = useState(cycle?.seedType || '');
    const [plantCount, setPlantCount] = useState(cycle?.plantCount?.toString() || '');
    const [startDate, setStartDate] = useState(cycle?.startDate || new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState<CropCycleStatus>(cycle?.status || CropCycleStatus.ACTIVE);
    const [greenhouseId, setGreenhouseId] = useState(cycle?.greenhouseId || '');
    const [farmerId, setFarmerId] = useState(cycle?.farmerId || '');
    const [farmerSharePercentage, setFarmerSharePercentage] = useState(cycle?.farmerSharePercentage?.toString() || '20');
    const [productionStartDate, setProductionStartDate] = useState(cycle?.productionStartDate || '');


    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        
        const numericPlantCount = Number(plantCount);
        if (numericPlantCount <= 0) {
            addToast('عدد النباتات يجب أن يكون أكبر من صفر.', 'error');
            return;
        }

        const data = { 
            name, 
            startDate, 
            status, 
            greenhouseId, 
            seedType, 
            plantCount: numericPlantCount, 
            productionStartDate: productionStartDate || null,
            farmerId: farmerId || null,
            farmerSharePercentage: farmerId ? Number(farmerSharePercentage) : null,
        };

        if (cycle) {
            onSave({ ...cycle, ...data });
        } else {
            onSave(data);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">اسم العروة</label>
                    <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className={formInputClass}/>
                </div>
                 <div>
                    <label htmlFor="seedType" className="block text-sm font-medium text-slate-700 dark:text-slate-300">نوع البذرة</label>
                    <input type="text" id="seedType" value={seedType} onChange={(e) => setSeedType(e.target.value)} required className={formInputClass}/>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="plantCount" className="block text-sm font-medium text-slate-700 dark:text-slate-300">عدد النباتات</label>
                    <input type="number" id="plantCount" value={plantCount} onChange={(e) => setPlantCount(e.target.value)} required min="1" className={formInputClass}/>
                </div>
                <div>
                    <label htmlFor="greenhouseId" className="block text-sm font-medium text-slate-700 dark:text-slate-300">الصوبة</label>
                    <select id="greenhouseId" value={greenhouseId} onChange={(e) => setGreenhouseId(e.target.value)} required className={formInputClass}>
                        <option value="" disabled>اختر صوبة</option>
                        {greenhouses.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">تاريخ البدء</label>
                    <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className={formInputClass}/>
                </div>
                 <div>
                    <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300">الحالة</label>
                    <select id="status" value={status} onChange={(e) => setStatus(e.target.value as CropCycleStatus)} required className={formInputClass}>
                        {Object.values(CropCycleStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label htmlFor="productionStartDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">تاريخ بدء الإنتاج (اختياري)</label>
                <input type="date" id="productionStartDate" value={productionStartDate || ''} onChange={(e) => setProductionStartDate(e.target.value)} className={formInputClass}/>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">اتركه فارغاً ليتم حسابه تلقائياً بناءً على أول فاتورة بيع.</p>
            </div>
             {isFarmerSystemEnabled && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="farmerId" className="block text-sm font-medium text-slate-700 dark:text-slate-300">المزارع المسؤول</label>
                        <select id="farmerId" value={farmerId || ''} onChange={(e) => setFarmerId(e.target.value)} className={formInputClass}>
                            <option value="">بدون مزارع</option>
                            {farmers.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                    </div>
                    {farmerId && (
                        <div>
                            <label htmlFor="farmerSharePercentage" className="block text-sm font-medium text-slate-700 dark:text-slate-300">نسبة المزارع (%)</label>
                            <input type="number" id="farmerSharePercentage" value={farmerSharePercentage} onChange={(e) => setFarmerSharePercentage(e.target.value)} required min="0" max="100" className={formInputClass}/>
                        </div>
                    )}
                </div>
            )}
            <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">إلغاء</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors">حفظ</button>
            </div>
        </form>
    );
};

const CropCycleCard: FC<{
    cycle: CropCycle;
    onEdit: (c: CropCycle) => void;
    onClose: (c: CropCycle) => void;
    onArchiveOrDelete: (id: string) => void;
    greenhouseName: string;
    farmerName: string | null;
    revenue: number;
    expense: number;
    profit: number;
    healthPercentage: number;
    healthColor: string;
}> = memo(({ cycle, onEdit, onClose, onArchiveOrDelete, greenhouseName, farmerName, revenue, expense, profit, healthPercentage, healthColor }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);

    const statusStyles = {
        [CropCycleStatus.ACTIVE]: { dot: 'bg-emerald-500', text: 'text-emerald-800 dark:text-emerald-300', bg: 'bg-emerald-100 dark:bg-emerald-900/50' },
        [CropCycleStatus.CLOSED]: { dot: 'bg-rose-500', text: 'text-rose-800 dark:text-rose-300', bg: 'bg-rose-100 dark:bg-rose-900/50' },
        [CropCycleStatus.ARCHIVED]: { dot: 'bg-slate-500', text: 'text-slate-800 dark:text-slate-300', bg: 'bg-slate-200 dark:bg-slate-700' },
    };

    const handleAction = (e: MouseEvent, action: () => void) => {
        e.preventDefault();
        e.stopPropagation();
        action();
        setIsMenuOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: globalThis.MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 flex flex-col h-full transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1">
            <div className="p-5 flex-grow">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">{cycle.name}</h3>
                         <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                            <p className="flex items-center">
                                <CalendarIcon className="w-4 h-4 ml-2 text-slate-400" />
                                <span><span className="font-medium text-slate-700 dark:text-slate-300">تاريخ البدء:</span> {cycle.startDate}</span>
                            </p>
                            {cycle.productionStartDate && (
                                <p className="flex items-center">
                                    <CalendarCheckIcon className="w-4 h-4 ml-2 text-teal-500" />
                                    <span><span className="font-medium text-slate-700 dark:text-slate-300">بدء الإنتاج:</span> {cycle.productionStartDate}</span>
                                </p>
                            )}
                            <p className="flex items-center">
                                <SeedIcon className="w-4 h-4 ml-2 text-emerald-500" />
                                <span><span className="font-medium text-slate-700 dark:text-slate-300">النوع:</span> {cycle.seedType} ({cycle.plantCount} نبات)</span>
                            </p>
                            <p className="flex items-center">
                                <GreenhouseIcon className="w-4 h-4 ml-2 text-sky-500" />
                                <span><span className="font-medium text-slate-700 dark:text-slate-300">الصوبة:</span> {greenhouseName}</span>
                            </p>
                            {farmerName && (
                                <p className="flex items-center">
                                    <FarmerIcon className="w-4 h-4 ml-2 text-indigo-500" />
                                    <span><span className="font-medium text-slate-700 dark:text-slate-300">المزارع:</span> {farmerName} ({cycle.farmerSharePercentage}%)</span>
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-end gap-2">
                        <div className={`flex items-center px-3 py-1 text-sm font-semibold rounded-full ${statusStyles[cycle.status].bg} ${statusStyles[cycle.status].text}`}>
                            <span className={`w-2 h-2 rounded-full ml-2 ${statusStyles[cycle.status].dot}`}></span>
                            <span>{cycle.status}</span>
                        </div>
                         <div className="relative inline-block text-left" ref={menuRef}>
                            <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); setIsMenuOpen(p => !p); }} className="p-2 text-slate-400 hover:text-sky-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" aria-label="خيارات">
                                <MenuVerticalIcon className="w-5 h-5"/>
                            </button>
                            {isMenuOpen && (
                                <div className="origin-top-left absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-slate-900 ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                    <div className="py-1" role="menu" aria-orientation="vertical">
                                        <a href="#" onClick={e => handleAction(e, () => onEdit(cycle))} className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700" role="menuitem"><EditIcon className="w-4 h-4 ml-2"/>تعديل</a>
                                        {cycle.status === CropCycleStatus.ACTIVE && (
                                            <a href="#" onClick={e => handleAction(e, () => onClose(cycle))} className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700" role="menuitem"><CloseIcon className="w-4 h-4 ml-2"/>إغلاق العروة</a>
                                        )}
                                        <a href="#" onClick={e => handleAction(e, () => onArchiveOrDelete(cycle.id))} className="flex items-center px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/50" role="menuitem"><DeleteIcon className="w-4 h-4 ml-2"/>حذف</a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">الإيرادات</p>
                            <p className="text-lg font-semibold text-emerald-600">{formatCurrency(revenue)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">المصروفات</p>
                            <p className="text-lg font-semibold text-rose-600">{formatCurrency(expense)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">ربح المالك</p>
                            <p className={`text-lg font-semibold ${profit >= 0 ? 'text-sky-600' : 'text-orange-500'}`}>{formatCurrency(profit)}</p>
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">صحة العروة</span>
                            <span className={`text-sm font-bold ${
                                healthPercentage > 75 ? 'text-emerald-600 dark:text-emerald-400' : 
                                healthPercentage > 40 ? 'text-yellow-600 dark:text-yellow-400' : 'text-rose-600 dark:text-rose-400'
                            }`}>{Math.round(healthPercentage)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                            <div 
                                className={`${healthColor} h-2.5 rounded-full transition-all duration-500 ease-out`} 
                                style={{ width: `${healthPercentage}%` }}
                                role="progressbar"
                                aria-valuenow={healthPercentage}
                                aria-valuemin={0}
                                aria-valuemax={100}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
            <Link to={`/cycles/${cycle.id}`} className="block bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-700/80 p-3 rounded-b-lg border-t border-slate-200 dark:border-slate-700 transition-colors">
                <div className="flex justify-between items-center text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    <span>عرض التفاصيل والإدارة</span>
                    <ArrowRightIcon className="w-4 h-4"/>
                </div>
            </Link>
        </div>
    );
});

const EmptyState: FC<{ message: string; subMessage: string; icon: React.ReactNode }> = ({ message, subMessage, icon }) => (
    <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700">
        <div className="flex justify-center mb-4 text-slate-400 dark:text-slate-500">{icon}</div>
        <p className="text-lg font-semibold text-slate-600 dark:text-slate-300">{message}</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subMessage}</p>
    </div>
);


const CropCyclesPage: FC = () => {
    const { loading, cropCycles, addCropCycle, updateCropCycle, archiveOrDeleteCropCycle, greenhouses, farmers, settings, transactions, farmerWithdrawals } = useContext(AppContext) as AppContextType;
    const { addToast } = useContext(ToastContext) as ToastContextType;
    const location = useLocation();
    const navigate = useNavigate();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAnimatingModal, setIsAnimatingModal] = useState(false);
    const [editingCycle, setEditingCycle] = useState<CropCycle | null>(null);

    const [filterGreenhouse, setFilterGreenhouse] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'active' | 'closed' | 'archived'>('active');
    
    const [closingCycle, setClosingCycle] = useState<CropCycle | null>(null);
    const [deletingCycleId, setDeletingCycleId] = useState<string | null>(null);

    const modalRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const isAnyModalOpen = isModalOpen || !!closingCycle || !!deletingCycleId;
        if (isAnyModalOpen) {
            document.body.classList.add('body-no-scroll');
        } else {
            document.body.classList.remove('body-no-scroll');
        }
        return () => {
            document.body.classList.remove('body-no-scroll');
        };
    }, [isModalOpen, closingCycle, deletingCycleId]);

    const handleOpenAddModal = useCallback(() => {
        setEditingCycle(null);
        setIsModalOpen(true);
    }, []);

    const handleOpenEditModal = useCallback((cycle: CropCycle) => {
        setEditingCycle(cycle);
        setIsModalOpen(true);
    }, []);

    const handleSetClosingCycle = useCallback((cycle: CropCycle) => {
        setClosingCycle(cycle);
    }, []);

    const handleSetDeletingCycleId = useCallback((id: string) => {
        setDeletingCycleId(id);
    }, []);

    useEffect(() => {
        const state = location.state as { action?: string };
        if (state?.action === 'add-cycle') {
            handleOpenAddModal();
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate, handleOpenAddModal]);

    useEffect(() => {
        if (isModalOpen) {
            const timer = setTimeout(() => setIsAnimatingModal(true), 10);
            return () => clearTimeout(timer);
        } else {
            setIsAnimatingModal(false);
        }
    }, [isModalOpen]);

    // Focus Trap and Escape key handler for modal
    useEffect(() => {
        if (!isModalOpen) return;
        
        const modalNode = modalRef.current;
        if (!modalNode) return;

        const focusableElements = modalNode.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsModalOpen(false);
                setEditingCycle(null);
            }

            if (e.key === 'Tab') {
                if (e.shiftKey) { // Shift + Tab
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else { // Tab
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        firstElement?.focus();
        
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isModalOpen]);


    const handleSave = (cycle: Omit<CropCycle, 'id'> | CropCycle) => {
        if ('id' in cycle) {
            updateCropCycle(cycle);
        } else {
            addCropCycle(cycle);
        }
        setIsModalOpen(false);
        setEditingCycle(null);
    };

    const handleConfirmClose = () => {
        if (closingCycle) {
            updateCropCycle({ ...closingCycle, status: CropCycleStatus.CLOSED });
            addToast(`تم إغلاق العروة "${closingCycle.name}" بنجاح.`, 'success');
        }
        setClosingCycle(null);
    };

    const handleConfirmDelete = () => {
        if (deletingCycleId) {
            archiveOrDeleteCropCycle(deletingCycleId);
        }
        setDeletingCycleId(null);
    };
    
    const cycleToDelete = useMemo(() => 
        deletingCycleId ? cropCycles.find(c => c.id === deletingCycleId) : null,
        [deletingCycleId, cropCycles]
    );

    const isCycleEmpty = useMemo(() => {
        if (!cycleToDelete) return true;
        const hasTransactions = transactions.some(t => t.cropCycleId === cycleToDelete.id);
        const hasWithdrawals = farmerWithdrawals.some(w => w.cropCycleId === cycleToDelete.id);
        return !hasTransactions && !hasWithdrawals;
    }, [cycleToDelete, transactions, farmerWithdrawals]);


    const filteredCycles = useMemo(() => {
        const statusMap = {
            'active': CropCycleStatus.ACTIVE,
            'closed': CropCycleStatus.CLOSED,
            'archived': CropCycleStatus.ARCHIVED
        };
        const statusToFilter = statusMap[activeTab];

        let cycles = cropCycles.filter(c => c.status === statusToFilter);

        if (filterGreenhouse !== 'all') {
            cycles = cycles.filter(c => c.greenhouseId === filterGreenhouse);
        }

        if (searchQuery) {
            cycles = cycles.filter(c => 
                c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                c.seedType.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        return cycles.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    }, [cropCycles, filterGreenhouse, searchQuery, activeTab]);

    const cyclesWithStats = useMemo(() => {
        // OPTIMIZATION: Group transactions by cycle ID in a single pass
        const transactionsByCycleId = new Map<string, Transaction[]>();
        for (const t of transactions) {
            if (!transactionsByCycleId.has(t.cropCycleId)) {
                transactionsByCycleId.set(t.cropCycleId, []);
            }
            transactionsByCycleId.get(t.cropCycleId)!.push(t);
        }

        return filteredCycles.map(cycle => {
            const cycleTransactions = transactionsByCycleId.get(cycle.id) || [];
            const revenue = cycleTransactions.filter(t => t.type === TransactionType.REVENUE).reduce((sum, t) => sum + t.amount, 0);
            const expense = cycleTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
            let ownerProfit = revenue - expense;

            if (settings.isFarmerSystemEnabled && cycle.farmerId && cycle.farmerSharePercentage) {
                const farmerShare = revenue * (cycle.farmerSharePercentage / 100);
                ownerProfit -= farmerShare;
            }

            let healthPercentage: number;
            let healthColor: string;
            if (expense === 0) {
                healthPercentage = revenue > 0 ? 100 : 50; 
                healthColor = revenue > 0 ? 'bg-emerald-500' : 'bg-slate-400';
            } else {
                const ratio = revenue / expense;
                if (ratio >= 1) {
                    healthPercentage = 50 + Math.min((ratio - 1), 1) * 50;
                } else {
                    healthPercentage = ratio * 50;
                }
                healthColor = 'bg-rose-500';
                if (healthPercentage > 75) healthColor = 'bg-emerald-500';
                else if (healthPercentage > 40) healthColor = 'bg-yellow-500';
            }

            const greenhouseName = greenhouses.find(g => g.id === cycle.greenhouseId)?.name || 'غير محددة';
            const farmerName = (settings.isFarmerSystemEnabled && cycle.farmerId)
                ? (farmers.find(f => f.id === cycle.farmerId)?.name || null)
                : null;
            
            return { cycle, revenue, expense, profit: ownerProfit, healthPercentage, healthColor, greenhouseName, farmerName };
        });
    }, [filteredCycles, transactions, settings, greenhouses, farmers]);


    const tabButtonClass = (tabName: 'active' | 'closed' | 'archived') => 
        `whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-colors duration-200 ${
            activeTab === tabName
            ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:border-slate-600'
        }`;

    const renderContent = () => {
        if (loading) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
            );
        }
        if (cyclesWithStats.length > 0) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {cyclesWithStats.map(data => (
                        <CropCycleCard 
                            key={data.cycle.id} 
                            cycle={data.cycle} 
                            onEdit={handleOpenEditModal}
                            onClose={handleSetClosingCycle}
                            onArchiveOrDelete={handleSetDeletingCycleId}
                            greenhouseName={data.greenhouseName}
                            farmerName={data.farmerName}
                            revenue={data.revenue}
                            expense={data.expense}
                            profit={data.profit}
                            healthPercentage={data.healthPercentage}
                            healthColor={data.healthColor}
                        />
                    ))}
                </div>
            );
        }
        
        const hasFilters = searchQuery || filterGreenhouse !== 'all';
        const messages = {
            active: {
                message: "لا توجد عروات نشطة حاليًا",
                subMessage: "ابدأ بإضافة عروة جديدة لتتبعها من الزر أعلاه."
            },
            closed: {
                message: "لا توجد عروات مغلقة",
                subMessage: "عند إغلاق عروة نشطة، ستظهر هنا."
            },
            archived: {
                message: "لا توجد عروات مؤرشفة حتى الآن",
                subMessage: "عند أرشفة عروة تحتوي على بيانات مالية، ستجدها هنا."
            }
        };
        const currentMessages = messages[activeTab];

        return (
            <div className="md:col-span-2 xl:col-span-3">
                <EmptyState 
                    message={hasFilters ? "لا توجد عروات تطابق بحثك" : currentMessages.message}
                    subMessage={hasFilters ? "جرّب تغيير الفلاتر أو البحث بكلمة أخرى." : currentMessages.subMessage}
                    icon={<DocumentSearchIcon className="w-16 h-16"/>}
                />
            </div>
        );
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                <button onClick={handleOpenAddModal} className="flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-md shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors">
                    <AddIcon className="w-5 h-5 ml-2" />
                    <span>إضافة عروة</span>
                </button>
                <div className="flex-grow flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 min-w-[150px]">
                        <input 
                            type="text"
                            placeholder="ابحث عن عروة..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className={searchInputClass}
                        />
                    </div>
                    <div className="flex-1 min-w-[150px]">
                        <select id="filterGreenhouse" value={filterGreenhouse} onChange={e => setFilterGreenhouse(e.target.value)} className={formInputClass.replace('mt-1', '')}>
                            <option value="all">كل الصوب</option>
                            {greenhouses.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>
            
            <div className="mb-6 border-b border-slate-200 dark:border-slate-700">
                <nav className="flex -mb-px space-x-4 space-x-reverse" aria-label="Tabs">
                    <button onClick={() => setActiveTab('active')} className={tabButtonClass('active')}>عروات نشطة</button>
                    <button onClick={() => setActiveTab('closed')} className={tabButtonClass('closed')}>عروات مغلقة</button>
                    <button onClick={() => setActiveTab('archived')} className={tabButtonClass('archived')}>عروات مؤرشفة</button>
                </nav>
            </div>

            {renderContent()}

            {isModalOpen && (
                <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-out ${isAnimatingModal ? 'bg-black bg-opacity-60' : 'bg-black bg-opacity-0'}`} aria-modal="true" role="dialog" onClick={() => { setIsModalOpen(false); setEditingCycle(null); }}>
                    <div ref={modalRef} className={`bg-slate-50 dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col transform transition-all duration-300 ease-out ${isAnimatingModal ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} onClick={e => e.stopPropagation()}>
                        <div className="p-6 pb-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                                {editingCycle ? 'تعديل العروة' : 'إضافة عروة جديدة'}
                            </h2>
                        </div>
                        <div className="p-6 flex-grow overflow-y-auto modal-scroll-contain">
                            <CropCycleForm 
                                cycle={editingCycle ?? undefined}
                                onSave={handleSave} 
                                onCancel={() => { setIsModalOpen(false); setEditingCycle(null); }} 
                                greenhouses={greenhouses} 
                                farmers={farmers} 
                                isFarmerSystemEnabled={settings.isFarmerSystemEnabled} 
                            />
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={!!closingCycle}
                onClose={() => setClosingCycle(null)}
                onConfirm={handleConfirmClose}
                title="تأكيد إغلاق العروة"
                message={`هل أنت متأكد من إغلاق العروة "${closingCycle?.name}"؟ يمكنك إعادة فتحها لاحقًا من خلال التعديل.`}
                confirmText="نعم، إغلاق"
                confirmColor="blue"
            />
            <ConfirmationModal
                isOpen={!!deletingCycleId}
                onClose={() => setDeletingCycleId(null)}
                onConfirm={handleConfirmDelete}
                title={isCycleEmpty ? "تأكيد حذف العروة" : "تأكيد أرشفة العروة"}
                message={isCycleEmpty 
                    ? "هل أنت متأكد من حذف هذه العروة الفارغة نهائياً؟ لا يمكن التراجع عن هذا الإجراء." 
                    : "هل أنت متأكد من أرشفة هذه العروة؟ سيتم نقلها إلى تبويب 'المؤرشفة' مع الاحتفاظ بجميع بياناتها."
                }
                confirmText={isCycleEmpty ? 'حذف' : 'أرشفة'}
                confirmColor={isCycleEmpty ? 'red' : 'yellow'}
            />
        </div>
    );
};

export default CropCyclesPage;