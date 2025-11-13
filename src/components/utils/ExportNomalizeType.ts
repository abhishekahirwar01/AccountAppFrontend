type TxType = "sales" | "purchases" | "receipts" | "payments" | "journals";

export const normalizeByType = (item: any, txType: TxType): any => {
  // Extract common fields that might be present in all transaction types
  const baseFields = {
    Date: item.date || item.createdAt || item.transactionDate || '',
    'Reference Number': item.referenceNumber || item.reference || item.invoiceNumber || item.voucherNumber || '',
    Description: item.description || item.narration || item.notes || '',
    Amount: item.amount || item.totalAmount || item.netAmount || 0,
    Company: item.company?.name || item.company || '',
    Status: item.status || item.state || '',
    Currency: item.currency || item.currencyCode || 'USD',
    'Created At': item.createdAt || '',
    'Updated At': item.updatedAt || ''
  };

  switch (txType) {
    case 'sales':
      return {
        ...baseFields,
        'Customer Name': item.customer?.name || item.customerName || item.customer || '',
        'Invoice Number': item.invoiceNumber || item.salesNumber || '',
        'Tax Amount': item.taxAmount || item.tax || 0,
        'Discount Amount': item.discountAmount || item.discount || 0,
        'Gross Amount': item.grossAmount || item.subtotal || 0,
        'Payment Terms': item.paymentTerms || '',
        'Due Date': item.dueDate || '',
        'Shipping Address': item.shippingAddress || '',
        'Billing Address': item.billingAddress || ''
      };
    
    case 'purchases':
      return {
        ...baseFields,
        'Vendor Name': item.vendor?.name || item.vendorName || item.vendor || '',
        'Purchase Order': item.purchaseOrderNumber || item.poNumber || '',
        'Tax Amount': item.taxAmount || item.tax || 0,
        'Discount Amount': item.discountAmount || item.discount || 0,
        'Gross Amount': item.grossAmount || item.subtotal || 0,
        'Receipt Date': item.receiptDate || '',
        'Expected Delivery': item.expectedDeliveryDate || '',
        'Shipping Method': item.shippingMethod || ''
      };
    
    case 'receipts':
      return {
        ...baseFields,
        'Received From': item.receivedFrom?.name || item.receivedFrom || '',
        'Payment Method': item.paymentMethod || item.paymentMode || '',
        'Bank Account': item.bankAccount?.name || item.bankAccount || '',
        'Check Number': item.checkNumber || '',
        'Transaction ID': item.transactionId || '',
        'Card Last Four': item.cardLastFour || '',
        'Payment Gateway': item.paymentGateway || ''
      };
    
    case 'payments':
      return {
        ...baseFields,
        'Paid To': item.paidTo?.name || item.paidTo || '',
        'Payment Method': item.paymentMethod || item.paymentMode || '',
        'Bank Account': item.bankAccount?.name || item.bankAccount || '',
        'Check Number': item.checkNumber || '',
        'Transaction ID': item.transactionId || '',
        'Card Last Four': item.cardLastFour || '',
        'Payment Gateway': item.paymentGateway || '',
        'Bill Reference': item.billReference || ''
      };
    
    case 'journals':
      return {
        ...baseFields,
        'Debit Account': item.debitAccount?.name || item.debitAccount || '',
        'Credit Account': item.creditAccount?.name || item.creditAccount || '',
        'Debit Amount': item.debitAmount || 0,
        'Credit Amount': item.creditAmount || 0,
        'Journal Type': item.journalType || '',
        'Transaction Type': item.transactionType || '',
        'Posted At': item.postedAt || '',
        'Approved By': item.approvedBy?.name || item.approvedBy || ''
      };
    
    default:
      return baseFields;
  }
};

// Define headers that match the normalized fields
export const HEADERS = [
  'Date',
  'Reference Number',
  'Description',
  'Amount',
  'Company',
  'Status',
  'Currency',
  'Created At',
  'Updated At',
  // Sales specific
  'Customer Name',
  'Invoice Number',
  'Tax Amount',
  'Discount Amount',
  'Gross Amount',
  'Payment Terms',
  'Due Date',
  'Shipping Address',
  'Billing Address',
  // Purchase specific
  'Vendor Name',
  'Purchase Order',
  'Tax Amount',
  'Discount Amount',
  'Gross Amount',
  'Receipt Date',
  'Expected Delivery',
  'Shipping Method',
  // Receipts specific
  'Received From',
  'Payment Method',
  'Bank Account',
  'Check Number',
  'Transaction ID',
  'Card Last Four',
  'Payment Gateway',
  // Payments specific
  'Paid To',
  'Payment Method',
  'Bank Account',
  'Check Number',
  'Transaction ID',
  'Card Last Four',
  'Payment Gateway',
  'Bill Reference',
  // Journals specific
  'Debit Account',
  'Credit Account',
  'Debit Amount',
  'Credit Amount',
  'Journal Type',
  'Transaction Type',
  'Posted At',
  'Approved By'
];