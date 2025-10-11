import { supabase } from './supabase';
import {
  Greenhouse,
  CropCycle,
  Transaction,
  Farmer,
  FarmerWithdrawal,
  Supplier,
  SupplierPayment,
  FertilizationProgram,
  Advance,
  AppSettings,
} from '../types';

export const database = {
  greenhouses: {
    async getAll() {
      const { data, error } = await supabase
        .from('greenhouses')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(g => ({
        id: g.id,
        name: g.name,
        creationDate: g.creation_date,
        initialCost: g.initial_cost,
      })) as Greenhouse[];
    },
    async create(greenhouse: Omit<Greenhouse, 'id'>) {
      const { data, error } = await supabase
        .from('greenhouses')
        .insert({
          name: greenhouse.name,
          creation_date: greenhouse.creationDate,
          initial_cost: greenhouse.initialCost,
        })
        .select()
        .single();
      if (error) throw error;
      return {
        id: data.id,
        name: data.name,
        creationDate: data.creation_date,
        initialCost: data.initial_cost,
      } as Greenhouse;
    },
    async update(greenhouse: Greenhouse) {
      const { data, error } = await supabase
        .from('greenhouses')
        .update({
          name: greenhouse.name,
          creation_date: greenhouse.creationDate,
          initial_cost: greenhouse.initialCost,
          updated_at: new Date().toISOString(),
        })
        .eq('id', greenhouse.id)
        .select()
        .single();
      if (error) throw error;
      return {
        id: data.id,
        name: data.name,
        creationDate: data.creation_date,
        initialCost: data.initial_cost,
      } as Greenhouse;
    },
    async delete(id: string) {
      const { error } = await supabase
        .from('greenhouses')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  cropCycles: {
    async getAll() {
      const { data, error } = await supabase
        .from('crop_cycles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(c => ({
        id: c.id,
        name: c.name,
        startDate: c.start_date,
        status: c.status,
        greenhouseId: c.greenhouse_id,
        seedType: c.seed_type,
        plantCount: c.plant_count,
        productionStartDate: c.production_start_date,
        farmerId: c.farmer_id,
        farmerSharePercentage: c.farmer_share_percentage,
      })) as CropCycle[];
    },
    async create(cycle: Omit<CropCycle, 'id'>) {
      const { data, error } = await supabase
        .from('crop_cycles')
        .insert({
          name: cycle.name,
          start_date: cycle.startDate,
          status: cycle.status,
          greenhouse_id: cycle.greenhouseId,
          seed_type: cycle.seedType,
          plant_count: cycle.plantCount,
          production_start_date: cycle.productionStartDate,
          farmer_id: cycle.farmerId,
          farmer_share_percentage: cycle.farmerSharePercentage,
        })
        .select()
        .single();
      if (error) throw error;
      return {
        id: data.id,
        name: data.name,
        startDate: data.start_date,
        status: data.status,
        greenhouseId: data.greenhouse_id,
        seedType: data.seed_type,
        plantCount: data.plant_count,
        productionStartDate: data.production_start_date,
        farmerId: data.farmer_id,
        farmerSharePercentage: data.farmer_share_percentage,
      } as CropCycle;
    },
    async update(cycle: CropCycle) {
      const { data, error } = await supabase
        .from('crop_cycles')
        .update({
          name: cycle.name,
          start_date: cycle.startDate,
          status: cycle.status,
          greenhouse_id: cycle.greenhouseId,
          seed_type: cycle.seedType,
          plant_count: cycle.plantCount,
          production_start_date: cycle.productionStartDate,
          farmer_id: cycle.farmerId,
          farmer_share_percentage: cycle.farmerSharePercentage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', cycle.id)
        .select()
        .single();
      if (error) throw error;
      return {
        id: data.id,
        name: data.name,
        startDate: data.start_date,
        status: data.status,
        greenhouseId: data.greenhouse_id,
        seedType: data.seed_type,
        plantCount: data.plant_count,
        productionStartDate: data.production_start_date,
        farmerId: data.farmer_id,
        farmerSharePercentage: data.farmer_share_percentage,
      } as CropCycle;
    },
    async delete(id: string) {
      const { error } = await supabase
        .from('crop_cycles')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  transactions: {
    async getAll() {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      return data.map(t => ({
        id: t.id,
        date: t.date,
        description: t.description,
        type: t.type,
        category: t.category,
        amount: t.amount,
        cropCycleId: t.crop_cycle_id,
        quantity: t.quantity,
        priceItems: t.price_items,
        quantityGrade1: t.quantity_grade1,
        priceGrade1: t.price_grade1,
        quantityGrade2: t.quantity_grade2,
        priceGrade2: t.price_grade2,
        discount: t.discount,
        supplierId: t.supplier_id,
        fertilizationProgramId: t.fertilization_program_id,
      })) as Transaction[];
    },
    async create(transaction: Omit<Transaction, 'id'>) {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          date: transaction.date,
          description: transaction.description,
          type: transaction.type,
          category: transaction.category,
          amount: transaction.amount,
          crop_cycle_id: transaction.cropCycleId,
          quantity: transaction.quantity,
          price_items: transaction.priceItems,
          quantity_grade1: transaction.quantityGrade1,
          price_grade1: transaction.priceGrade1,
          quantity_grade2: transaction.quantityGrade2,
          price_grade2: transaction.priceGrade2,
          discount: transaction.discount,
          supplier_id: transaction.supplierId,
          fertilization_program_id: transaction.fertilizationProgramId,
        })
        .select()
        .single();
      if (error) throw error;
      return {
        id: data.id,
        date: data.date,
        description: data.description,
        type: data.type,
        category: data.category,
        amount: data.amount,
        cropCycleId: data.crop_cycle_id,
        quantity: data.quantity,
        priceItems: data.price_items,
        quantityGrade1: data.quantity_grade1,
        priceGrade1: data.price_grade1,
        quantityGrade2: data.quantity_grade2,
        priceGrade2: data.price_grade2,
        discount: data.discount,
        supplierId: data.supplier_id,
        fertilizationProgramId: data.fertilization_program_id,
      } as Transaction;
    },
    async update(transaction: Transaction) {
      const { data, error } = await supabase
        .from('transactions')
        .update({
          date: transaction.date,
          description: transaction.description,
          type: transaction.type,
          category: transaction.category,
          amount: transaction.amount,
          crop_cycle_id: transaction.cropCycleId,
          quantity: transaction.quantity,
          price_items: transaction.priceItems,
          quantity_grade1: transaction.quantityGrade1,
          price_grade1: transaction.priceGrade1,
          quantity_grade2: transaction.quantityGrade2,
          price_grade2: transaction.priceGrade2,
          discount: transaction.discount,
          supplier_id: transaction.supplierId,
          fertilization_program_id: transaction.fertilizationProgramId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', transaction.id)
        .select()
        .single();
      if (error) throw error;
      return {
        id: data.id,
        date: data.date,
        description: data.description,
        type: data.type,
        category: data.category,
        amount: data.amount,
        cropCycleId: data.crop_cycle_id,
        quantity: data.quantity,
        priceItems: data.price_items,
        quantityGrade1: data.quantity_grade1,
        priceGrade1: data.price_grade1,
        quantityGrade2: data.quantity_grade2,
        priceGrade2: data.price_grade2,
        discount: data.discount,
        supplierId: data.supplier_id,
        fertilizationProgramId: data.fertilization_program_id,
      } as Transaction;
    },
    async delete(id: string) {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  farmers: {
    async getAll() {
      const { data, error } = await supabase
        .from('farmers')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Farmer[];
    },
    async create(farmer: Omit<Farmer, 'id'>) {
      const { data, error } = await supabase
        .from('farmers')
        .insert({ name: farmer.name })
        .select()
        .single();
      if (error) throw error;
      return data as Farmer;
    },
    async update(farmer: Farmer) {
      const { data, error } = await supabase
        .from('farmers')
        .update({ name: farmer.name, updated_at: new Date().toISOString() })
        .eq('id', farmer.id)
        .select()
        .single();
      if (error) throw error;
      return data as Farmer;
    },
    async delete(id: string) {
      const { error } = await supabase
        .from('farmers')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  farmerWithdrawals: {
    async getAll() {
      const { data, error } = await supabase
        .from('farmer_withdrawals')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      return data.map(w => ({
        id: w.id,
        date: w.date,
        amount: w.amount,
        cropCycleId: w.crop_cycle_id,
        description: w.description,
      })) as FarmerWithdrawal[];
    },
    async create(withdrawal: Omit<FarmerWithdrawal, 'id'>) {
      const { data, error } = await supabase
        .from('farmer_withdrawals')
        .insert({
          date: withdrawal.date,
          amount: withdrawal.amount,
          crop_cycle_id: withdrawal.cropCycleId,
          description: withdrawal.description,
        })
        .select()
        .single();
      if (error) throw error;
      return {
        id: data.id,
        date: data.date,
        amount: data.amount,
        cropCycleId: data.crop_cycle_id,
        description: data.description,
      } as FarmerWithdrawal;
    },
    async update(withdrawal: FarmerWithdrawal) {
      const { data, error } = await supabase
        .from('farmer_withdrawals')
        .update({
          date: withdrawal.date,
          amount: withdrawal.amount,
          crop_cycle_id: withdrawal.cropCycleId,
          description: withdrawal.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', withdrawal.id)
        .select()
        .single();
      if (error) throw error;
      return {
        id: data.id,
        date: data.date,
        amount: data.amount,
        cropCycleId: data.crop_cycle_id,
        description: data.description,
      } as FarmerWithdrawal;
    },
    async delete(id: string) {
      const { error } = await supabase
        .from('farmer_withdrawals')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  suppliers: {
    async getAll() {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Supplier[];
    },
    async create(supplier: Omit<Supplier, 'id'>) {
      const { data, error } = await supabase
        .from('suppliers')
        .insert({ name: supplier.name })
        .select()
        .single();
      if (error) throw error;
      return data as Supplier;
    },
    async update(supplier: Supplier) {
      const { data, error } = await supabase
        .from('suppliers')
        .update({ name: supplier.name, updated_at: new Date().toISOString() })
        .eq('id', supplier.id)
        .select()
        .single();
      if (error) throw error;
      return data as Supplier;
    },
    async delete(id: string) {
      const { error} = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  supplierPayments: {
    async getAll() {
      const { data, error } = await supabase
        .from('supplier_payments')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      return data.map(p => ({
        id: p.id,
        date: p.date,
        amount: p.amount,
        supplierId: p.supplier_id,
        description: p.description,
        linkedExpenseIds: p.linked_expense_ids,
      })) as SupplierPayment[];
    },
    async create(payment: Omit<SupplierPayment, 'id'>) {
      const { data, error } = await supabase
        .from('supplier_payments')
        .insert({
          date: payment.date,
          amount: payment.amount,
          supplier_id: payment.supplierId,
          description: payment.description,
          linked_expense_ids: payment.linkedExpenseIds,
        })
        .select()
        .single();
      if (error) throw error;
      return {
        id: data.id,
        date: data.date,
        amount: data.amount,
        supplierId: data.supplier_id,
        description: data.description,
        linkedExpenseIds: data.linked_expense_ids,
      } as SupplierPayment;
    },
    async update(payment: SupplierPayment) {
      const { data, error } = await supabase
        .from('supplier_payments')
        .update({
          date: payment.date,
          amount: payment.amount,
          supplier_id: payment.supplierId,
          description: payment.description,
          linked_expense_ids: payment.linkedExpenseIds,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id)
        .select()
        .single();
      if (error) throw error;
      return {
        id: data.id,
        date: data.date,
        amount: data.amount,
        supplierId: data.supplier_id,
        description: data.description,
        linkedExpenseIds: data.linked_expense_ids,
      } as SupplierPayment;
    },
    async delete(id: string) {
      const { error } = await supabase
        .from('supplier_payments')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  fertilizationPrograms: {
    async getAll() {
      const { data, error } = await supabase
        .from('fertilization_programs')
        .select('*')
        .order('start_date', { ascending: false });
      if (error) throw error;
      return data.map(p => ({
        id: p.id,
        name: p.name,
        startDate: p.start_date,
        endDate: p.end_date,
        cropCycleId: p.crop_cycle_id,
      })) as FertilizationProgram[];
    },
    async create(program: Omit<FertilizationProgram, 'id'>) {
      const { data, error } = await supabase
        .from('fertilization_programs')
        .insert({
          name: program.name,
          start_date: program.startDate,
          end_date: program.endDate,
          crop_cycle_id: program.cropCycleId,
        })
        .select()
        .single();
      if (error) throw error;
      return {
        id: data.id,
        name: data.name,
        startDate: data.start_date,
        endDate: data.end_date,
        cropCycleId: data.crop_cycle_id,
      } as FertilizationProgram;
    },
    async update(program: FertilizationProgram) {
      const { data, error } = await supabase
        .from('fertilization_programs')
        .update({
          name: program.name,
          start_date: program.startDate,
          end_date: program.endDate,
          crop_cycle_id: program.cropCycleId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', program.id)
        .select()
        .single();
      if (error) throw error;
      return {
        id: data.id,
        name: data.name,
        startDate: data.start_date,
        endDate: data.end_date,
        cropCycleId: data.crop_cycle_id,
      } as FertilizationProgram;
    },
    async delete(id: string) {
      const { error } = await supabase
        .from('fertilization_programs')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  advances: {
    async getAll() {
      const { data, error } = await supabase
        .from('advances')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      return data as Advance[];
    },
    async create(advance: Omit<Advance, 'id'>) {
      const { data, error } = await supabase
        .from('advances')
        .insert({
          date: advance.date,
          amount: advance.amount,
          description: advance.description,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Advance;
    },
    async update(advance: Advance) {
      const { data, error } = await supabase
        .from('advances')
        .update({
          date: advance.date,
          amount: advance.amount,
          description: advance.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', advance.id)
        .select()
        .single();
      if (error) throw error;
      return data as Advance;
    },
    async delete(id: string) {
      const { error } = await supabase
        .from('advances')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  settings: {
    async get() {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        theme: data.theme,
        isFarmerSystemEnabled: data.is_farmer_system_enabled,
        isSupplierSystemEnabled: data.is_supplier_system_enabled,
        isAgriculturalProgramsSystemEnabled: data.is_agricultural_programs_system_enabled,
        isTreasurySystemEnabled: data.is_treasury_system_enabled,
        isAdvancesSystemEnabled: data.is_advances_system_enabled,
        expenseCategories: data.expense_categories,
      } as AppSettings;
    },
    async createOrUpdate(settings: AppSettings) {
      const existing = await this.get();
      if (existing) {
        const { data, error } = await supabase
          .from('settings')
          .update({
            theme: settings.theme,
            is_farmer_system_enabled: settings.isFarmerSystemEnabled,
            is_supplier_system_enabled: settings.isSupplierSystemEnabled,
            is_agricultural_programs_system_enabled: settings.isAgriculturalProgramsSystemEnabled,
            is_treasury_system_enabled: settings.isTreasurySystemEnabled,
            is_advances_system_enabled: settings.isAdvancesSystemEnabled,
            expense_categories: settings.expenseCategories,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .select()
          .single();
        if (error) throw error;
        return {
          theme: data.theme,
          isFarmerSystemEnabled: data.is_farmer_system_enabled,
          isSupplierSystemEnabled: data.is_supplier_system_enabled,
          isAgriculturalProgramsSystemEnabled: data.is_agricultural_programs_system_enabled,
          isTreasurySystemEnabled: data.is_treasury_system_enabled,
          isAdvancesSystemEnabled: data.is_advances_system_enabled,
          expenseCategories: data.expense_categories,
        } as AppSettings;
      } else {
        const { data, error } = await supabase
          .from('settings')
          .insert({
            theme: settings.theme,
            is_farmer_system_enabled: settings.isFarmerSystemEnabled,
            is_supplier_system_enabled: settings.isSupplierSystemEnabled,
            is_agricultural_programs_system_enabled: settings.isAgriculturalProgramsSystemEnabled,
            is_treasury_system_enabled: settings.isTreasurySystemEnabled,
            is_advances_system_enabled: settings.isAdvancesSystemEnabled,
            expense_categories: settings.expenseCategories,
          })
          .select()
          .single();
        if (error) throw error;
        return {
          theme: data.theme,
          isFarmerSystemEnabled: data.is_farmer_system_enabled,
          isSupplierSystemEnabled: data.is_supplier_system_enabled,
          isAgriculturalProgramsSystemEnabled: data.is_agricultural_programs_system_enabled,
          isTreasurySystemEnabled: data.is_treasury_system_enabled,
          isAdvancesSystemEnabled: data.is_advances_system_enabled,
          expenseCategories: data.expense_categories,
        } as AppSettings;
      }
    },
  },
};
