// components/dashboard/account-validity-notice.tsx
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Clock, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";

// Update the interface to include onContactSupport
interface ValidityNoticeProps {
  expiresAt?: string;
  status?: string;
  daysRemaining?: number;
  onContactSupport: () => void; // Add this line
}

export function AccountValidityNotice({
  expiresAt,
  status,
  daysRemaining,
  onContactSupport // Add this to the destructuring
}: ValidityNoticeProps) {
  console.log("validity show run")

  // If no validity data provided, don't show notice
  if (!expiresAt || !status || daysRemaining === undefined) {
    return null;
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formattedExpiryDate = formatDate(expiresAt);

  // If account has unlimited validity or is disabled, don't show notice
  if (status === "unlimited" || status === "disabled") {
    return null;
  }

  // If account is already expired
  if (daysRemaining < 0) {
    return (
      <Alert variant="destructive" className="mb-6">
        <Ban className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
          <span className="flex-1">
            Your account validity has expired on {new Date(expiresAt).toLocaleDateString()}. 
            Please contact support to renew your account.
          </span>
          <Button 
            onClick={onContactSupport} // Use the prop here
            variant="outline" 
            size="sm" 
            className="shrink-0"
          >
            Contact Support
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // If account is expiring in 3 days or less - use custom warning styles
  if (daysRemaining <= 3) {
    return (
      <div className="mb-6 border border-amber-200 bg-amber-50 text-amber-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 mt-2 flex-shrink-0 text-amber-600" />
          <div className="flex-1 flex items-center justify-between flex-wrap gap-2">
            <span className="flex-1">
              Your account validity expires in {daysRemaining} day{daysRemaining === 1 ? '' : 's'},  
               {formattedExpiryDate}. Please contact us to extend your validity.
            </span>
            <Button 
              onClick={onContactSupport} // Use the prop here
              variant="outline" 
              size="sm" 
              className="shrink-0 border-amber-300 text-amber-800 dark:text-amber-50 hover:bg-amber-100 hover:text-black dark:hover:text-black"
            >
              Contact Us
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If account is expiring in 7 days or less - use custom info styles
  if (daysRemaining <= 7) {
    return (
      <div className="mb-6 border border-blue-200 bg-blue-50 text-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Clock className="h-4 w-4 mt-2 flex-shrink-0 text-blue-600" />
          <div className="flex-1 flex items-center justify-between flex-wrap gap-2">
            <span className="flex-1">
              Your account validity expires in {daysRemaining} days. 
              Consider extending your validity to avoid interruption.
            </span>
            <Button 
              onClick={onContactSupport} // Use the prop here
              variant="outline" 
              size="sm" 
              className="shrink-0 border-blue-300 text-blue-800 bg-gray-200 hover:bg-blue-100  hover:text-black "
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
