import React from 'react';
import { DownloadIcon } from './Icons';
import { usePWAInstall } from '../App';

const InstallPWAButton: React.FC = () => {
    const { openInstallGuide } = usePWAInstall();

    return (
        <button
            onClick={openInstallGuide}
            className="p-2 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
            aria-label="إضافة التطبيق للشاشة الرئيسية"
            title="إضافة التطبيق للشاشة الرئيسية"
        >
            <DownloadIcon className="h-6 w-6" />
        </button>
    );
};

export default InstallPWAButton;