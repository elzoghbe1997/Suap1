import { CropCycle, Transaction, CropCycleStatus, TransactionType, Greenhouse, AppSettings, Farmer, FarmerWithdrawal, Supplier, SupplierPayment, FertilizationProgram, ExpenseCategorySetting, BackupData, Advance, Person } from './types.ts';

// This file provides demo data for new users.

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

const INITIAL_FARMERS: Omit<Farmer, 'id'>[] = [
    { name: 'أحمد محمود' },
    { name: 'علي حسن' },
];

const INITIAL_PEOPLE: Omit<Person, 'id'>[] = [
    { name: 'إبراهيم' },
    { name: 'محمد' },
];

const INITIAL_GREENHOUSES: Omit<Greenhouse, 'id'>[] = [
    { name: 'الصوبة الشمالية', creationDate: '2023-01-15', initialCost: 150000 },
    { name: 'الصوبة الجنوبية', creationDate: '2023-03-20', initialCost: 185000 },
];

// IDs will be assigned by Supabase, but we need temporary ones for relationships
const tempCycleId1 = 'temp-cycle-1';
const tempCycleId2 = 'temp-cycle-2';
const tempCycleId3 = 'temp-cycle-3';

const tempFarmerId1 = 'temp-farmer-1';
const tempFarmerId2 = 'temp-farmer-2';

const tempGhId1 = 'temp-gh-1';
const tempGhId2 = 'temp-gh-2';


const INITIAL_CYCLES: Omit<CropCycle, 'id'>[] = [
  { name: 'عروة الطماطم الشتوية 2023', startDate: '2023-10-01', status: CropCycleStatus.CLOSED, greenhouseId: tempGhId1, seedType: 'طماطم شيري', plantCount: 600, productionStartDate: '2024-01-10', farmerId: tempFarmerId1, farmerSharePercentage: 20 },
  { name: 'عروة الخيار الصيفية 2024', startDate: '2024-04-15', status: CropCycleStatus.ACTIVE, greenhouseId: tempGhId2, seedType: 'خيار بلدي', plantCount: 850, productionStartDate: getPastDate(5), farmerId: tempFarmerId2, farmerSharePercentage: 25 },
  { name: 'عروة الفلفل الربيعية 2024', startDate: '2024-03-01', status: CropCycleStatus.ACTIVE, greenhouseId: tempGhId1, seedType: 'فلفل ألوان', plantCount: 700, productionStartDate: null, farmerId: null, farmerSharePercentage: null },
];

const INITIAL_FERTILIZATION_PROGRAMS: Omit<FertilizationProgram, 'id'>[] = [
    { name: 'برنامج الأسبوع 1 - خيار 2024', startDate: getPastDate(30), endDate: getPastDate(24), cropCycleId: tempCycleId2 },
    { name: 'برنامج الأسبوع 2 - خيار 2024', startDate: getPastDate(23), endDate: getPastDate(17), cropCycleId: tempCycleId2 },
];

const INITIAL_SUPPLIERS: Omit<Supplier, 'id'>[] = [
    { name: 'شركة الأسمدة الحديثة' },
    { name: 'مبيدات النصر' },
    { name: 'مؤسسة الهدى الزراعية' },
];

const INITIAL_TRANSACTIONS: Omit<Transaction, 'id'>[] = [
    { date: '2023-10-01', description: 'شراء بذور طماطم', type: TransactionType.EXPENSE, category: 'بذور', amount: 2500, cropCycleId: tempCycleId1 },
    { date: '2023-10-15', description: 'أسمدة ومغذيات', type: TransactionType.EXPENSE, category: 'أسمدة ومغذيات', amount: 4000, cropCycleId: tempCycleId1 },
    { date: '2023-11-01', description: 'أجور عمال', type: TransactionType.EXPENSE, category: 'أجور عمال', amount: 7000, cropCycleId: tempCycleId1 },
    { date: '2024-01-10', description: 'بيع أول دفعة محصول طماطم', type: TransactionType.REVENUE, category: 'أخرى', amount: 15000, cropCycleId: tempCycleId1, quantity: 500, price_items: [{ quantity: 500, price: 30 }], market: 'العبور' },
    { date: '2024-02-05', description: 'بيع ثاني دفعة محصول طماطم', type: TransactionType.REVENUE, category: 'أخرى', amount: 22000, cropCycleId: tempCycleId1, quantity: 750, price_items: [{ quantity: 500, price: 30 }, { quantity: 250, price: 28 }], market: 'المستقبل' },
    { date: '2024-02-20', description: 'صيانة نظام الري', type: TransactionType.EXPENSE, category: 'صيانة', amount: 1200, cropCycleId: tempCycleId1 },
    { date: '2024-04-15', description: 'شراء بذور خيار', type: TransactionType.EXPENSE, category: 'بذور', amount: 1800, cropCycleId: tempCycleId2 },
    { date: getPastDate(28), description: 'أسمدة نيتروجينية', type: TransactionType.EXPENSE, category: 'أسمدة ومغذيات', amount: 3200, cropCycleId: tempCycleId2, fertilizationProgramId: 'temp-fp-1' },
    { date: '2024-05-15', description: 'أجور عمال', type: TransactionType.EXPENSE, category: 'أجور عمال', amount: 5500, cropCycleId: tempCycleId2 },
    { date: getPastDate(5), description: 'بيع محصول خيار مبكر', type: TransactionType.REVENUE, category: 'أخرى', amount: 9500, cropCycleId: tempCycleId2, quantity: 400, price_items: [{ quantity: 400, price: 25 }], discount: 500, market: 'العبور' },
    { date: getPastDate(25), description: 'أسمدة بوتاسية (آجل)', type: TransactionType.EXPENSE, category: 'أسمدة ومغذيات', amount: 3500, cropCycleId: tempCycleId2, supplierId: 'temp-s-1', fertilizationProgramId: 'temp-fp-1' },
    { date: getPastDate(20), description: 'مبيدات وقائية (آجل)', type: TransactionType.EXPENSE, category: 'مبيدات', amount: 2200, cropCycleId: tempCycleId2, supplierId: 'temp-s-1', fertilizationProgramId: 'temp-fp-2' },
    { date: getPastDate(8), description: 'بذور خيار إضافية (آجل)', type: TransactionType.EXPENSE, category: 'بذور', amount: 1200, cropCycleId: tempCycleId2, supplierId: 'temp-s-3' },
    { date: '2024-03-01', description: 'شراء بذور فلفل ألوان', type: TransactionType.EXPENSE, category: 'بذور', amount: 3100, cropCycleId: tempCycleId3 },
    { date: '2024-03-20', description: 'مبيدات حشرية وقائية', type: TransactionType.EXPENSE, category: 'مبيدات', amount: 2200, cropCycleId: tempCycleId3 },
    { date: '2024-04-10', description: 'فواتير كهرباء ومياه', type: TransactionType.EXPENSE, category: 'فواتير', amount: 1500, cropCycleId: tempCycleId3 },
    { date: getPastDate(10), description: 'أجور عمال', type: TransactionType.EXPENSE, category: 'أجور عمال', amount: 6000, cropCycleId: tempCycleId3 },
    { date: getPastDate(30), description: 'مبيدات فطرية (آجل)', type: TransactionType.EXPENSE, category: 'مبيدات', amount: 1800, cropCycleId: tempCycleId3, supplierId: 'temp-s-2' },
    { date: getPastDate(15), description: 'أسمدة معالجة (آجل)', type: TransactionType.EXPENSE, category: 'أسمدة ومغذيات', amount: 2500, cropCycleId: tempCycleId3, supplierId: 'temp-s-2' },
];

const INITIAL_FARMER_WITHDRAWALS: Omit<FarmerWithdrawal, 'id'>[] = [
    { cropCycleId: tempCycleId1, date: '2024-01-20', amount: 2000, description: 'سلفة أولى' },
    { cropCycleId: tempCycleId1, date: '2024-02-15', amount: 3000, description: 'سلفة ثانية' },
    { cropCycleId: tempCycleId2, date: getPastDate(2), amount: 1500, description: 'دفعة تحت الحساب' },
];

const INITIAL_SUPPLIER_PAYMENTS: Omit<SupplierPayment, 'id'>[] = [
    { date: getPastDate(3), amount: 2000, supplierId: 'temp-s-1', description: 'دفعة من حساب الأسمدة', cropCycleId: tempCycleId2 },
    { date: getPastDate(1), amount: 1500, supplierId: 'temp-s-1', description: 'تسوية جزء من الحساب', cropCycleId: tempCycleId2, linkedExpenseIds: ['temp-t-15'] },
    { date: getPastDate(5), amount: 3000, supplierId: 'temp-s-2', description: 'دفعة أولى من الحساب', cropCycleId: tempCycleId3 },
];

const INITIAL_ADVANCES: Omit<Advance, 'id'>[] = [
    { date: getPastDate(10), amount: 5000, description: 'مصاريف شخصية', cropCycleId: tempCycleId2, personId: 'temp-p-1' },
    { date: getPastDate(3), amount: 1500, description: 'مصاريف طارئة', cropCycleId: tempCycleId3, personId: 'temp-p-2' },
    { date: getPastDate(2), amount: 2000, description: 'دفعة إيجار', cropCycleId: tempCycleId2, personId: 'temp-p-1' },
];

// This function provides a structured set of demo data.
// In a real scenario, you'd insert this into Supabase,
// which would assign real UUIDs. The useAppData hook will handle this.
// The useAppData hook needs to handle inserting base data (like farmers) first,
// getting their real IDs, and then updating related data (like crop_cycles) before inserting them.
// For simplicity here, we'll return the raw data and let the insert logic in useAppData handle it.
export const getDemoData = (): Omit<BackupData, 'settings'> & { settings: AppSettings } => {
    return {
        greenhouses: INITIAL_GREENHOUSES as Greenhouse[],
        cropCycles: INITIAL_CYCLES as CropCycle[],
        transactions: INITIAL_TRANSACTIONS as Transaction[],
        farmers: INITIAL_FARMERS as Farmer[],
        farmerWithdrawals: INITIAL_FARMER_WITHDRAWALS as FarmerWithdrawal[],
        settings: INITIAL_SETTINGS,
        suppliers: INITIAL_SUPPLIERS as Supplier[],
        supplierPayments: INITIAL_SUPPLIER_PAYMENTS as SupplierPayment[],
        fertilizationPrograms: INITIAL_FERTILIZATION_PROGRAMS as FertilizationProgram[],
        advances: INITIAL_ADVANCES as Advance[],
        people: INITIAL_PEOPLE as Person[],
    };
};