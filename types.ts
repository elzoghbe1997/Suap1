// FIX: Defined and exported all necessary types to resolve circular dependency and missing type errors.
export enum CropCycleStatus {
  ACTIVE = 'نشطة',
  CLOSED = 'مغلقة',
  ARCHIVED = 'مؤرشفة',
}

export enum TransactionType {
  REVENUE = 'إيرادات',
  EXPENSE = 'مصروفات',
}

// Custom expense category type
export interface ExpenseCategorySetting {
  id: string;
  name: string;
  isFoundational?: boolean;
}


export interface Farmer {
  id: string;
  name: string;
}

export interface FarmerWithdrawal {
  id: string;
  date: string;
  amount: number;
  cropCycleId: string;
  description: string;
}

export type Theme = 'light' | 'dark' | 'system';

export interface AppSettings {
  isFarmerSystemEnabled: boolean;
  isSupplierSystemEnabled: boolean;
  isAgriculturalProgramsSystemEnabled: boolean;
  isTreasurySystemEnabled?: boolean;
  isAdvancesSystemEnabled?: boolean;
  theme: Theme;
  expenseCategories: ExpenseCategorySetting[];
}

export interface Advance {
  id: string;
  date: string;
  amount: number;
  description: string;
}

export interface Greenhouse {
  id: string;
  name: string;
  creationDate: string;
  initialCost: number;
}

export interface CropCycle {
  id: string;
  name:string;
  startDate: string;
  status: CropCycleStatus;
  greenhouseId: string;
  seedType: string;
  plantCount: number;
  productionStartDate: string | null;
  farmerId?: string | null;
  farmerSharePercentage?: number | null;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  type: TransactionType;
  category: string; // Changed from ExpenseCategory to string
  amount: number;
  cropCycleId: string;
  quantity?: number;
  priceItems?: { quantity: number; price: number }[];
  quantityGrade1?: number;
  priceGrade1?: number;
  quantityGrade2?: number;
  priceGrade2?: number;
  discount?: number;
  supplierId?: string | null;
  fertilizationProgramId?: string | null;
}

export enum AlertType {
  HIGH_COST = 'تكاليف مرتفعة',
  STAGNANT_CYCLE = 'عروة راكدة',
  NEGATIVE_BALANCE = 'رصيد سالب',
}

export interface Alert {
  id: string;
  type: AlertType;
  message: string;
  relatedId: string; // ID of crop cycle or farmer
}

export interface Supplier {
  id: string;
  name: string;
}

export interface SupplierPayment {
  id: string;
  date: string;
  amount: number;
  supplierId: string;
  description: string;
  linkedExpenseIds?: string[];
}

export interface FertilizationProgram {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  cropCycleId: string;
}

export interface BackupData {
  greenhouses: Greenhouse[];
  cropCycles: CropCycle[];
  transactions: Transaction[];
  farmers: Farmer[];
  farmerWithdrawals: FarmerWithdrawal[];
  settings: AppSettings;
  suppliers: Supplier[];
  supplierPayments: SupplierPayment[];
  fertilizationPrograms: FertilizationProgram[];
  advances: Advance[];
}


export interface AppContextType {
  loading: boolean;
  isDeletingData: boolean;
  cropCycles: CropCycle[];
  transactions: Transaction[];
  greenhouses: Greenhouse[];
  settings: AppSettings;
  farmers: Farmer[];
  farmerWithdrawals: FarmerWithdrawal[];
  alerts: Alert[];
  suppliers: Supplier[];
  supplierPayments: SupplierPayment[];
  fertilizationPrograms: FertilizationProgram[];
  advances: Advance[];
  addCropCycle: (cycle: Omit<CropCycle, 'id'>) => Promise<void>;
  updateCropCycle: (updatedCycle: CropCycle) => Promise<void>;
  deleteCropCycle: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (updatedTransaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addGreenhouse: (greenhouse: Omit<Greenhouse, 'id'>) => Promise<void>;
  updateGreenhouse: (updatedGreenhouse: Greenhouse) => Promise<void>;
  deleteGreenhouse: (id: string) => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  addFarmer: (farmer: Omit<Farmer, 'id'>) => Promise<void>;
  updateFarmer: (updatedFarmer: Farmer) => Promise<void>;
  deleteFarmer: (id: string) => Promise<void>;
  addFarmerWithdrawal: (withdrawal: Omit<FarmerWithdrawal, 'id'>) => Promise<void>;
  updateFarmerWithdrawal: (updatedWithdrawal: FarmerWithdrawal) => Promise<void>;
  deleteFarmerWithdrawal: (id: string) => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
  updateSupplier: (updatedSupplier: Supplier) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  addSupplierPayment: (payment: Omit<SupplierPayment, 'id'>) => Promise<void>;
  updateSupplierPayment: (updatedPayment: SupplierPayment) => Promise<void>;
  deleteSupplierPayment: (id: string) => Promise<void>;
  addFertilizationProgram: (program: Omit<FertilizationProgram, 'id'>) => Promise<void>;
  updateFertilizationProgram: (updatedProgram: FertilizationProgram) => Promise<void>;
  deleteFertilizationProgram: (id: string) => Promise<void>;
  addAdvance: (advance: Omit<Advance, 'id'>) => Promise<void>;
  updateAdvance: (updatedAdvance: Advance) => Promise<void>;
  deleteAdvance: (id: string) => Promise<void>;
  addExpenseCategory: (category: Omit<ExpenseCategorySetting, 'id'>) => Promise<void>;
  updateExpenseCategory: (updatedCategory: ExpenseCategorySetting) => Promise<void>;
  deleteExpenseCategory: (id: string) => Promise<void>;
  loadBackupData: (data: BackupData) => Promise<void>;
  loadDemoData: () => Promise<void>;
  deleteAllData: () => Promise<void>;
  startFresh: () => Promise<void>;
}