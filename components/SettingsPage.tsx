import React from 'react';
import { AppContext } from '../App.tsx';
// FIX: Imported `AppSettings` type to resolve missing type error.
import { AppContextType, Theme, BackupData, AppSettings } from '../types.ts';
import { ToastContext, ToastContextType } from '../context/ToastContext.tsx';
import { SunIcon, MoonIcon, SystemIcon, DownloadIcon, UploadIcon, WarningIcon } from './Icons.tsx';
import ConfirmationModal from './ConfirmationModal.tsx';
import ExpenseCategoryManager from './ExpenseCategoryManager.tsx';

const SettingsPage: React.FC = () => {
    const context = React.useContext(AppContext) as AppContextType;
    const { settings, updateSettings, loadBackupData, deleteAllData } = context;
    const { addToast } = React.useContext(ToastContext) as ToastContextType;
    const restoreInputRef = React.useRef<HTMLInputElement>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [isCategoryManagerOpen, setIsCategoryManagerOpen] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState<'general' | 'appearance' | 'data'>('general');

    const handleToggle = (key: keyof AppSettings) => {
        updateSettings({ [key]: !settings[key] });
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
            const backupData: BackupData = {
              greenhouses: context.greenhouses,
              cropCycles: context.cropCycles,
              transactions: context.transactions,
              farmers: context.farmers,
              farmerWithdrawals: context.farmerWithdrawals,
              settings: context.settings,
              suppliers: context.suppliers,
              supplierPayments: context.supplierPayments,
              fertilizationPrograms: context.fertilizationPrograms,
              advances: context.advances,
            };

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

    const handleConfirmDeleteAll = () => {
        deleteAllData();
        setIsDeleteModalOpen(false);
    };
    
    const tabButtonClass = (tabName: 'general' | 'appearance' | 'data') => 
        `whitespace-nowrap py-3 px-4 border-b-2 font-medium text-base transition-colors duration-200 ${
            activeTab === tabName
            ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:border-slate-600'
        }`;

    const ToggleSwitch: React.FC<{ id: string; checked: boolean; onChange: () => void; title: string; description: string; disabled?: boolean; }> = ({ id, checked, onChange, title, description, disabled = false }) => (
         <div className="flex items-center justify-between pt-4 first:pt-0">
            <div className={`${disabled ? 'opacity-50' : ''}`}>
                <span className="font-medium text-slate-700 dark:text-slate-300">{title}</span>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
            </div>
            <label htmlFor={id} className={`relative inline-flex items-center flex-shrink-0 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                <input type="checkbox" id={id} className="sr-only peer" checked={checked} onChange={onChange} disabled={disabled} />
                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
            </label>
        </div>
    );


    return (
        <div className="max-w-4xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">الإعدادات</h1>
                <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">إدارة تفضيلات التطبيق والبيانات الأساسية.</p>
            </header>
            
            <div className="border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-4 space-x-reverse" aria-label="Tabs">
                    <button onClick={() => setActiveTab('general')} className={tabButtonClass('general')}>
                        عام
                    </button>
                    <button onClick={() => setActiveTab('appearance')} className={tabButtonClass('appearance')}>
                        المظهر
                    </button>
                    <button onClick={() => setActiveTab('data')} className={tabButtonClass('data')}>
                        البيانات
                    </button>
                </nav>
            </div>
            
            <div className="pt-8 space-y-8">
                {activeTab === 'general' && (
                    <div className="space-y-8 animate-fadeInSlideUp">
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold text-slate-800 dark:text-white">الأنظمة</h2>
                            <div className="mt-6 space-y-4 divide-y divide-slate-200 dark:divide-slate-700">
                                <ToggleSwitch 
                                    id="treasury-system-toggle"
                                    checked={settings.isTreasurySystemEnabled ?? false}
                                    onChange={() => {
                                        const newValue = !(settings.isTreasurySystemEnabled ?? false);
                                        updateSettings({
                                            isTreasurySystemEnabled: newValue,
                                            isAdvancesSystemEnabled: newValue
                                        });
                                    }}
                                    title="نظام الخزنة"
                                    description="تفعيل نظام الخزنة لتتبع السيولة النقدية والسلف الشخصية."
                                />
                                <ToggleSwitch 
                                    id="farmer-system-toggle"
                                    checked={settings.isFarmerSystemEnabled}
                                    onChange={() => handleToggle('isFarmerSystemEnabled')}
                                    title="نظام حصة المزارع"
                                    description="تفعيل نظام حساب حصة المزارع من إيرادات العروة."
                                />
                                <ToggleSwitch 
                                    id="supplier-system-toggle"
                                    checked={settings.isSupplierSystemEnabled}
                                    onChange={() => handleToggle('isSupplierSystemEnabled')}
                                    title="نظام الموردين"
                                    description="تفعيل نظام لتتبع الفواتير الآجلة والمدفوعات للموردين."
                                />
                                <ToggleSwitch 
                                    id="programs-system-toggle"
                                    checked={settings.isAgriculturalProgramsSystemEnabled}
                                    onChange={() => handleToggle('isAgriculturalProgramsSystemEnabled')}
                                    title="نظام أرباح البرامج"
                                    description="تتبع تكاليف البرامج وربطها مع الايرادات لحساب ربحية كل برنامج."
                                />
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-800 dark:text-white">إدارة فئات المصروفات</h2>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">إضافة أو تعديل فئات المصروفات المخصصة لتناسب احتياجاتك.</p>
                                </div>
                                <button
                                    onClick={() => setIsCategoryManagerOpen(true)}
                                    className="flex-shrink-0 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                                >
                                    إدارة
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'appearance' && (
                     <div className="space-y-8 animate-fadeInSlideUp">
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold text-slate-800 dark:text-white">مظهر التطبيق</h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">اختر المظهر المفضل لديك لواجهة التطبيق.</p>
                            <div className="mt-6">
                                <fieldset>
                                    <legend className="sr-only">Appearance</legend>
                                    <div className="flex items-center justify-center sm:justify-start space-x-2 space-x-reverse rounded-md bg-slate-100 dark:bg-slate-700/50 p-1">
                                        {themeOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => handleThemeChange(option.value)}
                                                className={`w-full flex items-center justify-center space-x-2 space-x-reverse rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                                    settings.theme === option.value
                                                        ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm'
                                                        : 'text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60'
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
                    </div>
                )}
                
                {activeTab === 'data' && (
                     <div className="space-y-8 animate-fadeInSlideUp">
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold text-slate-800 dark:text-white">النسخ الاحتياطي والاستعادة</h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
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
                                    className="flex-1 flex items-center justify-center px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-md shadow-sm hover:bg-slate-300 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-colors"
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

                        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-lg p-6">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <WarningIcon className="h-6 w-6 text-red-500" aria-hidden="true" />
                                </div>
                                <div className="mr-3 flex-1 md:flex md:justify-between">
                                    <div>
                                        <h2 className="text-xl font-semibold text-red-800 dark:text-red-200">حذف جميع البيانات</h2>
                                        <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                                            سيقوم هذا الإجراء بحذف جميع بيانات التطبيق بشكل نهائي، بما في ذلك الصوب والعروات والمعاملات. <strong>لا يمكن التراجع عن هذا الإجراء.</strong>
                                        </p>
                                    </div>
                                    <div className="mt-4 md:mt-0 md:mr-6 flex-shrink-0 self-center">
                                        <button
                                            onClick={() => setIsDeleteModalOpen(true)}
                                            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        >
                                            حذف جميع البيانات
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {isCategoryManagerOpen && (
                <ExpenseCategoryManager 
                    isOpen={isCategoryManagerOpen} 
                    onClose={() => setIsCategoryManagerOpen(false)} 
                />
            )}

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDeleteAll}
                title="تأكيد حذف جميع البيانات"
                message="هل أنت متأكد تمامًا؟ سيتم حذف جميع بيانات التطبيق بشكل نهائي ولا يمكن التراجع عن هذا الإجراء."
            />
        </div>
    );
};

export default SettingsPage;