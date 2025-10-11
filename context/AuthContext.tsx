import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    signup: (name: string, email: string, pass: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setIsAuthenticated(!!session);
            setIsLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            (async () => {
                if (event === 'SIGNED_IN' && session) {
                    setIsAuthenticated(true);
                } else if (event === 'SIGNED_OUT') {
                    setIsAuthenticated(false);
                    navigate('/login', { replace: true });
                }
            })();
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, [navigate]);

    const login = async (email: string, pass: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password: pass,
        });

        if (error) {
            throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
        }
        navigate('/dashboard');
    };

    const signup = async (name: string, email: string, pass: string) => {
        if (!name.trim()) throw new Error('الاسم مطلوب.');
        if (pass.length < 6) throw new Error('يجب أن تكون كلمة المرور 6 أحرف على الأقل.');

        const { error } = await supabase.auth.signUp({
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
        localStorage.removeItem('appInitialized');
        navigate('/dashboard');
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error logging out:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, login, signup, logout }}>
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
