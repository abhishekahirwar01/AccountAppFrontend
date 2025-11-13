"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Eye, Download } from "lucide-react";
import { InvoicePreview } from './invoice-preview';
import { PDFEditor } from './pdf-editor';
import type { Company, Party, Transaction } from "@/lib/types";

interface EnhancedInvoicePreviewProps {
  transaction: Transaction | null;
  company: Company | null;
  party: Party | null;
  serviceNameById?: Map<string, string>;
  initialPdfBlob?: Blob | null;
  onExitEditMode?: () => void;
}

export function EnhancedInvoicePreview({
  transaction,
  company,
  party,
  serviceNameById,
  initialPdfBlob,
  onExitEditMode,
}: EnhancedInvoicePreviewProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  // Update pdfBlob when initialPdfBlob changes
  React.useEffect(() => {
    if (initialPdfBlob) {
      console.log('📄 EnhancedInvoicePreview received PDF blob:', initialPdfBlob.size, 'bytes');
      setPdfBlob(initialPdfBlob);
      setIsEditMode(true);
      setShowEditor(true);
    } else {
      // Reset state if no PDF blob
      setPdfBlob(null);
      setIsEditMode(false);
      setShowEditor(false);
    }
  }, [initialPdfBlob]);

  const handleEditClick = () => {
    setIsEditMode(true);
    setShowEditor(true);
  };

  const handlePreviewClick = () => {
    setIsEditMode(false);
    setShowEditor(false);
    if (onExitEditMode) {
      onExitEditMode();
    }
  };

  const handleSaveEditedPDF = (modifiedBlob: Blob) => {
    setPdfBlob(modifiedBlob);
    // Here you could upload the modified PDF to your server
    console.log('PDF saved:', modifiedBlob);
  };

  const handleExportPDF = (modifiedBlob: Blob) => {
    // Trigger download
    const url = URL.createObjectURL(modifiedBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `edited-invoice-${transaction?._id?.slice(-6) || '000000'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with mode toggle */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <h2 className="text-lg font-semibold">Invoice Preview</h2>
        <div className="flex items-center gap-2">
          <Button
            variant={!isEditMode ? "default" : "outline"}
            size="sm"
            onClick={handlePreviewClick}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            variant={isEditMode ? "default" : "outline"}
            size="sm"
            onClick={handleEditClick}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit PDF
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {!isEditMode ? (
          // Standard Preview Mode
          <InvoicePreview
            transaction={transaction}
            company={company}
            party={party}
            serviceNameById={serviceNameById}
          />
        ) : (
          // PDF Editor Mode
          <div className="max-h-[60vh] overflow-auto">
            {pdfBlob ? (
              <PDFEditor
                pdfBlob={pdfBlob}
                onSave={handleSaveEditedPDF}
                onExport={handleExportPDF}
              />
            ) : (
              // Generate PDF first for editing
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    Generate PDF first to enable editing
                  </p>
                  <Button onClick={handlePreviewClick}>
                    <Eye className="w-4 h-4 mr-2" />
                    Go to Preview
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Instructions */}
      {isEditMode && (
        <div className="p-4 bg-muted/50 border-t">
          <div className="text-sm text-muted-foreground">
            <h4 className="font-medium mb-2">PDF Editing Instructions:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Click on text elements to select and edit them</li>
              <li>Use the properties panel to change font, size, color, and position</li>
              <li>Click "Add Text" to add new text elements</li>
              <li>Use Undo/Redo for changes</li>
              <li>Save changes or Export as new PDF</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for managing PDF editing state
export function usePDFEditing() {
  const [isEditing, setIsEditing] = useState(false);
  const [currentPDF, setCurrentPDF] = useState<Blob | null>(null);
  const [editHistory, setEditHistory] = useState<Blob[]>([]);

  const startEditing = (pdfBlob: Blob) => {
    setCurrentPDF(pdfBlob);
    setIsEditing(true);
    setEditHistory([pdfBlob]);
  };

  const saveEdit = (modifiedBlob: Blob) => {
    setCurrentPDF(modifiedBlob);
    setEditHistory(prev => [...prev, modifiedBlob]);
  };

  const undo = () => {
    if (editHistory.length > 1) {
      const newHistory = editHistory.slice(0, -1);
      setEditHistory(newHistory);
      setCurrentPDF(newHistory[newHistory.length - 1]);
    }
  };

  const finishEditing = () => {
    setIsEditing(false);
  };

  return {
    isEditing,
    currentPDF,
    editHistory,
    startEditing,
    saveEdit,
    undo,
    finishEditing,
    canUndo: editHistory.length > 1
  };
}