"use client";

import React, { useRef, useEffect, useState } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Download, Save, Type, Undo, Redo } from "lucide-react";
import { toast } from "react-toastify";
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFEditorProps {
  pdfBlob: Blob;
  onSave?: (modifiedPdf: Blob) => void;
  onExport?: (modifiedPdf: Blob) => void;
}

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  width: number;
  height: number;
}

export function PDFEditor({ pdfBlob, onSave, onExport }: PDFEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [pdfJsDoc, setPdfJsDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedText, setSelectedText] = useState<TextElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfImageUrl, setPdfImageUrl] = useState<string | null>(null);
  const [scale, setScale] = useState(1.5);

  // Text editing state
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('Helvetica');
  const [textColor, setTextColor] = useState('#000000');

  // Render PDF page to canvas
  const renderPage = async (pageNum: number) => {
    if (!pdfJsDoc) return;
    
    try {
      const page = await pdfJsDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const context = canvas.getContext('2d');
      if (!context) return;
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      
      // Update text elements positions based on the rendered PDF
      setTextElements(prev => prev.map(el => ({
        ...el,
        x: el.x * (viewport.width / 595), // Assuming default PDF size of 595x842
        y: el.y * (viewport.height / 842)
      })));
      
    } catch (error) {
      console.error('Error rendering page:', error);
      toast.error('Failed to render PDF page');
    }
  };

  // Initialize PDF and render as image
  useEffect(() => {
    const initializeEditor = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('🎯 PDFEditor received blob:', pdfBlob);
        console.log('📊 Blob size:', pdfBlob?.size, 'bytes');
        console.log('📄 Blob type:', pdfBlob?.type);

        if (!pdfBlob) {
          throw new Error('No PDF blob provided');
        }

        if (pdfBlob.size === 0) {
          throw new Error('PDF blob is empty');
        }

        // Load PDF document for editing
        const arrayBuffer = await pdfBlob.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        setPdfDoc(pdfDoc);
        setTotalPages(pdfDoc.getPageCount());

        // Load PDF for rendering with PDF.js
        const loadingTask = pdfjsLib.getDocument(new Uint8Array(arrayBuffer));
        const pdfJsDoc = await loadingTask.promise;
        setPdfJsDoc(pdfJsDoc);
        
        // Render the first page
        await renderPage(1);

        // Set up text elements for editing
        console.log('🔄 Setting up PDF editor...');

        // Use sample elements for editing
        const sampleElements: TextElement[] = [
          {
            id: 'sample-1',
            text: 'Click to edit text',
            x: 100,
            y: 100,
            fontSize: 16,
            fontFamily: 'Helvetica',
            color: '#2563eb',
            width: 200,
            height: 20
          },
          {
            id: 'sample-2',
            text: 'Company Name',
            x: 100,
            y: 150,
            fontSize: 18,
            fontFamily: 'Helvetica',
            color: '#000000',
            width: 150,
            height: 25
          },
          {
            id: 'sample-3',
            text: 'Amount',
            x: 300,
            y: 200,
            fontSize: 20,
            fontFamily: 'Helvetica',
            color: '#dc2626',
            width: 180,
            height: 30
          }
        ];
        setTextElements(sampleElements);

        setIsLoading(false);
        toast.success('PDF Editor loaded successfully!');

      } catch (error) {
        console.error('Error initializing PDF editor:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setError(`Failed to load PDF: ${errorMessage}`);
        setIsLoading(false);
        toast.error(`PDF Editor Error: ${errorMessage}`);
      }
    };

    if (pdfBlob) {
      initializeEditor();
    }
  }, [pdfBlob]);

  // Render page when currentPage changes
  useEffect(() => {
    if (pdfJsDoc && currentPage) {
      renderPage(currentPage);
    }
  }, [currentPage, pdfJsDoc, scale]);

  const addNewText = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const newElement: TextElement = {
      id: Date.now().toString(),
      text: 'New Text',
      x: canvas.width / 2 - 50,
      y: canvas.height / 2,
      fontSize: 16,
      fontFamily: 'Helvetica',
      color: '#000000',
      width: 100,
      height: 20
    };
    setTextElements(prev => [...prev, newElement]);
    setSelectedText(newElement);
  };

  const updateTextElement = (id: string, updates: Partial<TextElement>) => {
    setTextElements(prev =>
      prev.map(el => el.id === id ? { ...el, ...updates } : el)
    );
    if (selectedText?.id === id) {
      setSelectedText(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const deleteTextElement = (id: string) => {
    setTextElements(prev => prev.filter(el => el.id !== id));
    if (selectedText?.id === id) {
      setSelectedText(null);
    }
  };

  const saveChanges = async () => {
    if (!pdfDoc) return;

    try {
      // Apply text elements to PDF
      const pages = pdfDoc.getPages();
      const page = pages[currentPage - 1];

      textElements.forEach((element) => {
        const font = pdfDoc!.embedStandardFont(
          StandardFonts[element.fontFamily as keyof typeof StandardFonts] || StandardFonts.Helvetica
        );
        const color = hexToRgb(element.color);

        // Convert coordinates back to PDF space
        const pdfX = element.x * (595 / (canvasRef.current?.width || 595));
        const pdfY = (page.getHeight() - element.y * (842 / (canvasRef.current?.height || 842)));

        page.drawText(element.text, {
          x: pdfX,
          y: pdfY,
          size: element.fontSize,
          font,
          color: rgb(color.r / 255, color.g / 255, color.b / 255)
        });
      });

      // Save modified PDF
      const modifiedPdfBytes = await pdfDoc.save();
      const modifiedBlob = new Blob([new Uint8Array(modifiedPdfBytes)], { type: 'application/pdf' });

      if (onSave) {
        onSave(modifiedBlob);
      }

      toast.success('PDF saved successfully!');
    } catch (error) {
      console.error('Error saving PDF:', error);
      toast.error('Failed to save PDF changes');
    }
  };

  const exportPDF = async () => {
    if (!pdfDoc) return;

    try {
      const modifiedPdfBytes = await pdfDoc.save();
      const modifiedBlob = new Blob([new Uint8Array(modifiedPdfBytes)], { type: 'application/pdf' });

      if (onExport) {
        onExport(modifiedBlob);
      } else {
        const url = URL.createObjectURL(modifiedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'edited-invoice.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    }
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-4 border-b bg-background">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            PDF Editor - Page {currentPage} of {totalPages} - {Math.round(scale * 100)}%
          </span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Label htmlFor="page" className="text-sm">Page</Label>
          <Select
            value={currentPage.toString()}
            onValueChange={(value) => setCurrentPage(parseInt(value))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <SelectItem key={page} value={page.toString()}>
                  {page}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Label htmlFor="scale" className="text-sm">Zoom</Label>
          <Select
            value={scale.toString()}
            onValueChange={(value) => setScale(parseFloat(value))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.75">75%</SelectItem>
              <SelectItem value="1">100%</SelectItem>
              <SelectItem value="1.25">125%</SelectItem>
              <SelectItem value="1.5">150%</SelectItem>
              <SelectItem value="2">200%</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <Button onClick={addNewText} size="sm" disabled={isLoading || !!error}>
          <Type className="w-4 h-4 mr-2" />
          Add Text
        </Button>

        <Button onClick={saveChanges} size="sm" disabled={isLoading || !!error}>
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>

        <Button onClick={exportPDF} size="sm" variant="outline" disabled={isLoading || !!error}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Properties Panel */}
        {selectedText && (
          <Card className="w-80 m-4">
            <CardHeader>
              <CardTitle className="text-sm">Text Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="textContent">Text Content</Label>
                <Input
                  id="textContent"
                  value={selectedText.text || ''}
                  onChange={(e) => updateTextElement(selectedText.id, { text: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="fontSize">Font Size</Label>
                <Input
                  id="fontSize"
                  type="number"
                  value={selectedText.fontSize || 16}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 16;
                    setFontSize(value);
                    updateTextElement(selectedText.id, { fontSize: value });
                  }}
                  min="8"
                  max="72"
                />
              </div>

              <div>
                <Label htmlFor="fontFamily">Font Family</Label>
                <Select
                  value={selectedText.fontFamily || 'Helvetica'}
                  onValueChange={(value) => {
                    setFontFamily(value);
                    updateTextElement(selectedText.id, { fontFamily: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Helvetica">Helvetica</SelectItem>
                    <SelectItem value="Times-Roman">Times Roman</SelectItem>
                    <SelectItem value="Courier">Courier</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="textColor">Text Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="textColor"
                    type="color"
                    value={selectedText.color || '#000000'}
                    onChange={(e) => {
                      setTextColor(e.target.value);
                      updateTextElement(selectedText.id, { color: e.target.value });
                    }}
                    className="w-12 h-8 p-1"
                  />
                  <Input
                    value={selectedText.color || '#000000'}
                    onChange={(e) => {
                      setTextColor(e.target.value);
                      updateTextElement(selectedText.id, { color: e.target.value });
                    }}
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div>
                <Label>Position</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="posX" className="text-xs">X</Label>
                    <Input
                      id="posX"
                      type="number"
                      value={Math.round(selectedText.x)}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        updateTextElement(selectedText.id, { x: value });
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="posY" className="text-xs">Y</Label>
                    <Input
                      id="posY"
                      type="number"
                      value={Math.round(selectedText.y)}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        updateTextElement(selectedText.id, { y: value });
                      }}
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={() => deleteTextElement(selectedText.id)}
                variant="destructive"
                size="sm"
              >
                Delete Text
              </Button>
            </CardContent>
          </Card>
        )}

        {/* PDF Editor Container */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="border rounded-lg overflow-auto bg-white relative flex justify-center">
            {/* PDF Canvas */}
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="border"
                style={{ display: 'block' }}
              />
              
              {/* Text Elements Overlay */}
              <div
                ref={overlayRef}
                className="absolute inset-0 pointer-events-none"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%'
                }}
              >
                {textElements.map((element) => (
                  <div
                    key={element.id}
                    className={`absolute cursor-pointer border-2 pointer-events-auto ${
                      selectedText?.id === element.id ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:border-gray-300'
                    }`}
                    style={{
                      left: `${element.x}px`,
                      top: `${element.y}px`,
                      fontSize: `${element.fontSize}px`,
                      fontFamily: element.fontFamily,
                      color: element.color,
                      minWidth: '100px',
                      minHeight: '30px',
                      padding: '4px',
                      backgroundColor: selectedText?.id === element.id ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.8)',
                      borderRadius: '2px'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedText(element);
                    }}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => {
                      const newText = e.currentTarget.textContent || '';
                      updateTextElement(element.id, { text: newText });
                    }}
                    onBlur={(e) => {
                      const newText = e.currentTarget.textContent || '';
                      updateTextElement(element.id, { text: newText });
                    }}
                  >
                    {element.text}
                  </div>
                ))}
              </div>

              {/* Click handler for deselecting */}
              <div
                className="absolute inset-0"
                onClick={() => setSelectedText(null)}
                style={{ pointerEvents: selectedText ? 'auto' : 'none' }}
              />
            </div>

            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading PDF Editor...</p>
                </div>
              </div>
            )}

            {/* Error Overlay */}
            {error && (
              <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-10 p-6">
                <div className="text-center max-w-md">
                  <div className="text-red-500 mb-4">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <h3 className="text-lg font-semibold mb-2">PDF Editor Error</h3>
                    <p className="text-sm text-red-600 mb-4">{error}</p>
                  </div>
                  <Button onClick={() => window.location.reload()} size="sm">
                    Refresh Page
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Page Navigation */}
          <div className="flex justify-center mt-4">
            <Button 
              variant="outline" 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            <span className="mx-4 py-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button 
              variant="outline" 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}