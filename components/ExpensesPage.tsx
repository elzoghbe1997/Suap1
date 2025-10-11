import React from 'react';
import TransactionListPage from './TransactionListPage.tsx';

const ExpensesPage: React.FC = () => {
    return <TransactionListPage type="expense" />;
};

export default ExpensesPage;