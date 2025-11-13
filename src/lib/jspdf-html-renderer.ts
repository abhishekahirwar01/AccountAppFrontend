import {jsPDF} from "jspdf";


export interface TextSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
}

export interface ParsedElement {
  type: 'paragraph' | 'list' | 'heading';
  content: string | TextSegment[];
  styles: {
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    fontSize?: number;
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    color?: string;
    backgroundColor?: string;
    textDecoration?: string;
    marginLeft?: number;
    fontFamily?: string;
  };
  level?: number;
  listType?: 'ordered' | 'unordered';
  listNumber?: number;
}

const parseFontSize = (styleString: string, defaultSize: number = 9, parentFontSize?: number): number => {
  const sizeMatch = styleString.match(/font-size:\s*(\d+(?:\.\d+)?)(px|pt|em|rem)?/);
  if (sizeMatch) {
    const size = parseFloat(sizeMatch[1]);
    const unit = sizeMatch[2];
    
    if (!unit || unit === 'px') {
      return size * 0.85;
    } else if (unit === 'pt') {
      return size;
    } else if (unit === 'em') {
      return (parentFontSize || defaultSize) * size;
    } else if (unit === 'rem') {
      return 16 * 0.75 * size;
    }
  }
  
  if (styleString.includes('ql-size-small')) return defaultSize * 0.85;
  if (styleString.includes('ql-size-large')) return defaultSize * 1.5;
  if (styleString.includes('ql-size-huge')) return defaultSize * 2.5;
  
  return defaultSize;
};

const extractTextSegments = (element: Element, parentFontSize?: number): TextSegment[] => {
  const segments: TextSegment[] = [];
  
  const processNode = (node: Node, inheritedStyles: Partial<TextSegment> = {}): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (text.trim()) {
        segments.push({
          text,
          ...inheritedStyles
        });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const newStyles = { ...inheritedStyles };
      
      if (el.tagName === 'STRONG' || el.tagName === 'B') {
        newStyles.bold = true;
      }
      if (el.tagName === 'EM' || el.tagName === 'I') {
        newStyles.italic = true;
      }
      if (el.tagName === 'U') {
        newStyles.underline = true;
      }
      if (el.tagName === 'S' || el.tagName === 'STRIKE' || el.tagName === 'DEL') {
        newStyles.strikethrough = true;
      }
      
      const style = el.getAttribute('style');
      if (style) {
        const fontSize = parseFontSize(style, 9, parentFontSize);
        if (fontSize !== 9) {
          newStyles.fontSize = fontSize;
        }
        
        const colorMatch = style.match(/color:\s*rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (colorMatch) {
          newStyles.color = `rgb(${colorMatch[1]}, ${colorMatch[2]}, ${colorMatch[3]})`;
        }
        
        const bgMatch = style.match(/background-color:\s*rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (bgMatch) {
          newStyles.backgroundColor = `rgb(${bgMatch[1]}, ${bgMatch[2]}, ${bgMatch[3]})`;
        }
      }
      
      if (el.classList.contains('ql-size-small')) {
        newStyles.fontSize = 9 * 0.85;
      } else if (el.classList.contains('ql-size-large')) {
        newStyles.fontSize = 9 * 1.5;
      } else if (el.classList.contains('ql-size-huge')) {
        newStyles.fontSize = 9 * 2.5;
      }
      
      if (el.tagName === 'SPAN') {
        const className = el.className;
        if (className.includes('ql-size-small')) {
          newStyles.fontSize = 9 * 0.85;
        } else if (className.includes('ql-size-large')) {
          newStyles.fontSize = 9 * 1.5;
        } else if (className.includes('ql-size-huge')) {
          newStyles.fontSize = 9 * 2.5;
        }
      }
      
      Array.from(el.childNodes).forEach(child => processNode(child, newStyles));
    }
  };
  
  Array.from(element.childNodes).forEach(child => processNode(child));
  return segments;
};

export const parseHtmlToElementsForJsPDF = (html: string, defaultFontSize: number = 9): ParsedElement[] => {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return [];
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;
  
  const result: ParsedElement[] = [];
  let orderedListCounter = 0;
  let currentListType: 'ordered' | 'unordered' | null = null;

  const children = Array.from(body.children);

  children.forEach((el) => {
    const dataListAttr = el.getAttribute('data-list');
    let isListItem = false;
    let listType: 'ordered' | 'unordered' | null = null;

    if (dataListAttr === 'ordered') {
      isListItem = true;
      listType = 'ordered';
    } else if (dataListAttr === 'bullet') {
      isListItem = true;
      listType = 'unordered';
    } else if (el.tagName === 'OL' || el.closest('ol')) {
      isListItem = true;
      listType = 'ordered';
    } else if (el.tagName === 'UL' || el.closest('ul')) {
      isListItem = true;
      listType = 'unordered';
    } else if (el.tagName === 'LI') {
      const parent = el.parentElement;
      if (parent?.tagName === 'OL') {
        isListItem = true;
        listType = 'ordered';
      } else if (parent?.tagName === 'UL') {
        isListItem = true;
        listType = 'unordered';
      } else {
        const prevSibling = el.previousElementSibling;
        if (prevSibling?.getAttribute('data-list') === 'ordered') {
          isListItem = true;
          listType = 'ordered';
        } else if (prevSibling?.getAttribute('data-list') === 'bullet') {
          isListItem = true;
          listType = 'unordered';
        } else {
          isListItem = true;
          listType = 'unordered';
        }
      }
    }

    if (listType !== currentListType) {
      if (listType === 'ordered') {
        orderedListCounter = 0;
      }
      currentListType = listType;
    }

    if (!isListItem) {
      orderedListCounter = 0;
      currentListType = null;
    }

    const handleListItem = (li: Element, type: 'ordered' | 'unordered', number?: number) => {
      const textSegments = extractTextSegments(li);
      if (textSegments.length === 0) return;
      
      const styles = getListItemStyles(li, defaultFontSize);
      
      const sizeChild = li.querySelector('.ql-size-small, .ql-size-large, .ql-size-huge');
      if (sizeChild) {
        if (sizeChild.classList.contains('ql-size-small')) {
          styles.fontSize = defaultFontSize * 0.75;
        } else if (sizeChild.classList.contains('ql-size-large')) {
          styles.fontSize = defaultFontSize * 1.5;
        } else if (sizeChild.classList.contains('ql-size-huge')) {
          styles.fontSize = defaultFontSize * 2.5;
        }
      }
      
      result.push({
        type: 'list',
        content: textSegments,
        styles,
        listType: type,
        listNumber: number,
      });
    };

    if (el.tagName === 'OL') {
      const listItems = el.querySelectorAll(':scope > li');
      let counter = 1;
      listItems.forEach((li) => {
        const liDataList = li.getAttribute('data-list');
        const actualListType = liDataList === 'bullet' ? 'unordered' : 
                               liDataList === 'ordered' ? 'ordered' : 'ordered';
        
        if (actualListType === 'ordered') {
          handleListItem(li, 'ordered', counter++);
        } else {
          handleListItem(li, 'unordered');
        }
      });
    } else if (el.tagName === 'UL') {
      const listItems = el.querySelectorAll(':scope > li');
      let counter = 1;
      listItems.forEach((li) => {
        const liDataList = li.getAttribute('data-list');
        const actualListType = liDataList === 'ordered' ? 'ordered' : 
                               liDataList === 'bullet' ? 'unordered' : 'unordered';
        
        if (actualListType === 'ordered') {
          handleListItem(li, 'ordered', counter++);
        } else {
          handleListItem(li, 'unordered');
        }
      });
    } else if (isListItem && listType) {
      const textSegments = extractTextSegments(el);
      if (textSegments.length > 0) {
        if (listType === 'ordered') {
          orderedListCounter++;
          handleListItem(el, 'ordered', orderedListCounter);
        } else {
          handleListItem(el, 'unordered');
        }
      }
    } else if (el.tagName === 'P') {
      const textSegments = extractTextSegments(el);
      if (textSegments.length === 0) return;
      
      const styles = getParagraphStyles(el, defaultFontSize);
      
      const sizeChild = el.querySelector('.ql-size-small, .ql-size-large, .ql-size-huge');
      if (sizeChild) {
        if (sizeChild.classList.contains('ql-size-small')) {
          styles.fontSize = defaultFontSize * 0.75;
        } else if (sizeChild.classList.contains('ql-size-large')) {
          styles.fontSize = defaultFontSize * 1.5;
        } else if (sizeChild.classList.contains('ql-size-huge')) {
          styles.fontSize = defaultFontSize * 2.5;
        }
      }
      
      result.push({
        type: 'paragraph',
        content: textSegments,
        styles,
      });
    } else if (['H1', 'H2', 'H3'].includes(el.tagName)) {
      const textSegments = extractTextSegments(el);
      if (textSegments.length === 0) return;
      const level = parseInt(el.tagName[1]);
      
      const styles = getHeadingStyles(el, defaultFontSize);
      
      result.push({
        type: 'heading',
        content: textSegments,
        styles,
        level,
      });
    }
  });

  return result;
};

function getParagraphStyles(el: Element, defaultFontSize: number) {
  const styles: ParsedElement['styles'] = {
    fontSize: defaultFontSize,
    textAlign: 'left',
    fontWeight: 'normal',
    fontStyle: 'normal',
  };

  if (el.classList.contains('ql-align-center')) styles.textAlign = 'center';
  if (el.classList.contains('ql-align-right')) styles.textAlign = 'right';
  if (el.classList.contains('ql-align-justify')) styles.textAlign = 'justify';

  if (el.classList.contains('ql-size-small')) {
    styles.fontSize = defaultFontSize * 0.75;
  } else if (el.classList.contains('ql-size-large')) {
    styles.fontSize = defaultFontSize * 1.5;
  } else if (el.classList.contains('ql-size-huge')) {
    styles.fontSize = defaultFontSize * 2.5;
  }

  const styleAttr = el.getAttribute('style');
  if (styleAttr) {
    const fontSize = parseFontSize(styleAttr, styles.fontSize || defaultFontSize, styles.fontSize || defaultFontSize);
    if (fontSize !== defaultFontSize) {
      styles.fontSize = fontSize;
    }

    const fontMatch = styleAttr.match(/font-family:\s*["']?([^;"']+)["']?/);
    if (fontMatch) {
      styles.fontFamily = fontMatch[1];
    }

    const colorMatch = styleAttr.match(/color:\s*rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (colorMatch) {
      styles.color = `rgb(${colorMatch[1]}, ${colorMatch[2]}, ${colorMatch[3]})`;
    }

    const bgMatch = styleAttr.match(/background-color:\s*rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (bgMatch) {
      styles.backgroundColor = `rgb(${bgMatch[1]}, ${bgMatch[2]}, ${bgMatch[3]})`;
    }
  }

  return styles;
}

function getHeadingStyles(el: Element, defaultFontSize: number) {
  const level = parseInt(el.tagName[1]);
  const styles: ParsedElement['styles'] = {
    fontSize: defaultFontSize + (8 - level * 2),
    fontWeight: 'bold',
    textAlign: 'left',
  };

  if (el.classList.contains('ql-align-center')) styles.textAlign = 'center';
  if (el.classList.contains('ql-align-right')) styles.textAlign = 'right';
  if (el.classList.contains('ql-align-justify')) styles.textAlign = 'justify';

  const styleAttr = el.getAttribute('style');
  if (styleAttr) {
    const colorMatch = styleAttr.match(/color:\s*rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (colorMatch) {
      styles.color = `rgb(${colorMatch[1]}, ${colorMatch[2]}, ${colorMatch[3]})`;
    }
  }

  return styles;
}

function getListItemStyles(el: Element, defaultFontSize: number) {
  const styles: ParsedElement['styles'] = {
    fontSize: defaultFontSize,
    textAlign: 'left',
    fontWeight: 'normal',
    fontStyle: 'normal',
    marginLeft: 10,
  };

  if (el.classList.contains('ql-align-center')) styles.textAlign = 'center';
  if (el.classList.contains('ql-align-right')) styles.textAlign = 'right';
  if (el.classList.contains('ql-align-justify')) styles.textAlign = 'justify';

  if (el.classList.contains('ql-size-small')) {
    styles.fontSize = defaultFontSize * 0.75;
  } else if (el.classList.contains('ql-size-large')) {
    styles.fontSize = defaultFontSize * 1.5;
  } else if (el.classList.contains('ql-size-huge')) {
    styles.fontSize = defaultFontSize * 2.5;
  }

  const styleAttr = el.getAttribute('style');
  if (styleAttr) {
    const fontSize = parseFontSize(styleAttr, styles.fontSize || defaultFontSize, styles.fontSize || defaultFontSize);
    if (fontSize !== defaultFontSize) {
      styles.fontSize = fontSize;
    }

    const fontMatch = styleAttr.match(/font-family:\s*["']?([^;"']+)["']?/);
    if (fontMatch) {
      styles.fontFamily = fontMatch[1];
    }

    const colorMatch = styleAttr.match(/color:\s*rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (colorMatch) {
      styles.color = `rgb(${colorMatch[1]}, ${colorMatch[2]}, ${colorMatch[3]})`;
    }

    const bgMatch = styleAttr.match(/background-color:\s*rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (bgMatch) {
      styles.backgroundColor = `rgb(${bgMatch[1]}, ${bgMatch[2]}, ${bgMatch[3]})`;
    }
  }

  return styles;
}

export const renderParsedElementsWithJsPDF = (
  doc: jsPDF,
  elements: ParsedElement[],
  startX: number,
  startY: number,
  maxWidth: number,
  pageWidth: number,
  pageHeight: number,
  drawHeader: (isFirstPage: boolean) => void 
): number => {
  let currentY = startY;
  const lineHeight = 12;
  const bottomMargin = 40;
  const HEADER_HEIGHT_AFTER_BREAK = 228 + 12;

  elements.forEach((element) => {
    const fontSize = element.styles.fontSize || 9;
    const textAlign = element.styles.textAlign || 'left';
    
    if (currentY + lineHeight > pageHeight - bottomMargin) {
      doc.addPage();
      drawHeader(false);
      currentY = HEADER_HEIGHT_AFTER_BREAK; 
    }
    
    if (element.type === 'paragraph' || element.type === 'heading') {
      const segments = Array.isArray(element.content) ? element.content : [{ text: element.content }];
      
      let currentLine: {segment: TextSegment, text: string}[] = [];
      let lineStartY = currentY;

      const drawCurrentLine = () => {
        if (currentLine.length === 0) return;
        
        if (lineStartY + lineHeight > pageHeight - bottomMargin) {
          doc.addPage();
          drawHeader(false);
          lineStartY = HEADER_HEIGHT_AFTER_BREAK;
        }
        
        // Calculate total width of the line
        let totalWidth = 0;
        currentLine.forEach(item => {
          const segment = item.segment;
          let fontStyle = 'normal';
          if (segment.bold && segment.italic) {
            fontStyle = 'bolditalic';
          } else if (segment.bold) {
            fontStyle = 'bold';
          } else if (segment.italic) {
            fontStyle = 'italic';
          }
          doc.setFont('helvetica', fontStyle);
          doc.setFontSize(segment.fontSize || fontSize);
          totalWidth += doc.getStringUnitWidth(item.text) * doc.getFontSize() / doc.internal.scaleFactor;
        });
        
        // Calculate starting X based on alignment
        let lineX = startX;
        if (textAlign === 'center') {
          lineX = startX + (maxWidth - totalWidth) / 2;
        } else if (textAlign === 'right') {
          lineX = startX + maxWidth - totalWidth;
        }
        
        // Draw each segment
        currentLine.forEach(item => {
          const segment = item.segment;
          let fontStyle = 'normal';
          
          if (segment.bold && segment.italic) {
            fontStyle = 'bolditalic';
          } else if (segment.bold) {
            fontStyle = 'bold';
          } else if (segment.italic) {
            fontStyle = 'italic';
          }
          
          doc.setFont('helvetica', fontStyle);
          doc.setFontSize(segment.fontSize || fontSize);
          
          if (segment.color) {
            const rgbMatch = segment.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (rgbMatch) {
              doc.setTextColor(parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3]));
            }
          } else {
            doc.setTextColor(52, 58, 64);
          }
          
          doc.text(item.text, lineX, lineStartY);
          lineX += doc.getStringUnitWidth(item.text) * doc.getFontSize() / doc.internal.scaleFactor;
        });
        
        lineStartY += lineHeight;
        currentLine = [];
      };

      segments.forEach((segment) => {
        let fontStyle = 'normal';
        
        if (segment.bold && segment.italic) {
          fontStyle = 'bolditalic';
        } else if (segment.bold) {
          fontStyle = 'bold';
        } else if (segment.italic) {
          fontStyle = 'italic';
        }
        
        doc.setFont('helvetica', fontStyle);
        doc.setFontSize(segment.fontSize || fontSize);

        const words = segment.text.split(/\s+/);
        
        words.forEach((word) => {
          const testLineItems = [...currentLine, {segment, text: word}];
          let testWidth = 0;
          
          testLineItems.forEach(item => {
            const seg = item.segment;
            let fs = 'normal';
            if (seg.bold && seg.italic) fs = 'bolditalic';
            else if (seg.bold) fs = 'bold';
            else if (seg.italic) fs = 'italic';
            
            doc.setFont('helvetica', fs);
            doc.setFontSize(seg.fontSize || fontSize);
            testWidth += doc.getStringUnitWidth(item.text) * doc.getFontSize() / doc.internal.scaleFactor;
          });
          
          if (testLineItems.length > 1) {
            testWidth += doc.getStringUnitWidth(' ') * doc.getFontSize() / doc.internal.scaleFactor * (testLineItems.length - 1);
          }
          
          if (testWidth > maxWidth && currentLine.length > 0) {
            drawCurrentLine();
          }
          
          if (currentLine.length > 0) {
            currentLine.push({segment, text: ' ' + word});
          } else {
            currentLine.push({segment, text: word});
          }
        });
      });
      
      drawCurrentLine();
      currentY = lineStartY + 6;
      
    } else if (element.type === 'list') {
      const prefix = element.listType === 'ordered' 
        ? `${element.listNumber}. ` 
        : '• ';
      
      const segments = Array.isArray(element.content) ? element.content : [{ text: element.content }];
      
      if (currentY + lineHeight > pageHeight - bottomMargin) {
        doc.addPage();
        drawHeader(false);
        currentY = HEADER_HEIGHT_AFTER_BREAK;
      }

      let currentLine: {segment: TextSegment, text: string}[] = [];
      let lineStartY = currentY;
      let isFirstLine = true;
      
      const drawCurrentLine = () => {
        if (currentLine.length === 0) return;
        
        if (lineStartY + lineHeight > pageHeight - bottomMargin) {
          doc.addPage();
          drawHeader(false);
          lineStartY = HEADER_HEIGHT_AFTER_BREAK;
        }
        
        // Calculate total width including prefix for first line
        let totalWidth = 0;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fontSize);
        const prefixWidth = doc.getStringUnitWidth(prefix) * doc.getFontSize() / doc.internal.scaleFactor;
        
        currentLine.forEach(item => {
          const segment = item.segment;
          let fontStyle = 'normal';
          if (segment.bold && segment.italic) {
            fontStyle = 'bolditalic';
          } else if (segment.bold) {
            fontStyle = 'bold';
          } else if (segment.italic) {
            fontStyle = 'italic';
          }
          doc.setFont('helvetica', fontStyle);
          doc.setFontSize(segment.fontSize || fontSize);
          totalWidth += doc.getStringUnitWidth(item.text) * doc.getFontSize() / doc.internal.scaleFactor;
        });
        
        // Calculate starting X position based on alignment
        let lineX = startX;
        if (textAlign === 'center') {
          const fullWidth = isFirstLine ? prefixWidth + totalWidth : totalWidth;
          lineX = startX + (maxWidth - fullWidth) / 2;
        } else if (textAlign === 'right') {
          const fullWidth = isFirstLine ? prefixWidth + totalWidth : totalWidth;
          lineX = startX + maxWidth - fullWidth;
        }
        
        // Draw prefix on first line
        if (isFirstLine) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(fontSize);
          doc.setTextColor(52, 58, 64);
          doc.text(prefix, lineX, lineStartY);
          lineX += prefixWidth;
          isFirstLine = false;
        }
        
        // Draw text segments
        currentLine.forEach(item => {
          const segment = item.segment;
          let fontStyle = 'normal';
          
          if (segment.bold && segment.italic) {
            fontStyle = 'bolditalic';
          } else if (segment.bold) {
            fontStyle = 'bold';
          } else if (segment.italic) {
            fontStyle = 'italic';
          }
          
          doc.setFont('helvetica', fontStyle);
          doc.setFontSize(segment.fontSize || fontSize);
          
          if (segment.color) {
            const rgbMatch = segment.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (rgbMatch) {
              doc.setTextColor(parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3]));
            }
          } else {
            doc.setTextColor(52, 58, 64);
          }
          
          doc.text(item.text, lineX, lineStartY);
          lineX += doc.getStringUnitWidth(item.text) * doc.getFontSize() / doc.internal.scaleFactor;
        });
        
        lineStartY += lineHeight;
        currentLine = [];
      };

      segments.forEach((segment) => {
        let fontStyle = 'normal';
        
        if (segment.bold && segment.italic) {
          fontStyle = 'bolditalic';
        } else if (segment.bold) {
          fontStyle = 'bold';
        } else if (segment.italic) {
          fontStyle = 'italic';
        }
        
        doc.setFont('helvetica', fontStyle);
        doc.setFontSize(segment.fontSize || fontSize);

        const words = segment.text.split(/\s+/);
        
        words.forEach((word) => {
          const testLineItems = [...currentLine, {segment, text: word}];
          let testWidth = 0;
          
          testLineItems.forEach(item => {
            const seg = item.segment;
            let fs = 'normal';
            if (seg.bold && seg.italic) fs = 'bolditalic';
            else if (seg.bold) fs = 'bold';
            else if (seg.italic) fs = 'italic';
            
            doc.setFont('helvetica', fs);
            doc.setFontSize(seg.fontSize || fontSize);
            testWidth += doc.getStringUnitWidth(item.text) * doc.getFontSize() / doc.internal.scaleFactor;
          });
          
          if (testLineItems.length > 1) {
            testWidth += doc.getStringUnitWidth(' ') * doc.getFontSize() / doc.internal.scaleFactor * (testLineItems.length - 1);
          }
          
          // Add prefix width for first line calculation
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(fontSize);
          const prefixWidth = doc.getStringUnitWidth(prefix) * doc.getFontSize() / doc.internal.scaleFactor;
          const availableWidth = isFirstLine ? maxWidth - prefixWidth : maxWidth;
          
          if (testWidth > availableWidth && currentLine.length > 0) {
            drawCurrentLine();
          }
          
          if (currentLine.length > 0) {
            currentLine.push({segment, text: ' ' + word});
          } else {
            currentLine.push({segment, text: word});
          }
        });
      });
      
      drawCurrentLine();
      currentY = lineStartY + 4;
    }
  });

  return currentY;
};