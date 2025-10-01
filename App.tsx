import React, { useState, useEffect, createContext } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CropCyclesPage from './components/CropCycles';
import InvoicesPage from './components/Invoices';
import ExpensesPage from './components/Expenses';
import GreenhousePage from './components/Greenhouse';
import GreenhouseReport from './components/GreenhouseReport';
import ReportsPage from './components/Reports';
import SettingsPage from './components/SettingsPage';
import FarmerWithdrawalsPage from './components/FarmerWithdrawals';
import FarmerAccountsPage from './components/FarmerAccountsPage';
import { AppContextType } from './types';
import { useAppData } from './hooks/useAppData';
import { ToastProvider } from './context/ToastContext';
import ToastContainer from './components/ToastContainer';

export const AppContext = createContext<AppContextType | null>(null);

const AppContent: React.FC = () => {
  const contextValue = useAppData();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    setIsSidebarOpen(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsSidebarOpen(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // THEME LOGIC
  useEffect(() => {
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
  }, [contextValue.settings.theme]);

  return (
    <AppContext.Provider value={contextValue}>
      <HashRouter>
        <div className="relative min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-200">
          <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} settings={contextValue.settings} />
          <div className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? 'md:mr-64' : 'md:mr-0'}`}>
            <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            <main className="p-4 sm:p-6 lg:p-8">
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/cycles" element={<CropCyclesPage />} />
                <Route path="/invoices" element={<InvoicesPage />} />
                <Route path="/expenses" element={<ExpensesPage />} />
                <Route path="/farmer-accounts" element={<FarmerAccountsPage />} />
                <Route path="/farmer-withdrawals" element={<FarmerWithdrawalsPage />} />
                <Route path="/greenhouse" element={<GreenhousePage />} />
                <Route path="/greenhouse/:greenhouseId/report" element={<GreenhouseReport />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </main>
          </div>
          <ToastContainer />
        </div>
      </HashRouter>
    </AppContext.Provider>
  );
};


const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App;
