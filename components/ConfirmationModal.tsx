import React from 'react';
import { WarningIcon } from './Icons.tsx';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmColor?: 'red' | 'blue' | 'yellow';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = React.memo(({ isOpen, onClose, onConfirm, title, message, confirmText = 'حذف', confirmColor = 'red' }) => {
    const [isAnimating, setIsAnimating] = React.useState(false);

    React.useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => setIsAnimating(true), 10); // Start animation after mount
            return () => clearTimeout(timer);
        } else {
            setIsAnimating(false); // Reset on close
        }
    }, [isOpen]);
    
    if (!isOpen) return null;

    const colorClasses = {
        red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        yellow: 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500',
    };
    const buttonClass = `w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto sm:text-sm transition-colors ${colorClasses[confirmColor]}`;


    return (
        <div className={`absolute inset-0 flex items-center justify-center z-70 p-4 transition-opacity duration-300 ease-out ${isAnimating ? 'bg-black bg-opacity-60' : 'bg-black bg-opacity-0'}`} aria-modal="true" role="dialog" onClick={onClose}>
            <div className={`bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md transform transition-all duration-300 ease-out ${isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} onClick={e => e.stopPropagation()}>
                <div className="flex">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                        <WarningIcon className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:mr-4 sm:text-right flex-grow">
                        <h3 className="text-lg leading-6 font-bold text-slate-900 dark:text-white" id="modal-title">
                            {title}
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {message}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse space-y-2 sm:space-y-0 sm:space-x-2 sm:space-x-reverse">
                    <button
                        type="button"
                        className={buttonClass}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                    <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-slate-300 dark:border-slate-500 shadow-sm px-4 py-2 bg-white dark:bg-slate-700 text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:w-auto sm:text-sm transition-colors"
                        onClick={onClose}
                    >
                        إلغاء
                    </button>
                </div>
            </div>
        </div>
    );
});

export default ConfirmationModal;