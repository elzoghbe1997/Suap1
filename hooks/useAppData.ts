import React from 'react';
import { ToastContext, ToastContextType } from '../context/ToastContext';
import { CropCycle, Transaction, Greenhouse, AppSettings, Farmer, FarmerWithdrawal, Alert, BackupData, TransactionType, CropCycleStatus, AlertType, AppContextType, Supplier, SupplierPayment, FertilizationProgram, ExpenseCategorySetting, Advance } from '../types';
import * as api from '../api';
import { INITIAL_SETTINGS } from '../constants';

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
        api.fetchInitialData()
            .then(data => {
                setCropCycles(data.cropCycles);
                setTransactions(data.transactions);
                setGreenhouses(data.greenhouses);
                setSettings(data.settings);
                setFarmers(data.farmers);
                setFarmerWithdrawals(data.farmerWithdrawals);
                setSuppliers(data.suppliers);
                setSupplierPayments(data.supplierPayments);
                setFertilizationPrograms(data.fertilizationPrograms);
                setAdvances(data.advances || []);
            })
            .catch(error => {
                addToast(error.message || 'فشل تحميل البيانات الأولية.', 'error');
            })
            .finally(() => {
                setLoading(false);
            });
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

    // --- Helper for handling optimistic updates ---
    async function handleOptimisticUpdate<T, U>(
        originalState: T[],
        stateSetter: React.Dispatch<React.SetStateAction<T[]>>,
        optimisticState: T[],
        apiCall: () => Promise<U>,
        successCallback: (result: U) => void,
        errorMessage: string
    ) {
        stateSetter(optimisticState);

        try {
            const result = await apiCall();
            successCallback(result);
        } catch (error: any) {
            addToast(error.message || errorMessage, 'error');
            stateSetter(originalState);
            throw error; // Re-throw for component-level error handling
        }
    }


    const calculateProductionStartDate = React.useCallback((cycleId: string, currentTransactions: Transaction[]): (string | null) => {
        const cycleRevenues = currentTransactions
            .filter(t => t.cropCycleId === cycleId && t.type === TransactionType.REVENUE)
            .sort((a, b) => new Date(a.date).getTime() - new Date(a.date).getTime());
        return cycleRevenues.length > 0 ? cycleRevenues[0].date : null;
    }, []);
    

    // --- CRUD Functions with Optimistic Updates ---
    
    const addCropCycle = async (cycle: Omit<CropCycle, 'id'>) => {
        const tempId = `temp-${Date.now()}`;
        const optimisticCycle = { ...cycle, id: tempId };
        
        await handleOptimisticUpdate(
            cropCycles,
            setCropCycles,
            [...cropCycles, optimisticCycle],
            () => api.addCropCycle(cycle),
            (confirmedCycle) => {
                setCropCycles(prev => prev.map(c => c.id === tempId ? confirmedCycle : c));
                addToast("تمت إضافة العروة بنجاح.", 'success');
            },
            'فشل في إضافة العروة.'
        );
    };

    const updateCropCycle = async (updatedCycle: CropCycle) => {
        const optimisticState = cropCycles.map(c => c.id === updatedCycle.id ? updatedCycle : c);
        await handleOptimisticUpdate(
            cropCycles,
            setCropCycles,
            optimisticState,
            () => api.updateCropCycle(updatedCycle),
            () => addToast("تم تحديث العروة بنجاح.", 'success'),
            'فشل في تحديث العروة.'
        );
    };

    const deleteCropCycle = async (id: string) => {
        const cycleToDelete = cropCycles.find(c => c.id === id);
        if (!cycleToDelete) return;

        const hasFinancials = transactions.some(t => t.cropCycleId === id) || farmerWithdrawals.some(w => w.cropCycleId === id);

        if (hasFinancials) {
            // Archive logic
            const optimisticState = cropCycles.map(c => c.id === id ? { ...c, status: CropCycleStatus.ARCHIVED } : c);
            await handleOptimisticUpdate(
                cropCycles,
                setCropCycles,
                optimisticState,
                () => api.archiveCropCycle(cycleToDelete),
                () => addToast(`تم أرشفة العروة "${cycleToDelete.name}".`, 'success'),
                'فشل في أرشفة العروة.'
            );
        } else {
            // Delete logic
            const optimisticState = cropCycles.filter(c => c.id !== id);
            await handleOptimisticUpdate(
                cropCycles,
                setCropCycles,
                optimisticState,
                () => api.deleteCropCycle(id),
                () => {
                    setFertilizationPrograms(prev => prev.filter(p => p.cropCycleId !== id));
                    addToast(`تم حذف العروة "${cycleToDelete.name}".`, 'success');
                },
                'فشل في حذف العروة.'
            );
        }
    };

    const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
        const tempId = `temp-${Date.now()}`;
        const optimisticTransaction = { ...transaction, id: tempId };
        const optimisticState = [...transactions, optimisticTransaction].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        await handleOptimisticUpdate(
            transactions,
            setTransactions,
            optimisticState,
            () => api.addTransaction(transaction),
            (confirmed) => {
                setTransactions(prev => prev.map(t => t.id === tempId ? confirmed : t).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                
                if (confirmed.type === TransactionType.REVENUE) {
                    const cycle = cropCycles.find(c => c.id === confirmed.cropCycleId);
                    if (cycle && cycle.productionStartDate === null) {
                        const newStartDate = calculateProductionStartDate(cycle.id, [...transactions, confirmed]);
                        if (newStartDate) {
                            updateCropCycle({ ...cycle, productionStartDate: newStartDate });
                        }
                    }
                }
                addToast("تمت إضافة المعاملة بنجاح.", 'success');
            },
            'فشل في إضافة المعاملة.'
        );
    };

    const updateTransaction = async (updatedTransaction: Transaction) => {
        const optimisticState = transactions.map(t => t.id === updatedTransaction.id ? updatedTransaction : t);
         await handleOptimisticUpdate(
            transactions,
            setTransactions,
            optimisticState,
            () => api.updateTransaction(updatedTransaction),
            () => {
                 if (updatedTransaction.type === TransactionType.REVENUE) {
                    const cycle = cropCycles.find(c => c.id === updatedTransaction.cropCycleId);
                    if (cycle) {
                         const newStartDate = calculateProductionStartDate(cycle.id, optimisticState);
                         if (cycle.productionStartDate !== newStartDate) {
                             updateCropCycle({ ...cycle, productionStartDate: newStartDate });
                         }
                    }
                 }
                addToast("تم تحديث المعاملة بنجاح.", 'success');
            },
            'فشل في تحديث المعاملة.'
        );
    };
    
    const deleteTransaction = async (id: string) => {
        const transactionToDelete = transactions.find(t => t.id === id);
        if (!transactionToDelete) return;

        const optimisticState = transactions.filter(t => t.id !== id);
        await handleOptimisticUpdate(
            transactions,
            setTransactions,
            optimisticState,
            () => api.deleteTransaction(id),
            () => {
                if (transactionToDelete.type === TransactionType.REVENUE) {
                    const cycle = cropCycles.find(c => c.id === transactionToDelete.cropCycleId);
                    if(cycle) {
                        const newStartDate = calculateProductionStartDate(cycle.id, optimisticState);
                        if (cycle.productionStartDate !== newStartDate) {
                            updateCropCycle({ ...cycle, productionStartDate: newStartDate });
                        }
                    }
                }
                addToast("تم حذف المعاملة بنجاح.", 'success');
            },
            'فشل في حذف المعاملة.'
        );
    };
    
    // Simplified async functions for others
    const simpleAsyncUpdate = async <T extends {id: string}>(
        item: T,
        stateSetter: React.Dispatch<React.SetStateAction<T[]>>,
        apiCall: (item: T) => Promise<T>,
        successMsg: string,
        errorMsg: string
    ) => {
        const originalStateRef: { current: T[] | null } = { current: null };
        
        stateSetter(prev => {
            originalStateRef.current = prev;
            return prev.map((i: T) => i.id === item.id ? item : i);
        });
    
        try {
            await apiCall(item);
            addToast(successMsg, 'success');
        } catch (error: any) {
            addToast(error.message || errorMsg, 'error');
            if (originalStateRef.current) {
                stateSetter(originalStateRef.current);
            }
            throw error;
        }
    };

    const simpleAsyncAdd = async <T extends {id: string}, U>(
        item: U,
        stateSetter: React.Dispatch<React.SetStateAction<T[]>>,
        apiCall: (item: U) => Promise<T>,
        successMsg: string,
        errorMsg: string,
        sortFn?: (a: T, b: T) => number
    ) => {
        const tempId = `temp-${Date.now()}`;
        const optimisticItem = { ...item, id: tempId } as unknown as T;
        const originalStateRef: { current: T[] | null } = { current: null };
    
        stateSetter(prev => {
            originalStateRef.current = prev;
            const optimisticState = [...prev, optimisticItem];
            if (sortFn) {
                optimisticState.sort(sortFn);
            }
            return optimisticState;
        });
    
        try {
            const confirmedItem = await apiCall(item);
            stateSetter(prev => {
                let newState = prev.map(i => (i.id === tempId ? confirmedItem : i));
                if (sortFn) {
                    newState.sort(sortFn);
                }
                return newState;
            });
            addToast(successMsg, 'success');
        } catch (error: any) {
            addToast(error.message || errorMsg, 'error');
            if (originalStateRef.current) {
                stateSetter(originalStateRef.current);
            }
            throw error;
        }
    };

    const simpleAsyncDelete = async <T extends {id: string}>(
        id: string,
        state: T[],
        stateSetter: React.Dispatch<React.SetStateAction<T[]>>,
        apiCall: (id: string) => Promise<{id: string}>,
        successMsg: string,
        errorMsg: string
    ) => {
        const originalState = state;
        const optimisticState = originalState.filter(i => i.id !== id);
        stateSetter(optimisticState);
        try {
            await apiCall(id);
            addToast(successMsg, 'success');
        } catch (error: any) {
            addToast(error.message || errorMsg, 'error');
            stateSetter(originalState);
            throw error;
        }
    };
    
    // --- Implementations using simple helpers ---
    const addGreenhouse = (g: Omit<Greenhouse, 'id'>) => simpleAsyncAdd(g, setGreenhouses, api.addGreenhouse, "تمت إضافة الصوبة.", "فشل إضافة الصوبة.");
    const updateGreenhouse = (g: Greenhouse) => simpleAsyncUpdate(g, setGreenhouses, api.updateGreenhouse, "تم تحديث الصوبة.", "فشل تحديث الصوبة.");
    const deleteGreenhouse = (id: string) => {
        if (cropCycles.some(c => c.greenhouseId === id)) {
            addToast('لا يمكن حذف صوبة مرتبطة بعروات.', 'error');
            return Promise.reject();
        }
        return simpleAsyncDelete(id, greenhouses, setGreenhouses, api.deleteGreenhouse, "تم حذف الصوبة.", "فشل حذف الصوبة.");
    }

    const updateSettings = async (newSettings: Partial<AppSettings>) => {
        const originalSettings = settings;
        const optimisticSettings = { ...settings, ...newSettings };
        setSettings(optimisticSettings);
        localStorage.setItem('settings', JSON.stringify(optimisticSettings));
        try {
            await api.updateSettings(optimisticSettings);
        } catch (error: any) {
            addToast(error.message || "فشل حفظ الإعدادات.", 'error');
            setSettings(originalSettings);
            localStorage.setItem('settings', JSON.stringify(originalSettings));
            throw error;
        }
    };

    const addFarmer = (f: Omit<Farmer, 'id'>) => simpleAsyncAdd(f, setFarmers, api.addFarmer, "تمت إضافة المزارع.", "فشل إضافة المزارع.");
    const updateFarmer = (f: Farmer) => simpleAsyncUpdate(f, setFarmers, api.updateFarmer, "تم تحديث المزارع.", "فشل تحديث المزارع.");
    const deleteFarmer = async (id: string) => {
        const hasFinancials = cropCycles.some(c => c.farmerId === id) || farmerWithdrawals.some(w => cropCycles.find(c => c.id === w.cropCycleId)?.farmerId === id);
        if(hasFinancials) {
             addToast('لا يمكن حذف مزارع مرتبط بمعاملات.', 'error');
             return Promise.reject();
        }
        await simpleAsyncDelete(id, farmers, setFarmers, api.deleteFarmer, "تم حذف المزارع.", "فشل حذف المزارع.");
    };

    const withdrawalSort = (a: FarmerWithdrawal, b: FarmerWithdrawal) => new Date(b.date).getTime() - new Date(a.date).getTime();
    const addFarmerWithdrawal = (w: Omit<FarmerWithdrawal, 'id'>) => simpleAsyncAdd(w, setFarmerWithdrawals, api.addFarmerWithdrawal, "تمت إضافة السحب.", "فشل إضافة السحب.", withdrawalSort);
    const updateFarmerWithdrawal = (w: FarmerWithdrawal) => simpleAsyncUpdate(w, setFarmerWithdrawals, api.updateFarmerWithdrawal, "تم تحديث السحب.", "فشل تحديث السحب.");
    const deleteFarmerWithdrawal = (id: string) => simpleAsyncDelete(id, farmerWithdrawals, setFarmerWithdrawals, api.deleteFarmerWithdrawal, "تم حذف السحب.", "فشل حذف السحب.");

    const addSupplier = (s: Omit<Supplier, 'id'>) => simpleAsyncAdd(s, setSuppliers, api.addSupplier, "تمت إضافة المورد.", "فشل إضافة المورد.");
    const updateSupplier = (s: Supplier) => simpleAsyncUpdate(s, setSuppliers, api.updateSupplier, "تم تحديث المورد.", "فشل تحديث المورد.");
    const deleteSupplier = (id: string) => {
        if (transactions.some(t => t.supplierId === id) || supplierPayments.some(p => p.supplierId === id)) {
            addToast('لا يمكن حذف مورد مرتبط بمعاملات.', 'error');
            return Promise.reject();
        }
        return simpleAsyncDelete(id, suppliers, setSuppliers, api.deleteSupplier, "تم حذف المورد.", "فشل حذف المورد.");
    };

    const paymentSort = (a: SupplierPayment, b: SupplierPayment) => new Date(b.date).getTime() - new Date(a.date).getTime();
    const addSupplierPayment = (p: Omit<SupplierPayment, 'id'>) => simpleAsyncAdd(p, setSupplierPayments, api.addSupplierPayment, "تمت إضافة الدفعة.", "فشل إضافة الدفعة.", paymentSort);
    const updateSupplierPayment = (p: SupplierPayment) => simpleAsyncUpdate(p, setSupplierPayments, api.updateSupplierPayment, "تم تحديث الدفعة.", "فشل تحديث الدفعة.");
    const deleteSupplierPayment = (id: string) => simpleAsyncDelete(id, supplierPayments, setSupplierPayments, api.deleteSupplierPayment, "تم حذف الدفعة.", "فشل حذف الدفعة.");
    
    const addFertilizationProgram = (p: Omit<FertilizationProgram, 'id'>) => simpleAsyncAdd(p, setFertilizationPrograms, api.addFertilizationProgram, "تمت إضافة البرنامج.", "فشل إضافة البرنامج.");
    const updateFertilizationProgram = (p: FertilizationProgram) => simpleAsyncUpdate(p, setFertilizationPrograms, api.updateFertilizationProgram, "تم تحديث البرنامج.", "فشل تحديث البرنامج.");
    const deleteFertilizationProgram = (id: string) => {
        if (transactions.some(t => t.fertilizationProgramId === id)) {
            addToast('لا يمكن حذف برنامج مرتبط بمصروفات.', 'error');
            return Promise.reject();
        }
        return simpleAsyncDelete(id, fertilizationPrograms, setFertilizationPrograms, api.deleteFertilizationProgram, "تم حذف البرنامج.", "فشل حذف البرنامج.");
    };

    const advanceSort = (a: Advance, b: Advance) => new Date(b.date).getTime() - new Date(a.date).getTime();
    const addAdvance = (a: Omit<Advance, 'id'>) => simpleAsyncAdd(a, setAdvances, api.addAdvance, "تمت إضافة السلفة.", "فشل إضافة السلفة.", advanceSort);
    const updateAdvance = (a: Advance) => simpleAsyncUpdate(a, setAdvances, api.updateAdvance, "تم تحديث السلفة.", "فشل تحديث السلفة.");
    const deleteAdvance = (id: string) => simpleAsyncDelete(id, advances, setAdvances, api.deleteAdvance, "تم حذف السلفة.", "فشل حذف السلفة.");

    const addExpenseCategory = async (category: Omit<ExpenseCategorySetting, 'id'>) => {
        const newCategory = { ...category, id: Date.now().toString() };
        await updateSettings({ expenseCategories: [...(settings.expenseCategories || []), newCategory] });
        addToast("تمت إضافة الفئة.", 'success');
    };
    const updateExpenseCategory = async (updatedCategory: ExpenseCategorySetting) => {
        const oldName = (settings.expenseCategories || []).find(c => c.id === updatedCategory.id)?.name;
        await updateSettings({ expenseCategories: (settings.expenseCategories || []).map(cat => cat.id === updatedCategory.id ? updatedCategory : cat) });
        const newName = updatedCategory.name;
        if (oldName && newName && oldName !== newName) {
            // This is a side-effect, ideally handled by a backend transaction
            setTransactions(prev => prev.map(t => t.category === oldName ? { ...t, category: newName } : t));
            addToast("تم تحديث الفئة والمصروفات المرتبطة.", 'success');
        } else {
            addToast("تم تحديث الفئة.", 'success');
        }
    };
    const deleteExpenseCategory = async (id: string) => {
        const categoryToDelete = settings.expenseCategories.find(c => c.id === id);
        if (!categoryToDelete) return;
        if (transactions.some(t => t.category === categoryToDelete.name)) {
            addToast("لا يمكن حذف فئة مستخدمة في مصروفات.", 'error');
            return;
        }
        await updateSettings({ expenseCategories: (settings.expenseCategories || []).filter(cat => cat.id !== id) });
        addToast("تم حذف الفئة.", 'success');
    };
    
    const loadBackupData = async (data: BackupData) => {
        const originalState = { greenhouses, cropCycles, transactions, farmers, farmerWithdrawals, settings, suppliers, supplierPayments, fertilizationPrograms, advances };
        try {
          // Optimistic update
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
          localStorage.removeItem('startFresh');

          await api.loadBackupData(data); // "Save" to backend
          addToast('تم استعادة البيانات بنجاح!', 'success');
        } catch (error: any) {
          // Revert
          setGreenhouses(originalState.greenhouses);
          setCropCycles(originalState.cropCycles);
          // ... revert all state
          addToast(error.message || 'فشل استعادة البيانات.', 'error');
          throw error;
        }
    };
    
    const deleteAllData = async () => {
        setIsDeletingData(true);
        try {
            await api.deleteAllData();
            localStorage.removeItem('appInitialized');
            localStorage.setItem('startFresh', 'true');
            localStorage.removeItem('settings');

            const freshData = await api.startFresh();

            setCropCycles(freshData.cropCycles);
            setTransactions(freshData.transactions);
            setGreenhouses(freshData.greenhouses);
            setSettings(freshData.settings);
            setFarmers(freshData.farmers);
            setFarmerWithdrawals(freshData.farmerWithdrawals);
            setSuppliers(freshData.suppliers);
            setSupplierPayments(freshData.supplierPayments);
            setFertilizationPrograms(freshData.fertilizationPrograms);
            setAdvances(freshData.advances || []);
            
            addToast("تم حذف جميع البيانات بنجاح.", "success");
        } catch (error: any) {
            addToast("فشل حذف البيانات.", "error");
        } finally {
            setIsDeletingData(false);
        }
    };
    
    const startFresh = async () => {
        setLoading(true);
        try {
            const data = await api.startFresh();
            setGreenhouses(data.greenhouses);
            setCropCycles(data.cropCycles);
            setTransactions(data.transactions);
            setFarmers(data.farmers);
            setFarmerWithdrawals(data.farmerWithdrawals);
            setSuppliers(data.suppliers);
            setSupplierPayments(data.supplierPayments);
            setFertilizationPrograms(data.fertilizationPrograms);
            setAdvances(data.advances || []);
            setSettings(data.settings);
            addToast("تم البدء من جديد بنجاح.", "success");
        } catch (error) {
            addToast("حدث خطأ أثناء البدء من جديد.", "error");
        } finally {
            setLoading(false);
        }
    };

    const loadDemoData = async () => {
        setLoading(true);
        try {
            const data = await api.getDemoData();
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
            localStorage.removeItem('startFresh');
            addToast('تم تحميل البيانات التجريبية بنجاح.', 'success');
        } catch (error: any) {
            addToast(error.message || 'فشل تحميل البيانات التجريبية.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return {
        loading, isDeletingData, cropCycles, transactions, greenhouses, settings, farmers, farmerWithdrawals, alerts, suppliers, supplierPayments, fertilizationPrograms, advances, addCropCycle, updateCropCycle, deleteCropCycle, addTransaction, updateTransaction, deleteTransaction, addGreenhouse, updateGreenhouse, deleteGreenhouse, updateSettings, addFarmer, updateFarmer, deleteFarmer, addFarmerWithdrawal, updateFarmerWithdrawal, deleteFarmerWithdrawal, addSupplier, updateSupplier, deleteSupplier, addSupplierPayment, updateSupplierPayment, deleteSupplierPayment, addFertilizationProgram, updateFertilizationProgram, deleteFertilizationProgram, addAdvance, updateAdvance, deleteAdvance, addExpenseCategory, updateExpenseCategory, deleteExpenseCategory, loadBackupData, loadDemoData, deleteAllData, startFresh,
    };
};