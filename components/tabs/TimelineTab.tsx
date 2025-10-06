import React from 'react';
import { AppContext } from '../../App';
import { AppContextType, CropCycle, TransactionType, FarmerWithdrawal, FertilizationProgram } from '../../types';
import { CalendarIcon, ReceiptIcon, InvoiceIcon, ProgramIcon, ExpenseIcon } from '../Icons';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);

interface TimelineEvent {
    date: string;
    type: 'start' | 'expense' | 'revenue' | 'program' | 'withdrawal';
    Icon: React.FC<React.SVGProps<SVGSVGElement>>;
    color: string;
    title: string;
    details: React.ReactNode;
}

const TimelineItem: React.FC<{ event: TimelineEvent }> = ({ event }) => {
    return (
        <div className="timeline-item flex">
            <div className="timeline-icon-container">
                <span className={`h-10 w-10 rounded-full flex items-center justify-center ring-4 ring-slate-50 dark:ring-slate-800 ${event.color}`}>
                    <event.Icon className="h-5 w-5 text-white" />
                </span>
            </div>
            <div className={`mr-16 mb-8 w-full p-4 rounded-lg shadow bg-white dark:bg-slate-700 border-l-4 ${event.color.replace('bg-', 'border-')}`}>
                 <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{event.title}</p>
                 <time className="text-xs text-slate-500 dark:text-slate-400">{event.date}</time>
                 <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{event.details}</div>
            </div>
        </div>
    );
};

const TimelineTab: React.FC<{ cycle: CropCycle }> = ({ cycle }) => {
    const { transactions, fertilizationPrograms, farmerWithdrawals, settings } = React.useContext(AppContext) as AppContextType;
    type FilterType = 'all' | 'financial' | 'activity' | 'withdrawal';
    const [filter, setFilter] = React.useState<FilterType>('all');

    const timelineEvents = React.useMemo(() => {
        const events: TimelineEvent[] = [];

        events.push({ date: cycle.startDate, type: 'start', Icon: CalendarIcon, color: 'bg-emerald-500', title: 'بدء العروة', details: <p>{cycle.seedType} - {cycle.plantCount} نبات</p> });
        transactions.filter(t => t.cropCycleId === cycle.id).forEach(t => {
            if (t.type === TransactionType.EXPENSE) {
                events.push({ date: t.date, type: 'expense', Icon: ReceiptIcon, color: 'bg-rose-500', title: `مصروف: ${t.category}`, details: <p>{t.description} - <span className="font-bold">{formatCurrency(t.amount)}</span></p> });
            } else {
                events.push({ date: t.date, type: 'revenue', Icon: InvoiceIcon, color: 'bg-sky-500', title: 'فاتورة بيع', details: <p>{t.description} - <span className="font-bold">{formatCurrency(t.amount)}</span> ({t.quantity} ك.ج)</p> });
            }
        });
        fertilizationPrograms.filter(p => p.cropCycleId === cycle.id).forEach(p => {
            events.push({ date: p.startDate, type: 'program', Icon: ProgramIcon, color: 'bg-blue-500', title: 'بداية برنامج', details: <p>{p.name}</p> });
            events.push({ date: p.endDate, type: 'program', Icon: ProgramIcon, color: 'bg-slate-500', title: 'نهاية برنامج', details: <p>{p.name}</p> });
        });
        farmerWithdrawals.filter(w => w.cropCycleId === cycle.id).forEach(w => {
            events.push({ date: w.date, type: 'withdrawal', Icon: ExpenseIcon, color: 'bg-indigo-500', title: 'سحب للمزارع', details: <p>{w.description} - <span className="font-bold">{formatCurrency(w.amount)}</span></p> });
        });
        
        const filtered = events.filter(event => {
            if (filter === 'all') return true;
            if (filter === 'financial') return ['expense', 'revenue'].includes(event.type);
            if (filter === 'activity') return ['start', 'program'].includes(event.type);
            if (filter === 'withdrawal') return event.type === 'withdrawal';
            return false;
        });

        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    }, [cycle, transactions, fertilizationPrograms, farmerWithdrawals, filter]);

    const FilterButton: React.FC<{ filterType: FilterType, label: string }> = ({ filterType, label }) => {
        const isActive = filter === filterType;
        return (
            <button
                onClick={() => setFilter(filterType)}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                    isActive ? 'bg-emerald-600 text-white shadow' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                }`}
            >
                {label}
            </button>
        );
    };

    return (
        <div className="animate-fadeInSlideUp">
            <div className="flex flex-wrap gap-2 mb-6 p-2 bg-slate-100 dark:bg-slate-900 rounded-lg">
                <FilterButton filterType="all" label="الكل" />
                <FilterButton filterType="financial" label="المعاملات المالية" />
                <FilterButton filterType="activity" label="الأنشطة الزراعية" />
                {settings.isFarmerSystemEnabled && cycle.farmerId && <FilterButton filterType="withdrawal" label="سحوبات المزارع" />}
            </div>

            {timelineEvents.length > 0 ? (
                <div className="relative timeline-container pr-4">
                    {timelineEvents.map((event, index) => (
                        <TimelineItem key={`${event.date}-${event.title}-${index}`} event={event} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <p className="text-lg font-semibold text-slate-600 dark:text-slate-300">لا توجد أحداث تطابق الفلتر</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">جرّب اختيار فلتر آخر.</p>
                </div>
            )}
        </div>
    );
};

export default TimelineTab;
