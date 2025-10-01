import React, { useState, useContext, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import { AppContext } from '../App';
import { AppContextType, CropCycle, CropCycleStatus, TransactionType, Greenhouse, ExpenseCategory, Farmer } from '../types';
import { ToastContext, ToastContextType } from '../context/ToastContext';
import { AddIcon, EditIcon, SeedIcon, GreenhouseIcon, CalendarIcon, CalendarCheckIcon, PlantIcon, ReportIcon, CloseIcon, RevenueIcon, ExpenseIcon, ProfitIcon, YieldIcon, FarmerIcon, DocumentSearchIcon, BrainCircuitIcon, SparklesIcon } from './Icons';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import SkeletonCard from './SkeletonCard';
import LoadingSpinner from './LoadingSpinner';


const formInputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500";
const searchInputClass = "block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500";

const AIAnalysisDisplay: React.FC<{ analysis: string }> = ({ analysis }) => {
    const formatText = (text: string) => {
        // Process lists and bold text
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const html = lines.map(line => {
            line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
                return `<li>${line.trim().substring(2)}</li>`;
            }
            return `<p>${line}</p>`;
        }).join('');
        
        // Wrap list items in <ul>
        return `<div>${html.replace(/<\/li><li>/g, '</li><li>').replace(/<p>(<li>.*<\/li>)<\/p>/g, '<ul>$1</ul>')}</div>`;
    };

    return (
        <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: formatText(analysis) }} />
    );
};

// FIX: Updated onSave prop type to correctly handle both add and edit scenarios.
const CropCycleForm: React.FC<{ cycle?: CropCycle; onSave: (cycle: Omit<CropCycle, 'id' | 'productionStartDate'> | CropCycle) => void; onCancel: () => void; greenhouses: Greenhouse[]; farmers: Farmer[]; isFarmerSystemEnabled: boolean; }> = ({ cycle, onSave, onCancel, greenhouses, farmers, isFarmerSystemEnabled }) => {
    const { addToast } = useContext(ToastContext) as ToastContextType;
    const [name, setName] = useState(cycle?.name || '');
    const [seedType, setSeedType] = useState(cycle?.seedType || '');
    const [plantCount, setPlantCount] = useState(cycle?.plantCount?.toString() || '');
    const [startDate, setStartDate] = useState(cycle?.startDate || new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState<CropCycleStatus>(cycle?.status || CropCycleStatus.ACTIVE);
    const [greenhouseId, setGreenhouseId] = useState(cycle?.greenhouseId || '');
    const [farmerId, setFarmerId] = useState(cycle?.farmerId || '');
    const [farmerSharePercentage, setFarmerSharePercentage] = useState(cycle?.farmerSharePercentage?.toString() || '20');


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const numericPlantCount = Number(plantCount);
        if (numericPlantCount <= 0) {
            addToast('عدد النباتات يجب أن يكون أكبر من صفر.', 'error');
            return;
        }

        const data = { 
            name, 
            startDate, 
            status, 
            greenhouseId, 
            seedType, 
            plantCount: numericPlantCount, 
            farmerId: farmerId || null,
            farmerSharePercentage: farmerId ? Number(farmerSharePercentage) : null,
        };

        if (cycle) {
            onSave({ ...cycle, ...data });
        } else {
            onSave(data);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">اسم العروة</label>
                    <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className={formInputClass}/>
                </div>
                 <div>
                    <label htmlFor="seedType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">نوع البذرة</label>
                    <input type="text" id="seedType" value={seedType} onChange={(e) => setSeedType(e.target.value)} required className={formInputClass}/>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="plantCount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">عدد النباتات</label>
                    <input type="number" id="plantCount" value={plantCount} onChange={(e) => setPlantCount(e.target.value)} required min="1" className={formInputClass}/>
                </div>
                <div>
                    <label htmlFor="greenhouseId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">الصوبة</label>
                    <select id="greenhouseId" value={greenhouseId} onChange={(e) => setGreenhouseId(e.target.value)} required className={formInputClass}>
                        <option value="" disabled>اختر صوبة</option>
                        {greenhouses.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">تاريخ البدء</label>
                    <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className={formInputClass}/>
                </div>
                 <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">الحالة</label>
                    <select id="status" value={status} onChange={(e) => setStatus(e.target.value as CropCycleStatus)} required className={formInputClass}>
                        {Object.values(CropCycleStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>
             {isFarmerSystemEnabled && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="farmerId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">المزارع المسؤول</label>
                        <select id="farmerId" value={farmerId || ''} onChange={(e) => setFarmerId(e.target.value)} className={formInputClass}>
                            <option value="">بدون مزارع</option>
                            {farmers.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                    </div>
                    {farmerId && (
                        <div>
                            <label htmlFor="farmerSharePercentage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">نسبة المزارع (%)</label>
                            <input type="number" id="farmerSharePercentage" value={farmerSharePercentage} onChange={(e) => setFarmerSharePercentage(e.target.value)} required min="0" max="100" className={formInputClass}/>
                        </div>
                    )}
                </div>
            )}
            <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">إلغاء</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">حفظ</button>
            </div>
        </form>
    );
};

const ReportStatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        <div className="flex items-center">
            {icon}
            <div className="mr-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-xl font-bold text-gray-800 dark:text-gray-200">{value}</p>
            </div>
        </div>
    </div>
);

const CropCycleReportModal: React.FC<{ cycle: CropCycle; onClose: () => void }> = ({ cycle, onClose }) => {
    const { transactions, greenhouses, settings, farmers, farmerWithdrawals } = useContext(AppContext) as AppContextType;
    const { addToast } = useContext(ToastContext) as ToastContextType;
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);
    
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState('');
    const [analysisError, setAnalysisError] = useState('');

    const { revenue, expense, profit, expenseCategoryData, totalYield } = useMemo(() => {
        const cycleTransactions = transactions.filter(t => t.cropCycleId === cycle.id);
        const revenue = cycleTransactions.filter(t => t.type === TransactionType.REVENUE).reduce((sum, t) => sum + t.amount, 0);
        const expense = cycleTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
        const totalYield = cycleTransactions.filter(t => t.type === TransactionType.REVENUE).reduce((sum, t) => sum + (t.quantity || 0), 0);
        
        const expenseData: { [key in ExpenseCategory]?: number } = {};
        cycleTransactions.filter(t => t.type === TransactionType.EXPENSE).forEach(t => {
            expenseData[t.category] = (expenseData[t.category] || 0) + t.amount;
        });
        const expenseCategoryData = Object.entries(expenseData).map(([name, value]) => ({ name, value }));

        return { revenue, expense, profit: revenue - expense, expenseCategoryData, totalYield };
    }, [transactions, cycle.id]);
    
    const farmerDetails = useMemo(() => {
        if (!settings.isFarmerSystemEnabled || !cycle.farmerId || cycle.farmerSharePercentage == null) return null;
        
        const farmer = farmers.find(f => f.id === cycle.farmerId);
        if (!farmer) return null;

        const share = revenue * (cycle.farmerSharePercentage / 100);
        const withdrawals = farmerWithdrawals
            .filter(w => w.cropCycleId === cycle.id)
            .reduce((sum, w) => sum + w.amount, 0);
        const balance = share - withdrawals;
        
        return { name: farmer.name, share, withdrawals, balance };
    }, [settings, cycle, farmers, farmerWithdrawals, revenue]);

    const greenhouseName = useMemo(() => greenhouses.find(g => g.id === cycle.greenhouseId)?.name || 'غير محددة', [greenhouses, cycle.greenhouseId]);
    
    const revenuePerPlant = cycle.plantCount > 0 ? revenue / cycle.plantCount : 0;
    const costPerPlant = cycle.plantCount > 0 ? expense / cycle.plantCount : 0;
    const profitPerPlant = cycle.plantCount > 0 ? profit / cycle.plantCount : 0;
    const yieldPerPlant = cycle.plantCount > 0 ? totalYield / cycle.plantCount : 0;
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

    const COLORS = ['#10B981', '#3B82F6', '#F97316', '#EF4444', '#8B5CF6', '#F59E0B', '#6366F1'];

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setAiAnalysis('');
        setAnalysisError('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const dataForAI = {
                cycleInfo: { name: cycle.name, seedType: cycle.seedType, plantCount: cycle.plantCount, startDate: cycle.startDate },
                financials: { revenue, expense, profit, profitMargin: profitMargin.toFixed(1) + '%' },
                expenseBreakdown: expenseCategoryData,
            };

            const prompt = `بصفتك مرشدًا زراعيًا وخبيرًا ماليًا، قم بتحليل بيانات العروة التالية. قدم ملخصًا موجزًا (3-4 نقاط رئيسية) باللغة العربية. ركز على:
            1. تقييم الربحية الإجمالية وهامش الربح.
            2. تحديد أي بند من بنود المصروفات يبدو مرتفعًا بشكل غير عادي مقارنة بالإيرادات.
            3. تقديم توصية عملية واحدة على الأقل لتحسين الربحية في العروات المستقبلية (مثل اقتراح لخفض التكاليف أو تحسين الإنتاج).
            
            استخدم تنسيق Markdown البسيط (مثل **للنص العريض** و * للوائح) لجعل التحليل واضحًا ومباشرًا وسهل الفهم للمزارع.

            بيانات العروة:
            ${JSON.stringify(dataForAI, null, 2)}`;
            
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
            });

            setAiAnalysis(response.text);

        } catch (error) {
            console.error("AI Analysis failed:", error);
            setAnalysisError("حدث خطأ أثناء الاتصال بالمرشد الذكي. يرجى المحاولة مرة أخرى.");
            addToast("حدث خطأ أثناء تحليل البيانات.", "error");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">تقرير العروة: {cycle.name}</h2>
                        <p className="text-gray-500 dark:text-gray-400">{greenhouseName} - {cycle.seedType}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-6">
                     <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                            <div className="flex items-center">
                                <BrainCircuitIcon className="w-8 h-8 text-indigo-500 ml-3" />
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">المرشد الزراعي الذكي</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">احصل على تحليل وتوصيات لتحسين أداء عرواتك.</p>
                                </div>
                            </div>
                            <button onClick={handleAnalyze} disabled={isAnalyzing} className="flex-shrink-0 flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:bg-indigo-800">
                                <SparklesIcon className="w-5 h-5 ml-2" />
                                <span>{isAnalyzing ? 'جاري التحليل...' : 'تحليل بالذكاء الاصطناعي'}</span>
                            </button>
                        </div>
                        {isAnalyzing && <div className="mt-4 text-center"><LoadingSpinner /></div>}
                        {analysisError && <p className="mt-4 text-center text-red-500">{analysisError}</p>}
                        {aiAnalysis && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                 <AIAnalysisDisplay analysis={aiAnalysis} />
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">مقاييس الربحية</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           <ReportStatCard title="صافي الربح" value={formatCurrency(profit)} icon={<ProfitIcon className={`w-7 h-7 ${profit >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />} />
                           <ReportStatCard title="هامش الربح" value={`${profitMargin.toFixed(1)}%`} icon={<ProfitIcon className="w-7 h-7 text-blue-500" />} />
                           <ReportStatCard title="إجمالي الإيرادات" value={formatCurrency(revenue)} icon={<RevenueIcon className="w-7 h-7 text-green-500" />} />
                           <ReportStatCard title="إجمالي المصروفات" value={formatCurrency(expense)} icon={<ExpenseIcon className="w-7 h-7 text-red-500" />} />
                        </div>
                    </div>
                    
                    {farmerDetails && (
                        <div>
                            <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">حساب المزارع: {farmerDetails.name} ({cycle.farmerSharePercentage}%)</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <ReportStatCard title="حصة المزارع" value={formatCurrency(farmerDetails.share)} icon={<FarmerIcon className="w-7 h-7 text-indigo-500" />} />
                                <ReportStatCard title="إجمالي المسحوبات" value={formatCurrency(farmerDetails.withdrawals)} icon={<ExpenseIcon className="w-7 h-7 text-red-500" />} />
                                <ReportStatCard title="الرصيد المتبقي" value={formatCurrency(farmerDetails.balance)} icon={<ProfitIcon className={`w-7 h-7 ${farmerDetails.balance >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />} />
                            </div>
                        </div>
                    )}
                    
                    <div>
                        <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">تقرير الإنتاج</h3>
                        <div className="grid grid-cols-2 gap-4">
                           <ReportStatCard title="إجمالي الإنتاج (ك.ج)" value={`${totalYield.toLocaleString('en-US')} ك.ج`} icon={<YieldIcon className="w-7 h-7 text-teal-500" />} />
                           <ReportStatCard title="إنتاج النبات الواحد (ك.ج)" value={`${yieldPerPlant.toFixed(2)} ك.ج`} icon={<YieldIcon className="w-7 h-7 text-teal-500" />} />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">تحليل لكل نبات</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                           <ReportStatCard title="صافي ربح النبات" value={formatCurrency(profitPerPlant)} icon={<PlantIcon className={`w-7 h-7 ${profitPerPlant >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />} />
                           <ReportStatCard title="إيراد النبات" value={formatCurrency(revenuePerPlant)} icon={<PlantIcon className="w-7 h-7 text-green-500" />} />
                           <ReportStatCard title="تكلفة النبات" value={formatCurrency(costPerPlant)} icon={<PlantIcon className="w-7 h-7 text-red-500" />} />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">تحليل المصروفات</h3>
                        {expenseCategoryData.length > 0 ? (
                             <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={expenseCategoryData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                                        {expenseCategoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(value, name) => [formatCurrency(value as number), name]} contentStyle={{backgroundColor: 'rgba(31, 41, 55, 0.9)', border: 'none', borderRadius: '0.5rem'}}/>
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <p className="text-center text-gray-500 dark:text-gray-400 py-8">لا توجد مصروفات مسجلة لهذه العروة.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};


const CropCycleCard: React.FC<{cycle: CropCycle; onEdit: () => void; onViewReport: () => void;}> = ({cycle, onEdit, onViewReport}) => {
    const { transactions, greenhouses, farmers, settings } = useContext(AppContext) as AppContextType;

    const { revenue, expense, profit } = useMemo(() => {
        const cycleTransactions = transactions.filter(t => t.cropCycleId === cycle.id);
        const revenue = cycleTransactions.filter(t => t.type === TransactionType.REVENUE).reduce((sum, t) => sum + t.amount, 0);
        const expense = cycleTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
        return { revenue, expense, profit: revenue - expense };
    }, [transactions, cycle.id]);
    
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);
    
    const greenhouseName = useMemo(() => greenhouses.find(g => g.id === cycle.greenhouseId)?.name || 'غير محددة', [greenhouses, cycle.greenhouseId]);
    const farmerName = useMemo(() => {
        if(!settings.isFarmerSystemEnabled || !cycle.farmerId) return null;
        return farmers.find(f => f.id === cycle.farmerId)?.name || null;
    }, [farmers, cycle.farmerId, settings.isFarmerSystemEnabled]);

    const statusColor = {
        [CropCycleStatus.ACTIVE]: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        [CropCycleStatus.CLOSED]: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        [CropCycleStatus.ARCHIVED]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md transition-shadow hover:shadow-xl">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">{cycle.name}</h3>
                     <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <p className="flex items-center">
                            <CalendarIcon className="w-4 h-4 ml-2 text-gray-400" />
                            <span><span className="font-medium text-gray-700 dark:text-gray-300">تاريخ البدء:</span> {cycle.startDate}</span>
                        </p>
                         {cycle.productionStartDate && (
                            <p className="flex items-center">
                                <CalendarCheckIcon className="w-4 h-4 ml-2 text-teal-500" />
                                <span><span className="font-medium text-gray-700 dark:text-gray-300">بدء الإنتاج:</span> {cycle.productionStartDate}</span>
                            </p>
                        )}
                        <p className="flex items-center">
                            <SeedIcon className="w-4 h-4 ml-2 text-green-500" />
                            <span><span className="font-medium text-gray-700 dark:text-gray-300">نوع البذرة:</span> {cycle.seedType} ({cycle.plantCount} نبات)</span>
                        </p>
                        <p className="flex items-center">
                            <GreenhouseIcon className="w-4 h-4 ml-2 text-blue-500" />
                            <span><span className="font-medium text-gray-700 dark:text-gray-300">الصوبة:</span> {greenhouseName}</span>
                        </p>
                        {farmerName && (
                             <p className="flex items-center">
                                <FarmerIcon className="w-4 h-4 ml-2 text-indigo-500" />
                                <span><span className="font-medium text-gray-700 dark:text-gray-300">المزارع:</span> {farmerName} ({cycle.farmerSharePercentage}%)</span>
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex-shrink-0">
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusColor[cycle.status]}`}>{cycle.status}</span>
                </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center border-t border-gray-200 dark:border-gray-700 pt-4">
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">الإيرادات</p>
                    <p className="text-lg font-semibold text-green-600">{formatCurrency(revenue)}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">المصروفات</p>
                    <p className="text-lg font-semibold text-red-600">{formatCurrency(expense)}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">الربح</p>
                    <p className={`text-lg font-semibold ${profit >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>{formatCurrency(profit)}</p>
                </div>
            </div>
             <div className="flex justify-between items-center mt-4">
                <button onClick={onViewReport} className="flex items-center px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                    <ReportIcon className="w-4 h-4 ml-1.5"/>
                    <span>عرض التقرير</span>
                </button>
                <button onClick={onEdit} className="p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <EditIcon className="w-5 h-5"/>
                </button>
            </div>
        </div>
    );
};

const EmptyState: React.FC<{ message: string; subMessage: string; icon: React.ReactNode }> = ({ message, subMessage, icon }) => (
    <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
        <div className="flex justify-center mb-4 text-gray-400 dark:text-gray-500">{icon}</div>
        <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">{message}</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subMessage}</p>
    </div>
);


const CropCyclesPage: React.FC = () => {
    const { loading, cropCycles, addCropCycle, updateCropCycle, greenhouses, farmers, settings } = useContext(AppContext) as AppContextType;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCycle, setEditingCycle] = useState<CropCycle | null>(null);

    const [filterGreenhouse, setFilterGreenhouse] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'active' | 'closed' | 'archived'>('active');
    const [viewingReportFor, setViewingReportFor] = useState<CropCycle | undefined>();

    const handleSave = (cycle: Omit<CropCycle, 'id' | 'productionStartDate'> | CropCycle) => {
        if ('id' in cycle) {
            updateCropCycle(cycle);
        } else {
            addCropCycle(cycle);
        }
        setIsModalOpen(false);
        setEditingCycle(null);
    };
    
    const handleOpenAddModal = () => {
        setEditingCycle(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (cycle: CropCycle) => {
        setEditingCycle(cycle);
        setIsModalOpen(true);
    };

    const filteredCycles = useMemo(() => {
        const statusMap = {
            'active': CropCycleStatus.ACTIVE,
            'closed': CropCycleStatus.CLOSED,
            'archived': CropCycleStatus.ARCHIVED
        };
        const statusToFilter = statusMap[activeTab];

        let cycles = cropCycles.filter(c => c.status === statusToFilter);

        if (filterGreenhouse !== 'all') {
            cycles = cycles.filter(c => c.greenhouseId === filterGreenhouse);
        }

        if (searchQuery) {
            cycles = cycles.filter(c => 
                c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                c.seedType.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        return cycles.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    }, [cropCycles, filterGreenhouse, searchQuery, activeTab]);
    
    const tabButtonClass = (tabName: 'active' | 'closed' | 'archived') => 
        `whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-colors duration-200 ${
            activeTab === tabName
            ? 'border-green-500 text-green-600 dark:text-green-400'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
        }`;

    const renderContent = () => {
        if (loading) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
            );
        }
        if (filteredCycles.length > 0) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredCycles.map(cycle => 
                        <CropCycleCard 
                            key={cycle.id} 
                            cycle={cycle} 
                            onEdit={() => handleOpenEditModal(cycle)}
                            onViewReport={() => setViewingReportFor(cycle)} 
                        />
                    )}
                </div>
            );
        }
        return (
            <div className="md:col-span-2 xl:col-span-3">
                <EmptyState 
                    message="لا توجد عروات تطابق بحثك"
                    subMessage="جرّب تغيير الفلاتر أو البحث بكلمة أخرى."
                    icon={<DocumentSearchIcon className="w-16 h-16"/>}
                />
            </div>
        );
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                <button onClick={handleOpenAddModal} className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
                    <AddIcon className="w-5 h-5 ml-2" />
                    <span>إضافة عروة</span>
                </button>
                <div className="flex-grow flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 min-w-[150px]">
                        <input 
                            type="text"
                            placeholder="ابحث عن عروة..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className={searchInputClass}
                        />
                    </div>
                    <div className="flex-1 min-w-[150px]">
                        <select id="filterGreenhouse" value={filterGreenhouse} onChange={e => setFilterGreenhouse(e.target.value)} className={formInputClass.replace('mt-1', '')}>
                            <option value="all">كل الصوب</option>
                            {greenhouses.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>
            
            <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                <nav className="flex -mb-px space-x-4 space-x-reverse" aria-label="Tabs">
                    <button onClick={() => setActiveTab('active')} className={tabButtonClass('active')}>عروات نشطة</button>
                    <button onClick={() => setActiveTab('closed')} className={tabButtonClass('closed')}>عروات مغلقة</button>
                    <button onClick={() => setActiveTab('archived')} className={tabButtonClass('archived')}>عروات مؤرشفة</button>
                </nav>
            </div>

            {renderContent()}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
                            {editingCycle ? 'تعديل العروة' : 'إضافة عروة جديدة'}
                        </h2>
                        <CropCycleForm 
                            cycle={editingCycle ?? undefined}
                            onSave={handleSave} 
                            onCancel={() => { setIsModalOpen(false); setEditingCycle(null); }} 
                            greenhouses={greenhouses} 
                            farmers={farmers} 
                            isFarmerSystemEnabled={settings.isFarmerSystemEnabled} 
                        />
                    </div>
                </div>
            )}

            {viewingReportFor && (
                <CropCycleReportModal cycle={viewingReportFor} onClose={() => setViewingReportFor(undefined)} />
            )}
        </div>
    );
};

export default CropCyclesPage;