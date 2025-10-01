import { useState, useEffect, useContext } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { ToastContext, ToastContextType } from '../context/ToastContext';
import { CropCycle, Transaction, Greenhouse, AppSettings, Farmer, FarmerWithdrawal, Alert, BackupData, TransactionType, CropCycleStatus, AlertType, AppContextType } from '../types';
import { INITIAL_CYCLES, INITIAL_TRANSACTIONS, INITIAL_GREENHOUSES, INITIAL_SETTINGS, INITIAL_FARMERS, INITIAL_FARMER_WITHDRAWALS } from '../constants';

export const useAppData = (): AppContextType => {
    const [loading, setLoading] = useState(true);
    const [cropCycles, setCropCycles] = useLocalStorage<CropCycle[]>('cropCycles', INITIAL_CYCLES);
    const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
    const [greenhouses, setGreenhouses] = useLocalStorage<Greenhouse[]>('greenhouses', INITIAL_GREENHOUSES);
    const [settings, setSettings] = useLocalStorage<AppSettings>('settings', INITIAL_SETTINGS);
    const [farmers, setFarmers] = useLocalStorage<Farmer[]>('farmers', INITIAL_FARMERS);
    const [farmerWithdrawals, setFarmerWithdrawals] = useLocalStorage<FarmerWithdrawal[]>('farmerWithdrawals', INITIAL_FARMER_WITHDRAWALS);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    
    const { addToast } = useContext(ToastContext) as ToastContextType;

    useEffect(() => {
        // Simulate network latency for loading data from a backend
        const timer = setTimeout(() => {
            setLoading(false);
        }, 750); // 750ms delay

        return () => clearTimeout(timer);
    }, []); // Run only once on mount


    // ALERTS LOGIC
    useEffect(() => {
        if (loading) return; // Don't run alerts logic while initial data is loading
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


    // CROP CYCLE LOGIC
    const addCropCycle = (cycle: Omit<CropCycle, 'id' | 'productionStartDate'>) => {
        const newCycle = { ...cycle, id: Date.now().toString(), productionStartDate: null };
        setCropCycles(prev => [...prev, newCycle]);
    };

    const updateCropCycle = (updatedCycle: CropCycle) => {
        setCropCycles(prev => prev.map(c => c.id === updatedCycle.id ? updatedCycle : c));
    };
    
    const calculateProductionStartDate = (cycleId: string, currentTransactions: Transaction[]): (string | null) => {
        const cycleRevenues = currentTransactions
            .filter(t => t.cropCycleId === cycleId && t.type === TransactionType.REVENUE)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return cycleRevenues.length > 0 ? cycleRevenues[0].date : null;
    };

    // TRANSACTION LOGIC
    const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
        const newTransaction = { ...transaction, id: Date.now().toString() };
        
        if (newTransaction.type === TransactionType.REVENUE) {
            setCropCycles(prevCycles => {
                const cycleIndex = prevCycles.findIndex(c => c.id === newTransaction.cropCycleId);
                if (cycleIndex === -1) return prevCycles;

                const targetCycle = prevCycles[cycleIndex];
                const newEarliestDate = calculateProductionStartDate(targetCycle.id, [...transactions, newTransaction]);

                if (targetCycle.productionStartDate !== newEarliestDate) {
                    const updatedCycles = [...prevCycles];
                    updatedCycles[cycleIndex] = { ...targetCycle, productionStartDate: newEarliestDate };
                    return updatedCycles;
                }
                return prevCycles;
            });
        }
        
        setTransactions(prev => [...prev, newTransaction].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    };

    const updateTransaction = (updatedTransaction: Transaction) => {
        const originalTransaction = transactions.find(t => t.id === updatedTransaction.id);
        const updatedTransactions = transactions.map(t => t.id === updatedTransaction.id ? updatedTransaction : t);

        if (originalTransaction) {
            const affectedCycleIds = new Set([originalTransaction.cropCycleId, updatedTransaction.cropCycleId]);
            
            setCropCycles(prevCycles => {
                let cyclesChanged = false;
                const newCycles = [...prevCycles];
                
                affectedCycleIds.forEach(cycleId => {
                    const cycleIndex = newCycles.findIndex(c => c.id === cycleId);
                    if (cycleIndex !== -1) {
                        const targetCycle = newCycles[cycleIndex];
                        const newEarliestDate = calculateProductionStartDate(cycleId, updatedTransactions);
                        if (targetCycle.productionStartDate !== newEarliestDate) {
                            newCycles[cycleIndex] = { ...targetCycle, productionStartDate: newEarliestDate };
                            cyclesChanged = true;
                        }
                    }
                });

                return cyclesChanged ? newCycles : prevCycles;
            });
        }
        setTransactions(updatedTransactions);
    };
    
    const deleteTransaction = (id: string) => {
        const transactionToDelete = transactions.find(t => t.id === id);
        if (!transactionToDelete) return;

        if (transactionToDelete.type === TransactionType.REVENUE) {
            setCropCycles(prevCycles => {
                const cycleIndex = prevCycles.findIndex(c => c.id === transactionToDelete.cropCycleId);
                if (cycleIndex === -1) return prevCycles;

                const targetCycle = prevCycles[cycleIndex];
                const remainingTransactions = transactions.filter(t => t.id !== id);
                const newEarliestDate = calculateProductionStartDate(targetCycle.id, remainingTransactions);
                
                if(targetCycle.productionStartDate !== newEarliestDate) {
                    const updatedCycles = [...prevCycles];
                    updatedCycles[cycleIndex] = { ...targetCycle, productionStartDate: newEarliestDate };
                    return updatedCycles;
                }
                return prevCycles;
            });
        }
        setTransactions(prev => prev.filter(t => t.id !== id));
    };
    
    // GREENHOUSE LOGIC
    const addGreenhouse = (greenhouse: Omit<Greenhouse, 'id'>) => {
        const newGreenhouse = { ...greenhouse, id: Date.now().toString() };
        setGreenhouses(prev => [...prev, newGreenhouse]);
    };

    const updateGreenhouse = (updatedGreenhouse: Greenhouse) => {
        setGreenhouses(prev => prev.map(g => g.id === updatedGreenhouse.id ? updatedGreenhouse : g));
    };
      
    const deleteGreenhouse = (id: string) => {
        const cyclesInGreenhouse = cropCycles.filter(c => c.greenhouseId === id);
        const cycleIdsToDelete = new Set(cyclesInGreenhouse.map(c => c.id));
        
        setTransactions(prev => prev.filter(t => !cycleIdsToDelete.has(t.cropCycleId)));
        setFarmerWithdrawals(prev => prev.filter(w => !cycleIdsToDelete.has(w.cropCycleId)));
        setCropCycles(prev => prev.filter(c => c.greenhouseId !== id));
        setGreenhouses(prev => prev.filter(g => g.id !== id));
    };

    // SETTINGS, FARMERS, AND WITHDRAWALS LOGIC
    const updateSettings = (newSettings: Partial<AppSettings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    const addFarmer = (farmer: Omit<Farmer, 'id'>) => {
        const newFarmer = { ...farmer, id: Date.now().toString() };
        setFarmers(prev => [...prev, newFarmer]);
    };

    const updateFarmer = (updatedFarmer: Farmer) => {
        setFarmers(prev => prev.map(f => f.id === updatedFarmer.id ? updatedFarmer : f));
    };

    const deleteFarmer = (id: string) => {
        setFarmers(prev => prev.filter(f => f.id !== id));
        setCropCycles(prev => prev.map(c => c.farmerId === id ? { ...c, farmerId: null } : c));
    };

    const addFarmerWithdrawal = (withdrawal: Omit<FarmerWithdrawal, 'id'>) => {
        const newWithdrawal = { ...withdrawal, id: Date.now().toString() };
        setFarmerWithdrawals(prev => [...prev, newWithdrawal].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    };

    const updateFarmerWithdrawal = (updatedWithdrawal: FarmerWithdrawal) => {
        setFarmerWithdrawals(prev => prev.map(w => w.id === updatedWithdrawal.id ? updatedWithdrawal : w));
    };

    const deleteFarmerWithdrawal = (id: string) => {
        setFarmerWithdrawals(prev => prev.filter(w => w.id !== id));
    };

    // BACKUP/RESTORE LOGIC
    const loadBackupData = (data: BackupData) => {
        try {
          if (!data.settings || !Array.isArray(data.greenhouses) || !Array.isArray(data.cropCycles)) {
              throw new Error("ملف النسخة الاحتياطية غير صالح أو تالف.");
          }
          setGreenhouses(data.greenhouses || []);
          setCropCycles(data.cropCycles || []);
          setTransactions(data.transactions || []);
          setFarmers(data.farmers || []);
          setFarmerWithdrawals(data.farmerWithdrawals || []);
          setSettings(data.settings);
          addToast('تم استعادة البيانات بنجاح!', 'success');
        } catch (error) {
          console.error("Failed to load backup:", error);
          const message = error instanceof Error ? error.message : 'خطأ غير معروف';
          addToast(`فشل استعادة البيانات: ${message}`, 'error');
        }
    };
    
    return {
        loading,
        cropCycles,
        transactions,
        greenhouses,
        settings,
        farmers,
        farmerWithdrawals,
        alerts,
        addCropCycle,
        updateCropCycle,
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
        loadBackupData,
    };
};