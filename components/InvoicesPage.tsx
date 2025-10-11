import React from 'react';
import TransactionListPage from './TransactionListPage.tsx';

const InvoicesPage: React.FC = () => {
    return <TransactionListPage type="invoice" />;
};

export default InvoicesPage;