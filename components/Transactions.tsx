// This file is no longer used in navigation. Its functionality has been split into Invoices.tsx and Expenses.tsx.
// You can remove this file in a future cleanup.
import React from 'react';

const DeprecatedTransactionsPage: React.FC = () => {
    return (
        <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
            <p className="font-bold">مكون مهمل</p>
            <p>هذا المكون لم يعد مستخدماً. تم فصله إلى صفحتي "إدارة الفواتير" و "إدارة المصروفات".</p>
        </div>
    );
};

export default DeprecatedTransactionsPage;