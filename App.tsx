import React from 'react';
import Sidebar from './components/Sidebar.tsx';
import Header from './components/Header.tsx';
// FIX: Added Theme type import to support appearance settings across the app.
import { AppContextType, Theme } from './types.ts';
import { useAppData } from './hooks/useAppData.ts';
import { ToastProvider } from './context/ToastContext.tsx';
import ToastContainer from './components/ToastContainer.tsx';
import { SparklesIcon } from './components/Icons.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import DashboardSkeleton from './components/DashboardSkeleton.tsx';
import PWAInstallBanner from './components/PWAInstallBanner.tsx';

// Lazy load page components for code splitting
const Dashboard = React.lazy(() => import('./components/Dashboard.tsx'));
const CropCyclesPage = React.lazy(() => import('./components/CropCycles.tsx'));
const CropCycleDetailsPage = React.lazy(() => import('./components/CropCycleDetailsPage.tsx'));
const GreenhousePage = React.lazy(() => import('./components/Greenhouse.tsx'));
const GreenhouseReport = React.lazy(() => import('./components/GreenhouseReport.tsx'));
const ReportsPage = React.lazy(() => import('./components/Reports.tsx'));
const SettingsPage = React.lazy(() => import('./components/SettingsPage.tsx'));
const FarmerAccountsPage = React.lazy(() => import('./components/FarmerAccountsPage.tsx'));
const SuppliersPage = React.lazy(() => import('./components/SuppliersPage.tsx'));
const FertilizationProgramsPage = React.lazy(() => import('./components/FertilizationProgramsPage.tsx'));
const TreasuryPage = React.lazy(() => import('./components/TreasuryPage.tsx'));
const TreasuryDetailsPage = React.lazy(() => import('./components/TreasuryDetailsPage.tsx'));
const AdvancesPage = React.lazy(() => import('./components/AdvancesPage.tsx'));
const AuthPage = React.lazy(() => import('./components/AuthPage.tsx'));
const TransactionListPage = React.lazy(() => import('./components/TransactionListPage.tsx'));
const PWAInstallGuideModal = React.lazy(() => import('./components/PWAInstallGuideModal.tsx'));

// FIX: Cannot find name 'ReactRouterDOM'. Import from 'react-router-dom' instead.
import { HashRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';


// --- PWA Install Context ---
interface PWAInstallContextType {
    canInstall: boolean;
    triggerInstall: () => void;
    isGuideOpen: boolean;
    openInstallGuide: () => void;
    closeInstallGuide: () => void;
}

const PWAInstallContext = React.createContext<PWAInstallContextType | null>(null);

export const usePWAInstall = () => {
    const context = React.useContext(PWAInstallContext);
    if (!context) {
        throw new Error('usePWAInstall must be used within a PWAInstallProvider');
    }
    return context;
};

const PWAInstallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [installPrompt, setInstallPrompt] = React.useState<any>(null);
    const [isGuideOpen, setIsGuideOpen] = React.useState(false);

    React.useEffect(() => {
        const handleBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            setInstallPrompt(event);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        const handleAppInstalled = () => {
            setInstallPrompt(null);
        };
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const triggerInstall = async () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        await installPrompt.userChoice;
        setInstallPrompt(null);
    };

    const openInstallGuide = () => setIsGuideOpen(true);
    const closeInstallGuide = () => setIsGuideOpen(false);

    const value = { 
        canInstall: !!installPrompt, 
        triggerInstall,
        isGuideOpen,
        openInstallGuide,
        closeInstallGuide
    };

    return (
        <PWAInstallContext.Provider value={value}>
            {children}
        </PWAInstallContext.Provider>
    );
};
// --- End PWA Install Context ---


export const AppContext = React.createContext<AppContextType | null>(null);

const DeletingDataOverlay: React.FC = () => (
    <div className="absolute inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center text-white">
        <svg className="animate-spin h-10 w-10 text-white mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-xl font-semibold">جاري حذف جميع البيانات...</p>
        <p className="text-slate-400 mt-2">سيتم إعادة تشغيل التطبيق بعد قليل.</p>
    </div>
);


const AppLayout: React.FC = () => {
    const contextValue = React.useContext(AppContext) as AppContextType;
    const { isGuideOpen } = usePWAInstall();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    
    const toggleSidebar = React.useCallback(() => {
        setIsSidebarOpen(prevIsOpen => !prevIsOpen);
    }, []);

    React.useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 768px)');
        setIsSidebarOpen(mediaQuery.matches);
        const handler = (e: MediaQueryListEvent) => setIsSidebarOpen(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);
    
    React.useEffect(() => {
        const root = document.documentElement;
        const theme = contextValue.settings.theme;
        const themeMeta = document.querySelector('meta[name="theme-color"]');
        const darkColor = '#0f172a'; // slate-900
        const lightColor = '#f8fafc'; // slate-50

        const applySystemTheme = (e: { matches: boolean }) => {
            if (e.matches) {
                root.classList.add('dark');
                if (themeMeta) themeMeta.setAttribute('content', darkColor);
            } else {
                root.classList.remove('dark');
                if (themeMeta) themeMeta.setAttribute('content', lightColor);
            }
        };

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        // FIX: The type error was resolved in the last update, but this ensures robustness by removing any previous listeners before adding a new one.
        try { mediaQuery.removeEventListener('change', applySystemTheme); } catch(e) {}

        if (theme === 'system') {
            applySystemTheme(mediaQuery);
            mediaQuery.addEventListener('change', applySystemTheme);
        } else {
            if (theme === 'dark') {
                root.classList.add('dark');
                if (themeMeta) themeMeta.setAttribute('content', darkColor);
            } else { // 'light'
                root.classList.remove('dark');
                if (themeMeta) themeMeta.setAttribute('content', lightColor);
            }
        }

        return () => {
            try { mediaQuery.removeEventListener('change', applySystemTheme); } catch(e) {}
        };
    }, [contextValue.settings.theme]);


    if (contextValue.loading) {
        return (
             <div className="relative h-screen flex overflow-hidden">
                <div className="flex-1 flex flex-col w-full">
                    <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-slate-50 dark:bg-slate-900">
                        <DashboardSkeleton />
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-screen flex overflow-hidden text-slate-900 dark:text-slate-200">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} settings={contextValue.settings} />
            <div className={`flex-1 flex flex-col w-full transition-all duration-300 ease-in-out bg-slate-50 dark:bg-slate-900 ${isSidebarOpen ? 'md:mr-64' : 'md:mr-0'}`}>
                <Header toggleSidebar={toggleSidebar} />
                <main key={location.pathname} className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto animate-page-fade-in">
                    <React.Suspense fallback={<DashboardSkeleton />}>
                        <Outlet />
                    </React.Suspense>
                </main>
            </div>
            
            <React.Suspense>
                {isGuideOpen && <PWAInstallGuideModal />}
            </React.Suspense>
            <ToastContainer />
            <PWAInstallBanner />
        </div>
    );
};


const AppContent: React.FC = () => {
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
  
  const AuthLoader: React.FC = () => (
      <div className="flex items-center justify-center h-screen w-screen bg-slate-900">
          <svg className="animate-spin h-14 w-14 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
      </div>
  );
  
  return (
    <AppContext.Provider value={contextValue}>
      <Routes>
        <Route path="/login" element={
            <React.Suspense fallback={<AuthLoader />}>
                <AuthPage />
            </React.Suspense>
        } />
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


const App: React.FC = () => {
  React.useEffect(() => {
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
        <PWAInstallProvider>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </PWAInstallProvider>
      </HashRouter>
    </ToastProvider>
  );
};

export default App;