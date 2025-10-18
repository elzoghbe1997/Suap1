import React from 'react';
// FIX: Changed to a default import since TransactionListPage has a default export.
import TransactionListPage from './TransactionListPage';

const ExpensesPage: React.FC = () => {
    return <TransactionListPage type="expense" />;
};

export default ExpensesPage;