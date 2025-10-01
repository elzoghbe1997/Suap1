import React, { createContext, useState, useCallback, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
    id: number;
    message: string;
    type: ToastType;
}

export interface ToastContextType {
    toasts: ToastMessage[];
    addToast: (message: string, type: ToastType) => void;
    removeToast: (id: number) => void;
}

export const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const removeToast = useCallback((id: number) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, []);
    
    const addToast = useCallback((message: string, type: ToastType) => {
        const id = Date.now();
        setToasts(prevToasts => [{ id, message, type }, ...prevToasts]);
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
        </ToastContext.Provider>
    );
};
