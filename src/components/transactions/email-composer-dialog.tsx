// // components/email-composer-dialog.tsx
// import React, { useState } from 'react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea';
// import { Label } from '@/components/ui/label';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
// import { Loader2, Mail, X, Calendar, IndianRupee } from 'lucide-react';
// import { useToast } from '@/components/ui/use-toast';
// import { useIsMobile } from '@/hooks/use-mobile';

// interface EmailComposerDialogProps {
//   isOpen: boolean;
//   onClose: () => void;
//   transaction: any;
//   party: any;
//   company: any;
//   daysOverdue: number;
//   pendingAmount: number;
//   totalCustomerBalance: number;
// }

// export function EmailComposerDialog({
//   isOpen,
//   onClose,
//   transaction,
//   party,
//   company,
//   daysOverdue,
//   pendingAmount ,
//   totalCustomerBalance
// }: EmailComposerDialogProps) {
//   const [isSending, setIsSending] = useState(false);
//   const [emailContent, setEmailContent] = useState('');
//   const [emailSubject, setEmailSubject] = useState('');
//   const { toast } = useToast();
//   const isMobile = useIsMobile();

//   // Initialize email content when dialog opens
//   React.useEffect(() => {
//     if (isOpen) {
//       const defaultSubject = `Payment Reminder - Invoice ${transaction.invoiceNumber || transaction.referenceNumber || ''}`;
//       const defaultContent = generateDefaultEmailContent();
      
//       setEmailSubject(defaultSubject);
//       setEmailContent(defaultContent);
//     }
//   }, [isOpen, transaction, party, company, daysOverdue, pendingAmount, totalCustomerBalance]);

//   const generateDefaultEmailContent = () => {
//     const invoiceNumber = transaction.invoiceNumber || transaction.referenceNumber || 'N/A';
//     const invoiceDate = new Date(transaction.date).toLocaleDateString();
//     const formattedAmount = new Intl.NumberFormat('en-IN').format(totalCustomerBalance);
    
//     return `Dear ${party.name || 'Valued Customer'},

// This is a friendly reminder regarding your outstanding payment. The following invoice is currently pending:

// Invoice Number: ${invoiceNumber}
// Invoice Date: ${invoiceDate}
// Days Outstanding: ${daysOverdue} days
// Pending Amount: ₹${formattedAmount}

// ${daysOverdue > 30 ? `This invoice is ${daysOverdue - 30} days overdue. Please process the payment immediately to avoid any disruption in services.` : 'Please process this payment at your earliest convenience.'}

// If you have already made the payment, please disregard this reminder. For any queries regarding this invoice, please contact us.

// Thank you for your business!

// Best regards,
// ${company.businessName || 'Your Company'}
// ${company.emailId ? `Email: ${company.emailId}` : ''}`;
//   };

//   const handleSendEmail = async () => {
//      const baseURL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8745';
//     if (!emailContent.trim() || !emailSubject.trim()) {
//       toast({
//         variant: 'destructive',
//         title: 'Missing content',
//         description: 'Please provide both subject and email content.',
//       });
//       return;
//     }

//     setIsSending(true);
//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch(`${baseURL}/api/sales/send-credit-reminder`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           transactionId: transaction._id,
//           partyId: party._id,
//           daysOverdue: daysOverdue,
//           totalCustomerBalance: totalCustomerBalance,
//           emailSubject: emailSubject,
//           emailContent: emailContent,
//           isHtml: false, // Since we're sending plain text from the editor
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.message || 'Failed to send reminder');
//       }

//       toast({
//         title: 'Reminder Sent Successfully',
//         description: `Email sent to ${party.email}`,
//       });
//       onClose();
//     } catch (error) {
//       toast({
//         variant: 'destructive',
//         title: 'Failed to send reminder',
//         description: error instanceof Error ? error.message : 'Please try again later.',
//       });
//     } finally {
//       setIsSending(false);
//     }
//   };

//   if (!isOpen) return null;

//   if (isMobile) {
//     return (
//       <Dialog open={isOpen} onOpenChange={onClose}>
//         <DialogContent className="sm:max-w-md">
//           <DialogHeader>
//             <DialogTitle className="flex items-center gap-3">
//               <Mail className="h-6 w-6 text-blue-600" />
//               Send Payment Reminder
//             </DialogTitle>
//           </DialogHeader>

//           <div className="space-y-4">
//             {/* Transaction Summary */}
//             <Card>
//               <CardHeader className="pb-3">
//                 <CardTitle className="text-sm">Transaction Summary</CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-3 text-sm">
//                 <div className="flex flex-col justify-between">
//                   <span className="text-muted-foreground">Customer:</span>
//                   <span className="font-medium">{party.name}</span>
//                 </div>
//                 <div className="flex flex-col justify-between">
//                   <span className="text-muted-foreground">Email:</span>
//                   <span className="font-medium">{party.email}</span>
//                 </div>
//                 <div className="flex flex-col justify-between">
//                   <span className="text-muted-foreground">Invoice:</span>
//                   <span>{transaction.invoiceNumber || transaction.referenceNumber || 'N/A'}</span>
//                 </div>
//                 <div className="flex flex-col justify-between">
//                   <span className="text-muted-foreground">Date:</span>
//                   <span>{new Date(transaction.date).toLocaleDateString()}</span>
//                 </div>
//                 <div className="flex flex-col justify-between">
//                   <span className="text-muted-foreground">Days Outstanding:</span>
//                   <Badge variant={daysOverdue > 30 ? "destructive" : "secondary"}>
//                     {daysOverdue} days
//                   </Badge>
//                 </div>
//                 <div className="flex flex-col items-start pt-2 border-t">
//                   <span className="text-muted-foreground">Pending Amount:</span>
//                   <div className="text-left mt-1">
//                     <div className="font-bold text-lg text-red-600">
//                        ₹{new Intl.NumberFormat('en-IN').format(totalCustomerBalance)}
//                     </div>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Email Form */}
//             <div className="space-y-4">
//               <div className="space-y-2">
//                 <Label htmlFor="to">To</Label>
//                 <Input
//                   id="to"
//                   value={`${party.email}`}
//                   disabled
//                   className="bg-muted"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="subject">Subject</Label>
//                 <Input
//                   id="subject"
//                   value={emailSubject}
//                   onChange={(e) => setEmailSubject(e.target.value)}
//                   placeholder="Enter email subject"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="content">Email Content</Label>
//                 <Textarea
//                   id="content"
//                   value={emailContent}
//                   onChange={(e) => setEmailContent(e.target.value)}
//                   placeholder="Compose your email message..."
//                   className="min-h-[200px] resize-vertical"
//                 />
//               </div>

//               <div className="flex items-center justify-between text-sm text-muted-foreground">
//                 <span>You can edit the content above as needed</span>
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   onClick={() => setEmailContent(generateDefaultEmailContent())}
//                 >
//                   Reset to default
//                 </Button>
//               </div>
//             </div>

//             {/* Action Buttons */}
//             <div className="flex gap-3 pt-2">
//               <Button
//                 variant="outline"
//                 onClick={onClose}
//                 className="flex-1"
//                 disabled={isSending}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 onClick={handleSendEmail}
//                 disabled={isSending}
//                 className="flex-1 gap-2"
//               >
//                 {isSending ? (
//                   <Loader2 className="h-4 w-4 animate-spin" />
//                 ) : (
//                   <Mail className="h-4 w-4" />
//                 )}
//                 Send Reminder
//               </Button>
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>
//     );
//   }

//   return (
//     <div className="fixed inset-0 z-50 flex">
//       {/* Backdrop */}
//       <div
//         className="fixed inset-0 bg-black/50 transition-opacity"
//         onClick={onClose}
//       />

//       {/* Sliding Panel */}
//       <div className="relative w-full sm:ml-auto sm:max-w-2xl h-full bg-white shadow-xl transition-transform duration-300 ease-in-out">
//         <div className="flex flex-col h-full">
//           {/* Header */}
//           <div className="flex items-center justify-between p-4 sm:p-6 border-b">
//             <div className="flex items-center gap-3">
//               <Mail className="h-6 w-6 text-blue-600" />
//               <div>
//                 <h2 className="text-xl font-semibold">Send Payment Reminder</h2>
//                 <p className="text-sm text-muted-foreground">
//                   Compose and send reminder email
//                 </p>
//               </div>
//             </div>
//             <Button
//               variant="ghost"
//               size="icon"
//               onClick={onClose}
//               className="h-8 w-8"
//             >
//               <X className="h-4 w-4" />
//             </Button>
//           </div>

//           {/* Content */}
//           <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
//             {/* Transaction Summary */}
//             <Card>
//               <CardHeader className="pb-3">
//                 <CardTitle className="text-sm">Transaction Summary</CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-3 text-sm">
//                 <div className="flex flex-col sm:flex-row sm:justify-between">
//                   <span className="text-muted-foreground">Customer:</span>
//                   <span className="font-medium">{party.name}</span>
//                 </div>
//                 <div className="flex flex-col sm:flex-row sm:justify-between">
//                   <span className="text-muted-foreground">Email:</span>
//                   <span className="font-medium">{party.email}</span>
//                 </div>
//                 <div className="flex flex-col sm:flex-row sm:justify-between">
//                   <span className="text-muted-foreground">Invoice:</span>
//                   <span>{transaction.invoiceNumber || transaction.referenceNumber || 'N/A'}</span>
//                 </div>
//                 <div className="flex flex-col sm:flex-row sm:justify-between">
//                   <span className="text-muted-foreground">Date:</span>
//                   <span>{new Date(transaction.date).toLocaleDateString()}</span>
//                 </div>
//                 <div className="flex flex-col sm:flex-row sm:justify-between">
//                   <span className="text-muted-foreground">Days Outstanding:</span>
//                   <Badge variant={daysOverdue > 30 ? "destructive" : "secondary"}>
//                     {daysOverdue} days
//                   </Badge>
//                 </div>
//                 <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center pt-2 border-t">
//                   <span className="text-muted-foreground">Pending Amount:</span>
//                   <div className="text-left sm:text-right mt-1 sm:mt-0">
//                     <div className="font-bold text-base sm:text-lg text-red-600">
//                        ₹{new Intl.NumberFormat('en-IN').format(totalCustomerBalance)}
//                     </div>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Email Form */}
//             <div className="space-y-4">
//               <div className="space-y-2">
//                 <Label htmlFor="to">To</Label>
//                 <Input
//                   id="to"
//                   value={`${party.email}`}
//                   disabled
//                   className="bg-muted"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="subject">Subject</Label>
//                 <Input
//                   id="subject"
//                   value={emailSubject}
//                   onChange={(e) => setEmailSubject(e.target.value)}
//                   placeholder="Enter email subject"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="content">Email Content</Label>
//                 <Textarea
//                   id="content"
//                   value={emailContent}
//                   onChange={(e) => setEmailContent(e.target.value)}
//                   placeholder="Compose your email message..."
//                   className="min-h-[200px] sm:min-h-[300px] resize-vertical"
//                 />
//               </div>

//               <div className="flex items-center justify-between text-sm text-muted-foreground">
//                 <span>You can edit the content above as needed</span>
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   onClick={() => setEmailContent(generateDefaultEmailContent())}
//                 >
//                   Reset to default
//                 </Button>
//               </div>
//             </div>
//           </div>

//           {/* Footer */}
//           <div className="border-t p-4 sm:p-6 bg-muted/20">
//             <div className="flex gap-3">
//               <Button
//                 variant="outline"
//                 onClick={onClose}
//                 className="flex-1"
//                 disabled={isSending}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 onClick={handleSendEmail}
//                 disabled={isSending}
//                 className="flex-1 gap-2"
//               >
//                 {isSending ? (
//                   <Loader2 className="h-4 w-4 animate-spin" />
//                 ) : (
//                   <Mail className="h-4 w-4" />
//                 )}
//                 Send Reminder
//               </Button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }







// components/email-composer-dialog.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Mail, X, Calendar, IndianRupee } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface EmailComposerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  party: any;
  company: any;
  daysOverdue: number;
  pendingAmount: number;
  totalCustomerBalance: number;
}

export function EmailComposerDialog({
  isOpen,
  onClose,
  transaction,
  party,
  company,
  daysOverdue,
  pendingAmount,
  totalCustomerBalance
}: EmailComposerDialogProps) {
  const [isSending, setIsSending] = useState(false);
  const [emailContent, setEmailContent] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Initialize email content when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      const defaultSubject = `Payment Reminder - Invoice ${transaction.invoiceNumber || transaction.referenceNumber || ''}`;
      const defaultContent = generateDefaultEmailContent();
      
      setEmailSubject(defaultSubject);
      setEmailContent(defaultContent);
    }
  }, [isOpen, transaction, party, company, daysOverdue, pendingAmount, totalCustomerBalance]);

  const generateDefaultEmailContent = () => {
    const invoiceNumber = transaction.invoiceNumber || transaction.referenceNumber || 'N/A';
    const invoiceDate = new Date(transaction.date).toLocaleDateString();
    const formattedAmount = new Intl.NumberFormat('en-IN').format(totalCustomerBalance);
    
    return `Dear ${party.name || 'Valued Customer'},

This is a friendly reminder regarding your outstanding payment. The following invoice is currently pending:

Invoice Number: ${invoiceNumber}
Invoice Date: ${invoiceDate}
Days Outstanding: ${daysOverdue} days
Pending Amount: ₹${formattedAmount}

${daysOverdue > 30 ? `This invoice is ${daysOverdue - 30} days overdue. Please process the payment immediately to avoid any disruption in services.` : 'Please process this payment at your earliest convenience.'}

If you have already made the payment, please disregard this reminder. For any queries regarding this invoice, please contact us.

Thank you for your business!

Best regards,
${company.businessName || 'Your Company'}
${company.emailId ? `Email: ${company.emailId}` : ''}`;
  };

  const handleSendEmail = async () => {
    const baseURL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8745';
    if (!emailContent.trim() || !emailSubject.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing content',
        description: 'Please provide both subject and email content.',
      });
      return;
    }

    setIsSending(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${baseURL}/api/sales/send-credit-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          transactionId: transaction._id,
          partyId: party._id,
          daysOverdue: daysOverdue,
          totalCustomerBalance: totalCustomerBalance,
          emailSubject: emailSubject,
          emailContent: emailContent,
          isHtml: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reminder');
      }

      toast({
        title: 'Reminder Sent Successfully',
        description: `Email sent to ${party.email}`,
      });
      onClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to send reminder',
        description: error instanceof Error ? error.message : 'Please try again later.',
      });
    } finally {
      setIsSending(false);
    }
  };

  // Fix: Prevent backdrop click from closing when clicking on panel
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Fix: Stop propagation for button clicks
  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  // Mobile View - Use Dialog component (like credit-payment-reminder)
  if (isMobile) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Mail className="h-6 w-6 text-blue-600" />
              Send Payment Reminder
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Transaction Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Transaction Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-medium">{party.name}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{party.email}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Invoice:</span>
                  <span>{transaction.invoiceNumber || transaction.referenceNumber || 'N/A'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Date:</span>
                  <span>{new Date(transaction.date).toLocaleDateString()}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Days Outstanding:</span>
                  <Badge variant={daysOverdue > 30 ? "destructive" : "secondary"}>
                    {daysOverdue} days
                  </Badge>
                </div>
                <div className="flex flex-col items-start pt-2 border-t">
                  <span className="text-muted-foreground">Pending Amount:</span>
                  <div className="text-left mt-1">
                    <div className="font-bold text-lg text-red-600">
                      ₹{new Intl.NumberFormat('en-IN').format(totalCustomerBalance)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="to">To</Label>
                <Input
                  id="to"
                  value={`${party.email}`}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Enter email subject"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Email Content</Label>
                <Textarea
                  id="content"
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  placeholder="Compose your email message..."
                  className="min-h-[200px] resize-vertical"
                />
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>You can edit the content above as needed</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEmailContent(generateDefaultEmailContent())}
                >
                  Reset to default
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isSending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={isSending}
                className="flex-1 gap-2"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                Send Reminder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Desktop View - Maintain the original right-side sliding panel
  if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex">
//       {/* Backdrop - Fixed click handler */}
//       <div
//         className="fixed inset-0 bg-black/50 transition-opacity"
//         onClick={handleBackdropClick}
//       />

//       {/* Sliding Panel - Desktop Only */}
//       <div className="relative w-full sm:ml-auto sm:max-w-2xl h-full bg-white shadow-xl transition-transform duration-300 ease-in-out">
//         <div className="flex flex-col h-full">
//           {/* Header */}
//           <div className="flex items-center justify-between p-4 sm:p-6 border-b">
//             <div className="flex items-center gap-3">
//               <Mail className="h-6 w-6 text-blue-600" />
//               <div>
//                 <h2 className="text-xl font-semibold">Send Payment Reminder</h2>
//                 <p className="text-sm text-muted-foreground">
//                   Compose and send reminder email
//                 </p>
//               </div>
//             </div>
//             <Button
//               variant="ghost"
//               size="icon"
//               onClick={handleCloseClick}
//               className="h-8 w-8"
//             >
//               <X className="h-4 w-4" />
//             </Button>
//           </div>

//           {/* Content */}
//           <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
//             {/* Transaction Summary */}
//             <Card>
//               <CardHeader className="pb-3">
//                 <CardTitle className="text-sm">Transaction Summary</CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-3 text-sm">
//                 <div className="flex flex-col sm:flex-row sm:justify-between">
//                   <span className="text-muted-foreground">Customer:</span>
//                   <span className="font-medium">{party.name}</span>
//                 </div>
//                 <div className="flex flex-col sm:flex-row sm:justify-between">
//                   <span className="text-muted-foreground">Email:</span>
//                   <span className="font-medium">{party.email}</span>
//                 </div>
//                 <div className="flex flex-col sm:flex-row sm:justify-between">
//                   <span className="text-muted-foreground">Invoice:</span>
//                   <span>{transaction.invoiceNumber || transaction.referenceNumber || 'N/A'}</span>
//                 </div>
//                 <div className="flex flex-col sm:flex-row sm:justify-between">
//                   <span className="text-muted-foreground">Date:</span>
//                   <span>{new Date(transaction.date).toLocaleDateString()}</span>
//                 </div>
//                 <div className="flex flex-col sm:flex-row sm:justify-between">
//                   <span className="text-muted-foreground">Days Outstanding:</span>
//                   <Badge variant={daysOverdue > 30 ? "destructive" : "secondary"}>
//                     {daysOverdue} days
//                   </Badge>
//                 </div>
//                 <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center pt-2 border-t">
//                   <span className="text-muted-foreground">Pending Amount:</span>
//                   <div className="text-left sm:text-right mt-1 sm:mt-0">
//                     <div className="font-bold text-base sm:text-lg text-red-600">
//                       ₹{new Intl.NumberFormat('en-IN').format(totalCustomerBalance)}
//                     </div>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Email Form */}
//             <div className="space-y-4">
//               <div className="space-y-2">
//                 <Label htmlFor="to">To</Label>
//                 <Input
//                   id="to"
//                   value={`${party.email}`}
//                   disabled
//                   className="bg-muted"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="subject">Subject</Label>
//                 <Input
//                   id="subject"
//                   value={emailSubject}
//                   onChange={(e) => setEmailSubject(e.target.value)}
//                   placeholder="Enter email subject"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="content">Email Content</Label>
//                 <Textarea
//                   id="content"
//                   value={emailContent}
//                   onChange={(e) => setEmailContent(e.target.value)}
//                   placeholder="Compose your email message..."
//                   className="min-h-[200px] sm:min-h-[300px] resize-vertical"
//                 />
//               </div>

//               <div className="flex items-center justify-between text-sm text-muted-foreground">
//                 <span>You can edit the content above as needed</span>
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   onClick={() => setEmailContent(generateDefaultEmailContent())}
//                 >
//                   Reset to default
//                 </Button>
//               </div>
//             </div>
//           </div>

//           {/* Footer */}
//           <div className="border-t p-4 sm:p-6 bg-muted/20">
//             <div className="flex gap-3">
//               <Button
//                 variant="outline"
//                 onClick={handleCloseClick}
//                 className="flex-1"
//                 disabled={isSending}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 onClick={handleSendEmail}
//                 disabled={isSending}
//                 className="flex-1 gap-2"
//               >
//                 {isSending ? (
//                   <Loader2 className="h-4 w-4 animate-spin" />
//                 ) : (
//                   <Mail className="h-4 w-4" />
//                 )}
//                 Send Reminder
//               </Button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop - Fixed click handler */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={handleBackdropClick}
      />

      {/* Sliding Panel - Desktop Only */}
      <div className="relative w-full sm:ml-auto sm:max-w-2xl h-full bg-white dark:bg-gray-900 shadow-xl transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Send Payment Reminder</h2>
                <p className="text-sm text-muted-foreground">
                  Compose and send reminder email
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCloseClick}
              className="h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gray-50 dark:bg-gray-800">
            {/* Transaction Summary */}
            <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-900 dark:text-white">Transaction Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{party.name}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{party.email}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <span className="text-muted-foreground">Invoice:</span>
                  <span className="text-gray-900 dark:text-white">{transaction.invoiceNumber || transaction.referenceNumber || 'N/A'}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="text-gray-900 dark:text-white">{new Date(transaction.date).toLocaleDateString()}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <span className="text-muted-foreground">Days Outstanding:</span>
                  <Badge variant={daysOverdue > 30 ? "destructive" : "secondary"}>
                    {daysOverdue} days
                  </Badge>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-muted-foreground">Pending Amount:</span>
                  <div className="text-left sm:text-right mt-1 sm:mt-0">
                    <div className="font-bold text-base sm:text-lg text-red-600 dark:text-red-400">
                      ₹{new Intl.NumberFormat('en-IN').format(totalCustomerBalance)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="to" className="text-gray-900 dark:text-white">To</Label>
                <Input
                  id="to"
                  value={`${party.email}`}
                  disabled
                  className="bg-muted text-gray-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject" className="text-gray-900 dark:text-white">Subject</Label>
                <Input
                  id="subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Enter email subject"
                  className="text-gray-900 dark:text-white bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content" className="text-gray-900 dark:text-white">Email Content</Label>
                <Textarea
                  id="content"
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  placeholder="Compose your email message..."
                  className="min-h-[200px] sm:min-h-[300px] resize-vertical text-gray-900 dark:text-white bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                />
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>You can edit the content above as needed</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEmailContent(generateDefaultEmailContent())}
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Reset to default
                </Button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 sm:p-6 bg-muted/20 dark:bg-gray-800/50">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleCloseClick}
                className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                disabled={isSending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={isSending}
                className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                Send Reminder
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
