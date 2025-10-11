import React from 'react';
import { ToastMessage, ToastType } from '../context/ToastContext.tsx';
import { CloseIcon, WarningIcon } from './Icons.tsx'; 

interface ToastProps {
    toast: ToastMessage;
    onRemove: (id: number) => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ toast, onRemove, duration = 5000 }) => {
    React.useEffect(() => {
        const timer = setTimeout(() => {
            onRemove(toast.id);
        }, duration);

        return () => {
            clearTimeout(timer);
        };
    }, [toast.id, onRemove, duration]);

    const typeClasses: Record<ToastType, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
        success: { bg: 'bg-green-50 dark:bg-slate-800', text: 'text-green-800 dark:text-green-200', border: 'border-green-400', icon: <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> },
        error: { bg: 'bg-red-50 dark:bg-slate-800', text: 'text-red-800 dark:text-red-200', border: 'border-red-400', icon: <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg> },
        info: { bg: 'bg-blue-50 dark:bg-slate-800', text: 'text-blue-800 dark:text-blue-200', border: 'border-blue-400', icon: <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg> },
        warning: { bg: 'bg-yellow-50 dark:bg-slate-800', text: 'text-yellow-800 dark:text-yellow-200', border: 'border-yellow-400', icon: <WarningIcon className="w-5 h-5 text-yellow-400"/> },
    };

    const classes = typeClasses[toast.type];

    return (
        <div className={`w-full max-w-sm rounded-lg shadow-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden ${classes.bg} border-r-4 ${classes.border}`}>
            <div className="p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        {classes.icon}
                    </div>
                    <div className="mr-3 w-0 flex-1 pt-0.5">
                        <p className={`text-sm font-medium ${classes.text}`}>{toast.message}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button onClick={() => onRemove(toast.id)} className={`inline-flex rounded-md bg-transparent ${classes.text} hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}>
                            <span className="sr-only">Close</span>
                            <CloseIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Toast;