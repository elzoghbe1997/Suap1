import React, { FC, useEffect, useRef } from 'react';
import { usePWAInstall } from '../App';
import { DownloadIcon, CloseIcon } from './Icons';

const PWAInstallGuideModal: FC = () => {
    const { closeInstallGuide, triggerInstall } = usePWAInstall();
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
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">خطوات تثبيت التطبيق</h2>
                    <button onClick={closeInstallGuide} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 flex-grow overflow-y-auto space-y-4 text-slate-600 dark:text-slate-300">
                    <p>لتثبيت التطبيق على جهازك والوصول إليه بسهولة، يرجى اتباع الخطوات التالية:</p>
                    <ul className="list-decimal list-inside space-y-3 pr-4">
                        <li>
                            <strong className="font-semibold text-slate-800 dark:text-white">اضغط على زر "متابعة التثبيت"</strong> في الأسفل.
                        </li>
                        <li>
                            سيفتح متصفحك نافذة صغيرة. قد يختلف النص بداخلها، لكنها غالبًا ما تقول:
                            <div className="my-2 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-md border border-slate-200 dark:border-slate-700 text-center font-mono text-sm">
                                "إضافة إلى الشاشة الرئيسية"
                                <br/> أو <br/>
                                "إنشاء اختصار"
                            </div>
                        </li>
                        <li>
                            <strong className="font-semibold text-slate-800 dark:text-white">هذه هي الخطوة الصحيحة!</strong> اضغط على "إضافة" أو "تثبيت" لتأكيد العملية.
                        </li>
                        <li>
                            بعد لحظات، ستجد أيقونة التطبيق على شاشة جهازك الرئيسية مثل أي تطبيق آخر.
                        </li>
                    </ul>
                    <p className="text-sm text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                        بالرغم من أن المتصفح قد يسميها "اختصار"، إلا أنها النسخة الكاملة من التطبيق التي تعمل بشكل مستقل حتى بدون انترنت.
                    </p>
                </div>
                <div className="p-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                    <button
                        onClick={handleInstall}
                        className="flex items-center px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                    >
                        <DownloadIcon className="w-5 h-5 ml-2" />
                        <span>متابعة التثبيت</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PWAInstallGuideModal;
