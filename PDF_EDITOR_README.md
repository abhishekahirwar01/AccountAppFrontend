# PDF Customization Feature - Foxit-like PDF Editor

This implementation provides a comprehensive PDF customization feature similar to Foxit's inline editing capabilities, built using PDF-lib and Fabric.js for your React/Next.js invoice management application.

## 🚀 Features

### Core Editing Capabilities
- **Text Selection & Editing**: Click on any text element to select and edit it
- **Font Customization**: Change font family, size, and color
- **Positioning**: Drag and drop text elements to reposition them
- **Real-time Preview**: See changes instantly without full PDF regeneration
- **Undo/Redo**: Full history management for all editing operations

### Advanced Features
- **Multiple Font Support**: Helvetica, Times, Courier with various styles
- **Color Picker**: Full RGB color customization
- **Rotation Support**: Rotate text elements (0-360 degrees)
- **Multi-page Support**: Edit PDFs with multiple pages
- **Save/Export Options**: Save changes to original PDF or export as new file

## 📁 File Structure

```
src/
├── components/invoices/
│   ├── pdf-editor.tsx              # Main PDF editor component
│   ├── enhanced-invoice-preview.tsx # Enhanced preview with edit mode
│   └── invoice-preview.tsx         # Updated to include edit toggle
├── lib/
│   └── pdf-editor-utils.ts         # PDF manipulation utilities
└── types/
    └── pdf-editor-types.ts         # TypeScript definitions
```

## 🛠️ Installation

```bash
npm install pdf-lib fabric
```

## 🔧 Usage

### Basic Implementation

```tsx
import { EnhancedInvoicePreview } from '@/components/invoices/enhanced-invoice-preview';

function InvoicePage() {
  return (
    <EnhancedInvoicePreview
      transaction={transaction}
      company={company}
      party={party}
      serviceNameById={serviceNameById}
    />
  );
}
```

### Advanced Usage with Custom Hooks

```tsx
import { usePDFEditing } from '@/components/invoices/enhanced-invoice-preview';

function CustomInvoiceEditor() {
  const {
    isEditing,
    currentPDF,
    startEditing,
    saveEdit,
    undo,
    canUndo
  } = usePDFEditing();

  return (
    <div>
      {isEditing ? (
        <PDFEditor
          pdfBlob={currentPDF!}
          onSave={saveEdit}
        />
      ) : (
        <button onClick={() => startEditing(pdfBlob)}>
          Start Editing
        </button>
      )}
    </div>
  );
}
```

## 🎨 API Reference

### PDFEditor Component Props

```tsx
interface PDFEditorProps {
  pdfBlob: Blob;                    // PDF file as blob
  onSave?: (modifiedPdf: Blob) => void;     // Save callback
  onExport?: (modifiedPdf: Blob) => void;   // Export callback
}
```

### PDF Editing Options

```tsx
interface PDFEditingOptions {
  fontSize?: number;                // Font size in points
  fontFamily?: StandardFonts;       // PDF-lib standard font
  color?: { r: number; g: number; b: number }; // RGB color
  position?: { x: number; y: number }; // Position coordinates
  rotation?: number;                // Rotation in degrees
}
```

## 🔄 Workflow

1. **Generate PDF**: Use existing jsPDF templates to generate initial PDF
2. **Enter Edit Mode**: Click "Edit PDF" button to switch to editing mode
3. **Select Text**: Click on any text element to select it
4. **Modify Properties**: Use the properties panel to change:
   - Font family and size
   - Text color
   - Position (X, Y coordinates)
   - Rotation angle
5. **Add New Text**: Click "Add Text" to create new text elements
6. **Save Changes**: Click "Save" to apply changes to the PDF
7. **Export**: Click "Export" to download the modified PDF

## 🎯 Key Features Explained

### Text Selection System
- Click any text element to select it
- Selected text shows resize handles and properties panel
- Multiple selection support for batch operations

### Font Management
- Supports all PDF-lib standard fonts
- Dynamic font size adjustment (8pt - 72pt)
- Real-time font preview

### Color System
- RGB color picker
- Hex color input support
- Preset color palette

### Positioning System
- Drag and drop interface
- Precise X/Y coordinate input
- Snap-to-grid functionality

### History Management
- Unlimited undo/redo operations
- State persistence across sessions
- Change tracking for audit purposes

## 🚧 Challenges & Solutions

### PDF Structure Complexity
**Challenge**: PDFs have complex internal structure
**Solution**: Use PDF-lib's high-level API for text manipulation

### Text Extraction
**Challenge**: Extracting text from existing PDFs is complex
**Solution**: Implement simplified text element detection for common invoice fields

### Real-time Performance
**Challenge**: Real-time updates while maintaining performance
**Solution**: Use Fabric.js for canvas-based editing with optimized rendering

### Cross-browser Compatibility
**Challenge**: Different browser PDF handling
**Solution**: Use standardized Blob APIs and fallbacks

## 🔧 Advanced Configuration

### Custom Font Support
```tsx
// Add custom fonts to PDF-lib
const customFont = await pdfDoc.embedFont(customFontBytes);
page.drawText(text, {
  font: customFont,
  // ... other options
});
```

### Batch Operations
```tsx
// Apply changes to multiple text elements
const elements = await extractTextElements(pdfDoc);
elements.forEach(async (element) => {
  await updateTextElement(pdfDoc, element.id, newText, options);
});
```

### Custom Styling
```tsx
// Advanced text styling
page.drawText(text, {
  font: font,
  size: 14,
  color: rgb(0.2, 0.4, 0.8),
  rotate: { type: 'degrees', angle: 45 },
  x: 100,
  y: 200
});
```

## 📊 Performance Optimization

### Memory Management
- Clean up Fabric.js canvas instances
- Use Blob URLs efficiently
- Implement virtual scrolling for large PDFs

### Rendering Optimization
- Debounce text input updates
- Use requestAnimationFrame for smooth animations
- Implement lazy loading for multi-page PDFs

## 🐛 Troubleshooting

### Common Issues

1. **PDF not loading in editor**
   - Ensure PDF is generated as Blob
   - Check for CORS issues with PDF sources

2. **Text not selectable**
   - Verify Fabric.js canvas initialization
   - Check for z-index conflicts

3. **Changes not saving**
   - Ensure PDF-lib has write permissions
   - Check for memory limitations

4. **Performance issues**
   - Reduce canvas resolution for large PDFs
   - Implement pagination for multi-page documents

## 🔮 Future Enhancements

- **Advanced Text Formatting**: Bold, italic, underline support
- **Image Editing**: Add/resize images in PDFs
- **Annotation Support**: Comments, highlights, signatures
- **Collaboration**: Real-time multi-user editing
- **Template System**: Save and reuse custom templates
- **OCR Integration**: Extract text from scanned PDFs

## 📝 License

This implementation is part of your invoice management application and follows the same licensing terms.

## 🤝 Contributing

To extend this PDF editor:

1. Add new editing features in `pdf-editor.tsx`
2. Implement utility functions in `pdf-editor-utils.ts`
3. Update types in `pdf-editor-types.ts`
4. Add tests for new functionality

## 📞 Support

For issues or questions about the PDF customization feature, please refer to the main application documentation or create an issue in the project repository.