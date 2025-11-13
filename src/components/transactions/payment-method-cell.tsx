// components/payment-method-cell.tsx
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { CreditReminderPopup } from './credit-reminder-popup';
import { FaClock } from 'react-icons/fa';

interface PaymentMethodCellProps {
  transaction: any;
}

export function PaymentMethodCell({ transaction }: PaymentMethodCellProps) {
  const [showReminderPopup, setShowReminderPopup] = useState(false);
  const paymentMethod = transaction.paymentMethod;

  if (!paymentMethod) {
    return <span className="text-muted-foreground">-</span>;
  }

  const paymentMethodStyles: Record<string, string> = {
    Cash: "bg-green-500/20 text-green-700 dark:text-green-300",
    Credit: "bg-orange-500/20 text-red-700 dark:text-red-300",
    UPI: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
    "Bank Transfer": "bg-purple-500/20 text-purple-700 dark:text-purple-300",
    Cheque: "bg-gray-500/20 text-gray-700 dark:text-gray-300",
  };

  return (
    <>
      <div className="flex items-center gap-1">
        <Badge
          variant="outline"
          className={paymentMethodStyles[paymentMethod] ?? "bg-gray-500/20 text-gray-700 dark:text-gray-300"}
        >
          {paymentMethod}
        </Badge>
        {paymentMethod === "Credit" && transaction.type !== "purchases" && (
          <button
            onClick={() => setShowReminderPopup(true)}
            className="p-1 hover:bg-orange-100 dark:hover:bg-orange-900 rounded transition-colors"
            title="View credit reminder details"
          >
            <FaClock className="h-4 w-4 text-orange-500 " />
          </button>
        )}
      </div>

      {/* Credit Reminder Popup */}
      {paymentMethod === "Credit" && transaction.type !== "purchases" && (
        <CreditReminderPopup
          isOpen={showReminderPopup}
          onClose={() => setShowReminderPopup(false)}
          transaction={transaction}
          party={transaction.party || transaction.vendor}
        />
      )}
    </>
  );
}