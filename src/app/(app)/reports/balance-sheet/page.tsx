import { balanceSheetData } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, Clock, Download } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'INR' }).format(amount);

export default function BalanceSheetPage() {
  const totalLiabilitiesAndEquity = balanceSheetData.liabilities.total + balanceSheetData.equity.total;

  // Coming Soon Banner Component
  function ComingSoonBanner() {
  return (
    <div className="relative w-full max-w-2xl mx-auto overflow-hidden rounded-2xl border border-border/50 dark:bg-gray-900 bg-white shadow-lg 
                    lg:ml-[15%] lg:mt-[-5%]"> 
      {/* Mirror/Reflection Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-white/10 opacity-20"></div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center p-4 sm:p-6 lg:p-8">
        {/* Animated Icon */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl backdrop-blur-md border border-primary/20 shadow-lg">
          <div className="relative">
            <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-primary" />
            {/* Pulsing effect */}
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-75"></div>
          </div>
        </div>
        
        {/* Coming Soon Badge */}
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 to-primary/5 text-primary px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xl sm:text-2xl lg:text-3xl font-medium border border-primary/20 backdrop-blur-sm mb-3 sm:mb-4">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
          Coming Soon
        </div>

        {/* Title with gradient text */}
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-3 sm:mb-4">
          Advanced Analytics Coming Soon
        </h3>

        {/* Description */}
        <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-md mb-4 sm:mb-6 leading-relaxed px-2 sm:px-0">
          We're enhancing your Profit & Loss with interactive charts,
          historical comparisons, and detailed financial insights.
        </p>

        {/* Animated Badge */}
        
      </div>

      {/* Shine/Highlight Effect */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-60"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 bg-primary/5 rounded-full blur-xl"></div>
    </div>
  );
}
  return (
    <>
 <div className="flex justify-center items-center fixed w-full h-full z-10 bg-gray/30 backdrop-blur-sm rounded-lg p-0">
        <ComingSoonBanner />
      </div>
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Balance Sheet</h2>
          <p className="text-muted-foreground">
            As of July 31, 2024
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
      
      <Card className="w-full">
        <CardHeader>
            <CardTitle>Statement of Financial Position</CardTitle>
            <CardDescription>A snapshot of the company's financial health.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-lg font-semibold mb-2">Assets</h3>
                    <Table>
                        <TableBody>
                            <TableRow className="font-medium bg-secondary/50"><TableCell colSpan={2}>Current Assets</TableCell></TableRow>
                            {balanceSheetData.assets.current.map(item => (
                                <TableRow key={item.name}><TableCell className="pl-8">{item.name}</TableCell><TableCell className="text-right">{formatCurrency(item.amount)}</TableCell></TableRow>
                            ))}
                             <TableRow className="font-medium bg-secondary/50"><TableCell colSpan={2}>Non-Current Assets</TableCell></TableRow>
                            {balanceSheetData.assets.nonCurrent.map(item => (
                                <TableRow key={item.name}><TableCell className="pl-8">{item.name}</TableCell><TableCell className="text-right">{formatCurrency(item.amount)}</TableCell></TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-2">Liabilities &amp; Equity</h3>
                    <Table>
                        <TableBody>
                            <TableRow className="font-medium bg-secondary/50"><TableCell colSpan={2}>Current Liabilities</TableCell></TableRow>
                            {balanceSheetData.liabilities.current.map(item => (
                                <TableRow key={item.name}><TableCell className="pl-8">{item.name}</TableCell><TableCell className="text-right">{formatCurrency(item.amount)}</TableCell></TableRow>
                            ))}
                            <TableRow className="font-medium bg-secondary/50"><TableCell colSpan={2}>Non-Current Liabilities</TableCell></TableRow>
                            {balanceSheetData.liabilities.nonCurrent.map(item => (
                                <TableRow key={item.name}><TableCell className="pl-8">{item.name}</TableCell><TableCell className="text-right">{formatCurrency(item.amount)}</TableCell></TableRow>
                            ))}
                            <TableRow className="font-medium bg-secondary/50"><TableCell colSpan={2}>Equity</TableCell></TableRow>
                            <TableRow><TableCell className="pl-8">Retained Earnings</TableCell><TableCell className="text-right">{formatCurrency(balanceSheetData.equity.retainedEarnings)}</TableCell></TableRow>
                        </TableBody>
                    </Table>
                </div>
            </div>
        </CardContent>
        <CardFooter className="p-6 mt-4">
             <div className="w-full space-y-2">
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                    <span>Total Assets</span>
                    <span>{formatCurrency(balanceSheetData.assets.total)}</span>
                </div>
                 <div className="flex justify-between font-bold text-lg">
                    <span>Total Liabilities &amp; Equity</span>
                    <span>{formatCurrency(totalLiabilitiesAndEquity)}</span>
                </div>
                <Separator />
            </div>
        </CardFooter>
      </Card>
    </div>
        </>
  );
}
