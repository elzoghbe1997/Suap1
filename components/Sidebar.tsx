import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  DashboardIcon, 
  CycleIcon, 
  LogoIcon,
  InvoiceIcon,
  ReceiptIcon,
  ProgramIcon,
  GreenhouseIcon,
  ReportIcon,
  SettingsIcon,
  FarmerIcon,
  SupplierIcon,
  LogoutIcon,
  TreasuryIcon,
  AdvanceIcon,
  ChevronDownIcon,
} from './Icons.tsx';
import { AppSettings } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';


interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  settings: AppSettings;
}

const Sidebar: React.FC<SidebarProps> = React.memo(({ isOpen, setIsOpen, settings }) => {
  const { logout } = useAuth();
  const location = useLocation();
  
  // FIX: The Treasury menu state is now initialized based on the active route, ensuring it stays open during navigation within its section.
  const isTreasuryActive = location.pathname.startsWith('/treasury') || location.pathname.startsWith('/advances');
  const [isTreasuryMenuOpen, setIsTreasuryMenuOpen] = React.useState(isTreasuryActive);

  const commonLinkClasses = "flex items-center px-4 py-3 rounded-lg text-lg transition-all duration-200 transform hover:translate-x-1 focus:translate-x-1";
  const activeLinkClasses = "bg-emerald-600 text-white shadow-lg";
  const inactiveLinkClasses = "text-slate-300 hover:bg-slate-700 hover:text-white";
  
  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  // Keep the menu open if the user navigates to a child route.
  React.useEffect(() => {
    if (isTreasuryActive) {
      setIsTreasuryMenuOpen(true);
    }
  }, [isTreasuryActive]);

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
        className={`fixed top-0 right-0 h-full w-64 bg-slate-900 text-white z-40 transition-transform duration-300 ease-in-out md:translate-x-0 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Sidebar"
      >
        <div className="flex items-center justify-center h-16 border-b border-slate-700 flex-shrink-0">
          <LogoIcon className="w-10 h-10 text-emerald-400" />
          <span className="text-2xl font-bold mr-2 text-white">المحاسب</span>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
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
          {settings.isAgriculturalProgramsSystemEnabled && (
            <NavLink
              to="/programs"
              className={({ isActive }) => `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
              onClick={closeSidebarOnMobile}
            >
              <ProgramIcon className="h-6 w-6" />
              <span className="mx-4 font-semibold">أرباح البرامج</span>
            </NavLink>
          )}
          {settings.isSupplierSystemEnabled && (
              <NavLink
                to="/suppliers"
                className={({ isActive }) => `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
                onClick={closeSidebarOnMobile}
              >
                <SupplierIcon className="h-6 w-6" />
                <span className="mx-4 font-semibold">حسابات الموردين</span>
              </NavLink>
          )}
          {settings.isFarmerSystemEnabled && (
              <NavLink
                to="/farmer-accounts"
                className={({ isActive }) => `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
                onClick={closeSidebarOnMobile}
              >
                <FarmerIcon className="h-6 w-6" />
                <span className="mx-4 font-semibold">ادارة حساب المزارع</span>
              </NavLink>
          )}
          <NavLink
            to="/greenhouse"
            className={({ isActive }) => `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
            onClick={closeSidebarOnMobile}
          >
            <GreenhouseIcon className="h-6 w-6" />
            <span className="mx-4 font-semibold">إدارة الصوبة</span>
          </NavLink>

          {(settings.isTreasurySystemEnabled || settings.isAdvancesSystemEnabled) && (
            <div>
                <button
                    onClick={() => setIsTreasuryMenuOpen(!isTreasuryMenuOpen)}
                    className={`${commonLinkClasses} w-full justify-between ${isTreasuryActive ? 'text-white' : inactiveLinkClasses.replace('hover:bg-slate-700', '')}`}
                >
                    <div className="flex items-center">
                        <TreasuryIcon className="h-6 w-6" />
                        <span className="mx-4 font-semibold">الخزنة</span>
                    </div>
                    <ChevronDownIcon className={`h-5 w-5 transition-transform duration-200 ${isTreasuryMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {isTreasuryMenuOpen && (
                    <div className="mt-2 space-y-2 pr-4">
                        {settings.isTreasurySystemEnabled && (
                            <NavLink to="/treasury" className={({ isActive }) => `${commonLinkClasses} py-2 text-base ${isActive ? activeLinkClasses : inactiveLinkClasses}`} onClick={closeSidebarOnMobile}>
                                <span className="w-6 h-6 text-center">-</span>
                                <span className="mx-4 font-normal">صناديق العروات</span>
                            </NavLink>
                        )}
                        {settings.isAdvancesSystemEnabled && (
                             <NavLink to="/advances" className={({ isActive }) => `${commonLinkClasses} py-2 text-base ${isActive ? activeLinkClasses : inactiveLinkClasses}`} onClick={closeSidebarOnMobile}>
                                <AdvanceIcon className="h-5 w-5" />
                                <span className="mx-4 font-normal">السلف الشخصية</span>
                            </NavLink>
                        )}
                    </div>
                )}
            </div>
          )}
          
          <div className="pt-4 mt-4 space-y-2 border-t border-slate-700">
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
        <div className="px-4 py-4 mt-auto border-t border-slate-700">
            <button
                onClick={logout}
                className={`${commonLinkClasses} ${inactiveLinkClasses} w-full`}
            >
                <LogoutIcon className="h-6 w-6" />
                <span className="mx-4 font-semibold">تسجيل الخروج</span>
            </button>
        </div>
      </aside>
    </>
  );
});

export default Sidebar;