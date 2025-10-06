import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogoIcon, MailIcon, LockIcon } from './Icons';
import LoadingSpinner from './LoadingSpinner';

const AuthPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { login, signup } = useAuth();

    const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setter(e.target.value);
        if (error) {
            setError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await signup(name, email, password);
            }
        } catch (err: any) {
            setError(err.message || 'حدث خطأ ما. يرجى المحاولة مرة أخرى.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleForm = () => {
        setIsLogin(!isLogin);
        setError(null);
        setName('');
        setEmail('');
        setPassword('');
    };


    const inputWrapperClass = "relative";
    const iconClass = "absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none";
    const inputClass = "w-full pr-10 pl-4 py-3 bg-slate-800 border border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors text-white placeholder-slate-400";

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900 p-4">
            <div className="w-full max-w-sm mx-auto">
                <div className="text-center mb-8">
                    <LogoIcon className="w-16 h-16 text-emerald-500 mx-auto" />
                    <h1 className="text-4xl font-bold text-white mt-4">
                        {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
                    </h1>
                    <p className="text-slate-400 mt-2">
                        {isLogin ? 'مرحباً بعودتك! الرجاء إدخال بياناتك.' : 'املأ البيانات التالية للبدء.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {!isLogin && (
                        <div>
                            <div className={inputWrapperClass}>
                                 <input type="text" id="name" value={name} onChange={handleInputChange(setName)} required className={inputClass} placeholder="الاسم الكامل" />
                            </div>
                        </div>
                    )}
                     <div>
                        <div className={inputWrapperClass}>
                            <span className={iconClass}>
                                <MailIcon className="h-5 w-5 text-slate-400" />
                            </span>
                            <input type="email" id="email" value={email} onChange={handleInputChange(setEmail)} required className={inputClass} placeholder="البريد الإلكتروني"/>
                        </div>
                    </div>
                    <div>
                        <div className={inputWrapperClass}>
                             <span className={iconClass}>
                                <LockIcon className="h-5 w-5 text-slate-400" />
                            </span>
                            <input type="password" id="password" value={password} onChange={handleInputChange(setPassword)} required className={inputClass} placeholder="كلمة المرور"/>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3 text-center" role="alert" aria-live="assertive">
                            {error}
                        </div>
                    )}


                    <button type="submit" disabled={isLoading} className="w-full h-12 flex items-center justify-center px-4 py-3 text-lg font-semibold text-white bg-emerald-600 rounded-lg shadow-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors disabled:bg-emerald-700 disabled:cursor-not-allowed">
                        {isLoading ? <LoadingSpinner /> : (isLogin ? 'تسجيل الدخول' : 'إنشاء حساب')}
                    </button>
                </form>

                <p className="text-center mt-8 text-sm text-slate-400">
                    {isLogin ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
                    <button onClick={toggleForm} className="font-semibold text-emerald-400 hover:text-emerald-300 mr-2 focus:outline-none">
                        {isLogin ? 'إنشاء حساب' : 'تسجيل الدخول'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default AuthPage;