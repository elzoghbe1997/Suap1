import React, { useEffect, useState, useCallback, useContext, createContext, FC } from 'react';
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

const OnboardingModal: FC<{ onSelect: (choice: 'demo' | 'fresh') => void }> = ({ onSelect }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(true), 10);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`absolute inset-0 bg-slate-100 dark:bg-slate-900 z-50 flex items-center justify-center p-4 transition-opacity duration-500 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`w-full max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 sm:p-12 text-center transform transition-all duration-500 ease-out ${isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <SparklesIcon className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-white mb-4">
          أهلاً بك في المحاسب للصوب الزراعية
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
          اختر كيف تود أن تبدأ تجربتك.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => onSelect('demo')}
            className="flex-1 px-6 py-4 text-lg font-semibold text-white bg-emerald-600 rounded-lg shadow-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all transform hover:scale-105"
          >
            البدء ببيانات تجريبية
            <span className="block text-sm font-normal opacity-80"> لاستكشاف إمكانيات التطبيق </span>
          </button>
          <button
            onClick={() => onSelect('fresh')}
            className="flex-1 px-6 py-4 text-lg font-semibold text-slate-800 dark:text-slate-200 bg-slate-200 dark:bg-slate-700 rounded-lg shadow-md hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-all transform hover:scale-105"
          >
            البدء من الصفر
            <span className="block text-sm font-normal opacity-80">لتسجيل بياناتك الفعلية فوراً</span>
          </button>
        </div>
      </div>
    </div>
  );
};

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
    
    // FIX: Wrapped toggleSidebar in useCallback for performance optimization to prevent unnecessary re-renders of the Header component.
    const toggleSidebar = useCallback(() => {
        setIsSidebarOpen(prevIsOpen => !prevIsOpen);
    }, []);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 768px)');
        setIsSidebarOpen(mediaQuery.matches);
        const handler = (e: MediaQueryListEvent) => setIsSidebarOpen(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    useEffect(() => {
        if (!contextValue || contextValue.loading) return;
        const root = window.document.documentElement;

        if (contextValue.settings.theme === 'light') {
            root.classList.remove('dark');
            return; 
        }
        if (contextValue.settings.theme === 'dark') {
            root.classList.add('dark');
            return;
        }

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemChange = (e: MediaQueryListEvent) => {
            if (e.matches) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        };

        if (mediaQuery.matches) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        mediaQuery.addEventListener('change', handleSystemChange);

        return () => {
            mediaQuery.removeEventListener('change', handleSystemChange);
        };
    }, [contextValue?.settings?.theme, contextValue?.loading]);

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
  const { isAuthenticated, isLoading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Show onboarding if the user is authenticated, data is loaded, but the 'appInitialized' flag is not set.
    if (isAuthenticated && !contextValue.loading && !isLoading && !localStorage.getItem('appInitialized')) {
      setShowOnboarding(true);
    }
  }, [isAuthenticated, contextValue.loading, isLoading]);

  const handleOnboardingSelect = async (choice: 'demo' | 'fresh') => {
    // Set the flag immediately to prevent the modal from reappearing on reload.
    localStorage.setItem('appInitialized', 'true');
    setShowOnboarding(false);

    if (choice === 'fresh') {
      await contextValue.startFresh();
    } else {
      await contextValue.loadDemoData();
    }
  };
  
  if (contextValue.isDeletingData) {
    return <DeletingDataOverlay />;
  }
  
  // Show a skeleton loader while auth state or initial data is loading.
  if (isLoading || (isAuthenticated && contextValue.loading && !showOnboarding)) {
      return (
        <div className="relative h-screen flex overflow-hidden bg-slate-50 dark:bg-slate-900">
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <DashboardSkeleton />
            </main>
        </div>
      );
  }

  if (isAuthenticated && showOnboarding) {
    return <OnboardingModal onSelect={handleOnboardingSelect} />;
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