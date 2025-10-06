import React from 'react';
import { DownloadIcon } from './Icons';

const InstallPWAButton: React.FC = () => {
    const [installPromptEvent, setInstallPromptEvent] = React.useState<any>(null); // Use 'any' as BeforeInstallPromptEvent is not in standard TS lib

    React.useEffect(() => {
        const handleBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            setInstallPromptEvent(event);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!installPromptEvent) {
            return;
        }

        installPromptEvent.prompt();
        // The prompt can only be used once.
        setInstallPromptEvent(null);
    };

    if (!installPromptEvent) {
        return null;
    }

    return (
        <button
            onClick={handleInstallClick}
            className="p-2 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
            aria-label="تثبيت التطبيق"
            title="تثبيت التطبيق"
        >
            <DownloadIcon className="h-6 w-6" />
        </button>
    );
};

export default InstallPWAButton;
