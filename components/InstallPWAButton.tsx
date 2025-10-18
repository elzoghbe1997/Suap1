import React from 'react';
import { DownloadIcon } from './Icons';
import { usePWAInstall } from '../App';

const InstallPWAButton: React.FC = () => {
    const { canInstall, triggerInstall } = usePWAInstall();

    if (!canInstall) {
        return null;
    }

    return (
        <button
            onClick={triggerInstall}
            className="p-2 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
            aria-label="تثبيت التطبيق على الجهاز"
            title="تثبيت التطبيق على الجهاز"
        >
            <DownloadIcon className="h-6 w-6" />
        </button>
    );
};

export default InstallPWAButton;