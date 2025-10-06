import React, { createContext, useState, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
    isAuthenticated: boolean;
    login: (email: string, pass: string) => Promise<void>;
    signup: (name: string, email: string, pass: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem('isAuthenticated'));
    const navigate = useNavigate();

    // Mock login function (UI only)
    const login = async (email: string, pass: string) => {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network latency

        // Basic validation for any email/password
        if (!email.includes('@') || pass.length < 6) {
            throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
        }
        
        console.log('Logging in with:', email, pass);
        localStorage.setItem('isAuthenticated', 'true');
        setIsAuthenticated(true);
        navigate('/dashboard');
    };
    
    // Mock signup function (UI only)
    const signup = async (name: string, email: string, pass: string) => {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network latency

        if (!name.trim()) {
            throw new Error('الاسم مطلوب.');
        }
        if (!email.includes('@')) {
            throw new Error('صيغة البريد الإلكتروني غير صالحة.');
        }
        if (pass.length < 6) {
            throw new Error('يجب أن تكون كلمة المرور 6 أحرف على الأقل.');
        }

        console.log('Signing up with:', name, email, pass);
        // On successful signup, it's a new user, so don't set appInitialized yet
        localStorage.removeItem('appInitialized');
        localStorage.setItem('isAuthenticated', 'true');
        setIsAuthenticated(true);
        navigate('/dashboard');
    };

    const logout = () => {
        localStorage.removeItem('isAuthenticated');
        setIsAuthenticated(false);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, signup, logout }}>
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