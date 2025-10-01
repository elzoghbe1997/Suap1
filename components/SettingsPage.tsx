import React, { useContext, useRef } from 'react';
import { AppContext } from '../App';
import { AppContextType, Theme, BackupData } from '../types';
import { ToastContext, ToastContextType } from '../context/ToastContext';
import { SunIcon, MoonIcon, SystemIcon, DownloadIcon, UploadIcon } from './Icons';

const SettingsPage: React.FC = () => {
    const { settings, updateSettings, loadBackupData } = useContext(AppContext) as AppContextType;
    const { addToast } = useContext(ToastContext) as ToastContextType;
    const restoreInputRef = useRef<HTMLInputElement>(null);

    const handleToggle = () => {
        updateSettings({ isFarmerSystemEnabled: !settings.isFarmerSystemEnabled });
    };

    const handleThemeChange = (theme: Theme) => {
        updateSettings({ theme });
    };
    
    const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
        { value: 'light', label: 'فاتح', icon: <SunIcon className="w-5 h-5"/> },
        { value: 'dark', label: 'داكن', icon: <MoonIcon className="w-5 h-5"/> },
        { value: 'system', label: 'النظام', icon: <SystemIcon className="w-5 h-5"/> },
    ];
    
    const handleBackup = () => {
        try {
            const backupData: Partial<BackupData> = {};
            const keysToBackup = ['greenhouses', 'cropCycles', 'transactions', 'farmers', 'farmerWithdrawals', 'settings'];
            keysToBackup.forEach(key => {
                const data = localStorage.getItem(key);
                if (data) {
                    backupData[key as keyof BackupData] = JSON.parse(data);
                }
            });

            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
            a.href = url;
            a.download = `greenhouse_backup_${timestamp}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            addToast("تم إنشاء النسخة الاحتياطية بنجاح.", "success");
        } catch (error) {
            console.error("Backup failed:", error);
            addToast("حدث خطأ أثناء إنشاء النسخة الاحتياطية.", "error");
        }
    };
    
    const handleRestoreClick = () => {
        restoreInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!confirm("هل أنت متأكد أنك تريد استعادة البيانات من هذا الملف؟ سيتم استبدال جميع بياناتك الحالية. لا يمكن التراجع عن هذا الإجراء.")) {
            if(restoreInputRef.current) restoreInputRef.current.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File could not be read.");
                const data = JSON.parse(text) as BackupData;
                loadBackupData(data); // This function now handles its own toasts
            } catch (error) {
                console.error("Restore failed:", error);
                addToast("فشل في استعادة البيانات. يرجى التأكد من أن الملف هو ملف نسخة احتياطية صالح.", "error");
            } finally {
                 if(restoreInputRef.current) restoreInputRef.current.value = "";
            }
        };
        reader.readAsText(file);
    };


    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <header>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">الإعدادات</h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">إدارة تفضيلات التطبيق والبيانات الأساسية.</p>
            </header>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">نظام حصة المزارع</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">تفعيل أو تعطيل نظام حساب حصة المزارع من إيرادات العروة.</p>
                <div className="mt-6">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700 dark:text-gray-300">تفعيل النظام</span>
                        <label htmlFor="farmer-system-toggle" className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="farmer-system-toggle" className="sr-only peer" checked={settings.isFarmerSystemEnabled} onChange={handleToggle} />
                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">مظهر التطبيق</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">اختر المظهر المفضل لديك لواجهة التطبيق.</p>
                <div className="mt-6">
                     <fieldset>
                        <legend className="sr-only">Appearance</legend>
                        <div className="flex items-center justify-center sm:justify-start space-x-2 space-x-reverse rounded-md bg-gray-100 dark:bg-gray-700/50 p-1">
                            {themeOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => handleThemeChange(option.value)}
                                    className={`w-full flex items-center justify-center space-x-2 space-x-reverse rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                        settings.theme === option.value
                                            ? 'bg-white dark:bg-gray-800 text-green-700 dark:text-green-400 shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-800/60'
                                    }`}
                                >
                                    {option.icon}
                                    <span>{option.label}</span>
                                </button>
                            ))}
                        </div>
                    </fieldset>
                </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">إدارة البيانات</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    قم بإنشاء نسخة احتياطية من جميع بياناتك أو استعادتها. يوصى بعمل نسخة احتياطية بشكل دوري.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={handleBackup}
                        className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                        <DownloadIcon className="w-5 h-5 ml-2" />
                        <span>تنزيل نسخة احتياطية</span>
                    </button>
                    <button
                        onClick={handleRestoreClick}
                        className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md shadow-sm hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
                    >
                        <UploadIcon className="w-5 h-5 ml-2" />
                        <span>استعادة من نسخة احتياطية</span>
                    </button>
                    <input
                        type="file"
                        ref={restoreInputRef}
                        onChange={handleFileChange}
                        accept=".json"
                        className="hidden"
                    />
                </div>
                 <p className="mt-4 text-xs text-yellow-600 dark:text-yellow-400">
                    تحذير: استعادة نسخة احتياطية سيقوم بحذف جميع البيانات الحالية واستبدالها ببيانات الملف.
                </p>
            </div>
        </div>
    );
};

export default SettingsPage;