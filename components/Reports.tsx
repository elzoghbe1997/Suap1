import React from 'react';
import { AppContext } from '../App';
import { AppContextType, TransactionType } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import LoadingSpinner from './LoadingSpinner';

const ReportsPage: React.FC = () => {
    const { loading, cropCycles, transactions, greenhouses, settings } = React.useContext(AppContext) as AppContextType;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);
    };

    const cyclesPerformanceData = React.useMemo(() => {
        return cropCycles.map(cycle => {
            const cycleTransactions = transactions.filter(t => t.cropCycleId === cycle.id);
            const revenue = cycleTransactions.filter(t => t.type === TransactionType.REVENUE).reduce((sum, t) => sum + t.amount, 0);
            const expense = cycleTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
            let ownerProfit = revenue - expense;

            if (settings.isFarmerSystemEnabled && cycle.farmerId && cycle.farmerSharePercentage) {
                const farmerShare = revenue * (cycle.farmerSharePercentage / 100);
                ownerProfit -= farmerShare;
            }

            return {
                name: cycle.name,
                "صافي ربح المالك": ownerProfit,
            };
        }).sort((a, b) => b['صافي ربح المالك'] - a['صافي ربح المالك']);
    }, [cropCycles, transactions, settings.isFarmerSystemEnabled]);

    const expenseByGreenhouseData = React.useMemo(() => {
        const data: { [key: string]: number } = {};
        
        transactions
            .filter(t => t.type === TransactionType.EXPENSE)
            .forEach(t => {
                const cycle = cropCycles.find(c => c.id === t.cropCycleId);
                if(cycle) {
                    const greenhouse = greenhouses.find(g => g.id === cycle.greenhouseId);
                    if (greenhouse) {
                        data[greenhouse.name] = (data[greenhouse.name] || 0) + t.amount;
                    }
                }
            });

        return Object.entries(data).map(([name, value]) => ({ name, value }));
    }, [transactions, cropCycles, greenhouses]);

    const COLORS = ['#10B981', '#3B82F6', '#F97316', '#EF4444', '#8B5CF6', '#F59E0B', '#6366F1'];

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">التقارير التحليلية</h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">نظرة شاملة على أداء مشروعك المالي والزراعي.</p>
            </header>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">مقارنة أداء العروات (ربحية المالك)</h2>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={cyclesPerformanceData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                        <XAxis type="number" stroke="#9ca3af" fontSize={12} tickFormatter={(value) => new Intl.NumberFormat('en-US', {notation: 'compact'}).format(value as number)} />
                        <YAxis dataKey="name" type="category" width={150} stroke="#9ca3af" fontSize={12} />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', border: 'none', borderRadius: '0.5rem' }}
                            labelStyle={{ color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value) => formatCurrency(value as number)}
                        />
                        <Legend />
                        <Bar dataKey="صافي ربح المالك" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={25} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">تحليل المصروفات حسب الصوبة</h2>
                {expenseByGreenhouseData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                            <Pie
                                data={expenseByGreenhouseData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={130}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {expenseByGreenhouseData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value) => formatCurrency(value as number)}
                                contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', border: 'none', borderRadius: '0.5rem' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="text-center py-10">
                        <p className="text-gray-500 dark:text-gray-400">لا توجد بيانات مصروفات كافية لعرض هذا التحليل.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportsPage;