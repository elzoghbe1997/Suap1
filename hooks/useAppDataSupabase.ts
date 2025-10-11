import React from 'react';
import { ToastContext, ToastContextType } from '../context/ToastContext.tsx';
import { CropCycle, Transaction, Greenhouse, AppSettings, Farmer, FarmerWithdrawal, Alert, BackupData, TransactionType, CropCycleStatus, AlertType, AppContextType, Supplier, SupplierPayment, FertilizationProgram, ExpenseCategorySetting, Advance } from '../types.ts';
import { database } from '../lib/database.ts';
import { INITIAL_SETTINGS } from '../constants.ts';
import { supabase } from '../lib/supabase.ts';

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

    const fetchAllData = React.useCallback(async () => {
        try {
            const [
                greenhousesData,
                cyclesData,
                transactionsData,
                farmersData,
                withdrawalsData,
                suppliersData,
                paymentsData,
                programsData,
                advancesData,
                settingsData,
            ] = await Promise.all([
                database.greenhouses.getAll(),
                database.cropCycles.getAll(),
                database.transactions.getAll(),
                database.farmers.getAll(),
                database.farmerWithdrawals.getAll(),
                database.suppliers.getAll(),
                database.supplierPayments.getAll(),
                database.fertilizationPrograms.getAll(),
                database.advances.getAll(),
                database.settings.get(),
            ]);

            setGreenhouses(greenhousesData);
            setCropCycles(cyclesData);
            setTransactions(transactionsData);
            setFarmers(farmersData);
            setFarmerWithdrawals(withdrawalsData);
            setSuppliers(suppliersData);
            setSupplierPayments(paymentsData);
            setFertilizationPrograms(programsData);
            setAdvances(advancesData);
            setSettings(settingsData || INITIAL_SETTINGS);

        } catch (error: any) {
            console.error('Error fetching data:', error);
            addToast(error.message || 'فشل تحميل البيانات.', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    React.useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN') {
                fetchAllData();
            }
        });

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                fetchAllData();
            } else {
                setLoading(false);
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, [fetchAllData]);

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

    const addCropCycle = async (cycle: Omit<CropCycle, 'id'>) => {
        try {
            const newCycle = await database.cropCycles.create(cycle);
            setCropCycles(prev => [newCycle, ...prev]);
            addToast("تمت إضافة العروة بنجاح.", 'success');
        } catch (error: any) {
            console.error('Error adding crop cycle:', error);
            addToast(error.message || 'فشل إضافة العروة.', 'error');
            throw error;
        }
    };

    const updateCropCycle = async (updatedCycle: CropCycle) => {
        try {
            await database.cropCycles.update(updatedCycle);
            setCropCycles(prev => prev.map(c => c.id === updatedCycle.id ? updatedCycle : c));
            addToast("تم تحديث العروة بنجاح.", 'success');
        } catch (error: any) {
            console.error('Error updating crop cycle:', error);
            addToast(error.message || 'فشل تحديث العروة.', 'error');
            throw error;
        }
    };

    const deleteCropCycle = async (id: string) => {
        try {
            await database.cropCycles.delete(id);
            setCropCycles(prev => prev.filter(c => c.id !== id));
            addToast("تم حذف العروة بنجاح.", 'success');
        } catch (error: any) {
            console.error('Error deleting crop cycle:', error);
            addToast(error.message || 'فشل حذف العروة.', 'error');
            throw error;
        }
    };

    const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
        try {
            const newTransaction = await database.transactions.create(transaction);
            setTransactions(prev => [newTransaction, ...prev]);
            addToast("تمت إضافة المعاملة بنجاح.", 'success');
        } catch (error: any) {
            console.error('Error adding transaction:', error);
            addToast(error.message || 'فشل إضافة المعاملة.', 'error');
            throw error;
        }
    };

    const updateTransaction = async (updatedTransaction: Transaction) => {
        try {
            await database.transactions.update(updatedTransaction);
            setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
            addToast("تم تحديث المعاملة بنجاح.", 'success');
        } catch (error: any) {
            console.error('Error updating transaction:', error);
            addToast(error.message || 'فشل تحديث المعاملة.', 'error');
            throw error;
        }
    };

    const deleteTransaction = async (id: string) => {
        try {
            await database.transactions.delete(id);
            setTransactions(prev => prev.filter(t => t.id !== id));
            addToast("تم حذف المعاملة بنجاح.", 'success');
        } catch (error: any) {
            console.error('Error deleting transaction:', error);
            addToast(error.message || 'فشل حذف المعاملة.', 'error');
            throw error;
        }
    };

    const addGreenhouse = async (g: Omit<Greenhouse, 'id'>) => {
        try {
            const newGreenhouse = await database.greenhouses.create(g);
            setGreenhouses(prev => [newGreenhouse, ...prev]);
            addToast("تمت إضافة الصوبة.", 'success');
        } catch (error: any) {
            console.error('Error adding greenhouse:', error);
            addToast(error.message || 'فشل إضافة الصوبة.', 'error');
            throw error;
        }
    };

    const updateGreenhouse = async (g: Greenhouse) => {
        try {
            await database.greenhouses.update(g);
            setGreenhouses(prev => prev.map(gh => gh.id === g.id ? g : gh));
            addToast("تم تحديث الصوبة.", 'success');
        } catch (error: any) {
            console.error('Error updating greenhouse:', error);
            addToast(error.message || 'فشل تحديث الصوبة.', 'error');
            throw error;
        }
    };

    const deleteGreenhouse = async (id: string) => {
        try {
            await database.greenhouses.delete(id);
            setGreenhouses(prev => prev.filter(gh => gh.id !== id));
            addToast("تم حذف الصوبة.", 'success');
        } catch (error: any) {
            console.error('Error deleting greenhouse:', error);
            addToast(error.message || 'فشل حذف الصوبة.', 'error');
            throw error;
        }
    };

    const updateSettings = async (newSettings: Partial<AppSettings>) => {
        try {
            const updatedSettings = { ...settings, ...newSettings };
            await database.settings.createOrUpdate(updatedSettings);
            setSettings(updatedSettings);
        } catch (error: any) {
            console.error('Error updating settings:', error);
            addToast(error.message || 'فشل تحديث الإعدادات.', 'error');
            throw error;
        }
    };

    const addFarmer = async (f: Omit<Farmer, 'id'>) => {
        try {
            const newFarmer = await database.farmers.create(f);
            setFarmers(prev => [...prev, newFarmer]);
            addToast("تمت إضافة المزارع.", 'success');
        } catch (error: any) {
            console.error('Error adding farmer:', error);
            addToast(error.message || 'فشل إضافة المزارع.', 'error');
            throw error;
        }
    };

    const updateFarmer = async (f: Farmer) => {
        try {
            await database.farmers.update(f);
            setFarmers(prev => prev.map(fa => fa.id === f.id ? f : fa));
            addToast("تم تحديث المزارع.", 'success');
        } catch (error: any) {
            console.error('Error updating farmer:', error);
            addToast(error.message || 'فشل تحديث المزارع.', 'error');
            throw error;
        }
    };

    const deleteFarmer = async (id: string) => {
        try {
            await database.farmers.delete(id);
            setFarmers(prev => prev.filter(f => f.id !== id));
            addToast("تم حذف المزارع.", 'success');
        } catch (error: any) {
            console.error('Error deleting farmer:', error);
            addToast(error.message || 'فشل حذف المزارع.', 'error');
            throw error;
        }
    };

    const addFarmerWithdrawal = async (w: Omit<FarmerWithdrawal, 'id'>) => {
        try {
            const newWithdrawal = await database.farmerWithdrawals.create(w);
            setFarmerWithdrawals(prev => [newWithdrawal, ...prev]);
            addToast("تمت إضافة السحب.", 'success');
        } catch (error: any) {
            console.error('Error adding withdrawal:', error);
            addToast(error.message || 'فشل إضافة السحب.', 'error');
            throw error;
        }
    };

    const updateFarmerWithdrawal = async (w: FarmerWithdrawal) => {
        try {
            await database.farmerWithdrawals.update(w);
            setFarmerWithdrawals(prev => prev.map(fw => fw.id === w.id ? w : fw));
            addToast("تم تحديث السحب.", 'success');
        } catch (error: any) {
            console.error('Error updating withdrawal:', error);
            addToast(error.message || 'فشل تحديث السحب.', 'error');
            throw error;
        }
    };

    const deleteFarmerWithdrawal = async (id: string) => {
        try {
            await database.farmerWithdrawals.delete(id);
            setFarmerWithdrawals(prev => prev.filter(fw => fw.id !== id));
            addToast("تم حذف السحب.", 'success');
        } catch (error: any) {
            console.error('Error deleting withdrawal:', error);
            addToast(error.message || 'فشل حذف السحب.', 'error');
            throw error;
        }
    };

    const addSupplier = async (s: Omit<Supplier, 'id'>) => {
        try {
            const newSupplier = await database.suppliers.create(s);
            setSuppliers(prev => [...prev, newSupplier]);
            addToast("تمت إضافة المورد.", 'success');
        } catch (error: any) {
            console.error('Error adding supplier:', error);
            addToast(error.message || 'فشل إضافة المورد.', 'error');
            throw error;
        }
    };

    const updateSupplier = async (s: Supplier) => {
        try {
            await database.suppliers.update(s);
            setSuppliers(prev => prev.map(su => su.id === s.id ? s : su));
            addToast("تم تحديث المورد.", 'success');
        } catch (error: any) {
            console.error('Error updating supplier:', error);
            addToast(error.message || 'فشل تحديث المورد.', 'error');
            throw error;
        }
    };

    const deleteSupplier = async (id: string) => {
        try {
            await database.suppliers.delete(id);
            setSuppliers(prev => prev.filter(s => s.id !== id));
            addToast("تم حذف المورد.", 'success');
        } catch (error: any) {
            console.error('Error deleting supplier:', error);
            addToast(error.message || 'فشل حذف المورد.', 'error');
            throw error;
        }
    };

    const addSupplierPayment = async (p: Omit<SupplierPayment, 'id'>) => {
        try {
            const newPayment = await database.supplierPayments.create(p);
            setSupplierPayments(prev => [newPayment, ...prev]);
            addToast("تمت إضافة الدفعة.", 'success');
        } catch (error: any) {
            console.error('Error adding payment:', error);
            addToast(error.message || 'فشل إضافة الدفعة.', 'error');
            throw error;
        }
    };

    const updateSupplierPayment = async (p: SupplierPayment) => {
        try {
            await database.supplierPayments.update(p);
            setSupplierPayments(prev => prev.map(sp => sp.id === p.id ? p : sp));
            addToast("تم تحديث الدفعة.", 'success');
        } catch (error: any) {
            console.error('Error updating payment:', error);
            addToast(error.message || 'فشل تحديث الدفعة.', 'error');
            throw error;
        }
    };

    const deleteSupplierPayment = async (id: string) => {
        try {
            await database.supplierPayments.delete(id);
            setSupplierPayments(prev => prev.filter(sp => sp.id !== id));
            addToast("تم حذف الدفعة.", 'success');
        } catch (error: any) {
            console.error('Error deleting payment:', error);
            addToast(error.message || 'فشل حذف الدفعة.', 'error');
            throw error;
        }
    };

    const addFertilizationProgram = async (p: Omit<FertilizationProgram, 'id'>) => {
        try {
            const newProgram = await database.fertilizationPrograms.create(p);
            setFertilizationPrograms(prev => [newProgram, ...prev]);
            addToast("تمت إضافة البرنامج.", 'success');
        } catch (error: any) {
            console.error('Error adding program:', error);
            addToast(error.message || 'فشل إضافة البرنامج.', 'error');
            throw error;
        }
    };

    const updateFertilizationProgram = async (p: FertilizationProgram) => {
        try {
            await database.fertilizationPrograms.update(p);
            setFertilizationPrograms(prev => prev.map(fp => fp.id === p.id ? p : fp));
            addToast("تم تحديث البرنامج.", 'success');
        } catch (error: any) {
            console.error('Error updating program:', error);
            addToast(error.message || 'فشل تحديث البرنامج.', 'error');
            throw error;
        }
    };

    const deleteFertilizationProgram = async (id: string) => {
        try {
            await database.fertilizationPrograms.delete(id);
            setFertilizationPrograms(prev => prev.filter(fp => fp.id !== id));
            addToast("تم حذف البرنامج.", 'success');
        } catch (error: any) {
            console.error('Error deleting program:', error);
            addToast(error.message || 'فشل حذف البرنامج.', 'error');
            throw error;
        }
    };

    const addAdvance = async (a: Omit<Advance, 'id'>) => {
        try {
            const newAdvance = await database.advances.create(a);
            setAdvances(prev => [newAdvance, ...prev]);
            addToast("تمت إضافة السلفة.", 'success');
        } catch (error: any) {
            console.error('Error adding advance:', error);
            addToast(error.message || 'فشل إضافة السلفة.', 'error');
            throw error;
        }
    };

    const updateAdvance = async (a: Advance) => {
        try {
            await database.advances.update(a);
            setAdvances(prev => prev.map(ad => ad.id === a.id ? a : ad));
            addToast("تم تحديث السلفة.", 'success');
        } catch (error: any) {
            console.error('Error updating advance:', error);
            addToast(error.message || 'فشل تحديث السلفة.', 'error');
            throw error;
        }
    };

    const deleteAdvance = async (id: string) => {
        try {
            await database.advances.delete(id);
            setAdvances(prev => prev.filter(ad => ad.id !== id));
            addToast("تم حذف السلفة.", 'success');
        } catch (error: any) {
            console.error('Error deleting advance:', error);
            addToast(error.message || 'فشل حذف السلفة.', 'error');
            throw error;
        }
    };

    const addExpenseCategory = async (category: Omit<ExpenseCategorySetting, 'id'>) => {
        const newCategory = { ...category, id: Date.now().toString() };
        await updateSettings({ expenseCategories: [...(settings.expenseCategories || []), newCategory] });
        addToast("تمت إضافة الفئة.", 'success');
    };

    const updateExpenseCategory = async (updatedCategory: ExpenseCategorySetting) => {
        await updateSettings({ expenseCategories: (settings.expenseCategories || []).map(cat => cat.id === updatedCategory.id ? updatedCategory : cat) });
        addToast("تم تحديث الفئة.", 'success');
    };

    const deleteExpenseCategory = async (id: string) => {
        await updateSettings({ expenseCategories: (settings.expenseCategories || []).filter(cat => cat.id !== id) });
        addToast("تم حذف الفئة.", 'success');
    };

    const loadBackupData = async (data: BackupData) => {
        try {
            setLoading(true);
            await deleteAllData();

            for (const greenhouse of data.greenhouses || []) {
                await database.greenhouses.create(greenhouse);
            }
            for (const farmer of data.farmers || []) {
                await database.farmers.create(farmer);
            }
            for (const supplier of data.suppliers || []) {
                await database.suppliers.create(supplier);
            }
            for (const cycle of data.cropCycles || []) {
                await database.cropCycles.create(cycle);
            }
            for (const transaction of data.transactions || []) {
                await database.transactions.create(transaction);
            }
            for (const withdrawal of data.farmerWithdrawals || []) {
                await database.farmerWithdrawals.create(withdrawal);
            }
            for (const payment of data.supplierPayments || []) {
                await database.supplierPayments.create(payment);
            }
            for (const program of data.fertilizationPrograms || []) {
                await database.fertilizationPrograms.create(program);
            }
            for (const advance of data.advances || []) {
                await database.advances.create(advance);
            }

            await database.settings.createOrUpdate(data.settings);

            await fetchAllData();
            addToast('تم استعادة البيانات بنجاح!', 'success');
        } catch (error: any) {
            console.error('Error loading backup:', error);
            addToast(error.message || 'فشل استعادة البيانات.', 'error');
            throw error;
        }
    };

    const deleteAllData = async () => {
        try {
            setIsDeletingData(true);

            await Promise.all([
                ...transactions.map(t => database.transactions.delete(t.id)),
                ...farmerWithdrawals.map(w => database.farmerWithdrawals.delete(w.id)),
                ...supplierPayments.map(p => database.supplierPayments.delete(p.id)),
                ...fertilizationPrograms.map(p => database.fertilizationPrograms.delete(p.id)),
                ...advances.map(a => database.advances.delete(a.id)),
                ...cropCycles.map(c => database.cropCycles.delete(c.id)),
                ...greenhouses.map(g => database.greenhouses.delete(g.id)),
                ...farmers.map(f => database.farmers.delete(f.id)),
                ...suppliers.map(s => database.suppliers.delete(s.id)),
            ]);

            await database.settings.createOrUpdate(INITIAL_SETTINGS);

            setGreenhouses([]);
            setCropCycles([]);
            setTransactions([]);
            setFarmers([]);
            setFarmerWithdrawals([]);
            setSuppliers([]);
            setSupplierPayments([]);
            setFertilizationPrograms([]);
            setAdvances([]);
            setSettings(INITIAL_SETTINGS);

            localStorage.removeItem('appInitialized');
            addToast("تم حذف جميع البيانات بنجاح.", "success");
        } catch (error: any) {
            console.error('Error deleting all data:', error);
            addToast(error.message || 'فشل حذف البيانات.', 'error');
        } finally {
            setIsDeletingData(false);
        }
    };

    const startFresh = async () => {
        await deleteAllData();
        addToast("تم البدء من جديد بنجاح.", "success");
    };

    const loadDemoData = async () => {
        window.location.reload();
    };

    return {
        loading,
        isDeletingData,
        cropCycles,
        transactions,
        greenhouses,
        settings,
        farmers,
        farmerWithdrawals,
        alerts,
        suppliers,
        supplierPayments,
        fertilizationPrograms,
        advances,
        addCropCycle,
        updateCropCycle,
        deleteCropCycle,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addGreenhouse,
        updateGreenhouse,
        deleteGreenhouse,
        updateSettings,
        addFarmer,
        updateFarmer,
        deleteFarmer,
        addFarmerWithdrawal,
        updateFarmerWithdrawal,
        deleteFarmerWithdrawal,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addSupplierPayment,
        updateSupplierPayment,
        deleteSupplierPayment,
        addFertilizationProgram,
        updateFertilizationProgram,
        deleteFertilizationProgram,
        addAdvance,
        updateAdvance,
        deleteAdvance,
        addExpenseCategory,
        updateExpenseCategory,
        deleteExpenseCategory,
        loadBackupData,
        loadDemoData,
        deleteAllData,
        startFresh,
    };
};
