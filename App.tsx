import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CropCyclesPage from './components/CropCycles';
import CropCycleDetailsPage from './components/CropCycleDetailsPage';
import InvoicesPage from './components/Invoices';
import ExpensesPage from './components/Expenses';
import GreenhousePage from './components/Greenhouse';
import GreenhouseReport from './components/GreenhouseReport';
import ReportsPage from './components/Reports';
import SettingsPage from './components/SettingsPage';
import FarmerAccountsPage from './components/FarmerAccountsPage';
import SuppliersPage from './components/SuppliersPage';
import FertilizationProgramsPage from './components/FertilizationProgramsPage';
import { AppContextType } from './types';
import { useAppData } from './hooks/useAppData';
import { ToastProvider } from './context/ToastContext';
import ToastContainer from './components/ToastContainer';
import { SparklesIcon } from './components/Icons';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './components/AuthPage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardSkeleton from './components/DashboardSkeleton';


export const AppContext = React.createContext<AppContextType | null>(null);

const OnboardingModal: React.FC<{ onSelect: (choice: 'demo' | 'fresh') => void }> = ({ onSelect }) => {
  const [isAnimating, setIsAnimating] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(true), 10);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`fixed inset-0 bg-slate-100 dark:bg-slate-900 z-50 flex items-center justify-center p-4 transition-opacity duration-500 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}>
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
            <span className="block text-sm font-normal opacity-80">لاستكشاف إمكانيات التطبيق</span>
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


const AppLayout: React.FC = () => {
    const contextValue = React.useContext(AppContext) as AppContextType;
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    
    React.useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 768px)');
        setIsSidebarOpen(mediaQuery.matches);
        const handler = (e: MediaQueryListEvent) => setIsSidebarOpen(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    React.useEffect(() => {
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
                <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                <main key={location.pathname} className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto animate-page-fade-in">
                    <Outlet />
                </main>
            </div>
            <ToastContainer />
        </div>
    );
};


const AppContent: React.FC = () => {
  const contextValue = useAppData();
  const { isAuthenticated } = useAuth();
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  React.useEffect(() => {
    if (isAuthenticated && !localStorage.getItem('appInitialized') && !contextValue.loading) {
      setShowOnboarding(true);
    }
  }, [isAuthenticated, contextValue.loading]);

  const handleOnboardingSelect = (choice: 'demo' | 'fresh') => {
    if (choice === 'fresh') {
      contextValue.startFresh();
      localStorage.setItem('startFresh', 'true');
    } else {
      localStorage.removeItem('startFresh');
    }
    localStorage.setItem('appInitialized', 'true');
    setShowOnboarding(false);
  };
  
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
                <Route path="/invoices" element={<InvoicesPage />} />
                <Route path="/expenses" element={<ExpensesPage />} />
                {contextValue.settings.isAgriculturalProgramsSystemEnabled && <Route path="/programs" element={<FertilizationProgramsPage />} />}
                {contextValue.settings.isFarmerSystemEnabled && <Route path="/farmer-accounts" element={<FarmerAccountsPage />} />}
                {contextValue.settings.isSupplierSystemEnabled && <Route path="/suppliers" element={<SuppliersPage />} />}
                <Route path="/greenhouse" element={<GreenhousePage />} />
                <Route path="/greenhouse/:greenhouseId/report" element={<GreenhouseReport />} />
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