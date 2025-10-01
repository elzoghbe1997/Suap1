import React, { useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../App';
import { AppContextType, Transaction, TransactionType, ExpenseCategory } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { RevenueIcon, ExpenseIcon, ProfitIcon, ActiveCycleIcon, AddIcon, InvoiceIcon, ReceiptIcon, CycleIcon } from './Icons';
import LoadingSpinner from './LoadingSpinner';

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border-r-4" style={{ borderColor: color }}>
        <div className="flex items-center">
             <div className="flex-shrink-0">
                {icon}
            </div>
            <div className="mr-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{value}</p>
            </div>
        </div>
    </div>
);

const QuickActionButton: React.FC<{ to: string; title: string; icon: React.ReactNode; color: string; }> = ({ to, title, icon, color }) => (
    <Link to={to} className={`flex items-center p-4 rounded-lg shadow-sm transition-all duration-200 ease-in-out transform hover:-translate-y-1 ${color}`}>
        {icon}
        <span className="mr-3 font-semibold text-white">{title}</span>
    </Link>
);


const Dashboard: React.FC = () => {
    const { cropCycles, transactions, loading } = useContext(AppContext) as AppContextType;

    const { totalRevenue, totalExpenses, totalProfit, activeCycles } = useMemo(() => {
        const totalRevenue = transactions
            .filter(t => t.type === TransactionType.REVENUE)
            .reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = transactions
            .filter(t => t.type === TransactionType.EXPENSE)
            .reduce((sum, t) => sum + t.amount, 0);
        const activeCycles = cropCycles.filter(c => c.status === 'نشطة').length;
        return {
            totalRevenue,
            totalExpenses,
            totalProfit: totalRevenue - totalExpenses,
            activeCycles
        };
    }, [transactions, cropCycles]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);
    };

    const monthlyData = useMemo(() => {
        const data: { [key: string]: { month: string; إيرادات: number; مصروفات: number } } = {};
        transactions.forEach(t => {
            const month = new Date(t.date).toLocaleString('ar-EG', { month: 'short', year: 'numeric' });
            if (!data[month]) {
                data[month] = { month, إيرادات: 0, مصروفات: 0 };
            }
            if (t.type === TransactionType.REVENUE) {
                data[month].إيرادات += t.amount;
            } else {
                data[month].مصروفات += t.amount;
            }
        });
        return Object.values(data).reverse();
    }, [transactions]);
    
    const expenseCategoryData = useMemo(() => {
        const data: { [key in ExpenseCategory]?: number } = {};
        transactions
            .filter(t => t.type === TransactionType.EXPENSE)
            .forEach(t => {
                data[t.category] = (data[t.category] || 0) + t.amount;
            });
        return Object.entries(data).map(([name, value]) => ({ name, value }));
    }, [transactions]);

    const COLORS = ['#10B981', '#3B82F6', '#F97316', '#EF4444', '#8B5CF6', '#F59E0B', '#6366F1'];

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard title="إجمالي الإيرادات" value={formatCurrency(totalRevenue)} icon={<RevenueIcon className="h-8 w-8 text-green-500"/>} color="#10B981" />
                <StatCard title="إجمالي المصروفات" value={formatCurrency(totalExpenses)} icon={<ExpenseIcon className="h-8 w-8 text-red-500"/>} color="#EF4444" />
                <StatCard title="صافي الربح" value={formatCurrency(totalProfit)} icon={<ProfitIcon className="h-8 w-8 text-blue-500"/>} color={totalProfit >= 0 ? "#3B82F6" : "#F97316"} />
                <StatCard title="العروات النشطة" value={activeCycles.toString()} icon={<ActiveCycleIcon className="h-8 w-8 text-yellow-500"/>} color="#F59E0B" />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">إجراءات سريعة</h2>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <QuickActionButton to="/cycles" title="إضافة عروة" icon={<CycleIcon className="w-6 h-6 text-white"/>} color="bg-green-500 hover:bg-green-600"/>
                    <QuickActionButton to="/invoices" title="إضافة فاتورة" icon={<InvoiceIcon className="w-6 h-6 text-white"/>} color="bg-blue-500 hover:bg-blue-600"/>
                    <QuickActionButton to="/expenses" title="إضافة مصروف" icon={<ReceiptIcon className="w-6 h-6 text-white"/>} color="bg-red-500 hover:bg-red-600"/>
                    <QuickActionButton to="/farmer-withdrawals" title="إضافة سحب" icon={<ExpenseIcon className="w-6 h-6 text-white"/>} color="bg-indigo-500 hover:bg-indigo-600"/>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">الأداء الشهري</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                            <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                            <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(value) => new Intl.NumberFormat('en-US', {notation: 'compact'}).format(value as number)} />
                            <Tooltip contentStyle={{backgroundColor: 'rgba(31, 41, 55, 0.9)', border: 'none', borderRadius: '0.5rem'}} labelStyle={{color: '#fff'}} itemStyle={{color: '#fff'}} formatter={(value) => formatCurrency(value as number)} />
                            <Legend />
                            <Bar dataKey="إيرادات" fill="#10B981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="مصروفات" fill="#EF4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
                     <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">تصنيفات المصروفات</h2>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={expenseCategoryData} cx="50%" cy="50%" labelLine={false} outerRadius={110} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {expenseCategoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(value as number)} contentStyle={{backgroundColor: 'rgba(31, 41, 55, 0.9)', border: 'none', borderRadius: '0.5rem'}}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold p-4 sm:p-6 text-gray-800 dark:text-white">أحدث المعاملات</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="py-3 px-4 text-right font-medium text-gray-500 dark:text-gray-300">التاريخ</th>
                                <th className="py-3 px-4 text-right font-medium text-gray-500 dark:text-gray-300">الوصف</th>
                                <th className="py-3 px-4 text-right font-medium text-gray-500 dark:text-gray-300">النوع</th>
                                <th className="py-3 px-4 text-right font-medium text-gray-500 dark:text-gray-300">المبلغ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {transactions.slice(0, 5).map(t => (
                                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="py-4 px-4 whitespace-nowrap">{t.date}</td>
                                    <td className="py-4 px-4 whitespace-nowrap">{t.description}</td>
                                    <td className="py-4 px-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${t.type === TransactionType.REVENUE ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                                            {t.type}
                                        </span>
                                    </td>
                                    <td className={`py-4 px-4 whitespace-nowrap font-medium ${t.type === TransactionType.REVENUE ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(t.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;