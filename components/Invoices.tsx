import React from 'react';
// FIX: Changed to a default import since TransactionListPage has a default export.
import TransactionListPage from './TransactionListPage';

const InvoicesPage: React.FC = () => {
    return <TransactionListPage type="invoice" />;
};

export default InvoicesPage;