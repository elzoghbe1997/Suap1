import React from 'react';
import { useAuth } from '../context/AuthContext';

// FIX: Cannot find name 'ReactRouterDOM'. Import from 'react-router-dom' instead.
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute: React.FC = () => {
    const { isAuthenticated } = useAuth();
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;