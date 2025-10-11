// FIX: Replaced circular self-import with an import from the dedicated types.ts file.
import { AppSettings, ExpenseCategorySetting } from './types.ts';

export const INITIAL_EXPENSE_CATEGORIES: ExpenseCategorySetting[] = [
    { id: 'cat1', name: 'بذور', isFoundational: true },
    { id: 'cat2', name: 'أسمدة ومغذيات' },
    { id: 'cat3', name: 'مبيدات' },
    { id: 'cat4', name: 'أجور عمال' },
    { id: 'cat5', name: 'صيانة' },
    { id: 'cat6', name: 'فواتير' },
    { id: 'cat7', name: 'أخرى' },
];

export const INITIAL_SETTINGS: AppSettings = {
  isFarmerSystemEnabled: true,
  isSupplierSystemEnabled: true,
  isAgriculturalProgramsSystemEnabled: true,
  isTreasurySystemEnabled: true,
  isAdvancesSystemEnabled: true,
  theme: 'system',
  expenseCategories: INITIAL_EXPENSE_CATEGORIES,
};