import React from 'react';
import { ToastContext, ToastContextType } from '../context/ToastContext.tsx';
import { CropCycle, Transaction, Greenhouse, AppSettings, Farmer, FarmerWithdrawal, Alert, BackupData, TransactionType, CropCycleStatus, AlertType, AppContextType, Supplier, SupplierPayment, FertilizationProgram, ExpenseCategorySetting, Advance, Person } from '../types.ts';
import { INITIAL_SETTINGS } from '../constants.ts';
import useLocalStorage from './useLocalStorage.ts';
import { getDemoData } from '../api.ts';

export const useAppData = (): AppContextType => {
    const { addToast } = React.useContext(ToastContext) as ToastContextType;
    
    const [loading, setLoading] = React.useState(true);
    const [isDeletingData, setIsDeletingData] = React.useState(false);
    
    const [cropCycles, setCropCycles] = useLocalStorage<CropCycle[]>('cropCycles', []);
    const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
    const [greenhouses, setGreenhouses] = useLocalStorage<Greenhouse[]>('greenhouses', []);
    const [settings, setSettings] = useLocalStorage<AppSettings>('settings', INITIAL_SETTINGS);
    const [farmers, setFarmers] = useLocalStorage<Farmer[]>('farmers', []);
    const [farmerWithdrawals, setFarmerWithdrawals] = useLocalStorage<FarmerWithdrawal[]>('farmerWithdrawals', []);
    const [suppliers, setSuppliers] = useLocalStorage<Supplier[]>('suppliers', []);
    const [supplierPayments, setSupplierPayments] = useLocalStorage<SupplierPayment[]>('supplierPayments', []);
    const [fertilizationPrograms, setFertilizationPrograms] = useLocalStorage<FertilizationProgram[]>('fertilizationPrograms', []);
    const [advances, setAdvances] = useLocalStorage<Advance[]>('advances', []);
    const [people, setPeople] = useLocalStorage<Person[]>('people', []);
    const [alerts, setAlerts] = React.useState<Alert[]>([]);
    
    React.useEffect(() => {
        // Data is now loaded from localStorage by the hook, so we just need to stop the loading indicator.
        // This ensures that we don't overwrite existing user data with demo data on every page load.
        setLoading(false);
    }, []);

    // ALERTS LOGIC
    React.useEffect(() => {
        if (loading) return;
        const newAlerts: Alert[] = [];
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const farmerBalances: { [key: string]: number } = {};
        if (settings.isFarmerSystemEnabled) {
            farmers.forEach(farmer => {
                const associatedCycles = cropCycles.filter(c => c.farmerId === farmer.id);
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
                    .filter(w => associatedCycles.some(c => c.id === w.cropCycleId))
                    .reduce((sum, w) => sum + w.amount, 0);
                farmerBalances[farmer.id] = totalShare - totalWithdrawals;
            });
        }

        cropCycles.forEach(cycle => {
            if (cycle.status === CropCycleStatus.ACTIVE) {
                const cycleTransactions = transactions.filter(t => t.cropCycleId === cycle.id);
                const revenue = cycleTransactions.filter(t => t.type === TransactionType.REVENUE).reduce((s, t) => s + t.amount, 0);
                const expense = cycleTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);

                if (revenue > 0 && expense > revenue * 0.8) {
                    newAlerts.push({ id: `cost-${cycle.id}`, type: AlertType.HIGH_COST, message: `مصروفات عروة "${cycle.name}" تجاوزت 80% من إيراداتها.`, relatedId: cycle.id });
                }

                if (revenue === 0 && new Date(cycle.startDate) < thirtyDaysAgo) {
                    newAlerts.push({ id: `stagnant-${cycle.id}`, type: AlertType.STAGNANT_CYCLE, message: `مر 30 يومًا على بدء عروة "${cycle.name}" دون تسجيل أي إيرادات.`, relatedId: cycle.id });
                }
            }
        });

        if (settings.isFarmerSystemEnabled) {
            farmers.forEach(farmer => {
                if (farmerBalances[farmer.id] < 0) {
                    newAlerts.push({ id: `balance-${farmer.id}`, type: AlertType.NEGATIVE_BALANCE, message: `الرصيد المتبقي للمزارع "${farmer.name}" أصبح سالباً.`, relatedId: farmer.id });
                }
            });
        }

        setAlerts(newAlerts);

    }, [loading, cropCycles, transactions, farmers, farmerWithdrawals, settings.isFarmerSystemEnabled]);
    
    const getWithdrawalsForFarmer = React.useCallback((farmerId: string): FarmerWithdrawal[] => {
        const associatedCycleIds = new Set(
            cropCycles.filter(c => c.farmerId === farmerId).map(c => c.id)
        );
        return farmerWithdrawals
            .filter(w => associatedCycleIds.has(w.cropCycleId))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [cropCycles, farmerWithdrawals]);

    const addCropCycle = async (cycle: Omit<CropCycle, 'id'>) => {
        const newCycle = { ...cycle, id: Date.now().toString() };
        setCropCycles(prev => [...prev, newCycle]);
        addToast("تمت إضافة العروة بنجاح.", 'success');
    };
    const updateCropCycle = async (updatedCycle: CropCycle) => {
        setCropCycles(prev => prev.map(c => c.id === updatedCycle.id ? updatedCycle : c));
        addToast("تم تحديث العروة بنجاح.", 'success');
    };
    const archiveOrDeleteCropCycle = async (id: string) => {
        const isCycleEmpty = !transactions.some(t => t.cropCycleId === id) && !farmerWithdrawals.some(w => w.cropCycleId === id);

        if (isCycleEmpty) {
            // If it's empty, delete it permanently.
            setCropCycles(prev => prev.filter(c => c.id !== id));
            addToast("تم حذف العروة الفارغة بنجاح.", 'success');
        } else {
            // If it has data, archive it instead of deleting.
            setCropCycles(prev => prev.map(c => 
                c.id === id ? { ...c, status: CropCycleStatus.ARCHIVED } : c
            ));
            addToast("تمت أرشفة العروة بنجاح.", 'success');
        }
    };
    const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
        const newTransaction = { ...transaction, id: Date.now().toString() };
        
        // Auto-update production start date on first revenue
        if (newTransaction.type === TransactionType.REVENUE) {
            const cycleToUpdate = cropCycles.find(c => c.id === newTransaction.cropCycleId);
            if (cycleToUpdate && !cycleToUpdate.productionStartDate) {
                const updatedCycle = { ...cycleToUpdate, productionStartDate: newTransaction.date };
                // Use functional update to avoid race conditions with other state updates
                setCropCycles(prevCycles => 
                    prevCycles.map(c => c.id === updatedCycle.id ? updatedCycle : c)
                );
                addToast(`تم تحديث تاريخ بدء الإنتاج للعروة "${cycleToUpdate.name}" تلقائياً.`, 'info');
            }
        }
    
        setTransactions(prev => [newTransaction, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        addToast("تمت إضافة المعاملة بنجاح.", 'success');
    };
    const updateTransaction = async (updatedTransaction: Transaction) => {
        setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        addToast("تم تحديث المعاملة بنجاح.", 'success');
    };
    const deleteTransaction = async (id: string) => {
        setTransactions(prev => prev.filter(t => t.id !== id));
        addToast("تم حذف المعاملة بنجاح.", 'success');
    };
    const addGreenhouse = async (g: Omit<Greenhouse, 'id'>) => {
        setGreenhouses(prev => [...prev, { ...g, id: Date.now().toString() }]);
        addToast("تمت إضافة الصوبة.", 'success');
    };
    const updateGreenhouse = async (g: Greenhouse) => {
        setGreenhouses(prev => prev.map(gh => gh.id === g.id ? g : gh));
        addToast("تم تحديث الصوبة.", 'success');
    };
    const deleteGreenhouse = async (id: string) => {
        setGreenhouses(prev => prev.filter(gh => gh.id !== id));
        addToast("تم حذف الصوبة.", 'success');
    };
    const updateSettings = async (newSettings: Partial<AppSettings>) => {
        setSettings(prev => ({...prev, ...newSettings}));
    };
    const addFarmer = async (f: Omit<Farmer, 'id'>) => {
        setFarmers(prev => [...prev, { ...f, id: Date.now().toString() }]);
        addToast("تمت إضافة المزارع.", 'success');
    };
    const updateFarmer = async (f: Farmer) => {
        setFarmers(prev => prev.map(fa => fa.id === f.id ? f : fa));
        addToast("تم تحديث المزارع.", 'success');
    };
    const deleteFarmer = async (id: string) => {
        const associatedCycles = cropCycles.filter(cycle => cycle.farmerId === id);
        const hasActiveCycles = associatedCycles.some(cycle => cycle.status === CropCycleStatus.ACTIVE);

        if (hasActiveCycles) {
            addToast("لا يمكن حذف مزارع مرتبط بعروات نشطة.", 'error');
            return;
        }

        let totalShare = 0;
        associatedCycles.forEach(cycle => {
            if (cycle.farmerSharePercentage != null) {
                const cycleRevenue = transactions
                    .filter(t => t.cropCycleId === cycle.id && t.type === TransactionType.REVENUE)
                    .reduce((sum, t) => sum + t.amount, 0);
                totalShare += cycleRevenue * (cycle.farmerSharePercentage / 100);
            }
        });
        
        const associatedCycleIds = new Set(associatedCycles.map(c => c.id));
        const totalWithdrawals = farmerWithdrawals
            .filter(w => associatedCycleIds.has(w.cropCycleId))
            .reduce((sum, w) => sum + w.amount, 0);

        const balance = totalShare - totalWithdrawals;

        // Use a small epsilon for floating point comparison
        if (Math.abs(balance) > 0.01) {
            addToast(`لا يمكن حذف مزارع رصيده غير صفري. الرصيد الحالي: ${balance.toFixed(2)}`, 'error');
            return;
        }
        
        setFarmers(prev => prev.filter(f => f.id !== id));
        addToast("تم حذف المزارع بنجاح.", 'success');
    };
    const addFarmerWithdrawal = async (w: Omit<FarmerWithdrawal, 'id'>) => {
        setFarmerWithdrawals(prev => [{ ...w, id: Date.now().toString() }, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        addToast("تمت إضافة السحب.", 'success');
    };
    const updateFarmerWithdrawal = async (w: FarmerWithdrawal) => {
        setFarmerWithdrawals(prev => prev.map(fw => fw.id === w.id ? w : fw).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        addToast("تم تحديث السحب.", 'success');
    };
    const deleteFarmerWithdrawal = async (id: string) => {
        setFarmerWithdrawals(prev => prev.filter(fw => fw.id !== id));
        addToast("تم حذف السحب.", 'success');
    };
    const addSupplier = async (s: Omit<Supplier, 'id'>) => {
        setSuppliers(prev => [...prev, { ...s, id: Date.now().toString() }]);
         addToast("تمت إضافة المورد.", 'success');
    };
    const updateSupplier = async (s: Supplier) => {
        setSuppliers(prev => prev.map(su => su.id === s.id ? s : su));
        addToast("تم تحديث المورد.", 'success');
    };
    const deleteSupplier = async (id: string) => {
        const totalInvoices = transactions
            .filter(t => t.supplierId === id && t.type === TransactionType.EXPENSE)
            .reduce((sum, t) => sum + t.amount, 0);
            
        const totalPayments = supplierPayments
            .filter(p => p.supplierId === id)
            .reduce((sum, p) => sum + p.amount, 0);
            
        const balance = totalInvoices - totalPayments;
        
        if (Math.abs(balance) > 0.01) {
            addToast(`لا يمكن حذف مورد رصيده غير صفري. الرصيد الحالي: ${balance.toFixed(2)}`, 'error');
            return;
        }

        setSuppliers(prev => prev.filter(s => s.id !== id));
        addToast("تم حذف المورد.", 'success');
    };
    const addSupplierPayment = async (p: Omit<SupplierPayment, 'id'>) => {
        setSupplierPayments(prev => [{ ...p, id: Date.now().toString() }, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        addToast("تمت إضافة الدفعة.", 'success');
    };
    const updateSupplierPayment = async (p: SupplierPayment) => {
        setSupplierPayments(prev => prev.map(sp => sp.id === p.id ? p : sp).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        addToast("تم تحديث الدفعة.", 'success');
    };
    const deleteSupplierPayment = async (id: string) => {
        setSupplierPayments(prev => prev.filter(sp => sp.id !== id));
        addToast("تم حذف الدفعة.", 'success');
    };
    const addFertilizationProgram = async (p: Omit<FertilizationProgram, 'id'>) => {
        setFertilizationPrograms(prev => [...prev, { ...p, id: Date.now().toString() }]);
        addToast("تمت إضافة البرنامج.", 'success');
    };
    const updateFertilizationProgram = async (p: FertilizationProgram) => {
        setFertilizationPrograms(prev => prev.map(fp => fp.id === p.id ? p : fp));
        addToast("تم تحديث البرنامج.", 'success');
    };
    const deleteFertilizationProgram = async (id: string) => {
        const isProgramInUse = transactions.some(t => t.fertilizationProgramId === id);
        if (isProgramInUse) {
            addToast("لا يمكن حذف برنامج مرتبط بمعاملات. يجب فك ارتباط المعاملات أولاً.", "error");
            return;
        }
        setFertilizationPrograms(prev => prev.filter(fp => fp.id !== id));
        addToast("تم حذف البرنامج.", 'success');
    };
    const addAdvance = async (a: Omit<Advance, 'id'>) => {
        setAdvances(prev => [{ ...a, id: Date.now().toString() }, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        addToast("تمت إضافة السلفة.", 'success');
    };
    const updateAdvance = async (a: Advance) => {
        setAdvances(prev => prev.map(ad => ad.id === a.id ? a : ad).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        addToast("تم تحديث السلفة.", 'success');
    };
    const deleteAdvance = async (id: string) => {
        setAdvances(prev => prev.filter(ad => ad.id !== id));
        addToast("تم حذف السلفة.", 'success');
    };
    const addPerson = async (p: Omit<Person, 'id'>) => {
        setPeople(prev => [...prev, { ...p, id: Date.now().toString() }]);
        addToast("تمت إضافة الشخص.", 'success');
    };
    const updatePerson = async (p: Person) => {
        setPeople(prev => prev.map(pe => pe.id === p.id ? p : pe));
        addToast("تم تحديث الشخص.", 'success');
    };
    const deletePerson = async (id: string) => {
        const isPersonInUse = advances.some(a => a.personId === id);
        if (isPersonInUse) {
            addToast("لا يمكن حذف شخص مرتبط بسلف مسجلة.", 'error');
            return;
        }
        setPeople(prev => prev.filter(p => p.id !== id));
        addToast("تم حذف الشخص.", 'success');
    };
    const addExpenseCategory = async (category: Omit<ExpenseCategorySetting, 'id'>) => {
        const existingCategories = settings.expenseCategories || [];
        const normalizedNewName = category.name.trim().toLowerCase();

        if (existingCategories.some(cat => cat.name.trim().toLowerCase() === normalizedNewName)) {
            addToast(`الفئة "${category.name}" موجودة بالفعل.`, 'error');
            return;
        }

        const newCategory = { ...category, id: Date.now().toString() };
        setSettings(prev => ({ ...prev, expenseCategories: [...existingCategories, newCategory] }));
        addToast("تمت إضافة الفئة.", 'success');
    };
    const updateExpenseCategory = async (updatedCategory: ExpenseCategorySetting) => {
        const existingCategories = settings.expenseCategories || [];
        const normalizedNewName = updatedCategory.name.trim().toLowerCase();

        const duplicateExists = existingCategories.some(cat => 
            cat.name.trim().toLowerCase() === normalizedNewName && cat.id !== updatedCategory.id
        );

        if (duplicateExists) {
            addToast(`الفئة "${updatedCategory.name}" موجودة بالفعل.`, 'error');
            return;
        }

        const oldCategory = existingCategories.find(cat => cat.id === updatedCategory.id);

        setSettings(prev => ({
            ...prev,
            expenseCategories: (prev.expenseCategories || []).map(cat => 
                cat.id === updatedCategory.id ? updatedCategory : cat
            )
        }));

        if (oldCategory && oldCategory.name !== updatedCategory.name) {
            setTransactions(prevTransactions => 
                prevTransactions.map(t => 
                    t.type === TransactionType.EXPENSE && t.category === oldCategory.name 
                        ? { ...t, category: updatedCategory.name } 
                        : t
                )
            );
            addToast(`تم تحديث الفئة والمعاملات المرتبطة من '${oldCategory.name}' إلى '${updatedCategory.name}'.`, 'success');
        } else {
            addToast("تم تحديث الفئة بنجاح.", 'success');
        }
    };
    const deleteExpenseCategory = async (id: string) => {
        const categoryToDelete = settings.expenseCategories.find(cat => cat.id === id);
        if (!categoryToDelete) {
            addToast("لم يتم العثور على الفئة.", "error");
            return;
        }

        const isInUse = transactions.some(t => t.category === categoryToDelete.name);
        
        if (isInUse) {
            addToast("لا يمكن حذف الفئة لأنها مستخدمة في معاملات حالية.", "error");
            return;
        }

        setSettings(prev => ({ ...prev, expenseCategories: (prev.expenseCategories || []).filter(cat => cat.id !== id) }));
        addToast("تم حذف الفئة بنجاح.", 'success');
    };
    const loadBackupData = async (data: BackupData) => {
        try {
            localStorage.setItem('greenhouses', JSON.stringify(data.greenhouses || []));
            localStorage.setItem('cropCycles', JSON.stringify(data.cropCycles || []));
            localStorage.setItem('transactions', JSON.stringify(data.transactions || []));
            localStorage.setItem('farmers', JSON.stringify(data.farmers || []));
            localStorage.setItem('farmerWithdrawals', JSON.stringify(data.farmerWithdrawals || []));
            localStorage.setItem('suppliers', JSON.stringify(data.suppliers || []));
            localStorage.setItem('supplierPayments', JSON.stringify(data.supplierPayments || []));
            localStorage.setItem('fertilizationPrograms', JSON.stringify(data.fertilizationPrograms || []));
            localStorage.setItem('advances', JSON.stringify(data.advances || []));
            localStorage.setItem('people', JSON.stringify(data.people || []));
            localStorage.setItem('settings', JSON.stringify(data.settings || INITIAL_SETTINGS));
            localStorage.setItem('appInitialized', 'true');
            
            addToast('تم استعادة البيانات بنجاح! سيتم إعادة تحميل التطبيق.', 'success');
            
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            console.error("Failed to write backup data to localStorage:", error);
            addToast('حدث خطأ أثناء كتابة بيانات النسخة الاحتياطية.', 'error');
        }
    };
    const deleteAllData = async () => {
        setIsDeletingData(true);
        localStorage.clear();
        addToast("تم حذف جميع البيانات بنجاح. سيتم إعادة تشغيل التطبيق.", "success");
        setTimeout(() => window.location.reload(), 1500);
    };
    const startFresh = async () => {
        setLoading(true);
        setGreenhouses([]); setCropCycles([]); setTransactions([]); setFarmers([]); setFarmerWithdrawals([]); setSuppliers([]); setSupplierPayments([]); setFertilizationPrograms([]); setAdvances([]); setPeople([]); setSettings(INITIAL_SETTINGS);
        addToast("تم البدء من جديد بنجاح.", "success");
        setLoading(false);
    };
    const loadDemoData = async () => {
        setLoading(true);
        addToast('جار تحميل البيانات التجريبية...', 'info');
        const data = await getDemoData();
        setGreenhouses(data.greenhouses);
        setCropCycles(data.cropCycles);
        setTransactions(data.transactions);
        setFarmers(data.farmers);
        setFarmerWithdrawals(data.farmerWithdrawals);
        setSettings(data.settings);
        setSuppliers(data.suppliers);
        setSupplierPayments(data.supplierPayments);
        setFertilizationPrograms(data.fertilizationPrograms);
        setAdvances(data.advances);
        setPeople(data.people);
        addToast('تم تحميل البيانات التجريبية بنجاح.', 'success');
        setLoading(false);
    };

    return {
        loading, isDeletingData, cropCycles, transactions, greenhouses, settings, farmers, farmerWithdrawals, alerts, suppliers, supplierPayments, fertilizationPrograms, advances, people, addCropCycle, updateCropCycle, archiveOrDeleteCropCycle, addTransaction, updateTransaction, deleteTransaction, addGreenhouse, updateGreenhouse, deleteGreenhouse, updateSettings, addFarmer, updateFarmer, deleteFarmer, addFarmerWithdrawal, updateFarmerWithdrawal, deleteFarmerWithdrawal, addSupplier, updateSupplier, deleteSupplier, addSupplierPayment, updateSupplierPayment, deleteSupplierPayment, addFertilizationProgram, updateFertilizationProgram, deleteFertilizationProgram, addAdvance, updateAdvance, deleteAdvance, addPerson, updatePerson, deletePerson, addExpenseCategory, updateExpenseCategory, deleteExpenseCategory, getWithdrawalsForFarmer, loadBackupData, loadDemoData, deleteAllData, startFresh,
    };
};