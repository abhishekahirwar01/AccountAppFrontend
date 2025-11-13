"use client";

import * as React from "react";

import {
  Card,      
  CardContent,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Company } from "@/lib/types";
import { Building, Edit, Trash2 } from "lucide-react";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableRow } from "../ui/table";
import { ScrollArea } from "../ui/scroll-area";

interface CompanyCardProps {
  company: Company;
  clientName?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function CompanyCard({
  company,
  clientName,
  onEdit,
  onDelete,
}: CompanyCardProps) {

  return (
    <Card className="flex flex-col w-full">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Building className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>{company.businessName}</CardTitle>
            <CardDescription>{company.businessType}</CardDescription>
            {clientName && (
              <Badge variant="outline" className="mt-2">
                Client: {clientName}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4 px-0 text-sm">
        <ScrollArea className="h-72">
          <Table>
            <TableBody>
              <TableRow>
                
              </TableRow>
              <TableRow>
                <TableCell className="text-muted-foreground font-medium">
                  Contact Number
                </TableCell>
                <TableCell>{company.mobileNumber}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-muted-foreground font-medium">
                  Registration No.
                </TableCell>
                <TableCell>
                  <span className="font-mono bg-secondary px-2 py-1 rounded-md">
                    {company.registrationNumber}
                  </span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-muted-foreground font-medium">
                  GSTIN
                </TableCell>
                <TableCell>
                  <span className="font-mono bg-secondary px-2 py-1 rounded-md">
                    {company.gstin || "N/A"}
                  </span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-muted-foreground font-medium">
                  PAN Number
                </TableCell>
                <TableCell>
                  <span className="font-mono bg-secondary px-2 py-1 rounded-md">
                    {company.PANNumber || "N/A"}
                  </span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-muted-foreground font-medium">
                  Address
                </TableCell>
                <TableCell>
                  {company.address}, {company.City}, {company.addressState},{" "}
                  {company.Country} - {company.Pincode}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-muted-foreground font-medium">
                  Email
                </TableCell>
                <TableCell>{company.emailId || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-muted-foreground font-medium">
                  E-Way Bill
                </TableCell>
                <TableCell>
                  {company.ewayBillApplicable ? "Yes" : "No"}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
      <CardFooter className="mt-auto border-t p-2 flex justify-end gap-1">
        {onEdit && (
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
        )}

        {/* {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        )} */}
      </CardFooter>
    </Card>
  );
}
