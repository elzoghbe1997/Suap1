import React from 'react';

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
    </div>
);

export default LoadingSpinner;