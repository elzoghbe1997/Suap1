import React from 'react';
import { ToastContext, ToastContextType } from '../context/ToastContext.tsx';
import { CropCycle, Transaction, Greenhouse, AppSettings, Farmer, FarmerWithdrawal, Alert, BackupData, TransactionType, CropCycleStatus, AlertType, AppContextType, Supplier, SupplierPayment, FertilizationProgram, ExpenseCategorySetting, Advance } from '../types.ts';
import { lovable } from '../lovableClient.ts';
import { INITIAL_SETTINGS } from '../constants.ts';

// Helper to handle errors from Lovable client
const handleLovableError = (error: { message: string } | null, customMessage: string) => {
    if (error) {
        console.error(customMessage, error);
        throw new Error(error.message || customMessage);
    }
};

export const useAppData = (): AppContextType => {
    const { addToast } = React.useContext(ToastContext) as ToastContextType;
    
    const [loading, setLoading] = React.useState(true);
    const [isDeletingData, setIsDeletingData] = React.useState(false);
    const [cropCycles, setCropCycles] = React.useState<CropCycle[]>([]);
    const [transactions, setTransactions] = React.useState<Transaction[]>([]);
    const [greenhouses, setGreenhouses] = React.useState<Greenhouse[]>([]);
    const [settings, setSettings] = React.useState<AppSettings>(INITIAL_SETTINGS);
    const [farmers, setFarmers] = React.useState<Farmer[]>([]);
    const [farmerWithdrawals, setFarmerWithdrawals] = React.useState<FarmerWithdrawal[]>([]);
    const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
    const [supplierPayments, setSupplierPayments] = React.useState<SupplierPayment[]>([]);
    const [fertilizationPrograms, setFertilizationPrograms] = React.useState<FertilizationProgram[]>([]);
    const [advances, setAdvances] = React.useState<Advance[]>([]);
    const [alerts, setAlerts] = React.useState<Alert[]>([]);
    
    React.useEffect(() => {
        async function fetchAllData() {
            try {
                // In a real app, you would filter these by user_id
                const [
                    cyclesRes,
                    transactionsRes,
                    greenhousesRes,
                    settingsRes,
                    farmersRes,
                    withdrawalsRes,
                    suppliersRes,
                    paymentsRes,
                    programsRes,
                    advancesRes,
                ] = await Promise.all([
                    lovable.from('crop_cycles').select('*'),
                    lovable.from('transactions').select('*'),
                    lovable.from('greenhouses').select('*'),
                    // FIX: Removed .limit(1) as it was being called on a Promise. The logic below already handles taking the first result.
                    lovable.from('settings').select('*'),
                    lovable.from('farmers').select('*'),
                    lovable.from('farmer_withdrawals').select('*'),
                    lovable.from('suppliers').select('*'),
                    lovable.from('supplier_payments').select('*'),
                    lovable.from('fertilization_programs').select('*'),
                    lovable.from('advances').select('*'),
                ]);

                handleLovableError(cyclesRes.error, 'Failed to fetch crop cycles.');
                handleLovableError(transactionsRes.error, 'Failed to fetch transactions.');
                handleLovableError(greenhousesRes.error, 'Failed to fetch greenhouses.');
                handleLovableError(settingsRes.error, 'Failed to fetch settings.');
                handleLovableError(farmersRes.error, 'Failed to fetch farmers.');
                handleLovableError(withdrawalsRes.error, 'Failed to fetch withdrawals.');
                handleLovableError(suppliersRes.error, 'Failed to fetch suppliers.');
                handleLovableError(paymentsRes.error, 'Failed to fetch payments.');
                handleLovableError(programsRes.error, 'Failed to fetch programs.');
                handleLovableError(advancesRes.error, 'Failed to fetch advances.');

                setCropCycles(cyclesRes.data || []);
                setTransactions(transactionsRes.data || []);
                setGreenhouses(greenhousesRes.data || []);
                setSettings(settingsRes.data?.[0] || INITIAL_SETTINGS);
                setFarmers(farmersRes.data || []);
                setFarmerWithdrawals(withdrawalsRes.data || []);
                setSuppliers(suppliersRes.data || []);
                setSupplierPayments(paymentsRes.data || []);
                setFertilizationPrograms(programsRes.data || []);
                setAdvances(advancesRes.data || []);
                
            } catch (error: any) {
                addToast(error.message || 'فشل تحميل البيانات الأولية.', 'error');
            } finally {
                setLoading(false);
            }
        }
        
        // This is a mock implementation. Lovable doesn't have demo data.
        // We check if the app has been initialized before. If not, we don't fetch.
        // The onboarding modal will handle loading demo/fresh data.
        if (localStorage.getItem('appInitialized')) {
            // fetchAllData();
        } else {
             setLoading(false);
        }
        // For demonstration, we will continue to use mock data until the user chooses.
        // To migrate fully, replace the api.ts calls with fetchAllData().
        // The following code is from the old api.ts to keep the app working for now.
        const demoData = {
            greenhouses: [{ id: 'g1', name: 'الصوبة الشمالية', creationDate: '2023-01-15', initialCost: 150000 }, { id: 'g2', name: 'الصوبة الجنوبية', creationDate: '2023-03-20', initialCost: 185000 }],
            cropCycles: [ { id: '1', name: 'عروة الطماطم الشتوية 2023', startDate: '2023-10-01', status: CropCycleStatus.CLOSED, greenhouseId: 'g1', seedType: 'طماطم شيري', plantCount: 600, productionStartDate: '2024-01-10', farmerId: 'f1', farmerSharePercentage: 20 }, { id: '2', name: 'عروة الخيار الصيفية 2024', startDate: '2024-04-15', status: CropCycleStatus.ACTIVE, greenhouseId: 'g2', seedType: 'خيار بلدي', plantCount: 850, productionStartDate: '2024-06-10', farmerId: 'f2', farmerSharePercentage: 25 }, { id: '3', name: 'عروة الفلفل الربيعية 2024', startDate: '2024-03-01', status: CropCycleStatus.ACTIVE, greenhouseId: 'g1', seedType: 'فلفل ألوان', plantCount: 700, productionStartDate: null, farmerId: null, farmerSharePercentage: null }, ],
            transactions: [ { id: 't1', date: '2023-10-01', description: 'شراء بذور طماطم', type: TransactionType.EXPENSE, category: 'بذور', amount: 2500, cropCycleId: '1' }, { id: 't4', date: '2024-01-10', description: 'بيع أول دفعة محصول طماطم', type: TransactionType.REVENUE, category: 'أخرى', amount: 15000, cropCycleId: '1', quantity: 500, priceItems: [{ quantity: 500, price: 30 }] }, ],
            farmers: [{ id: 'f1', name: 'أحمد محمود' }, { id: 'f2', name: 'علي حسن' },],
            farmerWithdrawals: [{ id: 'fw1', cropCycleId: '1', date: '2024-01-20', amount: 2000, description: 'سلفة أولى' }],
            settings: INITIAL_SETTINGS,
            suppliers: [{ id: 's1', name: 'شركة الأسمدة الحديثة' }, { id: 's2', name: 'مبيدات النصر' }],
            supplierPayments: [{ id: 'sp1', date: '2024-06-12', amount: 2000, supplierId: 's1', description: 'دفعة من حساب الأسمدة' }],
            fertilizationPrograms: [{ id: 'fp1', name: 'برنامج الأسبوع 1 - خيار 2024', startDate: '2024-05-16', endDate: '2024-05-22', cropCycleId: '2' }],
            advances: [{ id: 'adv1', date: '2024-06-05', amount: 5000, description: 'سلفة شخصية' }],
        };
        setCropCycles(demoData.cropCycles);
        setTransactions(demoData.transactions);
        setGreenhouses(demoData.greenhouses);
        setSettings(demoData.settings);
        setFarmers(demoData.farmers);
        setFarmerWithdrawals(demoData.farmerWithdrawals);
        setSuppliers(demoData.suppliers);
        setSupplierPayments(demoData.supplierPayments);
        setFertilizationPrograms(demoData.fertilizationPrograms);
        setAdvances(demoData.advances);
        setLoading(false);


    }, [addToast]);

    // ALERTS LOGIC (no change, depends on state)
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
    
    // NOTE: All CRUD functions below need to be implemented using the `lovable` client.
    // The following are placeholder functions that manipulate local state for UI demonstration.
    
    const addCropCycle = async (cycle: Omit<CropCycle, 'id'>) => {
        const newCycle = { ...cycle, id: Date.now().toString() };
        setCropCycles(prev => [...prev, newCycle]);
        addToast("تمت إضافة العروة بنجاح.", 'success');
    };
    const updateCropCycle = async (updatedCycle: CropCycle) => {
        setCropCycles(prev => prev.map(c => c.id === updatedCycle.id ? updatedCycle : c));
        addToast("تم تحديث العروة بنجاح.", 'success');
    };
    const deleteCropCycle = async (id: string) => {
        setCropCycles(prev => prev.filter(c => c.id !== id));
        addToast("تم حذف/أرشفة العروة.", 'success');
    };
    const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
        const newTransaction = { ...transaction, id: Date.now().toString() };
        setTransactions(prev => [newTransaction, ...prev]);
        addToast("تمت إضافة المعاملة بنجاح.", 'success');
    };
    const updateTransaction = async (updatedTransaction: Transaction) => {
        setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
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
        setFarmers(prev => prev.filter(f => f.id !== id));
        addToast("تم حذف المزارع.", 'success');
    };
    const addFarmerWithdrawal = async (w: Omit<FarmerWithdrawal, 'id'>) => {
        setFarmerWithdrawals(prev => [{ ...w, id: Date.now().toString() }, ...prev]);
        addToast("تمت إضافة السحب.", 'success');
    };
    const updateFarmerWithdrawal = async (w: FarmerWithdrawal) => {
        setFarmerWithdrawals(prev => prev.map(fw => fw.id === w.id ? w : fw));
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
        setSuppliers(prev => prev.filter(s => s.id !== id));
        addToast("تم حذف المورد.", 'success');
    };
    const addSupplierPayment = async (p: Omit<SupplierPayment, 'id'>) => {
        setSupplierPayments(prev => [{ ...p, id: Date.now().toString() }, ...prev]);
        addToast("تمت إضافة الدفعة.", 'success');
    };
    const updateSupplierPayment = async (p: SupplierPayment) => {
        setSupplierPayments(prev => prev.map(sp => sp.id === p.id ? p : sp));
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
        setFertilizationPrograms(prev => prev.filter(fp => fp.id !== id));
        addToast("تم حذف البرنامج.", 'success');
    };
    const addAdvance = async (a: Omit<Advance, 'id'>) => {
        setAdvances(prev => [{ ...a, id: Date.now().toString() }, ...prev]);
        addToast("تمت إضافة السلفة.", 'success');
    };
    const updateAdvance = async (a: Advance) => {
        setAdvances(prev => prev.map(ad => ad.id === a.id ? a : ad));
        addToast("تم تحديث السلفة.", 'success');
    };
    const deleteAdvance = async (id: string) => {
        setAdvances(prev => prev.filter(ad => ad.id !== id));
        addToast("تم حذف السلفة.", 'success');
    };
    const addExpenseCategory = async (category: Omit<ExpenseCategorySetting, 'id'>) => {
        const newCategory = { ...category, id: Date.now().toString() };
        updateSettings({ expenseCategories: [...(settings.expenseCategories || []), newCategory] });
        addToast("تمت إضافة الفئة.", 'success');
    };
    const updateExpenseCategory = async (updatedCategory: ExpenseCategorySetting) => {
        updateSettings({ expenseCategories: (settings.expenseCategories || []).map(cat => cat.id === updatedCategory.id ? updatedCategory : cat) });
        addToast("تم تحديث الفئة.", 'success');
    };
    const deleteExpenseCategory = async (id: string) => {
        updateSettings({ expenseCategories: (settings.expenseCategories || []).filter(cat => cat.id !== id) });
        addToast("تم حذف الفئة.", 'success');
    };
    const loadBackupData = async (data: BackupData) => {
        setGreenhouses(data.greenhouses || []);
        setCropCycles(data.cropCycles || []);
        setTransactions(data.transactions || []);
        setFarmers(data.farmers || []);
        setFarmerWithdrawals(data.farmerWithdrawals || []);
        setSuppliers(data.suppliers || []);
        setSupplierPayments(data.supplierPayments || []);
        setFertilizationPrograms(data.fertilizationPrograms || []);
        setAdvances(data.advances || []);
        setSettings(data.settings);
        addToast('تم استعادة البيانات بنجاح!', 'success');
    };
    const deleteAllData = async () => {
        setIsDeletingData(true);
        setGreenhouses([]); setCropCycles([]); setTransactions([]); setFarmers([]); setFarmerWithdrawals([]); setSuppliers([]); setSupplierPayments([]); setFertilizationPrograms([]); setAdvances([]); setSettings(INITIAL_SETTINGS);
        localStorage.removeItem('appInitialized');
        addToast("تم حذف جميع البيانات بنجاح.", "success");
        setIsDeletingData(false);
    };
    const startFresh = async () => {
        setLoading(true);
        setGreenhouses([]); setCropCycles([]); setTransactions([]); setFarmers([]); setFarmerWithdrawals([]); setSuppliers([]); setSupplierPayments([]); setFertilizationPrograms([]); setAdvances([]); setSettings(INITIAL_SETTINGS);
        addToast("تم البدء من جديد بنجاح.", "success");
        setLoading(false);
    };
    const loadDemoData = async () => {
        setLoading(true);
        addToast('جار تحميل البيانات التجريبية...', 'info');
        // This is where you would fetch demo data from a real backend.
        // For now, we'll just reset to the initial mock data.
        window.location.reload(); // Simple way to reload initial mock data
    };

    return {
        loading, isDeletingData, cropCycles, transactions, greenhouses, settings, farmers, farmerWithdrawals, alerts, suppliers, supplierPayments, fertilizationPrograms, advances, addCropCycle, updateCropCycle, deleteCropCycle, addTransaction, updateTransaction, deleteTransaction, addGreenhouse, updateGreenhouse, deleteGreenhouse, updateSettings, addFarmer, updateFarmer, deleteFarmer, addFarmerWithdrawal, updateFarmerWithdrawal, deleteFarmerWithdrawal, addSupplier, updateSupplier, deleteSupplier, addSupplierPayment, updateSupplierPayment, deleteSupplierPayment, addFertilizationProgram, updateFertilizationProgram, deleteFertilizationProgram, addAdvance, updateAdvance, deleteAdvance, addExpenseCategory, updateExpenseCategory, deleteExpenseCategory, loadBackupData, loadDemoData, deleteAllData, startFresh,
    };
};