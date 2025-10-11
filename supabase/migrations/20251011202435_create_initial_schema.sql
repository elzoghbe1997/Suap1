/*
  # إنشاء قاعدة البيانات للمحاسب الزراعي

  ## الجداول الجديدة
  
  ### 1. greenhouses (الصوب الزراعية)
    - `id` (uuid, primary key)
    - `name` (text) - اسم الصوبة
    - `creation_date` (date) - تاريخ الإنشاء
    - `initial_cost` (numeric) - التكلفة الأولية
    - `user_id` (uuid) - معرف المستخدم
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ### 2. farmers (المزارعون)
    - `id` (uuid, primary key)
    - `name` (text) - اسم المزارع
    - `user_id` (uuid) - معرف المستخدم
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ### 3. suppliers (الموردون)
    - `id` (uuid, primary key)
    - `name` (text) - اسم المورد
    - `user_id` (uuid) - معرف المستخدم
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ### 4. crop_cycles (العروات الزراعية)
    - `id` (uuid, primary key)
    - `name` (text) - اسم العروة
    - `start_date` (date) - تاريخ البداية
    - `status` (text) - الحالة
    - `greenhouse_id` (uuid) - معرف الصوبة
    - `seed_type` (text) - نوع البذور
    - `plant_count` (integer) - عدد النباتات
    - `production_start_date` (date) - تاريخ بدء الإنتاج
    - `farmer_id` (uuid) - معرف المزارع
    - `farmer_share_percentage` (numeric) - نسبة المزارع
    - `user_id` (uuid) - معرف المستخدم
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ### 5. transactions (المعاملات المالية)
    - `id` (uuid, primary key)
    - `date` (date) - التاريخ
    - `description` (text) - الوصف
    - `type` (text) - النوع (إيرادات/مصروفات)
    - `category` (text) - الفئة
    - `amount` (numeric) - المبلغ
    - `crop_cycle_id` (uuid) - معرف العروة
    - `quantity` (numeric) - الكمية
    - `price_items` (jsonb) - تفاصيل الأسعار
    - `quantity_grade1` (numeric) - كمية الدرجة الأولى
    - `price_grade1` (numeric) - سعر الدرجة الأولى
    - `quantity_grade2` (numeric) - كمية الدرجة الثانية
    - `price_grade2` (numeric) - سعر الدرجة الثانية
    - `discount` (numeric) - الخصم
    - `supplier_id` (uuid) - معرف المورد
    - `fertilization_program_id` (uuid) - معرف البرنامج
    - `user_id` (uuid) - معرف المستخدم
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ### 6. farmer_withdrawals (سحوبات المزارع)
    - `id` (uuid, primary key)
    - `date` (date) - التاريخ
    - `amount` (numeric) - المبلغ
    - `crop_cycle_id` (uuid) - معرف العروة
    - `description` (text) - الوصف
    - `user_id` (uuid) - معرف المستخدم
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ### 7. supplier_payments (مدفوعات الموردين)
    - `id` (uuid, primary key)
    - `date` (date) - التاريخ
    - `amount` (numeric) - المبلغ
    - `supplier_id` (uuid) - معرف المورد
    - `description` (text) - الوصف
    - `linked_expense_ids` (text[]) - معرفات المصروفات المرتبطة
    - `user_id` (uuid) - معرف المستخدم
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ### 8. fertilization_programs (برامج التسميد)
    - `id` (uuid, primary key)
    - `name` (text) - اسم البرنامج
    - `start_date` (date) - تاريخ البداية
    - `end_date` (date) - تاريخ النهاية
    - `crop_cycle_id` (uuid) - معرف العروة
    - `user_id` (uuid) - معرف المستخدم
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ### 9. advances (السلف الشخصية)
    - `id` (uuid, primary key)
    - `date` (date) - التاريخ
    - `amount` (numeric) - المبلغ
    - `description` (text) - الوصف
    - `user_id` (uuid) - معرف المستخدم
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ### 10. settings (الإعدادات)
    - `id` (uuid, primary key)
    - `user_id` (uuid) - معرف المستخدم
    - `theme` (text) - المظهر
    - `is_farmer_system_enabled` (boolean)
    - `is_supplier_system_enabled` (boolean)
    - `is_agricultural_programs_system_enabled` (boolean)
    - `is_treasury_system_enabled` (boolean)
    - `is_advances_system_enabled` (boolean)
    - `expense_categories` (jsonb) - فئات المصروفات
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## الأمان
  - تفعيل RLS على جميع الجداول
  - إضافة سياسات للوصول الآمن للبيانات
*/

-- Create greenhouses table
CREATE TABLE IF NOT EXISTS greenhouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  creation_date date NOT NULL,
  initial_cost numeric NOT NULL DEFAULT 0,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE greenhouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own greenhouses"
  ON greenhouses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own greenhouses"
  ON greenhouses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own greenhouses"
  ON greenhouses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own greenhouses"
  ON greenhouses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create farmers table
CREATE TABLE IF NOT EXISTS farmers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own farmers"
  ON farmers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own farmers"
  ON farmers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own farmers"
  ON farmers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own farmers"
  ON farmers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own suppliers"
  ON suppliers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own suppliers"
  ON suppliers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own suppliers"
  ON suppliers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create crop_cycles table
CREATE TABLE IF NOT EXISTS crop_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date date NOT NULL,
  status text NOT NULL DEFAULT 'نشطة',
  greenhouse_id uuid NOT NULL REFERENCES greenhouses(id) ON DELETE CASCADE,
  seed_type text NOT NULL,
  plant_count integer NOT NULL DEFAULT 0,
  production_start_date date,
  farmer_id uuid REFERENCES farmers(id) ON DELETE SET NULL,
  farmer_share_percentage numeric,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE crop_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own crop_cycles"
  ON crop_cycles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own crop_cycles"
  ON crop_cycles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own crop_cycles"
  ON crop_cycles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own crop_cycles"
  ON crop_cycles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  description text NOT NULL,
  type text NOT NULL,
  category text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  crop_cycle_id uuid NOT NULL REFERENCES crop_cycles(id) ON DELETE CASCADE,
  quantity numeric,
  price_items jsonb,
  quantity_grade1 numeric,
  price_grade1 numeric,
  quantity_grade2 numeric,
  price_grade2 numeric,
  discount numeric,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  fertilization_program_id uuid,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create farmer_withdrawals table
CREATE TABLE IF NOT EXISTS farmer_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  crop_cycle_id uuid NOT NULL REFERENCES crop_cycles(id) ON DELETE CASCADE,
  description text NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE farmer_withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own farmer_withdrawals"
  ON farmer_withdrawals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own farmer_withdrawals"
  ON farmer_withdrawals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own farmer_withdrawals"
  ON farmer_withdrawals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own farmer_withdrawals"
  ON farmer_withdrawals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create supplier_payments table
CREATE TABLE IF NOT EXISTS supplier_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  description text NOT NULL,
  linked_expense_ids text[],
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own supplier_payments"
  ON supplier_payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own supplier_payments"
  ON supplier_payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own supplier_payments"
  ON supplier_payments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own supplier_payments"
  ON supplier_payments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create fertilization_programs table
CREATE TABLE IF NOT EXISTS fertilization_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  crop_cycle_id uuid NOT NULL REFERENCES crop_cycles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE fertilization_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fertilization_programs"
  ON fertilization_programs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fertilization_programs"
  ON fertilization_programs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fertilization_programs"
  ON fertilization_programs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own fertilization_programs"
  ON fertilization_programs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create advances table
CREATE TABLE IF NOT EXISTS advances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  description text NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE advances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own advances"
  ON advances FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own advances"
  ON advances FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own advances"
  ON advances FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own advances"
  ON advances FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE DEFAULT auth.uid(),
  theme text NOT NULL DEFAULT 'system',
  is_farmer_system_enabled boolean NOT NULL DEFAULT false,
  is_supplier_system_enabled boolean NOT NULL DEFAULT false,
  is_agricultural_programs_system_enabled boolean NOT NULL DEFAULT false,
  is_treasury_system_enabled boolean NOT NULL DEFAULT false,
  is_advances_system_enabled boolean NOT NULL DEFAULT false,
  expense_categories jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
  ON settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_greenhouses_user_id ON greenhouses(user_id);
CREATE INDEX IF NOT EXISTS idx_farmers_user_id ON farmers(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_crop_cycles_user_id ON crop_cycles(user_id);
CREATE INDEX IF NOT EXISTS idx_crop_cycles_greenhouse_id ON crop_cycles(greenhouse_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_crop_cycle_id ON transactions(crop_cycle_id);
CREATE INDEX IF NOT EXISTS idx_farmer_withdrawals_user_id ON farmer_withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_user_id ON supplier_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_fertilization_programs_user_id ON fertilization_programs(user_id);
CREATE INDEX IF NOT EXISTS idx_advances_user_id ON advances(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);