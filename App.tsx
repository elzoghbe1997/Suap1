import React, { useEffect, useState, useContext, createContext, FC, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar.tsx';
import Header from './components/Header.tsx';
import Dashboard from './components/Dashboard.tsx';
import CropCyclesPage from './components/CropCycles.tsx';
import CropCycleDetailsPage from './components/CropCycleDetailsPage.tsx';
import GreenhousePage from './components/Greenhouse.tsx';
import GreenhouseReport from './components/GreenhouseReport.tsx';
import ReportsPage from './components/Reports.tsx';
import SettingsPage from './components/SettingsPage.tsx';
import FarmerAccountsPage from './components/FarmerAccountsPage.tsx';
import SuppliersPage from './components/SuppliersPage.tsx';
import FertilizationProgramsPage from './components/FertilizationProgramsPage.tsx';
import TreasuryPage from './components/TreasuryPage.tsx';
import TreasuryDetailsPage from './components/TreasuryDetailsPage.tsx';
import AdvancesPage from './components/AdvancesPage.tsx';
import { AppContextType } from './types.ts';
import { useAppData } from './hooks/useAppData.ts';
import { ToastProvider } from './context/ToastContext.tsx';
import ToastContainer from './components/ToastContainer.tsx';
import { SparklesIcon } from './components/Icons.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import AuthPage from './components/AuthPage.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import DashboardSkeleton from './components/DashboardSkeleton.tsx';
import PWAInstallBanner from './components/PWAInstallBanner.tsx';
import TransactionListPage from './components/TransactionListPage.tsx';


export const AppContext = createContext<AppContextType | null>(null);

const DeletingDataOverlay: FC = () => (
    <div className="absolute inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center text-white">
        <svg className="animate-spin h-10 w-10 text-white mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-xl font-semibold">جاري حذف جميع البيانات...</p>
        <p className="text-slate-400 mt-2">سيتم إعادة تشغيل التطبيق بعد قليل.</p>
    </div>
);


const AppLayout: FC = () => {
    const contextValue = useContext(AppContext) as AppContextType;
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const toggleSidebar = React.useCallback(() => {
        setIsSidebarOpen(prevIsOpen => !prevIsOpen);
    }, []);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 768px)');
        setIsSidebarOpen(mediaQuery.matches);
        const handler = (e: MediaQueryListEvent) => setIsSidebarOpen(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);
    
    // System-Only Theme Logic
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const applyTheme = (isDark: boolean) => {
            if (isDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        };

        const mediaQueryListener = (e: MediaQueryListEvent) => {
            applyTheme(e.matches);
        };

        // Apply theme on initial load
        applyTheme(mediaQuery.matches);
        
        // Add listener for changes
        mediaQuery.addEventListener('change', mediaQueryListener);

        // Cleanup
        return () => {
            mediaQuery.removeEventListener('change', mediaQueryListener);
        };
    }, []);


    if (contextValue.loading) {
        return (
             <div className="relative h-screen flex overflow-hidden bg-slate-50 dark:bg-slate-900">
                <div className="flex-1 flex flex-col w-full">
                    <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                        <DashboardSkeleton />
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-screen flex overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-200">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} settings={contextValue.settings} />
            <div className={`flex-1 flex flex-col w-full transition-all duration-300 ease-in-out ${isSidebarOpen ? 'md:mr-64' : 'md:mr-0'}`}>
                <Header toggleSidebar={toggleSidebar} />
                <main key={location.pathname} className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto animate-page-fade-in">
                    <Outlet />
                </main>
            </div>
            
            <ToastContainer />
            <PWAInstallBanner />
        </div>
    );
};


const AppContent: FC = () => {
  const contextValue = useAppData();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  
  if (contextValue.isDeletingData) {
    return <DeletingDataOverlay />;
  }
  
  // Show a skeleton loader while auth state or initial data is loading.
  if (isAuthLoading || (isAuthenticated && contextValue.loading)) {
      return (
        <div className="relative h-screen flex overflow-hidden bg-slate-50 dark:bg-slate-900">
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <DashboardSkeleton />
            </main>
        </div>
      );
  }
  
  return (
    <AppContext.Provider value={contextValue}>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/cycles" element={<CropCyclesPage />} />
                <Route path="/cycles/:cropCycleId" element={<CropCycleDetailsPage />} />
                <Route path="/invoices" element={<TransactionListPage type="invoice" />} />
                <Route path="/expenses" element={<TransactionListPage type="expense" />} />
                {contextValue.settings.isAgriculturalProgramsSystemEnabled && <Route path="/programs" element={<FertilizationProgramsPage />} />}
                {contextValue.settings.isFarmerSystemEnabled && <Route path="/farmer-accounts" element={<FarmerAccountsPage />} />}
                {contextValue.settings.isSupplierSystemEnabled && <Route path="/suppliers" element={<SuppliersPage />} />}
                <Route path="/greenhouse" element={<GreenhousePage />} />
                <Route path="/greenhouse/:greenhouseId/report" element={<GreenhouseReport />} />
                {contextValue.settings.isTreasurySystemEnabled && <Route path="/treasury" element={<TreasuryPage />} />}
                {contextValue.settings.isTreasurySystemEnabled && <Route path="/treasury/:cropCycleId" element={<TreasuryDetailsPage />} />}
                {contextValue.settings.isAdvancesSystemEnabled && <Route path="/advances" element={<AdvancesPage />} />}
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
            </Route>
        </Route>
         <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      </Routes>
    </AppContext.Provider>
  );
};


const App: FC = () => {
  useEffect(() => {
    // FIX: Refactored ServiceWorker registration to reliably occur after the 'load' event, preventing "invalid state" errors.
    if ('serviceWorker' in navigator) {
      const handleServiceWorkerRegistration = () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
          })
          .catch(error => {
            console.error('ServiceWorker registration failed:', error);
          });
      };
      
      // The 'load' event is the most reliable point to register a service worker.
      window.addEventListener('load', handleServiceWorkerRegistration);
      
      return () => {
        window.removeEventListener('load', handleServiceWorkerRegistration);
      };
    }
  }, []);
  
  return (
    <ToastProvider>
      <HashRouter>
        <AuthProvider>
            <AppContent />
        </AuthProvider>
      </HashRouter>
    </ToastProvider>
  );
};

export default App;