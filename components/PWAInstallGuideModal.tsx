import React, { FC, useEffect, useRef } from 'react';
import { usePWAInstall } from '../App';
import { DownloadIcon, CloseIcon, MenuVerticalIcon } from './Icons';

const PWAInstallGuideModal: FC = () => {
    const { closeInstallGuide, triggerInstall, canInstall } = usePWAInstall();
    const modalRef = useRef<HTMLDivElement>(null);

    const handleInstall = () => {
        closeInstallGuide();
        triggerInstall();
    };

    // Animation state
    const [isAnimating, setIsAnimating] = React.useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setIsAnimating(true), 10);
        return () => clearTimeout(timer);
    }, []);

    // Focus Trap and Escape key handler
    useEffect(() => {
        const modalNode = modalRef.current;
        if (!modalNode) return;

        const focusableElements = modalNode.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeInstallGuide();
            }
            if (e.key === 'Tab') {
                if (e.shiftKey) { // Shift + Tab
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else { // Tab
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        firstElement?.focus();
        
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [closeInstallGuide]);

    return (
        <div 
            className={`fixed inset-0 flex items-center justify-center z-[60] p-4 transition-opacity duration-300 ease-out ${isAnimating ? 'bg-black bg-opacity-60' : 'bg-black bg-opacity-0'}`}
            aria-modal="true" 
            role="dialog" 
            onClick={closeInstallGuide}
        >
            <div 
                ref={modalRef}
                className={`bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col transform transition-all duration-300 ease-out ${isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 pb-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">تثبيت التطبيق على جهازك</h2>
                    <button onClick={closeInstallGuide} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 flex-grow overflow-y-auto space-y-6 text-slate-600 dark:text-slate-300">
                    {canInstall ? (
                        <>
                            <p>لتثبيت التطبيق مباشرة والحصول على أفضل تجربة، اضغط على الزر أدناه.</p>
                             <button
                                onClick={handleInstall}
                                className="w-full flex items-center justify-center px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                            >
                                <DownloadIcon className="w-5 h-5 ml-2" />
                                <span>تثبيت التطبيق الآن</span>
                            </button>
                             <div className="border-t border-slate-200 dark:border-slate-700 my-6"></div>
                            <p className="text-sm text-center text-slate-500 dark:text-slate-400">إذا لم يعمل الزر، أو كنت ترغب في التثبيت يدويًا، اتبع الخطوات التالية:</p>

                        </>
                    ) : (
                        <p>للحصول على أفضل تجربة والوصول السريع، اتبع هذه الخطوات البسيطة لوضع التطبيق على شاشتك الرئيسية:</p>
                    )}

                    {/* Manual steps */}
                    <div className="space-y-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 w-8 text-center font-bold text-emerald-500 text-xl">1.</div>
                            <div className="mr-3">
                                <p className="font-semibold text-slate-800 dark:text-white">افتح قائمة المتصفح</p>
                                <p>اضغط على أيقونة القائمة (<MenuVerticalIcon className="w-4 h-4 inline-block mx-1"/>) في متصفح جوجل كروم.</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                             <div className="flex-shrink-0 w-8 text-center font-bold text-emerald-500 text-xl">2.</div>
                            <div className="mr-3">
                                <p className="font-semibold text-slate-800 dark:text-white">اختر "تثبيت التطبيق"</p>
                                <p>ابحث عن خيار <span className="font-mono bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-md text-sm">"تثبيت التطبيق"</span> أو <span className="font-mono bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-md text-sm">"إضافة إلى الشاشة الرئيسية"</span> واضغط عليه.</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                             <div className="flex-shrink-0 w-8 text-center font-bold text-emerald-500 text-xl">3.</div>
                            <div className="mr-3">
                                <p className="font-semibold text-slate-800 dark:text-white">أكّد التثبيت</p>
                                <p>ستظهر نافذة صغيرة، اضغط على "تثبيت" لتأكيد الإضافة.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                     <button
                        onClick={closeInstallGuide}
                        className="px-6 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PWAInstallGuideModal;