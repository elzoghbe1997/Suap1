import React, { useState, useEffect } from 'react';
import { DownloadIcon, CloseIcon, LogoIcon } from './Icons';

const PWAInstallBanner: React.FC = () => {
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            // Check if the banner was dismissed before
            const dismissed = localStorage.getItem('pwaInstallDismissed');
            // Check if it's a mobile device (simple check)
            const isMobile = window.matchMedia('(max-width: 768px)').matches;
            
            if (!dismissed && isMobile) {
                setInstallPrompt(event);
                setIsVisible(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!installPrompt) {
            return;
        }
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        // Hide the banner after prompt
        setIsVisible(false);
        setInstallPrompt(null);
    };
    
    const handleDismissClick = () => {
        // Remember dismissal for this session/forever
        localStorage.setItem('pwaInstallDismissed', 'true');
        setIsVisible(false);
    };

    if (!isVisible || !installPrompt) {
        return null;
    }

    return (
        <div 
            className="absolute bottom-0 left-0 right-0 z-50 p-4 animate-fadeInSlideUp md:hidden" 
            role="dialog" 
            aria-labelledby="pwa-install-banner-title"
        >
            <div className="w-full max-w-md mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-4 flex items-center space-x-4 space-x-reverse relative">
                <button
                    onClick={handleDismissClick}
                    className="absolute top-2 left-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                    aria-label="إغلاق"
                >
                    <CloseIcon className="w-5 h-5" />
                </button>

                <div className="flex-shrink-0">
                    <LogoIcon className="w-12 h-12 text-emerald-500" />
                </div>
                
                <div className="flex-grow">
                    <h2 id="pwa-install-banner-title" className="font-bold text-slate-800 dark:text-white">ثبّت التطبيق</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        للوصول السريع والعمل دون اتصال بالإنترنت.
                    </p>
                </div>

                <div className="flex-shrink-0">
                    <button
                        onClick={handleInstallClick}
                        className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg shadow-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                    >
                        <DownloadIcon className="w-5 h-5 ml-2" />
                        <span>تثبيت</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PWAInstallBanner;
