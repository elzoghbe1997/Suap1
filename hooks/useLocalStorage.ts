import { useState, useEffect } from 'react';
// FIX: Imported Dispatch and SetStateAction to resolve missing React namespace.
import type { Dispatch, SetStateAction } from 'react';

// Custom hook for persisting state to localStorage
// FIX: Updated function signature to use imported types instead of React.Dispatch to resolve namespace errors.
export function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        // FIX: Added curly braces to the catch block to ensure the function always returns a value and to fix subsequent parsing errors.
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(storedValue));
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    return [storedValue, setStoredValue];
}
