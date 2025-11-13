"use client";

import { ColumnDef, FilterFn, Row } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Download,
  MoreHorizontal,
  Copy,
  Edit,
  Trash2,
  Building,
  Package,
  Eye,
  Server,
  Send,
  Printer,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { Transaction, Company, Party } from "@/lib/types";
import { generatePdfForTemplate1 } from "@/lib/pdf-template1";
import { generatePdfForTemplate11 } from "@/lib/pdf-template11";
import { generatePdfForTemplate12 } from "@/lib/pdf-template12";
import { generatePdfForTemplate16 } from "@/lib/pdf-template16";
import { generatePdfForTemplateA5 } from "@/lib/pdf-templateA5";
import { generatePdfForTemplateA5_3 } from "@/lib/pdf-templateA5-3";
import { generatePdfForTemplateA5_4 } from "@/lib/pdf-templateA5-4";
import { generatePdfForTemplatet3 } from "@/lib/pdf-template-t3";
import { getUnifiedLines } from "@/lib/utils";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { FaWhatsapp } from "react-icons/fa";
import { useToast } from "@/components/ui/use-toast";
import { PaymentMethodCell } from "./payment-method-cell";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Import the WhatsApp composer dialog
import { WhatsAppComposerDialog } from "./whatsapp-composer-dialog";
import { whatsappConnectionService } from "@/lib/whatsapp-connection";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { generatePdfForTemplate2 } from "@/lib/pdf-template2";
import { generatePdfForTemplate17 } from "@/lib/pdf-template17";
import { generatePdfForTemplate18 } from "@/lib/pdf-template18";
import { generatePdfForTemplate19 } from "@/lib/pdf-template19";
import { generatePdfForTemplate3 } from "@/lib/pdf-template3";
import { generatePdfForTemplate4 } from "@/lib/pdf-template4";
import { generatePdfForTemplate5 } from "@/lib/pdf-template5";
import { generatePdfForTemplate6 } from "@/lib/pdf-template6";
import { generatePdfForTemplate7 } from "@/lib/pdf-template7";
import { generatePdfForTemplate8 } from "@/lib/pdf-template8";
import { generatePdfForTemplateA5_2 } from "@/lib/pdf-templateA3-2";
import { capitalizeWords } from "@/lib/utils";

interface ColumnsProps {
  onPreview: (transaction: Transaction) => void;
  onViewItems: (tx: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  companyMap: Map<string, string>;
  serviceNameById: Map<string, string>;
  onSendInvoice: (tx: Transaction) => void;
  onSendWhatsApp?: (transaction: Transaction) => void;
  serviceMap?: Map<string, string>;
  hideActions?: boolean;
  userRole?: string;
  onConvertToSales?: (transaction: Transaction) => void;
  customerBalances?: { [key: string]: number };
}

/** Build a filter function that can match party/vendor, description and line names */
const makeCustomFilterFn = (
  serviceNameById: Map<string, string>
): FilterFn<Transaction> => {
  return (row, _columnId, filterValue) => {
    if (!filterValue) return true;

    const tx = row.original;
    const q = String(filterValue).toLowerCase();

    // party / vendor
    let partyName = "";
    const pv = tx.party || tx.vendor;
    if (pv && typeof pv === "object") {
      partyName = (pv as any).name || (pv as any).vendorName || "";
    }

    const desc = (tx.description || tx.narration || "").toLowerCase();

    // lines (products/services)
    const lines = getUnifiedLines(tx, serviceNameById);
    const matchLine = lines.some((l: { name?: string }) =>
      (l.name || "").toLowerCase().includes(q)
    );

    return partyName.toLowerCase().includes(q) || desc.includes(q) || matchLine;
  };
};

const printInvoice = async (
  transaction: Transaction,
  company?: Company,
  party?: Party,
  serviceNameById?: Map<string, string>,
  shippingAddress?: any,
  bank?: any,
  client?: any, // Change from clientContactName to full client object
  template: string = "template1"
) => {
  try {
    let pdfBlob: Blob;

    switch (template) {
      case "template1":
        pdfBlob = await generatePdfForTemplate1(
          transaction,
          company || null,
          party,
          serviceNameById,
          shippingAddress,
          bank,
          client
        );
        break;
      case "template2":
        const pdfDoc2 = generatePdfForTemplate2(
          transaction,
          company || null,
          party,
          serviceNameById,
          shippingAddress
        );
        pdfBlob = (await pdfDoc2).output("blob");
        break;
      case "template3":
        pdfBlob = (
          await generatePdfForTemplate3(
            transaction,
            company || null,
            party,
            serviceNameById,
            shippingAddress
          )
        ).output("blob");
        break;
      case "template4":
        const pdfDoc4 = generatePdfForTemplate4(
          transaction,
          company || null,
          party,
          serviceNameById,
          shippingAddress
        );
        pdfBlob = (await pdfDoc4).output("blob");
        break;
      case "template5":
        const pdfDoc5 = generatePdfForTemplate5(
          transaction,
          company || null,
          party,
          serviceNameById,
          shippingAddress
        );
        pdfBlob = (await pdfDoc5).output("blob");
        break;
      case "template6":
        const pdfDoc6 = generatePdfForTemplate6(
          transaction,
          company || null,
          party,
          serviceNameById,
          shippingAddress
        );
        pdfBlob = (await pdfDoc6).output("blob");
        break;
      case "template7":
        const pdfDoc7 = generatePdfForTemplate7(
          transaction,
          company || null,
          party,
          serviceNameById,
          shippingAddress
        );
        pdfBlob = (await pdfDoc7).output("blob");
        break;
      case "template8":
        pdfBlob = await generatePdfForTemplate8(
          transaction,
          company || null,
          party,
          serviceNameById,
          shippingAddress,
          bank
        );
        break;
      case "template11":
        const pdfDoc11 = generatePdfForTemplate11(
          transaction,
          company || null,
          party,
          serviceNameById,
          shippingAddress,
          undefined,
          bank
        );
        pdfBlob = (await pdfDoc11).output("blob");
        break;
      case "template12":
        pdfBlob = await generatePdfForTemplate12(
          transaction,
          company || null,
          party || null,
          serviceNameById,
          shippingAddress,
          bank
        );
        break;
      case "template16":
        const pdfDoc16 = generatePdfForTemplate16(
          transaction,
          company || null,
          party,
          serviceNameById,
          shippingAddress
        );
        pdfBlob = (await pdfDoc16).output("blob");
        break;
      case "template17":
        const pdfDoc17 = generatePdfForTemplate17(
          transaction,
          company || null,
          party,
          serviceNameById,
          shippingAddress,
          bank
        );
        pdfBlob = (await pdfDoc17).output("blob");
        break;
      case "template18":
        pdfBlob = await generatePdfForTemplate18(
          transaction,
          company || null,
          party,
          serviceNameById,
          shippingAddress,
          bank
        );
        break;
      case "template19":
        const pdfDoc19 = generatePdfForTemplate19(
          transaction,
          company || null,
          party,
          serviceNameById,
          shippingAddress,
          bank
        );
        pdfBlob = (await pdfDoc19).output("blob");
        break;
      case "templateA5":
        pdfBlob = await generatePdfForTemplateA5(
          transaction,
          company || null,
          party,
          serviceNameById,
          shippingAddress,
          bank,
          client
        );
        break;
      case "templateA5_2":
        pdfBlob = await generatePdfForTemplateA5_2(
          transaction,
          company || null,
          party,
          serviceNameById,
          shippingAddress,
          bank,
          client
        );
        break;
      case "templateA5_3":
        pdfBlob = await generatePdfForTemplateA5_3(
          transaction,
          company || null,
          party,
          serviceNameById,
          shippingAddress,
          bank,
          client
        );
        break;
      case "templateA5_4":
        pdfBlob = await generatePdfForTemplateA5_4(
          transaction,
          company || null,
          party,
          serviceNameById,
          shippingAddress,
          bank,
          client
        );
        break;
      case "template-t3":
        pdfBlob = await generatePdfForTemplatet3(
          transaction,
          company || null,
          party,
          shippingAddress,
          bank
        );
        break;
      default:
        pdfBlob = await generatePdfForTemplate1(
          transaction,
          company || null,
          party,
          serviceNameById,
          shippingAddress,
          bank,
          client
        );
    }

    const pdfUrl = URL.createObjectURL(pdfBlob);

    // Create iframe for printing
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    iframe.src = pdfUrl;

    document.body.appendChild(iframe);

    iframe.onload = () => {
      try {
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();

          const cleanup = () => {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(pdfUrl);
            iframe.contentWindow?.removeEventListener("afterprint", cleanup);
          };

          iframe.contentWindow?.addEventListener("afterprint", cleanup);

          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
              URL.revokeObjectURL(pdfUrl);
            }
          }, 30000);
        }, 1000);
      } catch (printError) {
        console.error("Print failed:", printError);
        document.body.removeChild(iframe);
        URL.revokeObjectURL(pdfUrl);
        throw new Error("Printing failed - please try downloading instead");
      }
    };

    iframe.onerror = () => {
      console.error("Failed to load PDF in iframe");
      document.body.removeChild(iframe);
      URL.revokeObjectURL(pdfUrl);
      throw new Error("Failed to load PDF for printing");
    };
  } catch (error) {
    console.error("Error printing invoice:", error);
    throw new Error("Failed to generate print document");
  }
};
export const columns = ({
  onPreview,
  onViewItems,
  onEdit,
  onDelete,
  companyMap,
  serviceNameById,
  onSendInvoice,
  onSendWhatsApp,
  hideActions = false,
  userRole,
  onConvertToSales,
  customerBalances,
}: ColumnsProps): ColumnDef<Transaction>[] => {
  const customFilterFn = makeCustomFilterFn(serviceNameById);

  const baseColumns: ColumnDef<Transaction>[] = [
    // SELECT COLUMN

    // PARTY / DETAILS
    {
      accessorKey: "party",
      header: "Details",
      filterFn: customFilterFn,
      cell: ({ row }) => {
        const transaction = row.original;

        if (transaction.type === "journal") {
          return (
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>JE</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">Journal Entry</div>
                <div className="text-sm text-muted-foreground">
                  {transaction.debitAccount} / {transaction.creditAccount}
                </div>
              </div>
            </div>
          );
        }

        const partyOrVendor = transaction.party || transaction.vendor;
        let partyName = "N/A";
        if (partyOrVendor && typeof partyOrVendor === "object") {
          if ("name" in partyOrVendor) {
            partyName = (partyOrVendor as any).name;
          } else if ("vendorName" in partyOrVendor) {
            partyName = (partyOrVendor as any).vendorName;
          }
        }

        // For expense payments, show expense name instead of party/vendor
        if (
          transaction.type === "payment" &&
          transaction.isExpense &&
          transaction.expense
        ) {
          if (
            typeof transaction.expense === "object" &&
            transaction.expense.name
          ) {
            partyName = transaction.expense.name;
          } else if (typeof transaction.expense === "string") {
            partyName = transaction.expense;
          }
        }

        return (
          <div className="flex items-center gap-3">
            <Avatar className="hidden md:block">
              <AvatarFallback>
                {partyName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">
                {capitalizeWords(partyName) || "N/A"}
              </div>
              <div className="text-sm text-muted-foreground hidden sm:block truncate max-w-xs">
                {transaction.description || transaction.narration || ""}
              </div>
            </div>
          </div>
        );
      },
    },

    // COMPANY
    {
      accessorKey: "company",
      header: "Company",
      cell: ({ row }: { row: Row<Transaction> }) => {
        const company = row.original.company;
        const companyId =
          typeof company === "object" && company !== null
            ? (company as any)._id
            : company;

        if (!companyId) return "N/A";

        const companyName = companyMap?.get(companyId as string) || "N/A";
        return (
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <span className="hidden sm:inline">{companyName}</span>
            <span className="sm:hidden text-sm">{companyName}</span>
          </div>
        );
      },
    },

    // LINES (ITEMS/SERVICES)
    // {
    //   id: "lines",
    //   header: "Items / Services",
    //   cell: ({ row }) => {
    //     const tx = row.original as any;
    //     const lines = getUnifiedLines(tx, serviceNameById);
    //     if (!lines.length)
    //       return <span className="text-muted-foreground">-</span>;

    //     const MAX_DISPLAY = 2;
    //     const displayLines = lines.slice(0, MAX_DISPLAY);
    //     const remainingCount = lines.length - MAX_DISPLAY;

    //      // Function to format the full transaction details for copying
    // const getCopyText = () => {
    //   const transactionType = tx.type?.charAt(0).toUpperCase() + tx.type?.slice(1) || 'Transaction';
    //   const partyName = typeof tx.party === 'object' ? tx.party.name : tx.party;
    //   const date = new Date(tx.date).toLocaleDateString();
    //   const total = new Intl.NumberFormat("en-IN", {
    //     style: "currency",
    //     currency: "INR"
    //   }).format(tx.totalAmount || tx.invoiceTotal || 0);

    //   let text = `${transactionType} Details\n`;
    //   text += `Date: ${date}\n`;
    //   text += `Party: ${partyName || 'N/A'}\n`;
    //   text += `Total: ${total}\n`;
    //   text += `Reference: ${tx.referenceNumber || 'N/A'}\n\n`;
    //   text += `Items (${lines.length}):\n`;

    //   lines.forEach((line: any, index: number) => {
    //     text += `${index + 1}. ${line.type === 'product' ? '📦' : '🛠️'} ${line.name}\n`;

    //     if (line.type === 'product') {
    //       text += `   Qty: ${line.quantity}${line.unitType ? ` ${line.unitType}` : ''}\n`;
    //       if (line.pricePerUnit) {
    //         text += `   Price: ${new Intl.NumberFormat("en-IN").format(Number(line.pricePerUnit))}\n`;
    //       }
    //     } else if (line.type === 'service' && line.description) {
    //       text += `   Desc: ${line.description}\n`;
    //     }

    //     if (line.amount) {
    //       text += `   Amount: ${new Intl.NumberFormat("en-IN", {
    //         style: "currency",
    //         currency: "INR"
    //       }).format(Number(line.amount))}\n`;
    //     }
    //     text += '\n';
    //   });

    //   return text;
    // };

    // // Copy to clipboard function
    // const handleCopy = async () => {
    //   try {
    //     const textToCopy = getCopyText();
    //     await navigator.clipboard.writeText(textToCopy);

    //     // You can add a toast notification here if you have one
    //     // toast({
    //     //   title: "Copied!",
    //     //   description: "Transaction details copied to clipboard",
    //     //   duration: 2000,
    //     // });

    //     console.log("Transaction details copied to clipboard");
    //   } catch (err) {
    //     console.error('Failed to copy: ', err);
    //     // Fallback for older browsers
    //     const textArea = document.createElement('textarea');
    //     textArea.value = getCopyText();
    //     document.body.appendChild(textArea);
    //     textArea.select();
    //     document.execCommand('copy');
    //     document.body.removeChild(textArea);
    //     console.log("Transaction details copied to clipboard (fallback)");
    //   }
    // };

    //     const fullList = (
    //       <div className="space-y-2">
    //         {lines.map((l: any, idx: number) => (
    //           <div key={idx} className="flex items-center gap-2 text-sm">
    //             {l.type === "product" ? (
    //               <Package className="h-4 w-4 text-muted-foreground shrink-0" />
    //             ) : (
    //               <Server className="h-4 w-4 text-muted-foreground shrink-0" />
    //             )}
    //             <div className="min-w-0">
    //               <div className="truncate font-medium">{l.name}</div>
    //               {l.type === "product" && (
    //                 <div className="text-xs text-muted-foreground">
    //                   {l.quantity}
    //                   {l.unitType ? ` ${l.unitType}` : ""}
    //                   {l.pricePerUnit
    //                     ? ` @ ${new Intl.NumberFormat("en-IN").format(
    //                         Number(l.pricePerUnit)
    //                       )}`
    //                     : ""}
    //                 </div>
    //               )}
    //               {l.type === "service" && l.description && (
    //                 <div className="text-xs text-muted-foreground truncate">
    //                   {l.description}
    //                 </div>
    //               )}
    //             </div>
    //           </div>
    //         ))}
    //       </div>
    //     );

    //     return (
    //       // <TooltipProvider>
    //       //   <Tooltip>
    //       //     <TooltipTrigger asChild>
    //       //       <div
    //       //         className="flex items-center -space-x-2 cursor-pointer"
    //       //         onClick={() => onViewItems(row.original)}
    //       //       >
    //       //         {displayLines.map((l: any, idx: number) => (
    //       //           <Avatar
    //       //             key={idx}
    //       //             className="h-7 w-7 border-2 border-background"
    //       //           >
    //       //             <AvatarFallback className="text-xs">
    //       //               {l.type === "product" ? (
    //       //                 <Package className="h-4 w-4" />
    //       //               ) : (
    //       //                 <Server className="h-4 w-4" />
    //       //               )}
    //       //             </AvatarFallback>
    //       //           </Avatar>
    //       //         ))}
    //       //         {remainingCount > 0 && (
    //       //           <Avatar className="h-7 w-7 border-2 border-background">
    //       //             <AvatarFallback className="text-xs font-semibold">
    //       //               +{remainingCount}
    //       //             </AvatarFallback>
    //       //           </Avatar>
    //       //         )}
    //       //       </div>
    //       //     </TooltipTrigger>
    //       //     <TooltipContent className="p-4" side="bottom" align="start">
    //       //       {fullList}
    //       //     </TooltipContent>
    //       //   </Tooltip>
    //       // </TooltipProvider>
    //       <TooltipProvider>
    //     <Tooltip>
    //       <TooltipTrigger asChild>
    //         <div className="flex items-center gap-2">
    //           {/* Copy Button */}
    //           <Button
    //             variant="ghost"
    //             size="icon"
    //             className="h-6 w-6 shrink-0"
    //             onClick={(e) => {
    //               e.stopPropagation(); // Prevent triggering row click
    //               handleCopy();
    //             }}
    //             title="Copy transaction details"
    //           >
    //             <Copy className="h-3 w-3" />
    //           </Button>

    //           {/* Items Display */}
    //           <div
    //             className="flex items-center -space-x-2 cursor-pointer flex-1"
    //             onClick={() => onViewItems(row.original)}
    //           >
    //             {displayLines.map((l: any, idx: number) => (
    //               <Avatar
    //                 key={idx}
    //                 className="h-7 w-7 border-2 border-background"
    //               >
    //                 <AvatarFallback className="text-xs">
    //                   {l.type === "product" ? (
    //                     <Package className="h-4 w-4" />
    //                   ) : (
    //                     <Server className="h-4 w-4" />
    //                   )}
    //                 </AvatarFallback>
    //               </Avatar>
    //             ))}
    //             {remainingCount > 0 && (
    //               <Avatar className="h-7 w-7 border-2 border-background">
    //                 <AvatarFallback className="text-xs font-semibold">
    //                   +{remainingCount}
    //                 </AvatarFallback>
    //               </Avatar>
    //             )}
    //           </div>
    //         </div>
    //       </TooltipTrigger>
    //       <TooltipContent className="p-4" side="bottom" align="start">
    //         <div className="space-y-3">
    //           <div className="flex items-center justify-between">
    //             <span className="font-semibold">Items & Services</span>
    //             <Button
    //               variant="outline"
    //               size="sm"
    //               onClick={handleCopy}
    //               className="h-7 text-xs"
    //             >
    //               <Copy className="h-3 w-3 mr-1" />
    //               Copy All
    //             </Button>
    //           </div>
    //           {fullList}
    //         </div>
    //       </TooltipContent>
    //     </Tooltip>
    //   </TooltipProvider>
    //     );
    //   },
    // },

    {
  id: "lines",
  header: "Items / Services",
  cell: ({ row }) => {
    const tx = row.original as any;
    const lines = getUnifiedLines(tx, serviceNameById);
    if (!lines.length)
      return <span className="text-muted-foreground">-</span>;

    const MAX_DISPLAY = 2;
    const displayLines = lines.slice(0, MAX_DISPLAY);
    const remainingCount = lines.length - MAX_DISPLAY;

    // Add this state hook for the copied message
    const [showCopied, setShowCopied] = useState(false);

    // Function to format the full transaction details for copying
    // Function to format the full transaction details for copying
const getCopyText = () => {
  const transactionType = tx.type?.charAt(0).toUpperCase() + tx.type?.slice(1) || "Transaction";
  
  // For purchases, show vendor name instead of party
  let contactName = "N/A";
  if (tx.type === "purchases") {
    contactName = typeof tx.vendor === "object" ? tx.vendor.vendorName : tx.vendor || "N/A";
  } else {
    contactName = typeof tx.party === "object" ? tx.party.name : tx.party || "N/A";
  }
  
  const date = new Date(tx.date).toLocaleDateString();
  const total = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(tx.totalAmount || tx.invoiceTotal || 0);

  let text = `${transactionType} Details\n`;
  text += `Date: ${date}\n`;
  
  // Use "Vendor" for purchases, "Customer" for sales, "Party" for others
  if (tx.type === "purchases") {
    text += `Vendor: ${contactName}\n`;
  } else if (tx.type === "sales") {
    text += `Customer: ${contactName}\n`;
  } else {
    text += `Party: ${contactName}\n`;
  }
  
  text += `Total: ${total}\n`;
  
  // Only show reference for non-sales and non-purchase entries
  if (tx.type !== "sales" && tx.type !== "purchases") {
    text += `Reference: ${tx.referenceNumber || "N/A"}\n`;
  }
  
  text += `\nItems (${lines.length}):\n`;

  lines.forEach((line: any, index: number) => {
    text += `${index + 1}. ${line.type === "product" ? "📦" : "🛠️"} ${line.name}\n`;

    if (line.type === "product") {
      text += `   Qty: ${line.quantity}${line.unitType ? ` ${line.unitType}` : ""}\n`;
      if (line.pricePerUnit) {
        text += `   Price: ${new Intl.NumberFormat("en-IN").format(Number(line.pricePerUnit))}\n`;
      }
    } else if (line.type === "service" && line.description) {
      text += `   Desc: ${line.description}\n`;
    }

    if (line.amount) {
      text += `   Amount: ${new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(Number(line.amount))}\n`;
    }
    text += "\n";
  });

  return text;
};

    // Copy to clipboard function
    const handleCopy = async () => {
      try {
        const textToCopy = getCopyText();
        await navigator.clipboard.writeText(textToCopy);

        // Show copied message
        setShowCopied(true);
        
        // Hide message after 2 seconds
        setTimeout(() => {
          setShowCopied(false);
        }, 2000);

        console.log("Transaction details copied to clipboard");
      } catch (err) {
        console.error("Failed to copy: ", err);
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = getCopyText();
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        
        // Show copied message for fallback too
        setShowCopied(true);
        setTimeout(() => {
          setShowCopied(false);
        }, 2000);
        
        console.log("Transaction details copied to clipboard (fallback)");
      }
    };

    const fullList = (
      <div className="space-y-2">
        {lines.map((l: any, idx: number) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            {l.type === "product" ? (
              <Package className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <Server className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <div className="min-w-0">
              <div className="truncate font-medium">{l.name}</div>
              {l.type === "product" && (
                <div className="text-xs text-muted-foreground">
                  {l.quantity}
                  {l.unitType ? ` ${l.unitType}` : ""}
                  {l.pricePerUnit
                    ? ` @ ${new Intl.NumberFormat("en-IN").format(
                        Number(l.pricePerUnit)
                      )}`
                    : ""}
                </div>
              )}
              {l.type === "service" && l.description && (
                <div className="text-xs text-muted-foreground truncate">
                  {l.description}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );

    return (
      <div className="flex items-center gap-2">
        {/* Copy Button with Success Message */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 hover:bg-accent"
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            title="Copy transaction details"
          >
            <Copy className="h-3 w-3" />
          </Button>
          
          {/* Success Message */}
          {showCopied && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded shadow-lg z-50 whitespace-nowrap animate-in fade-in-50 duration-200">
              ✓ Copied!
              {/* Arrow pointing down */}
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-500 rotate-45"></div>
            </div>
          )}
        </div>

        {/* Items Display with Tooltip */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="flex items-center -space-x-2 cursor-pointer flex-1"
                onClick={() => onViewItems(row.original)}
              >
                {displayLines.map((l: any, idx: number) => (
                  <Avatar
                    key={idx}
                    className="h-7 w-7 border-2 border-background hover:scale-105 transition-transform"
                  >
                    <AvatarFallback className="text-xs bg-muted">
                      {l.type === "product" ? (
                        <Package className="h-3 w-3" />
                      ) : (
                        <Server className="h-3 w-3" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {remainingCount > 0 && (
                  <Avatar className="h-7 w-7 border-2 border-background">
                    <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                      +{remainingCount}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent
              className="p-4 max-w-sm"
              side="bottom"
              align="start"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">
                    Items & Services
                  </span>
                  <div className="relative">
                    {/* <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="h-7 text-xs"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy All
                    </Button> */}
                    
                    {/* Success message for Copy All button */}
                    {showCopied && (
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded shadow-lg z-50 whitespace-nowrap animate-in fade-in-50 duration-200">
                        ✓ Copied!
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-500 rotate-45"></div>
                      </div>
                    )}
                  </div>
                </div>
                {fullList}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  },
},

    // Payment Method
    {
      accessorKey: "paymentMethod",
      header: "Payment Method",
      cell: ({ row }) => {
        return <PaymentMethodCell transaction={row.original} />;
      },
    },

    // AMOUNT
    // {
    //   accessorKey: "totalAmount",
    //   header: ({ column }) => (
    //     <Button
    //       variant="ghost"
    //       onClick={() => column.toggleSorting(column.getIsSomePageRowsSelected() === "asc")}
    //       className="text-right w-full justify-end px-0"
    //     >
    //       Amount
    //       <ArrowUpDown className="ml-2 h-4 w-4" />
    //     </Button>
    //   ),
    //   meta: { label: "Amount" },
    //   cell: ({ row }) => {
    //     const amount = parseFloat(
    //       String(row.original.totalAmount || (row.original as any).amount || 0)
    //     );
    //     const formatted = new Intl.NumberFormat("en-IN", {
    //       style: "currency",
    //       currency: "INR",
    //     }).format(amount);

    //     return <div className="text-right font-medium">{formatted}</div>;
    //   },
    // },
    {
      accessorKey: "totalAmount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-right w-full justify-end px-0"
        >
          Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      meta: { label: "Amount" },
      cell: ({ row }) => {
        const amount = parseFloat(
          String(row.original.totalAmount || (row.original as any).amount || 0)
        );
        const formatted = new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(amount);

        return <div className="text-right font-medium">{formatted}</div>;
      },
    },

    // DATE
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) =>
        new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(new Date(row.getValue("date") as string)),
    },

    // TYPE
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type") as string;

        const typeStyles: Record<string, string> = {
          sales: "bg-green-500/20 text-green-700 dark:text-green-300",
          purchases: "bg-orange-500/20 text-orange-700 dark:text-orange-300",
          proforma: "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300",
          receipt: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
          payment: "bg-red-500/20 text-red-700 dark:text-red-300",
          journal: "bg-purple-500/20 text-purple-700 dark:text-purple-300",
        };

        const variant = type === "sales" ? "default" : "secondary";
        return (
          <Badge variant={variant} className={typeStyles[type] ?? ""}>
            {type}
          </Badge>
        );
      },
    },
  ];

  // Conditionally add actions column
  if (!hideActions) {
    baseColumns.push({
      id: "actions",
      cell: ({ row }) => {
        const transaction = row.original;
        const { toast } = useToast();
        const router = useRouter();
        const [partyDetails, setPartyDetails] = useState<Party | null>(null);
        const [isLoadingParty, setIsLoadingParty] = useState(false);
        const [isWhatsAppDialogOpen, setIsWhatsAppDialogOpen] = useState(false);
const [isSendingEmail, setIsSendingEmail] = useState(false);
const [mailSentDialogOpen, setMailSentDialogOpen] = useState(false);
const [mailSentTo, setMailSentTo] = useState("");
        const [dropdownOpen, setDropdownOpen] = useState(false);
        const [emailDialogOpen, setEmailDialogOpen] = useState(false);
        // Invoice actions are allowed for sales and proforma
        const isInvoiceable =
          transaction.type === "sales" || transaction.type === "proforma";

        // WhatsApp allowed for both sales and receipts
        const isWhatsAppAllowed =
          transaction.type === "sales" || transaction.type === "receipt";

        // Extract basic party info from transaction
        const getBasicPartyInfo = () => {
          const pv = (transaction as any).party || (transaction as any).vendor;
          if (pv && typeof pv === "object") {
            return {
              _id: pv._id,
              name: pv.name || pv.vendorName || "Customer",
            };
          }
          return null;
        };

        const basicParty = getBasicPartyInfo();

        // Fetch complete party details when needed (for WhatsApp)
        const fetchPartyDetails = async () => {
          if (!basicParty?._id) return;

          setIsLoadingParty(true);
          try {
            const token = localStorage.getItem("token");
            const baseURL =
              process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8745";

            const response = await fetch(
              `${baseURL}/api/parties/${basicParty._id}`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (response.ok) {
              const data = await response.json();
              setPartyDetails(data);
              return data;
            } else {
              console.error("Failed to fetch party details for WhatsApp");
              return null;
            }
          } catch (error) {
            console.error("Error fetching party details for WhatsApp:", error);
            return null;
          } finally {
            setIsLoadingParty(false);
          }
        };

        // Fetch company details when needed (for email)
        const fetchCompanyDetails = async (companyId: string) => {
          try {
            const token = localStorage.getItem("token");
            const baseURL =
              process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8745";
            const response = await fetch(
              `${baseURL}/api/companies/${companyId}`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            if (response.ok) {
              const data = await response.json();
              return data;
            } else {
              console.error("Failed to fetch company details");
              return null;
            }
          } catch (error) {
            console.error("Error fetching company details:", error);
            return null;
          }
        };

        // Build invoice email HTML
        const buildInvoiceEmailHTML = (opts: {
          companyName: string;
          partyName?: string | null;
          supportEmail?: string | null;
          supportPhone?: string | null;
          logoUrl?: string | null;
        }) => {
          const {
            companyName,
            partyName = "Customer",
            supportEmail = "",
            supportPhone = "",
            logoUrl,
          } = opts;

          const contactLine = supportEmail
            ? `for any queries, feel free to contact us at <a href="mailto:${supportEmail}" style="color:#2563eb;text-decoration:none;">${supportEmail}</a>${
                supportPhone ? ` or ${supportPhone}` : ""
              }.`
            : `for any queries, feel free to contact us${
                supportPhone ? ` at ${supportPhone}` : ""
              }.`;

          return `
<table role="presentation" width="100%" style="background:#f5f7fb;padding:24px 12px;margin:0;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
        <tr>
          <td style="background:#111827;color:#fff;padding:16px 24px;">
            <div style="display:flex;align-items:center;gap:12px;">
              ${
                logoUrl
                  ? `<img src="${logoUrl}" alt="${companyName}" width="32" height="32" style="border-radius:6px;display:inline-block;">`
                  : ``
              }
              <span style="font-size:18px;font-weight:700;letter-spacing:.3px;">${companyName}</span>
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 24px 8px;">
            <p style="margin:0 0 12px 0;font-size:16px;color:#111827;">Dear ${partyName},</p>
            <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#374151;">
              Thank you for choosing ${companyName}. Please find attached the invoice for your recent purchase.
              We appreciate your business and look forward to serving you again.
            </p>

            <div style="margin:18px 0;padding:14px 16px;border:1px solid #e5e7eb;background:#f9fafb;border-radius:10px;font-size:14px;color:#111827;">
              Your invoice is attached as a PDF.
            </div>

            <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#374151;">
              ${contactLine}
            </p>

            <p style="margin:24px 0 0 0;font-size:14px;color:#111827;">
              Warm regards,<br>
              <strong>${companyName}</strong><br>
              ${
                supportEmail
                  ? `<a href="mailto:${supportEmail}" style="color:#2563eb;text-decoration:none;">${supportEmail}</a>`
                  : ``
              }
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#f9fafb;color:#6b7280;font-size:12px;text-align:center;padding:12px 24px;border-top:1px solid #e5e7eb;">
            This is an automated message regarding your invoice. Please reply to the address above if you need help.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
        };

        const buildCompany = (): Company | undefined => {
          const c = transaction.company as any;
          const companyId = typeof c === "object" && c ? c._id : c;
          const companyName = companyId
            ? companyMap.get(companyId as string)
            : undefined;
          return companyName
            ? ({ businessName: companyName } as unknown as Company)
            : undefined;
        };

        const buildPartyForInvoice = (): Party => {
          const pv = (transaction as any).party || (transaction as any).vendor;
          if (pv && typeof pv === "object") {
            return pv as Party;
          }
          // Return a default party object to prevent undefined
          return {
            _id: "",
            name: "Customer",
            email: "",
            contactNumber: "",
            address: "",
            city: "",
            state: "",
            pincode: "",
            gstin: "",
          } as Party;
        };
        // Add this function to fetch default template
        const fetchDefaultTemplate = async (): Promise<string> => {
          try {
            const token = localStorage.getItem("token");
            const baseURL =
              process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8745";

            const templateRes = await fetch(
              `${baseURL}/api/settings/default-template`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (templateRes.ok) {
              const templateData = await templateRes.json();
              return templateData.defaultTemplate || "template1";
            }
            return "template1"; // fallback
          } catch (error) {
            console.error("Error fetching default template:", error);
            return "template1"; // fallback
          }
        };

        const handleDownload = async () => {
          if (!isInvoiceable) {
            toast({
              variant: "destructive",
              title: "Cannot Download",
              description:
                "Only sales and proforma transactions can be downloaded as invoices.",
            });
            return;
          }

          try {
            // Fetch default template
            const defaultTemplate = await fetchDefaultTemplate();

            // Fetch complete party details
            let partyToUse = partyDetails;
            if (!partyToUse && basicParty?._id) {
              partyToUse = await fetchPartyDetails();
            }

            // Fetch complete company details
            const companyId = transaction.company as any;
            const companyIdStr =
              typeof companyId === "object" && companyId
                ? companyId._id
                : companyId;
            let companyToUse = null;

            if (companyIdStr) {
              companyToUse = await fetchCompanyDetails(companyIdStr);
            }

            // Fetch client details - get FULL client object
            let clientDetails = null;
            if (companyToUse?.client) {
              if (
                typeof companyToUse.client === "object" &&
                companyToUse.client.contactName
              ) {
                clientDetails = companyToUse.client;
              } else {
                const clientId =
                  typeof companyToUse.client === "string"
                    ? companyToUse.client
                    : (companyToUse.client as any)?.$oid ||
                      (companyToUse.client as any)?._id;

                if (clientId) {
                  const token = localStorage.getItem("token");
                  const baseURL =
                    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8745";
                  const response = await fetch(
                    `${baseURL}/api/clients/${clientId}`,
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    }
                  );
                  if (response.ok) {
                    clientDetails = await response.json();
                  }
                }
              }
            }

            // Fetch bank details
            let bankDetails = null;
            if (transaction?.bank) {
              if (
                typeof transaction.bank === "object" &&
                transaction.bank.bankName
              ) {
                bankDetails = transaction.bank;
              } else {
                const bankId =
                  typeof transaction.bank === "string"
                    ? transaction.bank
                    : (transaction.bank as any)?.$oid ||
                      (transaction.bank as any)?._id;
                if (bankId) {
                  const token = localStorage.getItem("token");
                  const baseURL =
                    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8745";
                  const response = await fetch(
                    `${baseURL}/api/bank-details/${bankId}`,
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    }
                  );
                  if (response.ok) {
                    bankDetails = await response.json();
                  }
                }
              }
            }

            // Extract shipping address
            let shippingAddress = null;
            if (transaction?.shippingAddress) {
              const addr = transaction.shippingAddress as any;
              if (!(addr instanceof Map || addr?.size > 0)) {
                if (
                  typeof addr === "object" &&
                  (addr.address || addr.city || addr.state)
                ) {
                  shippingAddress = addr;
                }
              }
            }

            // Generate PDF based on default template
            let pdfBlob: Blob;

            // Use clientDetails for all templates
            const clientToUse = clientDetails || null;
            const clientContactName = clientDetails?.contactName || null;

            switch (defaultTemplate) {
              case "template1":
                pdfBlob = await generatePdfForTemplate1(
                  transaction,
                  companyToUse || buildCompany(),
                  partyToUse || buildPartyForInvoice(),
                  serviceNameById,
                  shippingAddress,
                  bankDetails,
                  clientContactName
                );
                break;
              case "template2":
                const pdfDoc2 = generatePdfForTemplate2(
                  transaction,
                  companyToUse || buildCompany(),
                  partyToUse || buildPartyForInvoice(),
                  serviceNameById,
                  shippingAddress
                );
                pdfBlob = (await pdfDoc2).output("blob");
                break;
              case "template3":
                pdfBlob = (
                  await generatePdfForTemplate3(
                    transaction,
                    companyToUse || buildCompany(),
                    partyToUse || buildPartyForInvoice(),
                    serviceNameById,
                    shippingAddress
                  )
                ).output("blob");
                break;
              case "template4":
                const pdfDoc4 = generatePdfForTemplate4(
                  transaction,
                  companyToUse || buildCompany(),
                  partyToUse || buildPartyForInvoice(),
                  serviceNameById,
                  shippingAddress
                );
                pdfBlob = (await pdfDoc4).output("blob");
                break;
              case "template5":
                const pdfDoc5 = generatePdfForTemplate5(
                  transaction,
                  companyToUse || buildCompany(),
                  partyToUse || buildPartyForInvoice(),
                  serviceNameById,
                  shippingAddress
                );
                pdfBlob = (await pdfDoc5).output("blob");
                break;
              case "template6":
                const pdfDoc6 = generatePdfForTemplate6(
                  transaction,
                  companyToUse || buildCompany(),
                  partyToUse || buildPartyForInvoice(),
                  serviceNameById,
                  shippingAddress
                );
                pdfBlob = (await pdfDoc6).output("blob");
                break;
              case "template7":
                const pdfDoc7 = generatePdfForTemplate7(
                  transaction,
                  companyToUse || buildCompany(),
                  partyToUse || buildPartyForInvoice(),
                  serviceNameById,
                  shippingAddress
                );
                pdfBlob = (await pdfDoc7).output("blob");
                break;
              case "template8":
                pdfBlob = await generatePdfForTemplate8(
                  transaction,
                  companyToUse || buildCompany(),
                  partyToUse || buildPartyForInvoice(),
                  serviceNameById,
                  shippingAddress,
                  bankDetails
                );
                break;
              case "template11":
                const pdfDoc11 = generatePdfForTemplate11(
                  transaction,
                  companyToUse || buildCompany(),
                  partyToUse || buildPartyForInvoice(),
                  serviceNameById,
                  shippingAddress,
                  undefined,
                  bankDetails
                );
                pdfBlob = (await pdfDoc11).output("blob");
                break;
              case "template12":
                pdfBlob = await generatePdfForTemplate12(
                  transaction,
                  companyToUse || buildCompany(),
                  partyToUse || buildPartyForInvoice(),
                  serviceNameById,
                  shippingAddress,
                  bankDetails
                );
                break;
              case "template16":
                const pdfDoc16 = generatePdfForTemplate16(
                  transaction,
                  companyToUse || buildCompany(),
                  partyToUse || buildPartyForInvoice(),
                  serviceNameById,
                  shippingAddress
                );
                pdfBlob = (await pdfDoc16).output("blob");
                break;
              case "template17":
                const pdfDoc17 = generatePdfForTemplate17(
                  transaction,
                  companyToUse || buildCompany(),
                  partyToUse || buildPartyForInvoice(),
                  serviceNameById,
                  shippingAddress,
                  bankDetails
                );
                pdfBlob = (await pdfDoc17).output("blob");
                break;
              case "template18":
                pdfBlob = await generatePdfForTemplate18(
                  transaction,
                  companyToUse || buildCompany(),
                  partyToUse || buildPartyForInvoice(),
                  serviceNameById,
                  shippingAddress,
                  bankDetails
                );
                break;
              case "template19":
                const pdfDoc19 = generatePdfForTemplate19(
                  transaction,
                  companyToUse || buildCompany(),
                  partyToUse || buildPartyForInvoice(),
                  serviceNameById,
                  shippingAddress,
                  bankDetails
                );

                pdfBlob = (await pdfDoc19).output("blob");
                break;
              case "templateA5":
                pdfBlob = await generatePdfForTemplateA5(
                  transaction,
                  companyToUse || buildCompany(),
                  partyToUse || buildPartyForInvoice(),
                  serviceNameById,
                  shippingAddress,
                  bankDetails,
                  clientToUse // ← FIXED: Use clientToUse (full object)
                );
                break;
              case "templateA5_2":
                pdfBlob = await generatePdfForTemplateA5_2(
                  transaction,
                  companyToUse || buildCompany(),
                  partyToUse || buildPartyForInvoice(),
                  serviceNameById,
                  shippingAddress,
                  bankDetails,
                  clientToUse // ← FIXED: Use clientToUse (full object)
                );
                break;
              case "templateA5_3":
                pdfBlob = await generatePdfForTemplateA5_3(
                  transaction,
                  companyToUse || buildCompany(),
                  partyToUse || buildPartyForInvoice(),
                  serviceNameById,
                  shippingAddress,
                  bankDetails,
                  clientToUse // ← FIXED: Use clientToUse (full object)
                );
                break;
              case "templateA5_4":
                pdfBlob = await generatePdfForTemplateA5_4(
                  transaction,
                  companyToUse || buildCompany(),
                  partyToUse || buildPartyForInvoice(),
                  serviceNameById,
                  shippingAddress,
                  bankDetails,
                  clientToUse // ← FIXED: Use clientToUse (full object)
                );
                break;
              case "template-t3":
                pdfBlob = await generatePdfForTemplatet3(
                  transaction,
                  companyToUse || buildCompany(),
                  partyToUse || buildPartyForInvoice(),
                  shippingAddress,
                  bankDetails
                );
                break;
              default:
                pdfBlob = await generatePdfForTemplate1(
                  transaction,
                  companyToUse || buildCompany(),
                  partyToUse || buildPartyForInvoice(),
                  serviceNameById,
                  shippingAddress,
                  bankDetails,
                  clientContactName
                );
            }

            // Create download link
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement("a");
            link.href = url;

            const invoiceNumber =
              transaction.invoiceNumber || transaction.referenceNumber;
            const fname = `Invoice-${
              invoiceNumber ||
              (transaction._id ?? "INV").toString().slice(-6).toUpperCase()
            }.pdf`;
            link.download = fname;

            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up
            URL.revokeObjectURL(url);

            toast({
              title: "Invoice Downloaded",
              description: `Invoice saved as ${fname} (${defaultTemplate})`,
            });
          } catch (error) {
            console.error("Error downloading invoice:", error);
            toast({
              variant: "destructive",
              title: "Download Failed",
              description: "Could not download invoice. Please try again.",
            });
          }
        };

        const handlePrintInvoice = async () => {
          setDropdownOpen(false);
          if (!isInvoiceable) {
            toast({
              variant: "destructive",
              title: "Cannot Print",
              description:
                "Only sales transactions can be printed as invoices.",
            });
            return;
          }

          try {
            // Fetch default template
            const defaultTemplate = await fetchDefaultTemplate();
            console.log("Using template for print:", defaultTemplate); // Debug log

            // Fetch complete party details
            let partyToUse = partyDetails;
            if (!partyToUse && basicParty?._id) {
              partyToUse = await fetchPartyDetails();
            }

            // Fetch complete company details
            const companyId = transaction.company as any;
            const companyIdStr =
              typeof companyId === "object" && companyId
                ? companyId._id
                : companyId;
            let companyToUse = null;

            if (companyIdStr) {
              companyToUse = await fetchCompanyDetails(companyIdStr);
            }

            // Fetch client details (full client object)
            let clientDetails = null;
            if (companyToUse?.client) {
              if (
                typeof companyToUse.client === "object" &&
                companyToUse.client.contactName
              ) {
                clientDetails = companyToUse.client;
              } else {
                const clientId =
                  typeof companyToUse.client === "string"
                    ? companyToUse.client
                    : (companyToUse.client as any)?.$oid ||
                      (companyToUse.client as any)?._id;

                if (clientId) {
                  const token = localStorage.getItem("token");
                  const baseURL =
                    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8745";
                  const response = await fetch(
                    `${baseURL}/api/clients/${clientId}`,
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    }
                  );
                  if (response.ok) {
                    clientDetails = await response.json();
                  }
                }
              }
            }

            // Fetch bank details
            let bankDetails = null;
            if (transaction?.bank) {
              if (
                typeof transaction.bank === "object" &&
                transaction.bank.bankName
              ) {
                bankDetails = transaction.bank;
              } else {
                const bankId =
                  typeof transaction.bank === "string"
                    ? transaction.bank
                    : (transaction.bank as any)?.$oid ||
                      (transaction.bank as any)?._id;
                if (bankId) {
                  const token = localStorage.getItem("token");
                  const baseURL =
                    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8745";
                  const response = await fetch(
                    `${baseURL}/api/bank-details/${bankId}`,
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    }
                  );
                  if (response.ok) {
                    bankDetails = await response.json();
                  }
                }
              }
            }

            // Extract shipping address
            let shippingAddress = null;
            if (transaction?.shippingAddress) {
              const addr = transaction.shippingAddress as any;
              if (!(addr instanceof Map || addr?.size > 0)) {
                if (
                  typeof addr === "object" &&
                  (addr.address || addr.city || addr.state)
                ) {
                  shippingAddress = addr;
                }
              }
            }

            // Prepare company with full client object (not just contact name)
            const companyWithClient = companyToUse
              ? {
                  ...companyToUse,
                  client: clientDetails, // Pass the full client object
                }
              : buildCompany();

            // Ensure we pass the template to printInvoice
            await printInvoice(
              transaction,
              companyWithClient,
              partyToUse || buildPartyForInvoice(),
              serviceNameById,
              shippingAddress,
              bankDetails,
              clientDetails,
              defaultTemplate // Make sure this is passed correctly
            );

            toast({
              title: "Printing Invoice",
              description: `Opening print dialog... (${defaultTemplate})`,
            });
          } catch (error) {
            console.error("Print error:", error);
            toast({
              variant: "destructive",
              title: "Print Failed",
              description:
                "Could not print invoice. Please try downloading instead.",
            });
          }
        };

        // const handleSendWhatsApp = async () => {
        //   setDropdownOpen(false);
        //   // Fetch party details if we don't have them
        //   let partyToUse = partyDetails;
        //   if (!partyToUse && basicParty?._id) {
        //     partyToUse = await fetchPartyDetails();
        //   }

        //   if (!partyToUse) {
        //     toast({
        //       variant: "destructive",
        //       title: "Customer Information Missing",
        //       description:
        //         "Unable to find customer details for this transaction.",
        //     });
        //     return;
        //   }

        //   // ✅ BETTER: Use async method for accurate check
        //   const isConnected =
        //     await whatsappConnectionService.checkWhatsAppWebConnection();

        //   if (!isConnected) {
        //     toast({
        //       title: "Connect WhatsApp",
        //       description: "Please connect your WhatsApp to send messages.",
        //     });
        //   }

        //   // If connected, open the composer directly
        //   setIsWhatsAppDialogOpen(true);
        // };

        const handleSendWhatsApp = async () => {
          setDropdownOpen(false);

          try {
            // Fetch party details
            let partyToUse = partyDetails;
            if (!partyToUse && basicParty?._id) {
              partyToUse = await fetchPartyDetails();
            }

            if (!partyToUse) {
              toast({
                variant: "destructive",
                title: "Customer Information Missing",
                description:
                  "Unable to find customer details for this transaction.",
              });
              return;
            }

            // Check WhatsApp connection
            const isConnected =
              await whatsappConnectionService.checkWhatsAppWebConnection();

            if (!isConnected) {
              setIsWhatsAppDialogOpen(true);
              return;
            }

            // Get customer mobile number
            const customerMobile =
              partyToUse?.contactNumber || partyToUse?.contactNumber || "";
            if (!customerMobile) {
              toast({
                variant: "destructive",
                title: "Mobile Number Missing",
                description:
                  "Customer mobile number is required to send via WhatsApp.",
              });
              return;
            }

            // Generate PDF first (reuse your download logic)
            const defaultTemplate = await fetchDefaultTemplate();

            // Fetch company details
            const companyId = transaction.company as any;
            const companyIdStr =
              typeof companyId === "object" && companyId
                ? companyId._id
                : companyId;
            let companyToUse = null;
            if (companyIdStr) {
              companyToUse = await fetchCompanyDetails(companyIdStr);
            }

            // Generate PDF
            let pdfBlob: Blob;
            // Use your existing PDF generation logic here...
            pdfBlob = await generatePdfForTemplate1(
              transaction,
              companyToUse || buildCompany(),
              partyToUse || buildPartyForInvoice(),
              serviceNameById
            );

            // Create download link and trigger download
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement("a");
            link.href = url;

            const invoiceNumber =
              transaction.invoiceNumber || transaction.referenceNumber;
            const fileName = `Invoice-${invoiceNumber || "INV"}.pdf`;
            link.download = fileName;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Format mobile number for WhatsApp
            const formattedNumber = customerMobile.replace(/\D/g, "");
            let finalNumber = formattedNumber;
            if (
              !formattedNumber.startsWith("91") &&
              formattedNumber.length === 10
            ) {
              finalNumber = `91${formattedNumber}`;
            }

            // Generate message
            const invoiceDate = new Date(transaction.date).toLocaleDateString(
              "en-GB",
              {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }
            );
            const amount = transaction.totalAmount || transaction.amount || 0;
            const formattedAmount = new Intl.NumberFormat("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(amount);

            const message = `Dear ${partyToUse?.name || "Valued Customer"},

Please find your invoice attached.

Invoice No: ${invoiceNumber}
Invoice Date: ${invoiceDate}
Amount: ₹${formattedAmount}

Thank you for your business!

Best regards,
${companyToUse?.businessName || "Your Company"}`;

            // Open WhatsApp Web with pre-filled message
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://web.whatsapp.com/send?phone=${finalNumber}&text=${encodedMessage}`;

            window.open(whatsappUrl, "_blank", "noopener,noreferrer");

            toast({
              title: "PDF Downloaded & WhatsApp Opening",
              description: `Invoice downloaded. Opening WhatsApp Web to send to ${
                partyToUse?.name || "customer"
              }.`,
            });

            // Clean up
            setTimeout(() => {
              URL.revokeObjectURL(url);
            }, 30000);
          } catch (error) {
            console.error("Error in WhatsApp send:", error);
            toast({
              variant: "destructive",
              title: "Operation Failed",
              description: "Could not complete the WhatsApp send operation.",
            });
          }
        };

  const handleSendInvoiceEmail = async () => {
  setDropdownOpen(false);

  if (!isInvoiceable) {
    toast({
      variant: "destructive",
      title: "❌ Cannot Send Email",
      description: "Only sales and proforma transactions can be emailed as invoices.",
    });
    return;
  }

  setIsSendingEmail(true);
  toast({
    title: "📤 Sending mail...",
    description: "Please wait while we send your invoice.",
  });

  try {
    const token = localStorage.getItem("token");
    const baseURL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8745";

    // Check Gmail connection
    const statusRes = await fetch(`${baseURL}/api/integrations/gmail/status`, {
      headers: { Authorization: `Bearer ${token || ""}` },
    });

    if (!statusRes.ok) {
      setMailSentTo("❌ Connection error: Could not check Gmail status");
      setMailSentDialogOpen(true);
      return;
    }

    const emailStatus = await statusRes.json();

    if (!emailStatus.connected) {
      setEmailDialogOpen(true);
      return;
    }

    // Fetch party
    const pv = (transaction as any).party || (transaction as any).vendor;
    const partyId = pv?._id || null;

    if (!partyId) {
      setMailSentTo("❌ Customer details not found");
      setMailSentDialogOpen(true);
      return;
    }

    const partyToUse = await fetchPartyDetails();
    if (!partyToUse?.email) {
      setMailSentTo("❌ Customer email not available");
      setMailSentDialogOpen(true);
      return;
    }

    // Fetch company details
    const companyId = typeof transaction.company === "object" 
      ? transaction.company._id 
      : transaction.company || ""; 

    const companyToUse = await fetchCompanyDetails(companyId);
    if (!companyToUse) {
      setMailSentTo("❌ Company details not found");
      setMailSentDialogOpen(true);
      return;
    }

    // Generate PDF
    let pdfBase64: string;
    try {
      const pdfBlob = await generatePdfForTemplate1(
        transaction,
        companyToUse,
        partyToUse,
        serviceNameById
      );

      pdfBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(pdfBlob);
      });
    } catch (pdfError) {
      setMailSentTo("❌ PDF generation failed");
      setMailSentDialogOpen(true);
      return;
    }

    // Send email
    const subject = `Invoice from ${companyToUse.businessName || "Your Company"}`;
    const bodyHtml = buildInvoiceEmailHTML({
      companyName: companyToUse.businessName || "Your Company",
      partyName: partyToUse.name || "Customer",
      supportEmail: companyToUse.emailId || "",
      supportPhone: companyToUse.mobileNumber || "",
    });
    const fileName = `${transaction.invoiceNumber || "invoice"}.pdf`;

    const emailRes = await fetch(`${baseURL}/api/integrations/gmail/send-invoice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: partyToUse.email,
        subject,
        html: bodyHtml,
        fileName,
        pdfBase64,
        companyId,
        sendAs: "companyOwner",
      }),
    });

    if (emailRes.ok) {
      setMailSentTo(`✅ Mail sent successfully to ${partyToUse.email}`);
      setMailSentDialogOpen(true);
    } else {
      let errorData;
      try {
        errorData = await emailRes.json();
      } catch {
        errorData = { message: "Unknown error occurred" };
      }
      setMailSentTo(`❌ Email sending failed: ${errorData.message || "Unknown error"}`);
      setMailSentDialogOpen(true);
    }

  } catch (err) {
    console.error("Unexpected error:", err);
    setMailSentTo("⚠️ Unexpected error occurred while sending the email");
    setMailSentDialogOpen(true);
  } finally {
    setIsSendingEmail(false);
  }
};


        console.log("role :", userRole);

        return (
          <>
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>

                {/* Convert to Sales Transaction - Only for proforma */}
                {transaction.type === "proforma" && onConvertToSales && (
                  <DropdownMenuItem
                    onClick={() => onConvertToSales(transaction)}
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    <span>Make it Sales Transaction</span>
                  </DropdownMenuItem>
                )}

                {/* WhatsApp Send - For both sales and receipts if they have contact numbers */}
                <DropdownMenuItem
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await handleSendWhatsApp();
                  }}
                  disabled={!isWhatsAppAllowed || isLoadingParty}
                >
                  <FaWhatsapp className="mr-2 h-4 w-4 text-green-600" />
                  <span>
                    {isLoadingParty ? "Loading..." : "Send on WhatsApp"}
                    {!isWhatsAppAllowed &&
                      ` (${transaction.type} not supported)`}
                  </span>
                </DropdownMenuItem>

   <DropdownMenuItem
  onClick={async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await handleSendInvoiceEmail();
  }}
  disabled={!isInvoiceable || isSendingEmail}
>
  <Send className="mr-2 h-4 w-4" />
  <span>
    {isSendingEmail ? "Sending..." : "Send Invoice via Mail"}
    {!isInvoiceable && "(Sales only)"}
  </span>
</DropdownMenuItem>



                <DropdownMenuItem
                  onClick={() =>
                    navigator.clipboard.writeText(String(transaction._id || ""))
                  }
                >
                  <Copy className="mr-2 h-4 w-4" />
                  <span>Copy transaction ID</span>
                </DropdownMenuItem>

                {/* Preview / Download enabled only for sales */}
                <DropdownMenuItem
                  onClick={() => onPreview(transaction)}
                  disabled={!isInvoiceable}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  <span>
                    Preview Invoice {!isInvoiceable && "(Sales only)"}
                  </span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  // onClick={handleDownload}
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await handleDownload();
                  }}
                  disabled={!isInvoiceable}
                >
                  <Download className="mr-2 h-4 w-4" />
                  <span>
                    Download Invoice {!isInvoiceable && "(Sales only)"}
                  </span>
                </DropdownMenuItem>

                {/* 🖨️ Print Invoice - Only for sales */}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePrintInvoice();
                  }}
                  disabled={!isInvoiceable}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  <span>Print Invoice {!isInvoiceable && "(Sales only)"}</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => onEdit(transaction)}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Edit transaction</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => onDelete(transaction)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete transaction</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
<Dialog open={mailSentDialogOpen} onOpenChange={setMailSentDialogOpen}>
  <DialogContent className="sm:max-w-md text-center">
    <DialogHeader>
      <DialogTitle className="text-center font-bold text-lg">Mail Status</DialogTitle>
      <DialogDescription>
        {mailSentTo}
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button onClick={() => setMailSentDialogOpen(false)}>OK</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

            {/* Email Not Connected Dialog */}
            <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {userRole === "client"
                      ? "Email invoicing is enabled for your account"
                      : "Email invoicing requires setup"}
                  </DialogTitle>
                  <DialogDescription>
                    {userRole === "client"
                      ? "Your administrator has granted you permission to send invoices via email. Please review and accept the terms to activate this feature."
                      : "Email invoicing has been enabled for your account, but you need to contact your administrator to set up the email integration."}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    <span className="text-sm font-medium">Email account</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {userRole === "client"
                      ? "Accept terms first to connect an email."
                      : "Please contact your administrator to configure email settings."}
                  </p>
                </div>
                {userRole === "client" && (
                  <DialogFooter>
                    <Button
                      onClick={() => {
                        setEmailDialogOpen(false);
                        if (userRole === "client") {
                          router.push("/profile?tab=permissions");
                        }
                      }}
                    >
                      Go to Permissions
                    </Button>
                  </DialogFooter>
                )}
              </DialogContent>
            </Dialog>

            {/* WhatsApp Composer Dialog */}
            <WhatsAppComposerDialog
              isOpen={isWhatsAppDialogOpen}
              onClose={() => setIsWhatsAppDialogOpen(false)}
              transaction={transaction}
              party={
                partyDetails || basicParty || { _id: "", name: "Customer" }
              }
              company={buildCompany() || { businessName: "Company" }}
            />
          </>
        );
      },
    });
  }

  return baseColumns;
};
