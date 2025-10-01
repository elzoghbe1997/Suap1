import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  DashboardIcon, 
  CycleIcon, 
  LogoIcon,
  InvoiceIcon,
  ReceiptIcon,
  GreenhouseIcon,
  ReportIcon,
  SettingsIcon,
  FarmerIcon
} from './Icons';
import { AppSettings } from '../types';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  settings: AppSettings;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, settings }) => {
  const commonLinkClasses = "flex items-center px-4 py-3 rounded-lg text-lg transition-colors duration-200";
  const activeLinkClasses = "bg-green-600 text-white";
  const inactiveLinkClasses = "text-gray-300 hover:bg-gray-700 hover:text-white";
  
  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      ></div>
      
      <aside
        className={`fixed top-0 right-0 h-full w-64 bg-gray-800 text-white z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
        aria-label="Sidebar"
      >
        <div className="flex items-center justify-center h-20 border-b border-gray-700">
          <LogoIcon className="w-10 h-10 text-green-400" />
          <span className="text-2xl font-bold mr-2 text-white">المحاسب</span>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
            onClick={closeSidebarOnMobile}
          >
            <DashboardIcon className="h-6 w-6" />
            <span className="mx-4 font-semibold">لوحة التحكم</span>
          </NavLink>
          <NavLink
            to="/cycles"
            className={({ isActive }) => `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
            onClick={closeSidebarOnMobile}
          >
            <CycleIcon className="h-6 w-6" />
            <span className="mx-4 font-semibold">إدارة العروات</span>
          </NavLink>
          <NavLink
            to="/invoices"
            className={({ isActive }) => `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
            onClick={closeSidebarOnMobile}
          >
            <InvoiceIcon className="h-6 w-6" />
            <span className="mx-4 font-semibold">إدارة الفواتير</span>
          </NavLink>
          <NavLink
            to="/expenses"
            className={({ isActive }) => `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
            onClick={closeSidebarOnMobile}
          >
            <ReceiptIcon className="h-6 w-6" />
            <span className="mx-4 font-semibold">إدارة المصروفات</span>
          </NavLink>
          {settings.isFarmerSystemEnabled && (
            <>
              <NavLink
                to="/farmer-accounts"
                className={({ isActive }) => `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
                onClick={closeSidebarOnMobile}
              >
                <FarmerIcon className="h-6 w-6" />
                <span className="mx-4 font-semibold">حسابات المزارعين</span>
              </NavLink>
              <NavLink
                to="/farmer-withdrawals"
                className={({ isActive }) => `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
                onClick={closeSidebarOnMobile}
              >
                <ReceiptIcon className="h-6 w-6" />
                <span className="mx-4 font-semibold">سحوبات المزارعين</span>
              </NavLink>
            </>
          )}
          <NavLink
            to="/greenhouse"
            className={({ isActive }) => `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
            onClick={closeSidebarOnMobile}
          >
            <GreenhouseIcon className="h-6 w-6" />
            <span className="mx-4 font-semibold">إدارة الصوبة</span>
          </NavLink>
          
          <div className="pt-4 mt-4 space-y-2 border-t border-gray-700">
             <NavLink
                to="/reports"
                className={({ isActive }) => `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
                onClick={closeSidebarOnMobile}
             >
                <ReportIcon className="h-6 w-6" />
                <span className="mx-4 font-semibold">التقارير</span>
              </NavLink>
              <NavLink
                to="/settings"
                className={({ isActive }) => `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
                onClick={closeSidebarOnMobile}
              >
                <SettingsIcon className="h-6 w-6" />
                <span className="mx-4 font-semibold">الإعدادات</span>
              </NavLink>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;