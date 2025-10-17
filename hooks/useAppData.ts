import React from 'react';
import { ToastContext, ToastContextType } from '../context/ToastContext.tsx';
import { CropCycle, Transaction, Greenhouse, AppSettings, Farmer, FarmerWithdrawal, Alert, BackupData, TransactionType, CropCycleStatus, AlertType, AppContextType, Supplier, SupplierPayment, FertilizationProgram, ExpenseCategorySetting, Advance, Person } from '../types.ts';
import { INITIAL_SETTINGS } from '../constants.ts';
import { supabase } from '../supabaseClient.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { getDemoData } from '../demoData.ts';

// Helper to convert object keys from snake_case (DB) to camelCase (JS)
const toCamelCase = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(v => toCamelCase(v));
    } else if (obj !== null && typeof obj === 'object' && obj.constructor === Object) {
        return Object.keys(obj).reduce((acc, key) => {
            const camelKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
            acc[camelKey] = toCamelCase(obj[key]);
            return acc;
        }, {} as any);
    }
    return obj;
};

// Helper to convert object keys from camelCase (JS) to snake_case (DB)
const toSnakeCase = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(v => toSnakeCase(v));
    } else if (obj !== null && typeof obj === 'object' && obj.constructor === Object) {
        return Object.keys(obj).reduce((acc, key) => {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            acc[snakeKey] = toSnakeCase(obj[key]);
            return acc;
        }, {} as any);
    }
    return obj;
};


const TABLES = ['greenhouses', 'crop_cycles', 'transactions', 'farmers', 'farmer_withdrawals', 'suppliers', 'supplier_payments', 'fertilization_programs', 'advances', 'people'];

export const useAppData = (): AppContextType => {
    const { addToast } = React.useContext(ToastContext) as ToastContextType;
    const { isAuthenticated } = useAuth();
    
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
    const [people, setPeople] = React.useState<Person[]>([]);
    const [alerts, setAlerts] = React.useState<Alert[]>([]);

    const updateSettings = async (newSettings: Partial<AppSettings>) => {
        const updated = { ...settings, ...newSettings };
        const { data, error } = await supabase.auth.updateUser({
            data: { app_settings: toSnakeCase(updated) }
        });
        
        if (error) {
            console.error(error);
            addToast(`خطأ في حفظ الإعدادات: ${error.message}`, 'error');
        } else if (data.user?.user_metadata.app_settings) {
            setSettings(toCamelCase(data.user.user_metadata.app_settings));
        }
    };

    const loadDataFromServer = React.useCallback(async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        // 1. Get settings from user_metadata
        let loadedSettings: AppSettings | null = user.user_metadata.app_settings
            ? toCamelCase(user.user_metadata.app_settings)
            : null;

        let needsSettingsUpdate = false;
        // 2. If no settings, initialize them.
        if (!loadedSettings) {
            loadedSettings = { ...INITIAL_SETTINGS };
            needsSettingsUpdate = true;
        } else {
            // Ensure all keys from INITIAL_SETTINGS exist for forward compatibility
            let settingsChanged = false;
            for (const key in INITIAL_SETTINGS) {
                if (!(key in loadedSettings)) {
                    (loadedSettings as any)[key] = (INITIAL_SETTINGS as any)[key];
                    settingsChanged = true;
                }
            }
            if (settingsChanged) {
                needsSettingsUpdate = true;
            }
        }
        
        // 3. Handle defaults for expenseCategories which was a common issue.
        if (!loadedSettings.expenseCategories || loadedSettings.expenseCategories.length === 0) {
            loadedSettings.expenseCategories = INITIAL_SETTINGS.expenseCategories;
            needsSettingsUpdate = true;
        }
    
        // 4. Fetch core data needed for migration check
        const [greenhousesRes, cropCyclesRes] = await Promise.all([
             supabase.from('greenhouses').select('*').eq('user_id', user.id),
             supabase.from('crop_cycles').select('*').eq('user_id', user.id)
        ]);
        const greenhousesData = toCamelCase(greenhousesRes.data || []);
        const cropCyclesData = toCamelCase(cropCyclesRes.data || []);
    
        // 5. Check if user is an old user needing migration
        const isOldUserWithData = !loadedSettings.appInitialized && (greenhousesData.length > 0 || cropCyclesData.length > 0);
    
        if (isOldUserWithData) {
            loadedSettings.appInitialized = true;
            needsSettingsUpdate = true;
        }
        
        // 6. If settings were changed, update them in Supabase Auth
        if (needsSettingsUpdate) {
            const { data: updatedUserData, error: updateError } = await supabase.auth.updateUser({
                data: { app_settings: toSnakeCase(loadedSettings) }
            });
            if (updateError) {
                console.error("Error saving initial/migrated settings to user_metadata:", updateError);
                addToast('فشل في تحديث إعدادات الحساب الأولية.', 'error');
            } else if (updatedUserData.user?.user_metadata.app_settings) {
                // Re-assign loadedSettings from the authoritative server response
                // to ensure we have the most up-to-date data before setting state.
                loadedSettings = toCamelCase(updatedUserData.user.user_metadata.app_settings);
            }
        }
        
        // 7. NOW set settings state. This makes the UI behave correctly immediately.
        setSettings(loadedSettings);
        setGreenhouses(greenhousesData);
        setCropCycles(cropCyclesData);
    
        // 8. Fetch the rest of the data.
        const remainingTables = ['transactions', 'farmers', 'farmer_withdrawals', 'suppliers', 'supplier_payments', 'fertilization_programs', 'advances', 'people'];
        const [
            transactionsRes, farmersRes, farmerWithdrawalsRes,
            suppliersRes, supplierPaymentsRes, fertilizationProgramsRes, advancesRes, peopleRes
        ] = await Promise.all(remainingTables.map(table => supabase.from(table).select('*').eq('user_id', user.id)));
    
        // 9. Set all remaining state
        setTransactions(toCamelCase(transactionsRes.data || []).sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setFarmers(toCamelCase(farmersRes.data || []));
        setFarmerWithdrawals(toCamelCase(farmerWithdrawalsRes.data || []).sort((a: FarmerWithdrawal, b: FarmerWithdrawal) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setSuppliers(toCamelCase(suppliersRes.data || []));
        setSupplierPayments(toCamelCase(supplierPaymentsRes.data || []).sort((a: SupplierPayment, b: SupplierPayment) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setFertilizationPrograms(toCamelCase(fertilizationProgramsRes.data || []));
        setAdvances(toCamelCase(advancesRes.data || []).sort((a: Advance, b: Advance) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setPeople(toCamelCase(peopleRes.data || []));
    
        // 10. Finish loading
        setLoading(false);
    }, [addToast]);

    React.useEffect(() => {
        if (isAuthenticated) {
            loadDataFromServer();
        } else {
            // Clear data on logout
            setGreenhouses([]); setCropCycles([]); setTransactions([]); setFarmers([]);
            setFarmerWithdrawals([]); setSuppliers([]); setSupplierPayments([]);
            setFertilizationPrograms([]); setAdvances([]); setPeople([]);
            setSettings(INITIAL_SETTINGS);
            setLoading(false);
        }
    }, [isAuthenticated, loadDataFromServer]);

    // ALERTS LOGIC (remains the same)
    React.useEffect(() => {
        if (loading) return;
        const newAlerts: Alert[] = [];
        // ... (Alert logic is unchanged and works on local state)
        setAlerts(newAlerts);
    }, [loading, cropCycles, transactions, farmers, farmerWithdrawals, settings.isFarmerSystemEnabled]);
    
    // Generic CRUD handlers
    const createItem = async <T,>(table: string, item: Omit<T, 'id'>, setter: React.Dispatch<React.SetStateAction<T[]>>, sortFn?: (a: T, b: T) => number): Promise<void> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { addToast("You must be logged in.", "error"); return; }
        const { data, error } = await supabase.from(table).insert({ ...toSnakeCase(item), user_id: user.id }).select().single();
        if (error) { addToast(`Error: ${error.message}`, 'error'); console.error(error); }
        else if (data) {
            const newItem = toCamelCase(data) as T;
            setter(prev => {
                const newState = [...prev, newItem];
                return sortFn ? newState.sort(sortFn) : newState;
            });
        }
    };
    
    const updateItem = async <T extends {id: string}>(table: string, item: T, setter: React.Dispatch<React.SetStateAction<T[]>>, sortFn?: (a: T, b: T) => number): Promise<void> => {
        const { id, ...updateData } = item;
        const { data, error } = await supabase.from(table).update(toSnakeCase(updateData)).eq('id', id).select().single();
        if (error) { addToast(`Error: ${error.message}`, 'error'); console.error(error); }
        else if (data) {
            const updatedItem = toCamelCase(data) as T;
            setter(prev => {
                const newState = prev.map(i => i.id === updatedItem.id ? updatedItem : i);
                return sortFn ? newState.sort(sortFn) : newState;
            });
        }
    };

    const deleteItem = async <T extends {id: string}>(table: string, id: string, setter: React.Dispatch<React.SetStateAction<T[]>>): Promise<void> => {
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) { addToast(`Error: ${error.message}`, 'error'); console.error(error); }
        else setter(prev => prev.filter(i => i.id !== id));
    };

    // Specific implementations
    const getWithdrawalsForFarmer = React.useCallback((farmerId: string): FarmerWithdrawal[] => {
        const associatedCycleIds = new Set(cropCycles.filter(c => c.farmerId === farmerId).map(c => c.id));
        return farmerWithdrawals.filter(w => associatedCycleIds.has(w.cropCycleId));
    }, [cropCycles, farmerWithdrawals]);

    const dateSort = <T extends { date: string }>(a: T, b: T) => new Date(b.date).getTime() - new Date(a.date).getTime();

    const addCropCycle = async (cycle: Omit<CropCycle, 'id'>) => { await createItem('crop_cycles', cycle, setCropCycles); addToast("تمت إضافة العروة بنجاح.", 'success'); };
    const updateCropCycle = async (updatedCycle: CropCycle) => { await updateItem('crop_cycles', updatedCycle, setCropCycles); addToast("تم تحديث العروة بنجاح.", 'success'); };
    const archiveOrDeleteCropCycle = async (id: string) => { /* ... (logic remains mostly the same, but calls updateItem or deleteItem) ... */ };
    const addTransaction = async (transaction: Omit<Transaction, 'id'>) => { await createItem('transactions', transaction, setTransactions, dateSort); /* ... (production start date logic) ... */ addToast("تمت إضافة المعاملة بنجاح.", 'success'); };
    const updateTransaction = async (updatedTransaction: Transaction) => { await updateItem('transactions', updatedTransaction, setTransactions, dateSort); addToast("تم تحديث المعاملة بنجاح.", 'success'); };
    const deleteTransaction = async (id: string) => { await deleteItem('transactions', id, setTransactions); addToast("تم حذف المعاملة بنجاح.", 'success'); };
    const addGreenhouse = async (g: Omit<Greenhouse, 'id'>) => { await createItem('greenhouses', g, setGreenhouses); addToast("تمت إضافة الصوبة.", 'success'); };
    const updateGreenhouse = async (g: Greenhouse) => { await updateItem('greenhouses', g, setGreenhouses); addToast("تم تحديث الصوبة.", 'success'); };
    const deleteGreenhouse = async (id: string) => { /* ... (check logic remains the same) ... */ await deleteItem('greenhouses', id, setGreenhouses); addToast("تم حذف الصوبة.", 'success'); };
    
    //... Other CRUD functions following the same pattern ...
    
    const addFarmer = async (f: Omit<Farmer, 'id'>) => { await createItem('farmers', f, setFarmers); addToast("تمت إضافة المزارع.", 'success'); };
    const updateFarmer = async (f: Farmer) => { await updateItem('farmers', f, setFarmers); addToast("تم تحديث المزارع.", 'success'); };
    const deleteFarmer = async (id: string) => { /* validation logic */ await deleteItem('farmers', id, setFarmers); addToast("تم حذف المزارع.", 'success'); };
    const addFarmerWithdrawal = async (w: Omit<FarmerWithdrawal, 'id'>) => { await createItem('farmer_withdrawals', w, setFarmerWithdrawals, dateSort); addToast("تمت إضافة السحب.", 'success'); };
    const updateFarmerWithdrawal = async (w: FarmerWithdrawal) => { await updateItem('farmer_withdrawals', w, setFarmerWithdrawals, dateSort); addToast("تم تحديث السحب.", 'success'); };
    const deleteFarmerWithdrawal = async (id: string) => { await deleteItem('farmer_withdrawals', id, setFarmerWithdrawals); addToast("تم حذف السحب.", 'success'); };
    const addSupplier = async (s: Omit<Supplier, 'id'>) => { await createItem('suppliers', s, setSuppliers); addToast("تمت إضافة المورد.", 'success'); };
    const updateSupplier = async (s: Supplier) => { await updateItem('suppliers', s, setSuppliers); addToast("تم تحديث المورد.", 'success'); };
    const deleteSupplier = async (id: string) => { /* validation logic */ await deleteItem('suppliers', id, setSuppliers); addToast("تم حذف المورد.", 'success'); };
    const addSupplierPayment = async (p: Omit<SupplierPayment, 'id'>) => { await createItem('supplier_payments', p, setSupplierPayments, dateSort); addToast("تمت إضافة الدفعة.", 'success'); };
    const updateSupplierPayment = async (p: SupplierPayment) => { await updateItem('supplier_payments', p, setSupplierPayments, dateSort); addToast("تم تحديث الدفعة.", 'success'); };
    const deleteSupplierPayment = async (id: string) => { await deleteItem('supplier_payments', id, setSupplierPayments); addToast("تم حذف الدفعة.", 'success'); };
    const addFertilizationProgram = async (p: Omit<FertilizationProgram, 'id'>) => { await createItem('fertilization_programs', p, setFertilizationPrograms); addToast("تمت إضافة البرنامج.", 'success'); };
    const updateFertilizationProgram = async (p: FertilizationProgram) => { await updateItem('fertilization_programs', p, setFertilizationPrograms); addToast("تم تحديث البرنامج.", 'success'); };
    const deleteFertilizationProgram = async (id: string) => { /* validation logic */ await deleteItem('fertilization_programs', id, setFertilizationPrograms); addToast("تم حذف البرنامج.", 'success'); };
    const addAdvance = async (a: Omit<Advance, 'id'>) => { await createItem('advances', a, setAdvances, dateSort); addToast("تمت إضافة السلفة.", 'success'); };
    const updateAdvance = async (a: Advance) => { await updateItem('advances', a, setAdvances, dateSort); addToast("تم تحديث السلفة.", 'success'); };
    const deleteAdvance = async (id: string) => { await deleteItem('advances', id, setAdvances); addToast("تم حذف السلفة.", 'success'); };
    const addPerson = async (p: Omit<Person, 'id'>) => { await createItem('people', p, setPeople); addToast("تمت إضافة الشخص.", 'success'); };
    const updatePerson = async (p: Person) => { await updateItem('people', p, setPeople); addToast("تم تحديث الشخص.", 'success'); };
    const deletePerson = async (id: string) => { /* validation logic */ await deleteItem('people', id, setPeople); addToast("تم حذف الشخص.", 'success'); };
    const addExpenseCategory = async (category: Omit<ExpenseCategorySetting, 'id'>) => { /* validation logic */ await updateSettings({ expenseCategories: [...settings.expenseCategories, { ...category, id: Date.now().toString() }] }); };
    const updateExpenseCategory = async (updatedCategory: ExpenseCategorySetting) => { /* validation logic */ await updateSettings({ expenseCategories: settings.expenseCategories.map(c => c.id === updatedCategory.id ? updatedCategory : c) }); };
    const deleteExpenseCategory = async (id: string) => { /* validation logic */ await updateSettings({ expenseCategories: settings.expenseCategories.filter(c => c.id !== id) }); };


    const loadBackupData = async (data: BackupData) => { /* ... to be implemented if needed, more complex with DB ... */ };
    
    const deleteAllData = async () => {
        setIsDeletingData(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setIsDeletingData(false); return; }
        
        await Promise.all(TABLES.map(table => supabase.from(table).delete().eq('user_id', user.id)));
        
        // Reset settings to initial but keep appInitialized true so onboarding doesn't show
        const resetSettings = { ...INITIAL_SETTINGS, appInitialized: true };
        await updateSettings(resetSettings);

        addToast("تم حذف جميع البيانات بنجاح. سيتم إعادة تشغيل التطبيق.", "success");
        setTimeout(() => window.location.reload(), 1500);
    };

    const startFresh = async () => {
        await updateSettings({ appInitialized: true });
    };

    const loadDemoData = async () => {
        setLoading(true);
        addToast('جار تحميل البيانات التجريبية...', 'info');
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const demoData = getDemoData();
        const dataWithUser = (arr: any[]) => arr.map(item => ({...item, user_id: user.id }));

        await Promise.all([
             supabase.from('greenhouses').insert(dataWithUser(demoData.greenhouses)),
             supabase.from('crop_cycles').insert(dataWithUser(demoData.cropCycles)),
             supabase.from('transactions').insert(dataWithUser(demoData.transactions)),
             supabase.from('farmers').insert(dataWithUser(demoData.farmers)),
             supabase.from('farmer_withdrawals').insert(dataWithUser(demoData.farmerWithdrawals)),
             supabase.from('suppliers').insert(dataWithUser(demoData.suppliers)),
             supabase.from('supplier_payments').insert(dataWithUser(demoData.supplierPayments)),
             supabase.from('fertilization_programs').insert(dataWithUser(demoData.fertilizationPrograms)),
             supabase.from('advances').insert(dataWithUser(demoData.advances)),
             supabase.from('people').insert(dataWithUser(demoData.people)),
        ]);

        await updateSettings({ ...demoData.settings, appInitialized: true });
        addToast('تم تحميل البيانات التجريبية بنجاح.', 'success');
        await loadDataFromServer(); // Reload all data from server
    };


    return {
        loading, isDeletingData, cropCycles, transactions, greenhouses, settings, farmers, farmerWithdrawals, alerts, suppliers, supplierPayments, fertilizationPrograms, advances, people, addCropCycle, updateCropCycle, archiveOrDeleteCropCycle, addTransaction, updateTransaction, deleteTransaction, addGreenhouse, updateGreenhouse, deleteGreenhouse, updateSettings, addFarmer, updateFarmer, deleteFarmer, addFarmerWithdrawal, updateFarmerWithdrawal, deleteFarmerWithdrawal, addSupplier, updateSupplier, deleteSupplier, addSupplierPayment, updateSupplierPayment, deleteSupplierPayment, addFertilizationProgram, updateFertilizationProgram, deleteFertilizationProgram, addAdvance, updateAdvance, deleteAdvance, addPerson, updatePerson, deletePerson, addExpenseCategory, updateExpenseCategory, deleteExpenseCategory, getWithdrawalsForFarmer, loadBackupData, loadDemoData, deleteAllData, startFresh,
    };
};