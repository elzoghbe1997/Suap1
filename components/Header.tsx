import React, { useState, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { AppContext } from '../App';
import { AppContextType, Alert, Theme } from '../types';
import { MenuIcon, AlertIcon, WarningIcon, SunIcon, MoonIcon, SystemIcon } from './Icons';

const AlertsDropdown: React.FC<{ alerts: Alert[]; onClose: () => void }> = ({ alerts, onClose }) => {
    return (
        <div 
            className="origin-top-left absolute left-0 mt-2 w-80 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="menu-button"
        >
            <div className="py-1" role="none">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">التنبيهات ({alerts.length})</p>
                </div>
                {alerts.length > 0 ? (
                    <div className="max-h-80 overflow-y-auto">
                        {alerts.map(alert => (
                            <a href="#" key={alert.id} className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 mt-0.5">
                                        <WarningIcon className="h-5 w-5 text-yellow-500" />
                                    </div>
                                    <div className="mr-3 w-0 flex-1">
                                        <p className="font-medium">{alert.type}</p>
                                        <p className="text-gray-500 dark:text-gray-400">{alert.message}</p>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-6">لا توجد تنبيهات جديدة.</p>
                )}
            </div>
        </div>
    );
};

const ThemeSwitcher: React.FC = () => {
    const { settings, updateSettings } = useContext(AppContext) as AppContextType;
    const [isThemeOpen, setIsThemeOpen] = useState(false);

    const themeIcons = {
        light: <SunIcon className="h-5 w-5" />,
        dark: <MoonIcon className="h-5 w-5" />,
        system: <SystemIcon className="h-5 w-5" />,
    };
    
    const themeLabels: Record<Theme, string> = {
        light: 'فاتح',
        dark: 'داكن',
        system: 'النظام',
    };

    const handleThemeChange = (theme: Theme) => {
        updateSettings({ theme });
        setIsThemeOpen(false);
    };

    React.useEffect(() => {
        const close = () => setIsThemeOpen(false);
        if (isThemeOpen) {
            window.addEventListener('click', close);
        }
        return () => window.removeEventListener('click', close);
    }, [isThemeOpen]);

    return (
        <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
                onClick={() => setIsThemeOpen(p => !p)}
                className="p-2 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
                aria-label="Toggle theme"
            >
                {settings.theme === 'light' && <SunIcon className="h-6 w-6" />}
                {settings.theme === 'dark' && <MoonIcon className="h-6 w-6" />}
                {settings.theme === 'system' && <SystemIcon className="h-6 w-6" />}
            </button>
            {isThemeOpen && (
                 <div 
                    className="origin-top-left absolute left-0 mt-2 w-40 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                    role="menu"
                >
                    <div className="py-1" role="none">
                        {(['light', 'dark', 'system'] as Theme[]).map(theme => (
                            <button
                                key={theme}
                                onClick={() => handleThemeChange(theme)}
                                className={`w-full text-right flex items-center px-4 py-2 text-sm ${settings.theme === theme ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'} hover:bg-gray-100 dark:hover:bg-gray-700`}
                                role="menuitem"
                            >
                                <span className="mr-3">{themeIcons[theme]}</span>
                                {themeLabels[theme]}
                            </button>
                        ))}
                    </div>
                 </div>
            )}
        </div>
    );
};

interface HeaderProps {
    toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const location = useLocation();
  const { alerts } = useContext(AppContext) as AppContextType;
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/invoices')) return 'إدارة الفواتير';
    if (path.startsWith('/expenses')) return 'إدارة المصروفات';
    if (path.startsWith('/greenhouse/') && path.endsWith('/report')) return 'تقرير الصوبة';
    
    switch (path) {
      case '/dashboard': return 'لوحة التحكم';
      case '/cycles': return 'إدارة العروات';
      case '/farmer-accounts': return 'حسابات المزارعين';
      case '/farmer-withdrawals': return 'سحوبات المزارعين';
      case '/greenhouse': return 'إدارة الصوبة';
      case '/reports': return 'التقارير';
      case '/settings': return 'الإعدادات';
      default: return 'المحاسب الزراعي';
    }
  };
  
    const handleAlertsToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsAlertsOpen(prev => !prev);
    };
    
    React.useEffect(() => {
        const close = () => setIsAlertsOpen(false);
        if (isAlertsOpen) {
            window.addEventListener('click', close);
        }
        return () => window.removeEventListener('click', close);
    }, [isAlertsOpen]);


  return (
    <header className="sticky top-0 bg-white dark:bg-gray-800 shadow-sm z-30">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
              aria-label="Toggle sidebar"
            >
               <MenuIcon className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white mr-4">{getPageTitle()}</h1>
        </div>
        
        <div className="flex items-center space-x-2">
            <ThemeSwitcher />
            <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={handleAlertsToggle}
                    className="p-2 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
                    aria-label="Toggle alerts"
                >
                    <AlertIcon className="h-6 w-6" />
                    {alerts.length > 0 && (
                        <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800"></span>
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