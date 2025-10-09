import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppContext } from '../App';
import { AppContextType, CropCycle, Greenhouse } from '../types';
import { ArrowRightIcon, GreenhouseIcon, SeedIcon } from './Icons';
import LoadingSpinner from './LoadingSpinner';
import OverviewTab from './tabs/OverviewTab';
import TransactionsTab from './tabs/TransactionsTab';
import ProgramsTab from './tabs/ProgramsTab';
import FarmerTab from './tabs/FarmerTab';
import TimelineTab from './tabs/TimelineTab';


const CropCycleDetailsPage: React.FC = () => {
    const { cropCycleId } = useParams<{ cropCycleId: string }>();
    const { loading, cropCycles, greenhouses, settings } = React.useContext(AppContext) as AppContextType;
    type TabType = 'overview' | 'transactions' | 'programs' | 'farmer' | 'timeline';
    const [activeTab, setActiveTab] = React.useState<TabType>('overview');

    const cycle = React.useMemo(() => cropCycles.find(c => c.id === cropCycleId), [cropCycles, cropCycleId]);
    const greenhouse = React.useMemo(() => greenhouses.find(g => g.id === cycle?.greenhouseId), [greenhouses, cycle]);
    
    if (loading) return <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>;
    if (!cycle) return <div className="text-center p-8">لم يتم العثور على العروة.</div>;

    const tabButtonClass = (tabName: TabType) => 
        `whitespace-nowrap py-3 px-4 border-b-2 font-medium text-base transition-colors duration-200 ${
            activeTab === tabName
            ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:border-slate-600'
        }`;
    
    return (
        <div className="space-y-6">
            <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                     <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-2">
                        <Link to="/cycles" className="hover:underline">إدارة العروات</Link>
                        <ArrowRightIcon className="w-4 h-4 mx-2 transform scale-x-[-1]" />
                        <span>{cycle.name}</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{cycle.name}</h1>
                    <div className="flex items-center text-md text-slate-500 dark:text-slate-400 mt-1">
                        <GreenhouseIcon className="w-5 h-5 ml-2 text-sky-500"/>
                        <span>{greenhouse?.name}</span>
                        <span className="mx-2">|</span>
                        <SeedIcon className="w-5 h-5 ml-2 text-emerald-500"/>
                        <span>{cycle.seedType}</span>
                    </div>
                </div>
            </header>
            
             <div className="border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-4 space-x-reverse overflow-x-auto hide-scrollbar">
                    <button onClick={() => setActiveTab('overview')} className={tabButtonClass('overview')}>نظرة عامة</button>
                    <button onClick={() => setActiveTab('transactions')} className={tabButtonClass('transactions')}>المعاملات</button>
                    {settings.isAgriculturalProgramsSystemEnabled && <button onClick={() => setActiveTab('programs')} className={tabButtonClass('programs')}>البرامج الزراعية</button>}
                    <button onClick={() => setActiveTab('timeline')} className={tabButtonClass('timeline')}>الجدول الزمني</button>
                    {settings.isFarmerSystemEnabled && cycle.farmerId && <button onClick={() => setActiveTab('farmer')} className={tabButtonClass('farmer')}>حساب المزارع</button>}
                </nav>
            </div>

            <div className="pt-4">
                {activeTab === 'overview' && <OverviewTab cycle={cycle} />}
                {activeTab === 'transactions' && <TransactionsTab cycle={cycle} />}
                {activeTab === 'programs' && settings.isAgriculturalProgramsSystemEnabled && <ProgramsTab cycle={cycle} />}
                {activeTab === 'timeline' && <TimelineTab cycle={cycle} />}
                {activeTab === 'farmer' && settings.isFarmerSystemEnabled && cycle.farmerId && <FarmerTab cycle={cycle} />}
            </div>
        </div>
    );
};


export default CropCycleDetailsPage;
