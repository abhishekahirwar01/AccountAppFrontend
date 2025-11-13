"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Download, Upload, FileText, CheckCircle, X } from "lucide-react";
import * as XLSX from "xlsx";

interface ExcelImportExportProps {
  templateData: Record<string, any>[];
  templateFileName: string;
  importEndpoint: string;
  onImportSuccess: () => void;
  expectedColumns: string[];
  transformImportData?: (data: any[]) => any[];
}

export function ExcelImportExport({
  templateData,
  templateFileName,
  importEndpoint,
  onImportSuccess,
  expectedColumns,
  transformImportData,
}: ExcelImportExportProps) {
  const { toast } = useToast();
  const [importFile, setImportFile] = React.useState<File | null>(null);
  const [importPreview, setImportPreview] = React.useState<any[]>([]);
  const [isImporting, setIsImporting] = React.useState(false);
   const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Function to download an empty Excel template
  const handleDownloadTemplate = () => {
    // Create a worksheet from the template data
    const ws = XLSX.utils.json_to_sheet(templateData);

    // Create a new workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");

    // Download the Excel file
    XLSX.writeFile(wb, templateFileName);
  };

  // Function to handle file import
  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportFile(file);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });

        // Assuming the first sheet is the one we need
        const ws = wb.Sheets[wb.SheetNames[0]];

        // Convert the sheet into JSON
        const json = XLSX.utils.sheet_to_json(ws);

        // Validate columns
        if (json.length > 0) {
          const firstRow = json[0] as Record<string, any>;
          const fileColumns = Object.keys(firstRow);

          const missingColumns = expectedColumns.filter(
            col => !fileColumns.includes(col)
          );

          if (missingColumns.length > 0) {
            toast({
              variant: "destructive",
              title: "Invalid file format",
              description: `Missing columns: ${missingColumns.join(", ")}`,
            });
            setImportFile(null);
            return;
          }
        }

        // Transform data if needed
        const processedData = transformImportData ? transformImportData(json) : json;

        console.log("Formatted Data for Import:", processedData);
        setImportPreview(processedData);
      } catch (error: unknown) {
        if (error instanceof Error) {
          toast({
            variant: "destructive",
            title: "Failed to parse file",
            description: error.message,
          });
        } else {
          toast({
            variant: "destructive",
            title: "An unknown error occurred",
            description: "Something went wrong.",
          });
        }
        setImportFile(null);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = async () => {
    if (importPreview.length === 0) return;

    setIsImporting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      // Import items one by one
      for (let item of importPreview) {
        // Skip empty rows
        if (Object.values(item).some(value => value !== "" && value != null)) {
          await fetch(importEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(item),
          });
        }
      }

      onImportSuccess();
      toast({
        title: "Import successful",
        description: "Items have been added from file.",
      });
      setImportFile(null);
      setImportPreview([]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Import Failed",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleCancelImport = () => {
    setImportFile(null);
    setImportPreview([]);
  };

  return (
    <>
    {/* Desktop View  */}
    <div className=" hidden md:flex flex-col sm:flex-row gap-3 sm:gap-3 items-start sm:items-center">
      {/* Left Group: Download + Import */}
      <div className="flex xs:flex-row gap-4 sm:gap-3 w-full sm:w-auto">
        <Button
          onClick={handleDownloadTemplate}
          variant="outline"
          size="sm"
          className="gap-2 w-full xs:w-auto justify-center"
        >
          <Download className="h-3.5 w-3.5" />
          Template
        </Button>

        <div className="flex gap-2 w-full xs:w-auto">
          <input
            type="file"
            accept=".xlsx, .xls"
            className="hidden"
            id="import-file"
            onChange={handleImportFile}
          />
          <label
            htmlFor="import-file"
            className="inline-flex items-center gap-2 cursor-pointer bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-sm font-medium py-2 px-3 rounded-md border border-blue-200 dark:border-blue-800 transition-colors w-full xs:w-auto justify-center"
          >
            <Upload className="h-3.5 w-3.5" />
            Import
          </label>
        </div>
      </div>

      {/* File Preview */}
      {importFile && (
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md p-2 w-full sm:w-auto">
          <FileText className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
          <span className="text-sm text-green-800 dark:text-green-300 truncate max-w-[120px]">
            {importFile.name}
          </span>
          <div className="flex gap-1 ml-auto">
            <Button
              size="sm"
              onClick={handleConfirmImport}
              disabled={isImporting}
              className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white"
            >
              {isImporting ? (
                <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
              ) : (
                <CheckCircle className="h-3 w-3" />
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancelImport}
              disabled={isImporting}
              className="h-7 px-2"
            >
              ✕
            </Button>
          </div>
        </div>
      )}
    </div>

    {/* Mobile View - Icon Button with Dialog */}
      <div className="sm:hidden">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-10 w-10 p-0 rounded-full"
            >
              <Upload className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">Import/Export</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Download Template Section */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm">Download Template</h3>
                <Button
                  onClick={handleDownloadTemplate}
                  variant="outline"
                  className="w-full justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Excel Template
                </Button>
                <p className="text-xs text-muted-foreground">
                  Download the template file to fill in your data
                </p>
              </div>

              {/* Import Section */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm">Import Data</h3>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  className="hidden"
                  id="mobile-import-file"
                  onChange={(e) => {
                    handleImportFile(e);
                    // Keep dialog open after file selection
                  }}
                />
                <label
                  htmlFor="mobile-import-file"
                  className="inline-flex items-center gap-2 cursor-pointer bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-medium py-2 px-4 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors w-full justify-center"
                >
                  <Upload className="h-4 w-4" />
                  Choose Excel File
                </label>
              </div>

              {/* File Preview in Dialog */}
              {importFile && (
                <div className="space-y-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-800 dark:text-green-300 truncate">
                        {importFile.name}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        {Math.round(importFile.size / 1024)} KB
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        handleConfirmImport();
                        setIsDialogOpen(false);
                      }}
                      disabled={isImporting}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
                    >
                      {isImporting ? (
                        <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                      ) : (
                        <CheckCircle className="h-3 w-3" />
                      )}
                      Confirm Import
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancelImport}
                      disabled={isImporting}
                      className="px-3"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="mt-2"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

    </>


  );
}