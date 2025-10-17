import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { lovable } from '../lovableClient';

interface AuthContextType {
    isAuthenticated: boolean;
    login: (email: string, pass: string) => Promise<void>;
    signup: (name: string, email: string, pass: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    useEffect(() => {
        const { data: { subscription } } = lovable.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                setIsAuthenticated(true);
            } else if (event === 'SIGNED_OUT') {
                setIsAuthenticated(false);
                // On logout, always navigate back to login
                navigate('/login', { replace: true });
            }
            setIsLoading(false);
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, [navigate]);

    const login = async (email: string, pass: string) => {
        const { error } = await lovable.auth.signInWithPassword({
            email,
            password: pass,
        });

        if (error) {
            throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
        }
        // Manually set auth state to prevent race condition with the listener
        setIsAuthenticated(true);
        navigate('/dashboard');
    };
    
    const signup = async (name: string, email: string, pass: string) => {
        if (!name.trim()) throw new Error('الاسم مطلوب.');
        if (pass.length < 6) throw new Error('يجب أن تكون كلمة المرور 6 أحرف على الأقل.');

        const { error } = await lovable.auth.signUp({
            email,
            password: pass,
            options: {
                data: {
                    full_name: name,
                }
            }
        });
        
        if (error) {
            throw new Error(error.message || 'فشل إنشاء الحساب. قد يكون البريد الإلكتروني مستخدمًا.');
        }
        // On successful signup, clear onboarding flag for the new user.
        localStorage.removeItem('appInitialized');
        // Manually set auth state to prevent race condition
        setIsAuthenticated(true);
        navigate('/dashboard');
    };

    const logout = async () => {
        const { error } = await lovable.auth.signOut();
        if (error) {
            console.error('Error logging out:', error);
        }
        // Manually set auth state to ensure immediate UI update
        setIsAuthenticated(false);
        // State change and navigation are also handled by onAuthStateChange listener
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, signup, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
