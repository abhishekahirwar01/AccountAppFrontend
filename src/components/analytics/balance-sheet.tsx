import { balanceSheetData } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'INR' }).format(amount);

export default function BalanceSheetTab() {
  const totalLiabilitiesAndEquity = balanceSheetData.liabilities.total + balanceSheetData.equity.total;
  return (
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
  );
}
