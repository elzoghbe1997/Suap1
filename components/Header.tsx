import React, { FC, memo, useContext, useState, useEffect, MouseEvent } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../App.tsx';
import { AppContextType, Alert, AlertType, CropCycle } from '../types.ts';
import { MenuIcon, AlertIcon, WarningIcon } from './Icons.tsx';
import InstallPWAButton from './InstallPWAButton.tsx';

const AlertsDropdown: FC<{ alerts: Alert[]; onClose: () => void }> = memo(({ alerts, onClose }) => {
    const navigate = useNavigate();

    const handleAlertClick = (alert: Alert) => {
        onClose(); // Close the dropdown first
        switch (alert.type) {
            case AlertType.HIGH_COST:
            case AlertType.STAGNANT_CYCLE:
                navigate(`/cycles/${alert.relatedId}`);
                break;
            case AlertType.NEGATIVE_BALANCE:
                navigate('/farmer-accounts', { state: { highlightFarmerId: alert.relatedId } });
                break;
            default:
                break;
        }
    };

    return (
        <div 
            className="origin-top-left absolute left-0 mt-2 w-80 rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="menu-button"
        >
            <div className="py-1" role="none">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">التنبيهات ({alerts.length})</p>
                </div>
                {alerts.length > 0 ? (
                    <div className="max-h-80 overflow-y-auto">
                        {alerts.map(alert => (
                            <button
                                key={alert.id}
                                onClick={() => handleAlertClick(alert)}
                                className="w-full text-right block px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                                role="menuitem"
                            >
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 mt-0.5">
                                        <WarningIcon className="h-5 w-5 text-yellow-500" />
                                    </div>
                                    <div className="mr-3 w-0 flex-1">
                                        <p className="font-medium">{alert.type}</p>
                                        <p className="text-slate-500 dark:text-slate-400">{alert.message}</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-6">لا توجد تنبيهات جديدة.</p>
                )}
            </div>
        </div>
    );
});

const DynamicTitle: FC = () => {
    const location = useLocation();
    const params = useParams();
    const { cropCycles } = useContext(AppContext) as AppContextType;

    const getPageTitle = () => {
        const path = location.pathname;
        const { cropCycleId } = params;

        if (path.startsWith('/cycles/') && cropCycleId) {
            const cycle = cropCycles.find(c => c.id === cropCycleId);
            return cycle ? `تفاصيل: ${cycle.name}` : 'تفاصيل العروة';
        }
        if (path.startsWith('/treasury/') && cropCycleId) {
            const cycle = cropCycles.find(c => c.id === cropCycleId);
            return cycle ? `صندوق: ${cycle.name}` : 'تفاصيل الصندوق';
        }
        if (path.startsWith('/greenhouse/') && path.endsWith('/report')) return 'تقرير الصوبة';
        
        switch (path) {
          case '/dashboard': return 'لوحة التحكم';
          case '/cycles': return 'إدارة العروات';
          case '/invoices': return 'إدارة الفواتير';
          case '/expenses': return 'إدارة المصروفات';
          case '/advances': return 'إدارة السلف الشخصية';
          case '/programs': return 'أرباح البرامج الزراعية';
          case '/farmer-accounts': return 'ادارة حساب المزارع';
          case '/suppliers': return 'حسابات الموردين';
          case '/greenhouse': return 'إدارة الصوبة';
          case '/treasury': return 'صناديق العروات';
          case '/reports': return 'التقارير';
          case '/settings': return 'الإعدادات';
          default: return 'المحاسب الزراعي';
        }
    };

    return <h1 className="text-xl font-semibold text-slate-800 dark:text-white mr-4 whitespace-nowrap overflow-hidden text-ellipsis">{getPageTitle()}</h1>;
};


interface HeaderProps {
    toggleSidebar: () => void;
}

const Header: FC<HeaderProps> = ({ toggleSidebar }) => {
  const { alerts } = useContext(AppContext) as AppContextType;
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  
    const handleAlertsToggle = (e: MouseEvent) => {
        e.stopPropagation();
        setIsAlertsOpen(prev => !prev);
    };
    
    useEffect(() => {
        const close = () => setIsAlertsOpen(false);
        if (isAlertsOpen) {
            window.addEventListener('click', close);
        }
        return () => window.removeEventListener('click', close);
    }, [isAlertsOpen]);


  return (
    <header className="sticky top-0 bg-white/70 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 z-20 flex-shrink-0">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        <div className="flex items-center min-w-0">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
              aria-label="Toggle sidebar"
            >
               <MenuIcon className="h-6 w-6" />
            </button>
            <DynamicTitle />
        </div>
        
        <div className="flex items-center space-x-2">
            <InstallPWAButton />
            <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={handleAlertsToggle}
                    className="p-2 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
                    aria-label="Toggle alerts"
                >
                    <AlertIcon className="h-6 w-6" />
                    {alerts.length > 0 && (
                        <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900"></span>
                    )}
                </button>
                {isAlertsOpen && <AlertsDropdown alerts={alerts} onClose={() => setIsAlertsOpen(false)} />}
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;