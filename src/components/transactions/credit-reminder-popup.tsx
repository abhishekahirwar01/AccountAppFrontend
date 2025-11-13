import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Calendar, Clock, IndianRupee, Edit, Phone, User, Wallet } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { EmailComposerDialog } from './email-composer-dialog';
import { useCompany } from '@/contexts/company-context';

interface CreditReminderPopupProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  party: any;
}

interface PartyDetails {
  _id: string;
  name: string;
  email?: string;
  contactNumber?: string;
  balance?: number;
}

export function CreditReminderPopup({ isOpen, onClose, transaction, party }: CreditReminderPopupProps) {
  console.log("party object from reminder component ", party);
  
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [partyDetails, setPartyDetails] = useState<PartyDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [companySpecificBalance, setCompanySpecificBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [companyDetails, setCompanyDetails] = useState<any>(null);
  const { toast } = useToast();
  const { selectedCompanyId } = useCompany();

  // Fetch complete party details and company-specific balance when popup opens
  useEffect(() => {
    const fetchPartyDetails = async () => {
      if (!isOpen || !party?._id) return;
      
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const baseURL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8745';
        
        const response = await fetch(`${baseURL}/api/parties/${party._id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPartyDetails(data);
          console.log("Fetched party details:", data);
        } else {
          console.error('Failed to fetch party details');
          // Fallback to basic party info
          setPartyDetails(party);
        }
      } catch (error) {
        console.error('Error fetching party details:', error);
        // Fallback to basic party info
        setPartyDetails(party);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchCompanySpecificBalance = async () => {
      if (!isOpen || !party?._id) return;
      
      setIsLoadingBalance(true);
      try {
        const token = localStorage.getItem('token');
        const baseURL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8745';
        
        // Use the same balance fetching logic as in receivables page
        let url = `${baseURL}/api/parties/balances`;
        const params = new URLSearchParams();
        if (selectedCompanyId) {
          params.append('companyId', selectedCompanyId);
        }

        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          const storedBalances = data.balances || {};
          const balance = storedBalances[party._id] || 0;
          setCompanySpecificBalance(balance);
          console.log("Fetched company-specific balance:", {
            companyId: selectedCompanyId || "all",
            partyId: party._id,
            balance
          });
        } else {
          console.error('Failed to fetch company-specific balance');
          // Fallback to basic party balance
          setCompanySpecificBalance(party.balance || 0);
        }
      } catch (error) {
        console.error('Error fetching company-specific balance:', error);
        // Fallback to basic party balance
        setCompanySpecificBalance(party.balance || 0);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    const fetchCompanyDetails = async () => {
      if (!isOpen) return;
      
      try {
        const token = localStorage.getItem('token');
        const baseURL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8745';
        
        // First, try to get company from transaction
        if (transaction?.company) {
          const transactionCompany = transaction.company;
          if (typeof transactionCompany === 'object' && (transactionCompany.name || transactionCompany.businessName)) {
            setCompanyDetails(transactionCompany);
            return;
          }
        }
        
        // If selectedCompanyId exists, fetch from API
        if (selectedCompanyId) {
          const response = await fetch(`${baseURL}/api/companies/${selectedCompanyId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (response.ok) {
            const data = await response.json();
            setCompanyDetails(data);
            console.log("Fetched company details:", data);
          }
        }
      } catch (error) {
        console.error('Error fetching company details:', error);
      }
    };

    fetchPartyDetails();
    fetchCompanySpecificBalance();
    fetchCompanyDetails();
  }, [isOpen, party, selectedCompanyId, transaction]);

  if (!transaction || !party) return null;

  // Calculate days since transaction
  const transactionDate = new Date(transaction.date);
  const currentDate = new Date();
  const daysSinceTransaction = Math.floor((currentDate.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Get pending balance for this specific transaction
  const pendingBalance = transaction.totalAmount || transaction.amount || 0;
  
  // Use detailed party info if available, otherwise fallback to basic
  const displayParty = partyDetails || party;
  // Use company-specific balance instead of basic balance
  const totalCustomerBalance = companySpecificBalance;

  // Get company info from transaction
  const company = transaction.company || {};


  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Credit Payment Reminder
            </DialogTitle>
            {/* {companyDetails && (companyDetails.name || companyDetails.businessName) && (
              <div className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Company: <span className="font-medium">{companyDetails.name || companyDetails.businessName}</span>
              </div>
            )} */}
          </DialogHeader>

          <div className="space-y-4">
            {/* Customer Information */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <h4 className="font-semibold text-base">{displayParty.name}</h4>
                        {isLoading && (
                          <div className="text-xs text-blue-500 mt-1">
                            Loading details...
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {isLoading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading customer details...
                      </div>
                    ) : (
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className={displayParty.email ? "text-foreground font-medium" : "text-muted-foreground"}>
                            {displayParty.email || 'No email address available'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className={displayParty.contactNumber ? "text-foreground font-medium" : "text-muted-foreground"}>
                            {displayParty.contactNumber || 'No contact number available'}
                          </span>
                        </div>

                       
                      </div>
                    )}
                  </div>
                  
                  <Badge variant="outline" className="bg-orange-500/20 text-orange-700 whitespace-nowrap">
                    Credit
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Transaction Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Transaction Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice Date:</span>
                  <span>{new Date(transaction.date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice No:</span>
                  <span>{transaction.invoiceNumber || transaction.referenceNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Days Since:</span>
                  <Badge variant={daysSinceTransaction > 30 ? "destructive" : "secondary"}>
                    {daysSinceTransaction} days
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Customer Balance Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <IndianRupee className="h-4 w-4" />
                  Customer Balance
                  {companyDetails && (companyDetails.name || companyDetails.businessName) && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({companyDetails.name || companyDetails.businessName})
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Customer Balance:</span>
                  <div className="text-right">
                    {isLoadingBalance ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Loading...</span>
                      </div>
                    ) : (
                      <div className={`font-bold text-lg ${totalCustomerBalance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ₹{new Intl.NumberFormat('en-IN').format(Math.abs(totalCustomerBalance))}
                        <span className="text-sm font-normal ml-2 text-muted-foreground">
                          {totalCustomerBalance >= 0 ? '(Customer Owes)' : '(You Owe)'}
                        </span>
                      </div>
                    )}
                    {daysSinceTransaction > 30 && totalCustomerBalance > 0 && (
                      <div className="text-xs text-red-500 mt-1">
                        Overdue by {daysSinceTransaction - 30} days
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Close
              </Button>
              
              <Button
                variant="outline"
                onClick={() => { onClose(); setShowEmailComposer(true); }}
                className="flex-1 gap-2"
                disabled={!displayParty.email || isLoading}
              >
                <Edit className="h-4 w-4" />
                Compose Email
              </Button>
              
            
            </div>

            {!displayParty.email && !isLoading && (
              <div className="text-center text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                <p>⚠️ This customer doesn't have an email address. Please add an email to send payment reminders.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Composer Dialog */}
      {displayParty.email && (
        <EmailComposerDialog
          isOpen={showEmailComposer}
          onClose={() => setShowEmailComposer(false)}
          transaction={transaction}
          party={displayParty}
          company={company}
          daysOverdue={daysSinceTransaction}
          pendingAmount={pendingBalance}
          totalCustomerBalance={totalCustomerBalance}
        />
      )}
    </>
  );
}
