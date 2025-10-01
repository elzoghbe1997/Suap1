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

export enum ExpenseCategory {
  SEEDS = 'بذور',
  FERTILIZERS = 'أسمدة ومغذيات',
  PESTICIDES = 'مبيدات',
  LABOR = 'أجور عمال',
  MAINTENANCE = 'صيانة',
  UTILITIES = 'فواتير',
  OTHER = 'أخرى',
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
  theme: Theme;
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
  category: ExpenseCategory;
  amount: number;
  cropCycleId: string;
  quantity?: number;
  quantityGrade1?: number;
  priceGrade1?: number;
  quantityGrade2?: number;
  priceGrade2?: number;
  discount?: number;
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

export interface BackupData {
  greenhouses: Greenhouse[];
  cropCycles: CropCycle[];
  transactions: Transaction[];
  farmers: Farmer[];
  farmerWithdrawals: FarmerWithdrawal[];
  settings: AppSettings;
}


export interface AppContextType {
  loading: boolean;
  cropCycles: CropCycle[];
  transactions: Transaction[];
  greenhouses: Greenhouse[];
  settings: AppSettings;
  farmers: Farmer[];
  farmerWithdrawals: FarmerWithdrawal[];
  alerts: Alert[];
  addCropCycle: (cycle: Omit<CropCycle, 'id' | 'productionStartDate'>) => void;
  updateCropCycle: (updatedCycle: CropCycle) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (updatedTransaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addGreenhouse: (greenhouse: Omit<Greenhouse, 'id'>) => void;
  updateGreenhouse: (updatedGreenhouse: Greenhouse) => void;
  deleteGreenhouse: (id: string) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  addFarmer: (farmer: Omit<Farmer, 'id'>) => void;
  updateFarmer: (updatedFarmer: Farmer) => void;
  deleteFarmer: (id: string) => void;
  addFarmerWithdrawal: (withdrawal: Omit<FarmerWithdrawal, 'id'>) => void;
  updateFarmerWithdrawal: (updatedWithdrawal: FarmerWithdrawal) => void;
  deleteFarmerWithdrawal: (id: string) => void;
  loadBackupData: (data: BackupData) => void;
}