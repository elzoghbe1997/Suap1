// FIX: Replaced circular self-import with an import from the dedicated types.ts file.
import { CropCycle, Transaction, CropCycleStatus, TransactionType, ExpenseCategory, Greenhouse, AppSettings, Farmer, FarmerWithdrawal } from './types';

const formatDate = (date: Date) => date.toISOString().split('T')[0];

const getPastDate = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return formatDate(date);
};

export const INITIAL_SETTINGS: AppSettings = {
  isFarmerSystemEnabled: true,
  theme: 'system',
};

export const INITIAL_FARMERS: Farmer[] = [
    { id: 'f1', name: 'أحمد محمود' },
    { id: 'f2', name: 'علي حسن' },
];

export const INITIAL_CYCLES: CropCycle[] = [
  { id: '1', name: 'عروة الطماطم الشتوية 2023', startDate: '2023-10-01', status: CropCycleStatus.CLOSED, greenhouseId: 'g1', seedType: 'طماطم شيري', plantCount: 600, productionStartDate: '2024-01-10', farmerId: 'f1', farmerSharePercentage: 20 },
  { id: '2', name: 'عروة الخيار الصيفية 2024', startDate: '2024-04-15', status: CropCycleStatus.ACTIVE, greenhouseId: 'g2', seedType: 'خيار بلدي', plantCount: 850, productionStartDate: getPastDate(5), farmerId: 'f2', farmerSharePercentage: 25 },
  { id: '3', name: 'عروة الفلفل الربيعية 2024', startDate: '2024-03-01', status: CropCycleStatus.ACTIVE, greenhouseId: 'g1', seedType: 'فلفل ألوان', plantCount: 700, productionStartDate: null, farmerId: null, farmerSharePercentage: null },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
    // Cycle 1 (Closed)
    { id: 't1', date: '2023-10-01', description: 'شراء بذور طماطم', type: TransactionType.EXPENSE, category: ExpenseCategory.SEEDS, amount: 2500, cropCycleId: '1' },
    { id: 't2', date: '2023-10-15', description: 'أسمدة ومغذيات', type: TransactionType.EXPENSE, category: ExpenseCategory.FERTILIZERS, amount: 4000, cropCycleId: '1' },
    { id: 't3', date: '2023-11-01', description: 'أجور عمال', type: TransactionType.EXPENSE, category: ExpenseCategory.LABOR, amount: 7000, cropCycleId: '1' },
    { 
      id: 't4', date: '2024-01-10', description: 'بيع أول دفعة محصول طماطم', type: TransactionType.REVENUE, 
      category: ExpenseCategory.OTHER, amount: 15000, cropCycleId: '1', quantity: 500,
      quantityGrade1: 500, priceGrade1: 30, quantityGrade2: 0, priceGrade2: 0, discount: 0
    },
    { 
      id: 't5', date: '2024-02-05', description: 'بيع ثاني دفعة محصول طماطم', type: TransactionType.REVENUE, 
      category: ExpenseCategory.OTHER, amount: 22000, cropCycleId: '1', quantity: 750,
      quantityGrade1: 500, priceGrade1: 30, quantityGrade2: 250, priceGrade2: 28, discount: 0
    },
    { id: 't6', date: '2024-02-20', description: 'صيانة نظام الري', type: TransactionType.EXPENSE, category: ExpenseCategory.MAINTENANCE, amount: 1200, cropCycleId: '1' },
    
    // Cycle 2 (Active)
    { id: 't7', date: '2024-04-15', description: 'شراء بذور خيار', type: TransactionType.EXPENSE, category: ExpenseCategory.SEEDS, amount: 1800, cropCycleId: '2' },
    { id: 't8', date: '2024-05-01', description: 'أسمدة نيتروجينية', type: TransactionType.EXPENSE, category: ExpenseCategory.FERTILIZERS, amount: 3200, cropCycleId: '2' },
    { id: 't9', date: '2024-05-15', description: 'أجور عمال', type: TransactionType.EXPENSE, category: ExpenseCategory.LABOR, amount: 5500, cropCycleId: '2' },
    { 
      id: 't10', date: getPastDate(5), description: 'بيع محصول خيار مبكر', type: TransactionType.REVENUE, 
      category: ExpenseCategory.OTHER, amount: 9500, cropCycleId: '2', quantity: 400,
      quantityGrade1: 400, priceGrade1: 25, quantityGrade2: 0, priceGrade2: 0, discount: 500
    },

    // Cycle 3 (Active)
    { id: 't11', date: '2024-03-01', description: 'شراء بذور فلفل ألوان', type: TransactionType.EXPENSE, category: ExpenseCategory.SEEDS, amount: 3100, cropCycleId: '3' },
    { id: 't12', date: '2024-03-20', description: 'مبيدات حشرية وقائية', type: TransactionType.EXPENSE, category: ExpenseCategory.PESTICIDES, amount: 2200, cropCycleId: '3' },
    { id: 't13', date: '2024-04-10', description: 'فواتير كهرباء ومياه', type: TransactionType.EXPENSE, category: ExpenseCategory.UTILITIES, amount: 1500, cropCycleId: '3' },
    { id: 't14', date: getPastDate(10), description: 'أجور عمال', type: TransactionType.EXPENSE, category: ExpenseCategory.LABOR, amount: 6000, cropCycleId: '3' }
].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export const INITIAL_GREENHOUSES: Greenhouse[] = [
    { id: 'g1', name: 'الصوبة الشمالية', creationDate: '2023-01-15', initialCost: 150000 },
    { id: 'g2', name: 'الصوبة الجنوبية', creationDate: '2023-03-20', initialCost: 185000 },
];

export const INITIAL_FARMER_WITHDRAWALS: FarmerWithdrawal[] = [
    { id: 'fw1', cropCycleId: '1', date: '2024-01-20', amount: 2000, description: 'سلفة أولى' },
    { id: 'fw2', cropCycleId: '1', date: '2024-02-15', amount: 3000, description: 'سلفة ثانية' },
    { id: 'fw3', cropCycleId: '2', date: getPastDate(2), amount: 1500, description: 'دفعة تحت الحساب' },
].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());