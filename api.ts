import { CropCycle, Transaction, CropCycleStatus, TransactionType, Greenhouse, AppSettings, Farmer, FarmerWithdrawal, Supplier, SupplierPayment, FertilizationProgram, ExpenseCategorySetting, BackupData, Advance } from './types';

// This file simulates a backend API. In a real application, these functions would make network requests.

const MOCK_API_DELAY = 500; // ms

// FIX: Replaced mockRequest to remove simulated network errors and handle 'undefined' data correctly to prevent JSON parsing errors.
function mockRequest<T>(data: T): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        // The `deleteAllData` function passes `undefined`, which doesn't need cloning and causes JSON.parse to fail.
        if (typeof data === 'undefined') {
          resolve(data);
          return;
        }
        // Deep copy to prevent mutation issues
        resolve(JSON.parse(JSON.stringify(data)));
      } catch (error) {
        console.error("Error in mockRequest:", error);
        reject(error);
      }
    }, MOCK_API_DELAY);
  });
}


// --- Initial Data ---
const formatDate = (date: Date) => date.toISOString().split('T')[0];
const getPastDate = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return formatDate(date);
};

const INITIAL_EXPENSE_CATEGORIES: ExpenseCategorySetting[] = [
    { id: 'cat1', name: 'بذور' },
    { id: 'cat2', name: 'أسمدة ومغذيات' },
    { id: 'cat3', name: 'مبيدات' },
    { id: 'cat4', name: 'أجور عمال' },
    { id: 'cat5', name: 'صيانة' },
    { id: 'cat6', name: 'فواتير' },
    { id: 'cat7', name: 'أخرى' },
];

const INITIAL_SETTINGS: AppSettings = {
  isFarmerSystemEnabled: true,
  isSupplierSystemEnabled: true,
  isAgriculturalProgramsSystemEnabled: true,
  isTreasurySystemEnabled: true,
  isAdvancesSystemEnabled: true,
  theme: 'system',
  expenseCategories: INITIAL_EXPENSE_CATEGORIES,
};

const INITIAL_FARMERS: Farmer[] = [
    { id: 'f1', name: 'أحمد محمود' },
    { id: 'f2', name: 'علي حسن' },
];

const INITIAL_GREENHOUSES: Greenhouse[] = [
    { id: 'g1', name: 'الصوبة الشمالية', creationDate: '2023-01-15', initialCost: 150000 },
    { id: 'g2', name: 'الصوبة الجنوبية', creationDate: '2023-03-20', initialCost: 185000 },
];


const INITIAL_CYCLES: CropCycle[] = [
  { id: '1', name: 'عروة الطماطم الشتوية 2023', startDate: '2023-10-01', status: CropCycleStatus.CLOSED, greenhouseId: 'g1', seedType: 'طماطم شيري', plantCount: 600, productionStartDate: '2024-01-10', farmerId: 'f1', farmerSharePercentage: 20 },
  { id: '2', name: 'عروة الخيار الصيفية 2024', startDate: '2024-04-15', status: CropCycleStatus.ACTIVE, greenhouseId: 'g2', seedType: 'خيار بلدي', plantCount: 850, productionStartDate: getPastDate(5), farmerId: 'f2', farmerSharePercentage: 25 },
  { id: '3', name: 'عروة الفلفل الربيعية 2024', startDate: '2024-03-01', status: CropCycleStatus.ACTIVE, greenhouseId: 'g1', seedType: 'فلفل ألوان', plantCount: 700, productionStartDate: null, farmerId: null, farmerSharePercentage: null },
];

const INITIAL_FERTILIZATION_PROGRAMS: FertilizationProgram[] = [
    { id: 'fp1', name: 'برنامج الأسبوع 1 - خيار 2024', startDate: getPastDate(30), endDate: getPastDate(24), cropCycleId: '2' },
    { id: 'fp2', name: 'برنامج الأسبوع 2 - خيار 2024', startDate: getPastDate(23), endDate: getPastDate(17), cropCycleId: '2' },
];

const INITIAL_SUPPLIERS: Supplier[] = [
    { id: 's1', name: 'شركة الأسمدة الحديثة' },
    { id: 's2', name: 'مبيدات النصر' },
    { id: 's3', name: 'مؤسسة الهدى الزراعية' },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
    { id: 't1', date: '2023-10-01', description: 'شراء بذور طماطم', type: TransactionType.EXPENSE, category: 'بذور', amount: 2500, cropCycleId: '1' },
    { id: 't2', date: '2023-10-15', description: 'أسمدة ومغذيات', type: TransactionType.EXPENSE, category: 'أسمدة ومغذيات', amount: 4000, cropCycleId: '1' },
    { id: 't3', date: '2023-11-01', description: 'أجور عمال', type: TransactionType.EXPENSE, category: 'أجور عمال', amount: 7000, cropCycleId: '1' },
    { id: 't4', date: '2024-01-10', description: 'بيع أول دفعة محصول طماطم', type: TransactionType.REVENUE, category: 'أخرى', amount: 15000, cropCycleId: '1', quantity: 500, priceItems: [{ quantity: 500, price: 30 }] },
    { id: 't5', date: '2024-02-05', description: 'بيع ثاني دفعة محصول طماطم', type: TransactionType.REVENUE, category: 'أخرى', amount: 22000, cropCycleId: '1', quantity: 750, priceItems: [{ quantity: 500, price: 30 }, { quantity: 250, price: 28 }] },
    { id: 't6', date: '2024-02-20', description: 'صيانة نظام الري', type: TransactionType.EXPENSE, category: 'صيانة', amount: 1200, cropCycleId: '1' },
    { id: 't7', date: '2024-04-15', description: 'شراء بذور خيار', type: TransactionType.EXPENSE, category: 'بذور', amount: 1800, cropCycleId: '2' },
    { id: 't8', date: getPastDate(28), description: 'أسمدة نيتروجينية', type: TransactionType.EXPENSE, category: 'أسمدة ومغذيات', amount: 3200, cropCycleId: '2', fertilizationProgramId: 'fp1' },
    { id: 't9', date: '2024-05-15', description: 'أجور عمال', type: TransactionType.EXPENSE, category: 'أجور عمال', amount: 5500, cropCycleId: '2' },
    { id: 't10', date: getPastDate(5), description: 'بيع محصول خيار مبكر', type: TransactionType.REVENUE, category: 'أخرى', amount: 9500, cropCycleId: '2', quantity: 400, priceItems: [{ quantity: 400, price: 25 }], discount: 500 },
    { id: 't15', date: getPastDate(25), description: 'أسمدة بوتاسية (آجل)', type: TransactionType.EXPENSE, category: 'أسمدة ومغذيات', amount: 3500, cropCycleId: '2', supplierId: 's1', fertilizationProgramId: 'fp1' },
    { id: 't17', date: getPastDate(20), description: 'مبيدات وقائية (آجل)', type: TransactionType.EXPENSE, category: 'مبيدات', amount: 2200, cropCycleId: '2', supplierId: 's1', fertilizationProgramId: 'fp2' },
    { id: 't19', date: getPastDate(8), description: 'بذور خيار إضافية (آجل)', type: TransactionType.EXPENSE, category: 'بذور', amount: 1200, cropCycleId: '2', supplierId: 's3' },
    { id: 't11', date: '2024-03-01', description: 'شراء بذور فلفل ألوان', type: TransactionType.EXPENSE, category: 'بذور', amount: 3100, cropCycleId: '3' },
    { id: 't12', date: '2024-03-20', description: 'مبيدات حشرية وقائية', type: TransactionType.EXPENSE, category: 'مبيدات', amount: 2200, cropCycleId: '3' },
    { id: 't13', date: '2024-04-10', description: 'فواتير كهرباء ومياه', type: TransactionType.EXPENSE, category: 'فواتير', amount: 1500, cropCycleId: '3' },
    { id: 't14', date: getPastDate(10), description: 'أجور عمال', type: TransactionType.EXPENSE, category: 'أجور عمال', amount: 6000, cropCycleId: '3' },
    { id: 't16', date: getPastDate(30), description: 'مبيدات فطرية (آجل)', type: TransactionType.EXPENSE, category: 'مبيدات', amount: 1800, cropCycleId: '3', supplierId: 's2' },
    { id: 't18', date: getPastDate(15), description: 'أسمدة معالجة (آجل)', type: TransactionType.EXPENSE, category: 'أسمدة ومغذيات', amount: 2500, cropCycleId: '3', supplierId: 's2' },
].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

const INITIAL_FARMER_WITHDRAWALS: FarmerWithdrawal[] = [
    { id: 'fw1', cropCycleId: '1', date: '2024-01-20', amount: 2000, description: 'سلفة أولى' },
    { id: 'fw2', cropCycleId: '1', date: '2024-02-15', amount: 3000, description: 'سلفة ثانية' },
    { id: 'fw3', cropCycleId: '2', date: getPastDate(2), amount: 1500, description: 'دفعة تحت الحساب' },
].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

const INITIAL_SUPPLIER_PAYMENTS: SupplierPayment[] = [
    { id: 'sp1', date: getPastDate(3), amount: 2000, supplierId: 's1', description: 'دفعة من حساب الأسمدة' },
    { id: 'sp2', date: getPastDate(1), amount: 1500, supplierId: 's1', description: 'تسوية جزء من الحساب' },
    { id: 'sp3', date: getPastDate(5), amount: 3000, supplierId: 's2', description: 'دفعة أولى من الحساب' },
].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

const INITIAL_ADVANCES: Advance[] = [
    { id: 'adv1', date: getPastDate(10), amount: 5000, description: 'سلفة شخصية' },
    { id: 'adv2', date: getPastDate(3), amount: 1500, description: 'مصاريف طارئة' },
];

const DEMO_DATA: BackupData = {
    greenhouses: INITIAL_GREENHOUSES,
    cropCycles: INITIAL_CYCLES,
    transactions: INITIAL_TRANSACTIONS,
    farmers: INITIAL_FARMERS,
    farmerWithdrawals: INITIAL_FARMER_WITHDRAWALS,
    settings: INITIAL_SETTINGS,
    suppliers: INITIAL_SUPPLIERS,
    supplierPayments: INITIAL_SUPPLIER_PAYMENTS,
    fertilizationPrograms: INITIAL_FERTILIZATION_PROGRAMS,
    advances: INITIAL_ADVANCES,
};

const FRESH_DATA: BackupData = {
    greenhouses: [],
    cropCycles: [],
    transactions: [],
    farmers: [],
    farmerWithdrawals: [],
    settings: INITIAL_SETTINGS,
    suppliers: [],
    supplierPayments: [],
    fertilizationPrograms: [],
    advances: [],
};

// --- API Functions ---
export const fetchInitialData = (): Promise<BackupData> => {
    const startFreshFlag = localStorage.getItem('startFresh') === 'true';
    const settingsStr = localStorage.getItem('settings');
    
    let storedSettings = INITIAL_SETTINGS;
    if (settingsStr && settingsStr !== 'undefined' && settingsStr !== 'null') {
        try {
            const parsed = JSON.parse(settingsStr);
            if (parsed) { // check for null from JSON.parse(null)
                storedSettings = parsed;
            }
        } catch (e) {
            console.warn("Could not parse settings from localStorage in API, using initial settings.");
        }
    }


    if (!storedSettings.expenseCategories) {
        storedSettings.expenseCategories = INITIAL_EXPENSE_CATEGORIES;
    }

    let data = startFreshFlag ? FRESH_DATA : DEMO_DATA;
    data = { ...data, settings: storedSettings };
    return mockRequest(data); // Never fail initial load
}

export const addCropCycle = (item: Omit<CropCycle, 'id'>): Promise<CropCycle> => mockRequest({ ...item, id: Date.now().toString() });
export const updateCropCycle = (item: CropCycle): Promise<CropCycle> => mockRequest(item);
export const deleteCropCycle = (id: string): Promise<{ id: string }> => mockRequest({ id });
export const archiveCropCycle = (item: CropCycle): Promise<CropCycle> => mockRequest({ ...item, status: CropCycleStatus.ARCHIVED });


export const addTransaction = (item: Omit<Transaction, 'id'>): Promise<Transaction> => mockRequest({ ...item, id: Date.now().toString() });
export const updateTransaction = (item: Transaction): Promise<Transaction> => mockRequest(item);
export const deleteTransaction = (id: string): Promise<{ id: string }> => mockRequest({ id });

export const addGreenhouse = (item: Omit<Greenhouse, 'id'>): Promise<Greenhouse> => mockRequest({ ...item, id: Date.now().toString() });
export const updateGreenhouse = (item: Greenhouse): Promise<Greenhouse> => mockRequest(item);
export const deleteGreenhouse = (id: string): Promise<{ id: string }> => mockRequest({ id });

export const updateSettings = (item: AppSettings): Promise<AppSettings> => mockRequest(item);

export const addFarmer = (item: Omit<Farmer, 'id'>): Promise<Farmer> => mockRequest({ ...item, id: Date.now().toString() });
export const updateFarmer = (item: Farmer): Promise<Farmer> => mockRequest(item);
export const deleteFarmer = (id: string): Promise<{ id: string }> => mockRequest({ id });

export const addFarmerWithdrawal = (item: Omit<FarmerWithdrawal, 'id'>): Promise<FarmerWithdrawal> => mockRequest({ ...item, id: Date.now().toString() });
export const updateFarmerWithdrawal = (item: FarmerWithdrawal): Promise<FarmerWithdrawal> => mockRequest(item);
export const deleteFarmerWithdrawal = (id: string): Promise<{ id: string }> => mockRequest({ id });

export const addSupplier = (item: Omit<Supplier, 'id'>): Promise<Supplier> => mockRequest({ ...item, id: Date.now().toString() });
export const updateSupplier = (item: Supplier): Promise<Supplier> => mockRequest(item);
export const deleteSupplier = (id: string): Promise<{ id: string }> => mockRequest({ id });

export const addSupplierPayment = (item: Omit<SupplierPayment, 'id'>): Promise<SupplierPayment> => mockRequest({ ...item, id: Date.now().toString() });
export const updateSupplierPayment = (item: SupplierPayment): Promise<SupplierPayment> => mockRequest(item);
export const deleteSupplierPayment = (id: string): Promise<{ id: string }> => mockRequest({ id });

export const addFertilizationProgram = (item: Omit<FertilizationProgram, 'id'>): Promise<FertilizationProgram> => mockRequest({ ...item, id: Date.now().toString() });
export const updateFertilizationProgram = (item: FertilizationProgram): Promise<FertilizationProgram> => mockRequest(item);
export const deleteFertilizationProgram = (id: string): Promise<{ id: string }> => mockRequest({ id });

export const addAdvance = (item: Omit<Advance, 'id'>): Promise<Advance> => mockRequest({ ...item, id: Date.now().toString() });
export const updateAdvance = (item: Advance): Promise<Advance> => mockRequest(item);
export const deleteAdvance = (id: string): Promise<{ id: string }> => mockRequest({ id });

export const loadBackupData = (data: BackupData): Promise<BackupData> => mockRequest(data);
export const deleteAllData = (): Promise<void> => mockRequest(undefined);
export const startFresh = (): Promise<BackupData> => mockRequest(FRESH_DATA);
export const getDemoData = (): Promise<BackupData> => mockRequest(DEMO_DATA);