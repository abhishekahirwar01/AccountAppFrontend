

// import React, { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Label } from "@/components/ui/label";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import {
//   Loader2,
//   MessageCircle,
//   X,
//   Smartphone,
//   CheckCircle2,
//   LogOut,
//   Users,
//   Crown,
// } from "lucide-react";
// import { useToast } from "@/components/ui/use-toast";
// import { WhatsAppConnectionDialog } from "./whatsapp-connection-dialog";
// import { useWhatsAppConnection } from "@/hooks/useWhatsAppConnection";

// interface WhatsAppComposerDialogProps {
//   isOpen: boolean;
//   onClose: () => void;
//   transaction: any;
//   party: any;
//   company: any;
// }

// export function WhatsAppComposerDialog({
//   isOpen,
//   onClose,
//   transaction,
//   party,
//   company,
// }: WhatsAppComposerDialogProps) {
//   const [messageContent, setMessageContent] = useState("");
//   const [mobileNumber, setMobileNumber] = useState("");
//   const [showConnectionDialog, setShowConnectionDialog] = useState(false);
//   const [isSending, setIsSending] = useState(false);
//   const { toast } = useToast();

//   const {
//     isConnected,
//     connectionInfo,
//     isLoading,
//     canManage,
//     connectWhatsApp,
//     disconnectWhatsApp,
//     refreshConnection,
//     sendMessage // ✅ ADDED: This is the function we need
//   } = useWhatsAppConnection();

//   // Initialize when dialog opens
//   useEffect(() => {
//     if (isOpen) {
//       const partyMobile = party?.contactNumber || party?.phone || "";
//       setMobileNumber(partyMobile);
//       setMessageContent(generateDefaultMessageContent());
//     }
//   }, [isOpen, transaction, party, company]);

//   const generateDefaultMessageContent = () => {
//     const invoiceNumber =
//       transaction.invoiceNumber || transaction.referenceNumber || "N/A";
//     const invoiceDate = new Date(transaction.date).toLocaleDateString("en-GB", {
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//     });
//     const amount = transaction.totalAmount || transaction.amount || 0;
//     const formattedAmount = new Intl.NumberFormat("en-IN", {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     }).format(amount);

//     return `Dear ${party?.name || "Valued Customer"},

// Please view the details of the transaction below.

// Invoice No: ${invoiceNumber}
// Invoice Date: ${invoiceDate}
// Amount: ₹${formattedAmount}

// Thank you for your business!

// Best regards,
// ${company?.businessName || "Your Company"}`;
//   };

//   // ✅ FIXED: Use the correct sendMessage function
//   const handleSendOnWhatsApp = async () => {
//     if (!mobileNumber.trim()) {
//       toast({
//         variant: "destructive",
//         title: "Mobile number required",
//         description: "Please enter a valid mobile number.",
//       });
//       return;
//     }

//     if (!messageContent.trim()) {
//       toast({
//         variant: "destructive",
//         title: "Message required",
//         description: "Please enter a message to share.",
//       });
//       return;
//     }

//     // ✅ REMOVED: Vendor ID check since we're using phone numbers directly
//     // if (!party?._id) {
//     //   toast({
//     //     variant: "destructive",
//     //     title: "Vendor ID required",
//     //     description: "Cannot send message without vendor information.",
//     //   });
//     //   return;
//     // }

//     setIsSending(true);
//     try {
//       const result = await sendMessage({
//         message: messageContent,
//         phoneNumber: mobileNumber,
//         partyName: party?.name,
//         invoiceData: {
//           partyName: party?.name,
//           invoiceNumber: transaction.invoiceNumber || transaction.referenceNumber,
//           amount: transaction.totalAmount || transaction.amount,
//           dueDate: transaction.dueDate,
//           gstAmount: transaction.taxAmount,
//           totalAmount: transaction.totalAmount,
//         },
//         manualSend: false,
//       });

//       if (result.success) {
//         // Success toast is handled in the hook
//         // Optionally close the dialog after successful send
//         // onClose();
//       }
//     } catch (error: any) {
//       console.error("Error sending WhatsApp message:", error);
//       // Show additional error toast if needed
//       if (!error.message?.includes("WhatsApp is not connected")) {
//         toast({
//           variant: "destructive",
//           title: "Send Failed",
//           description: error.message || "Failed to send WhatsApp message",
//         });
//       }
//     } finally {
//       setIsSending(false);
//     }
//   };

//   const handleConnectWhatsApp = () => {
//     setShowConnectionDialog(true);
//   };

//   const handleConnected = async () => {
//     try {
//       await refreshConnection();
//       setShowConnectionDialog(false);
//       toast({
//         title: "WhatsApp Connected!",
//         description: "WhatsApp has been successfully connected.",
//       });
//     } catch (error) {
//       console.error("Error after connection:", error);
//     }
//   };

//   const handleDisconnectWhatsApp = async () => {
//     await disconnectWhatsApp();
//   };

//   if (!isOpen) return null;

//   const invoiceNumber =
//     transaction.invoiceNumber || transaction.referenceNumber || "N/A";
//   const invoiceDate = new Date(transaction.date).toLocaleDateString();
//   const amount = transaction.totalAmount || transaction.amount || 0;
//   const formattedAmount = new Intl.NumberFormat("en-IN", {
//     style: "currency",
//     currency: "INR",
//   }).format(amount);

//   return (
//     <>
//       <div className="fixed inset-0 z-50 flex">
//         <div
//           className="fixed inset-0 bg-black/50 transition-opacity"
//           onClick={onClose}
//         />

//         <div className="relative ml-auto w-full max-w-2xl h-full bg-white shadow-xl transition-transform duration-300 ease-in-out">
//           <div className="flex flex-col h-full">
//             {/* Header */}
//             <div className="flex items-center justify-between p-6 border-b">
//               <div className="flex items-center gap-3">
//                 <MessageCircle className="h-6 w-6 text-green-600" />
//                 <div>
//                   <h2 className="text-xl font-semibold">Share on WhatsApp</h2>
//                   <p className="text-sm text-muted-foreground">
//                     {isConnected
//                       ? "Send messages automatically"
//                       : "Connect WhatsApp to send messages"}
//                   </p>
//                 </div>
//               </div>
//               <Button variant="ghost" size="icon" onClick={onClose}>
//                 <X className="h-4 w-4" />
//               </Button>
//             </div>

//             {/* Content */}
//             <div className="flex-1 overflow-y-auto p-6 space-y-6">
//               {/* Connection Status */}
//               {isLoading && (
//                 <Card className="border-blue-200 bg-blue-50">
//                   <CardContent className="p-4">
//                     <div className="flex items-center gap-3">
//                       <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
//                       <div className="flex-1">
//                         <p className="font-medium text-blue-800">
//                           Checking WhatsApp Connection...
//                         </p>
//                         <p className="text-sm text-blue-700">
//                           Verifying WhatsApp connection status
//                         </p>
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               )}

//               {!isLoading && isConnected === false && (
//                 <Card className="border-yellow-200 bg-yellow-50">
//                   <CardContent className="p-4">
//                     <div className="flex items-center gap-3">
//                       <Smartphone className="h-5 w-5 text-yellow-600" />
//                       <div className="flex-1">
//                         <p className="font-medium text-yellow-800">
//                           WhatsApp Not Connected
//                         </p>
//                         <p className="text-sm text-yellow-700">
//                           {canManage
//                             ? "Connect WhatsApp to send automated messages"
//                             : "WhatsApp needs to be connected to send messages"}
//                         </p>
//                       </div>
//                       {canManage && (
//                         <Button onClick={handleConnectWhatsApp} size="sm">
//                           <Smartphone className="h-4 w-4 mr-2" />
//                           Connect
//                         </Button>
//                       )}
//                     </div>
//                   </CardContent>
//                 </Card>
//               )}

//               {!isLoading && isConnected === true && (
//                 <Card className="border-green-200 bg-green-50">
//                   <CardContent className="p-4">
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center gap-3">
//                         <CheckCircle2 className="h-5 w-5 text-green-600" />
//                         <div>
//                           <p className="font-medium text-green-800 flex items-center gap-2">
//                             WhatsApp Connected
//                             {canManage && (
//                               <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
//                                 <Crown className="h-3 w-3" />
//                                 Admin
//                               </span>
//                             )}
//                           </p>
//                           <p className="text-sm text-green-700">
//                             {connectionInfo?.phoneNumber
//                               ? `Connected to ${connectionInfo.phoneNumber}`
//                               : "WhatsApp is connected and ready"}
//                             {connectionInfo?.profileName &&
//                               ` (${connectionInfo.profileName})`}
//                           </p>
//                         </div>
//                       </div>
//                       <div className="flex gap-2">
//                         <Button
//                           onClick={refreshConnection}
//                           variant="outline"
//                           size="sm"
//                           disabled={isLoading}
//                         >
//                           <Loader2
//                             className={`h-4 w-4 mr-1 ${
//                               isLoading ? "animate-spin" : ""
//                             }`}
//                           />
//                           Refresh
//                         </Button>
//                         {canManage && (
//                           <Button
//                             onClick={handleDisconnectWhatsApp}
//                             variant="outline"
//                             size="sm"
//                             className="text-red-600 border-red-200 hover:bg-red-50"
//                           >
//                             <LogOut className="h-4 w-4 mr-1" />
//                             Disconnect
//                           </Button>
//                         )}
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               )}

//               {/* Transaction Summary */}
//               <Card>
//                 <CardHeader className="pb-3">
//                   <CardTitle className="text-sm">Transaction Summary</CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-3 text-sm">
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">Customer:</span>
//                     <span className="font-medium">{party?.name || "N/A"}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">Mobile:</span>
//                     <span className="font-medium">
//                       {party?.contactNumber || party?.phone || "N/A"}
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">Invoice:</span>
//                     <span>{invoiceNumber}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">Date:</span>
//                     <span>{invoiceDate}</span>
//                   </div>
//                   <div className="flex justify-between items-center pt-2 border-t">
//                     <span className="text-muted-foreground">Amount:</span>
//                     <div className="text-right">
//                       <div className="font-bold text-lg">{formattedAmount}</div>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>

//               {/* WhatsApp Form */}
//               <div className="space-y-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="mobile">Mobile Number</Label>
//                   <div className="flex gap-2">
//                     <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-sm">
//                       +91
//                     </div>
//                     <Input
//                       id="mobile"
//                       value={mobileNumber}
//                       onChange={(e) => setMobileNumber(e.target.value)}
//                       placeholder="Enter mobile number"
//                       className="flex-1 rounded-l-none"
//                     />
//                   </div>
//                   <p className="text-xs text-muted-foreground">
//                     Make sure this is a valid WhatsApp number
//                   </p>
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="message">Message</Label>
//                   <Textarea
//                     id="message"
//                     value={messageContent}
//                     onChange={(e) => setMessageContent(e.target.value)}
//                     placeholder="Compose your WhatsApp message..."
//                     className="min-h-[300px] resize-vertical font-mono text-sm"
//                   />
//                 </div>

//                 <div className="flex items-center justify-between text-sm text-muted-foreground">
//                   <span>You can edit the message above as needed</span>
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={() =>
//                       setMessageContent(generateDefaultMessageContent())
//                     }
//                   >
//                     Reset to default
//                   </Button>
//                 </div>
//               </div>
//             </div>

//             {/* Footer */}
//             <div className="border-t p-6 bg-muted/20">
//               <div className="flex gap-3">
//                 <Button variant="outline" onClick={onClose} className="flex-1">
//                   Cancel
//                 </Button>

//                 {isConnected ? (
//                   <Button
//                     onClick={handleSendOnWhatsApp}
//                     className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
//                     disabled={isSending || !mobileNumber.trim()}
//                   >
//                     {isSending ? (
//                       <Loader2 className="h-4 w-4 animate-spin" />
//                     ) : (
//                       <MessageCircle className="h-4 w-4" />
//                     )}
//                     {isSending ? "Sending..." : "Send via WhatsApp"}
//                   </Button>
//                 ) : (
//                   <Button
//                     onClick={handleConnectWhatsApp}
//                     className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
//                     disabled={!canManage}
//                   >
//                     <Smartphone className="h-4 w-4" />
//                     {canManage ? "Connect WhatsApp" : "WhatsApp Not Connected"}
//                   </Button>
//                 )}
//               </div>

//               {isConnected && (
//                 <div className="mt-3 text-center">
//                   <p className="text-xs text-muted-foreground">
//                     💬 Messages will be sent automatically via WhatsApp
//                   </p>
//                 </div>
//               )}

//               {!isConnected && canManage && (
//                 <div className="mt-3 text-center">
//                   <p className="text-xs text-muted-foreground">
//                     🔗 Connect WhatsApp to enable automated messaging
//                   </p>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       <WhatsAppConnectionDialog
//         isOpen={showConnectionDialog}
//         onClose={() => setShowConnectionDialog(false)}
//         onConnected={handleConnected}
//       />
//     </>
//   );
// }












import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MessageCircle, X, Download, FileText, ExternalLink, Paperclip, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";


interface WhatsAppComposerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  party: any;
  company: any;
  products?: any[]; // Add this
  services?: any[];
  onGeneratePdf?: (transaction: any, party: any, company: any) => Promise<Blob>;
  serviceNameById?: Map<string, string>;
   className?: string;
}

export function WhatsAppComposerDialog({ 
  isOpen, 
  onClose, 
  transaction, 
  party, 
  company,
  onGeneratePdf,
  serviceNameById,
  products = [], // Default to empty array
  services = [],
}: WhatsAppComposerDialogProps) {
  const [messageContent, setMessageContent] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [pdfFileName, setPdfFileName] = useState('');
  const [currentStep, setCurrentStep] = useState(1); // 1: Setup, 2: PDF Ready, 3: WhatsApp Open
  const { toast } = useToast();

  // Initialize when dialog opens
  useEffect(() => {
    if (isOpen) {
      const partyMobile = party?.contactNumber || party?.phone || '';
      setMobileNumber(partyMobile);
      setMessageContent(generateDefaultMessageContent());
      setPdfGenerated(false);
      setPdfFileName('');
      setCurrentStep(1);
    }
  }, [isOpen, transaction, party, company]);


  // Generate PDF function
 
//  const generateDefaultMessageContent = () => {
//     const invoiceNumber = transaction.invoiceNumber || transaction.referenceNumber || 'N/A';
//     const invoiceDate = new Date(transaction.date).toLocaleDateString('en-GB', {
//         day: '2-digit',
//         month: 'short',
//         year: 'numeric'
//     });
    
//     // Get transaction details
//     const items = transaction.items || transaction.products || transaction.services || [];
//     console.log('Transaction items for message content:', items);
    
//     // Calculate totals from items if available
//     const subtotal = transaction.subtotal || 
//                     items.reduce((sum: number, item: any) => sum + (item.amount || item.lineTotal || 0), 0) || 
//                     transaction.totalAmount || 
//                     transaction.amount || 0;
    
//     const taxAmount = transaction.taxAmount || 
//                      transaction.tax || 
//                      transaction.gstAmount || 
//                      items.reduce((sum: number, item: any) => sum + (item.lineTax || item.gstAmount || 0), 0) || 0;
    
//     const totalAmount = transaction.totalAmount || transaction.grandTotal || subtotal + taxAmount;

//     // Format currency
//     const formatCurrency = (amount: number) => {
//         return new Intl.NumberFormat('en-IN', {
//             minimumFractionDigits: 2,
//             maximumFractionDigits: 2
//         }).format(amount);
//     };

//     // Build tabular items section
//     let itemsSection = '';
//     const displayItems = items.slice(0, 5); // Show first 5 items in table
//     const remainingItems = items.length - 5;
    
//     if (displayItems.length > 0) {
//         console.log('Building tabular items section with:', displayItems);
        
//         // Table header
//         itemsSection = `📊 Invoice Items:\n`;
        
//         itemsSection += `│ Item                              │ Quantity │ Unit Price │    Amount  │\n`;
       
//         // Table rows
//         displayItems.forEach((item: any) => {
//             const itemName = item.product?.name || 
//                            item.name || 
//                            item.productName || 
//                            item.serviceName ||
//                            (item.product && typeof item.product === 'string' ? item.product : null) ||
//                            'Item';
            
//             const quantity = item.quantity || 1;
//             const unitType = item.unitType ? ` ${item.unitType}` : '';
//             const unitPrice = item.pricePerUnit || item.rate || item.unitPrice || 0;
//             const itemAmount = item.amount || item.lineTotal || item.total || (quantity * unitPrice);
            
//             // Truncate long item names for table display
//             const displayName = itemName.length > 28 ? itemName.substring(0, 25) + '...' : itemName;
            
//             itemsSection += `│ ${displayName.padEnd(32)} │ ${(quantity + unitType).padStart(8)} │ ₹${formatCurrency(unitPrice).padStart(8)} │ ₹${formatCurrency(itemAmount).padStart(8)} │\n`;
//         });
        
//         // Table footer
        
        
//         // Show tax details if available
//         const hasTax = displayItems.some(item => item.lineTax || item.gstAmount);
//         if (hasTax) {
//             itemsSection += `\n`;
//             displayItems.forEach((item: any) => {
//                 const itemTax = item.lineTax || item.gstAmount || 0;
//                 if (itemTax > 0) {
//                     const itemName = item.product?.name || item.name || 'Item';
//                     const displayName = itemName.length > 20 ? itemName.substring(0, 17) + '...' : itemName;
//                     const taxRate = item.gstPercentage || 0;
//                     itemsSection += `   ${displayName}: Tax (${taxRate}%) = ₹${formatCurrency(itemTax)}\n`;
//                 }
//             });
//         }
        
//         // Show remaining items count if any
//         if (remainingItems > 0) {
//             itemsSection += `\n📋 ...and ${remainingItems} more items\n`;
//         }
        
//         itemsSection += `\n`;
//     } else {
//         // If no items in the array, try to get description
//         const description = transaction.description || transaction.narration;
//         if (description) {
//             itemsSection = `📋 Description: ${description}\n\n`;
//         } else {
//             itemsSection = `📋 Items: Various products/services\n\n`;
//         }
//     }

//     return `Dear ${party?.name || 'Valued Customer'},

// Please find your invoice summary:

// 📄 Invoice: ${invoiceNumber}
// 📅 Date: ${invoiceDate}

// ${itemsSection}
// 💰 Amount Summary:

// │ Subtotal           │ ₹${formatCurrency(subtotal).padStart(12)} │
// │ Tax                │ ₹${formatCurrency(taxAmount).padStart(12)} │
// │ Total              │ ₹${formatCurrency(totalAmount).padStart(12)} │


// Complete details are in the attached PDF invoice.

// Thank you for your business!

// Best regards,
// ${company?.businessName || 'Your Company'}`;
// };


// const generateDefaultMessageContent = () => {
//     const invoiceNumber = transaction.invoiceNumber || transaction.referenceNumber || 'N/A';
//     const invoiceDate = new Date(transaction.date).toLocaleDateString('en-GB', {
//         day: '2-digit',
//         month: 'short',
//         year: 'numeric'
//     });
    
//     // Debug: Check both products and services
//     console.log('=== TRANSACTION DEBUG ===');
//     console.log('Products array:', transaction.products);
//     console.log('Services array:', transaction.services);
//     console.log('Products length:', transaction.products?.length);
//     console.log('Services length:', transaction.services?.length);
//     console.log('=== END DEBUG ===');
    
//     // Combine both products and services into one array
//     const products = transaction.products || [];
//     const services = transaction.services || [];
//     const allItems = [...products, ...services];
    
//     const subtotal = transaction.subtotal || allItems.reduce((sum: number, item: any) => sum + (item.amount || item.lineTotal || 0), 0) || 0;
//     const taxAmount = transaction.taxAmount || allItems.reduce((sum: number, item: any) => sum + (item.lineTax || item.gstAmount || 0), 0) || 0;
//     const totalAmount = transaction.totalAmount || subtotal + taxAmount;

//     const formatCurrency = (amount: number) => {
//         return new Intl.NumberFormat('en-IN', {
//             minimumFractionDigits: 2,
//             maximumFractionDigits: 2
//         }).format(amount);
//     };

//     let message = `📄 *INVOICE - ${company?.businessName || 'Your Company'}*\n\n`;
//     message += `*Invoice No:* ${invoiceNumber}\n`;
//     message += `*Date:* ${invoiceDate}\n`;
//     message += `*Customer:* ${party?.name || 'Valued Customer'}\n\n`;
    
//     // Build items section from combined products and services
//     if (allItems.length > 0) {
//         message += `*ITEMS:*\n`;
//         message += '────────────────\n';
        
//         allItems.forEach((item: any, index: number) => {
//             // Determine if it's a product or service and extract name accordingly
//             let itemName = 'Item';
//             let itemType = '';
            
//             if (item.product) {
//                 // This is a product
//                 itemName = item.product?.name || item.name || 'Product';
//                 itemType = '🛍️ ';
//             } else if (item.service) {
//                 // This is a service
//                 itemName = item.service?.serviceName || item.name || 'Service';
//                 itemType = '🔧 ';
//             } else {
//                 // Fallback
//                 itemName = item.name || item.productName || item.serviceName || `Item ${index + 1}`;
//             }
            
//             const quantity = item.quantity || 1;
//             const unitType = item.unitType ? ` ${item.unitType}` : '';
//             const unitPrice = item.pricePerUnit || item.rate || item.unitPrice || (item.amount / quantity) || 0;
//             const itemAmount = item.amount || item.lineTotal || item.total || (quantity * unitPrice);
//             const itemTax = item.lineTax || item.gstAmount || 0;
//             const taxRate = item.gstPercentage || transaction.gstPercentage || 0;
            
//             message += `${index + 1}. ${itemType}${itemName}\n`;
//             message += `   Qty: ${quantity}${unitType} × ₹${formatCurrency(unitPrice)} = ₹${formatCurrency(itemAmount)}\n`;
            
//             if (itemTax > 0) {
//                 message += `   Tax (${taxRate}%): ₹${formatCurrency(itemTax)}\n`;
//             }
//         });
        
//         message += '────────────────\n';
//     } else {
//         // If no items, show basic info
//         message += `*DESCRIPTION:*\n`;
//         message += '────────────────\n';
//         message += `${transaction.description || transaction.narration || 'Products/Services'}\n`;
//         message += '────────────────\n';
//     }
    
//     message += `*Subtotal:* ₹${formatCurrency(subtotal)}\n`;
//     message += `*Tax:* ₹${formatCurrency(taxAmount)}\n`;
//     message += `*TOTAL:* ₹${formatCurrency(totalAmount)}\n\n`;
    
//     message += `Thank you for your business! 🎉\n\n`;
//     message += `Best regards,\n`;
//     message += `*${company?.businessName || 'Your Company'}*`;
    
//     return message;
// };

const generateDefaultMessageContent = () => {
    const invoiceNumber = transaction.invoiceNumber || transaction.referenceNumber || 'N/A';
    const invoiceDate = new Date(transaction.date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
    
    // Debug: Check both products and services
    console.log('=== TRANSACTION DEBUG ===');
    console.log('Products array:', transaction.products);
    console.log('Services array:', transaction.services);
    console.log('Available products prop:', products); // Check the props
    console.log('Available services prop:', services); // Check the props
    console.log('=== END DEBUG ===');
    
    // Combine both products and services into one array - RENAME VARIABLES
    const transactionProducts = transaction.products || []; // Renamed
    const transactionServices = transaction.services || []; // Renamed
    const allItems = [...transactionProducts, ...transactionServices];
    
    const subtotal = transaction.subtotal || allItems.reduce((sum: number, item: any) => sum + (item.amount || item.lineTotal || 0), 0) || 0;
    const taxAmount = transaction.taxAmount || allItems.reduce((sum: number, item: any) => sum + (item.lineTax || item.gstAmount || 0), 0) || 0;
    const totalAmount = transaction.totalAmount || subtotal + taxAmount;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    let message = `📄 *INVOICE - ${company?.businessName || 'Your Company'}*\n\n`;
    message += `*Invoice No:* ${invoiceNumber}\n`;
    message += `*Date:* ${invoiceDate}\n`;
    message += `*Customer:* ${party?.name || 'Valued Customer'}\n\n`;
    
    // Build items section from combined products and services
    if (allItems.length > 0) {
        message += `*ITEMS:*\n`;
        message += '────────────────\n';
        
        allItems.forEach((item: any, index: number) => {
            // Determine if it's a product or service and extract name accordingly
            let itemName = 'Item';
            let itemType = '';
            
            if (item.product || item.productId) {
                // This is a product - use the props to find the actual name
                const productId = item.product?._id || item.product || item.productId;
                const foundProduct = products.find(p => p._id === productId); // Now using the props
                itemName = foundProduct?.name || item.product?.name || item.name || 'Product';
                itemType = '🛍️ ';
                console.log(`Product ${index + 1}: ID=${productId}, Name=${itemName}`);
            } else if (item.service || item.serviceId) {
                // This is a service - use the props to find the actual name
                const serviceId = item.service?._id || item.service || item.serviceId;
                const foundService = services.find(s => s._id === serviceId); // Now using the props
                itemName = foundService?.serviceName || item.service?.serviceName || item.name || 'Service';
                itemType = '🔧 ';
                console.log(`Service ${index + 1}: ID=${serviceId}, Name=${itemName}`);
            } else {
                // Fallback
                itemName = item.name || item.productName || item.serviceName || `Item ${index + 1}`;
            }
            
            const quantity = item.quantity || 1;
            const unitType = item.unitType ? ` ${item.unitType}` : '';
            const unitPrice = item.pricePerUnit || item.rate || item.unitPrice || (item.amount / quantity) || 0;
            const itemAmount = item.amount || item.lineTotal || item.total || (quantity * unitPrice);
            const itemTax = item.lineTax || item.gstAmount || 0;
            const taxRate = item.gstPercentage || transaction.gstPercentage || 0;
            
            message += `${index + 1}. ${itemType}${itemName}\n`;
            message += `   Qty: ${quantity}${unitType} × ₹${formatCurrency(unitPrice)} = ₹${formatCurrency(itemAmount)}\n`;
            
            if (itemTax > 0) {
                message += `   Tax (${taxRate}%): ₹${formatCurrency(itemTax)}\n`;
            }
        });
        
        message += '────────────────\n';
    } else {
        // If no items, show basic info
        message += `*DESCRIPTION:*\n`;
        message += '────────────────\n';
        message += `${transaction.description || transaction.narration || 'Products/Services'}\n`;
        message += '────────────────\n';
    }
    
    message += `*Subtotal:* ₹${formatCurrency(subtotal)}\n`;
    message += `*Tax:* ₹${formatCurrency(taxAmount)}\n`;
    message += `*TOTAL:* ₹${formatCurrency(totalAmount)}\n\n`;
    
    message += `Thank you for your business! 🎉\n\n`;
    message += `Best regards,\n`;
    message += `*${company?.businessName || 'Your Company'}*`;
    
    return message;
};
 
  const handleCompleteFlow = async () => {
  if (!mobileNumber.trim()) {
    toast({
      variant: 'destructive',
      title: 'Mobile number required',
      description: 'Please enter a valid mobile number.',
    });
    return;
  }

  try {
    setIsGeneratingPdf(true);
    
    // Simply open WhatsApp without any PDF download
    const formattedNumber = mobileNumber.replace(/\D/g, '');
    let finalNumber = formattedNumber;
    if (!formattedNumber.startsWith('91') && formattedNumber.length === 10) {
      finalNumber = `91${formattedNumber}`;
    }

    const encodedMessage = encodeURIComponent(messageContent);
    const whatsappUrl = `https://web.whatsapp.com/send?phone=${finalNumber}&text=${encodedMessage}`;
    
    const newWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    
    if (newWindow) {
      toast({
        title: 'WhatsApp Opening',
        description: 'Please download the PDF first and attach it manually in WhatsApp.',
      });
    }

    // Close dialog after opening WhatsApp
    setTimeout(() => {
      onClose();
    }, 2000);

  } catch (error) {
    console.error('Error opening WhatsApp:', error);
    toast({
      variant: 'destructive',
      title: 'Operation Failed',
      description: 'Could not open WhatsApp. Please try again.',
    });
  } finally {
    setIsGeneratingPdf(false);
  }
};

// Remove PDF-only button since we're not generating PDFs here
const handleOpenWhatsAppOnly = () => {
  if (!mobileNumber.trim()) {
    toast({
      variant: 'destructive',
      title: 'Mobile number required',
      description: 'Please enter a valid mobile number.',
    });
    return;
  }

  const formattedNumber = mobileNumber.replace(/\D/g, '');
  let finalNumber = formattedNumber;
  if (!formattedNumber.startsWith('91') && formattedNumber.length === 10) {
    finalNumber = `91${formattedNumber}`;
  }

  const encodedMessage = encodeURIComponent(messageContent);
  const whatsappUrl = `https://web.whatsapp.com/send?phone=${finalNumber}&text=${encodedMessage}`;
  
  const newWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  
  if (newWindow) {
    toast({
      title: 'WhatsApp Opening',
      description: 'Opening WhatsApp Web.',
    });
    onClose();
  }
};

  if (!isOpen) return null;

  const invoiceNumber = transaction.invoiceNumber || transaction.referenceNumber || 'N/A';
  const invoiceDate = new Date(transaction.date).toLocaleDateString();
  const amount = transaction.totalAmount || transaction.amount || 0;
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);

  return (
    <>
     <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col z-[99999]">

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            Send Invoice via WhatsApp
          </DialogTitle>
        </DialogHeader>

         <div className="flex-1 overflow-y-auto">
           {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Transaction Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Invoice Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer:</span>
                    <span className="font-medium">{party?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mobile:</span>
                    <span className="font-medium">{party?.contactNumber || party?.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice No:</span>
                    <span>{invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span>{invoiceDate}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-muted-foreground">Amount:</span>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {formattedAmount}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

             

              {/* WhatsApp Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mobile">Customer WhatsApp Number</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-sm">
                      +91
                    </div>
                    <Input
                      id="mobile"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="Enter customer WhatsApp number"
                      className="flex-1 rounded-l-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message to Send</Label>
                  <Textarea
                    id="message"
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="Compose your WhatsApp message..."
                    className="min-h-[150px] resize-vertical text-sm"
                  />
                </div>
              </div>

              {/* Important Instructions */}
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <h4 className="font-medium text-amber-800 mb-3 flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Important: Manual PDF Attachment Required
                  </h4>
                 
                </CardContent>
              </Card>
            </div>

            {/* Footer Actions */}
            <div className="border-t p-6 bg-muted/20">
              {/* Main Action Flow */}
              <div className="flex gap-3 mb-4">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                
                {currentStep === 1 && (
                  <Button
                    onClick={handleCompleteFlow}
                    disabled={isGeneratingPdf || !mobileNumber.trim()}
                    className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                  >
                    {isGeneratingPdf ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MessageCircle className="h-4 w-4" />
                    )}
                     Open WhatsApp
                  </Button>
                )}
                
                {currentStep === 2 && (
                  <Button
                    onClick={handleOpenWhatsAppOnly}
                    className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open WhatsApp Web
                  </Button>
                )}
                
                {currentStep === 3 && (
                  <Button
                    onClick={onClose}
                    className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Done - Return to App
                  </Button>
                )}
              </div>

             
            </div>
         </div>
        </DialogContent>
    </Dialog>
     
    </>
  );
}