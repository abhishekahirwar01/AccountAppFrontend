import { lazy } from 'react';

export const RecentTransactions = lazy(() => import('@/components/dashboard/recent-transactions'));
export const ProductStock = lazy(() => import('@/components/dashboard/product-stock'));
export const ProformaForm = lazy(() => import('@/components/transactions/proforma-form'));
export const TransactionForm = lazy(() => import('@/components/transactions/transaction-form').then(module => ({ default: module.TransactionForm })));
export const AccountValidityNotice = lazy(() => import('@/components/dashboard/account-validity-notice').then(module => ({ default: module.AccountValidityNotice })));
export const UpdateWalkthrough = lazy(() => import('@/components/notifications/UpdateWalkthrough'));