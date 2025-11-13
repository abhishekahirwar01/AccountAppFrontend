// HtmlNoteRenderer.tsx
// This is a utility function to parse HTML notes and render them in react-pdf

import { Text, View, StyleSheet } from "@react-pdf/renderer";

interface ParsedElement {
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

interface TextSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
}

// Helper function to parse font size from style string
const parseFontSize = (styleString: string, defaultSize: number = 8, parentFontSize?: number): number => {
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
      return 16 * 0.85 * size; // rem based on 16px default
    }
  }
  
  // Check for Quill size classes
  if (styleString.includes('ql-size-small')) return defaultSize * 1.0;
  if (styleString.includes('ql-size-large')) return defaultSize * 1.5;
  if (styleString.includes('ql-size-huge')) return defaultSize * 2.5;
  
  return defaultSize;
};

// Helper function to extract inline formatted text segments
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
      
      // Check for formatting tags
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
      
      // Check inline styles
      const style = el.getAttribute('style');
      if (style) {
        // Parse font size
        const fontSize = parseFontSize(style, 8, parentFontSize);
        if (fontSize !== 8) {
          newStyles.fontSize = fontSize;
        }
        
        // Parse color
        const colorMatch = style.match(/color:\s*rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (colorMatch) {
          newStyles.color = `rgb(${colorMatch[1]}, ${colorMatch[2]}, ${colorMatch[3]})`;
        }
        
        // Parse background color
        const bgMatch = style.match(/background-color:\s*rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (bgMatch) {
          newStyles.backgroundColor = `rgb(${bgMatch[1]}, ${bgMatch[2]}, ${bgMatch[3]})`;
        }
      }
      
      // CRITICAL: Check for Quill size classes on inline elements
      if (el.classList.contains('ql-size-small')) {
        newStyles.fontSize = 8 * 1.0; // 6pt
      } else if (el.classList.contains('ql-size-large')) {
        newStyles.fontSize = 8 * 1.5; // 12pt
      } else if (el.classList.contains('ql-size-huge')) {
        newStyles.fontSize = 8 * 2.5; // 20pt
      }
      
      // Check for span with size class
      if (el.tagName === 'SPAN') {
        const className = el.className;
        if (className.includes('ql-size-small')) {
          newStyles.fontSize = 8 * 1.0;
        } else if (className.includes('ql-size-large')) {
          newStyles.fontSize = 8 * 1.5;
        } else if (className.includes('ql-size-huge')) {
          newStyles.fontSize = 8 * 2.5;
        }
      }
      
      // Process children
      Array.from(el.childNodes).forEach(child => processNode(child, newStyles));
    }
  };
  
  Array.from(element.childNodes).forEach(child => processNode(child));
  return segments;
};

export const parseHtmlToElements = (html: string, defaultFontSize: number = 8): ParsedElement[] => {
  if (typeof window === 'undefined') return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;
  
  const result: ParsedElement[] = [];
  let orderedListCounter = 0;
  let currentListType: 'ordered' | 'unordered' | null = null;

  // Get all direct children of body
  const children = Array.from(body.children);

  children.forEach((el, idx) => {
    // Check for Quill's data-list attribute (PRIMARY detection method)
    const dataListAttr = el.getAttribute('data-list');
    
    // Determine if this element is a list item
    let isListItem = false;
    let listType: 'ordered' | 'unordered' | null = null;

    // Priority 1: Check data-list attribute (Quill format) - MOST IMPORTANT
    if (dataListAttr === 'ordered') {
      isListItem = true;
      listType = 'ordered';
    } else if (dataListAttr === 'bullet') {
      isListItem = true;
      listType = 'unordered';
    }
    // Priority 2: Check if it's a standard HTML list
    else if (el.tagName === 'OL' || el.closest('ol')) {
      isListItem = true;
      listType = 'ordered';
    } else if (el.tagName === 'UL' || el.closest('ul')) {
      isListItem = true;
      listType = 'unordered';
    }
    // Priority 3: Check if it's an LI element
    else if (el.tagName === 'LI') {
      // Look at parent or previous sibling to determine type
      const parent = el.parentElement;
      if (parent?.tagName === 'OL') {
        isListItem = true;
        listType = 'ordered';
      } else if (parent?.tagName === 'UL') {
        isListItem = true;
        listType = 'unordered';
      } else {
        // Check previous sibling for Quill lists
        const prevSibling = el.previousElementSibling;
        if (prevSibling?.getAttribute('data-list') === 'ordered') {
          isListItem = true;
          listType = 'ordered';
        } else if (prevSibling?.getAttribute('data-list') === 'bullet') {
          isListItem = true;
          listType = 'unordered';
        } else {
          // Default to bullet if no clear indicator
          isListItem = true;
          listType = 'unordered';
        }
      }
    }

    // Handle list type changes
    if (listType !== currentListType) {
      if (listType === 'ordered') {
        orderedListCounter = 0; // Reset counter for new ordered list
      }
      currentListType = listType;
    }

    // If not a list item, reset counter
    if (!isListItem) {
      orderedListCounter = 0;
      currentListType = null;
    }

    // Process based on element type
    if (el.tagName === 'OL') {
      // CRITICAL: Check if children have data-list attributes that override
      const listItems = el.querySelectorAll(':scope > li');
      let counter = 1;
      listItems.forEach((li) => {
        const textSegments = extractTextSegments(li);
        if (textSegments.length === 0) return;

        // Check data-list attribute on the <li> element itself
        const liDataList = li.getAttribute('data-list');
        const actualListType = liDataList === 'bullet' ? 'unordered' : 
                               liDataList === 'ordered' ? 'ordered' : 'ordered';

        const styles = getListItemStyles(li, defaultFontSize);
        
        if (actualListType === 'ordered') {
          result.push({
            type: 'list',
            content: textSegments,
            styles,
            listType: 'ordered',
            listNumber: counter++,
          });
        } else {
          result.push({
            type: 'list',
            content: textSegments,
            styles,
            listType: 'unordered',
          });
        }
      });
    } else if (el.tagName === 'UL') {
      // CRITICAL: Check if children have data-list attributes that override
      const listItems = el.querySelectorAll(':scope > li');
      let counter = 1;
      listItems.forEach((li) => {
        const textSegments = extractTextSegments(li);
        if (textSegments.length === 0) return;

        // Check data-list attribute on the <li> element itself
        const liDataList = li.getAttribute('data-list');
        const actualListType = liDataList === 'ordered' ? 'ordered' : 
                               liDataList === 'bullet' ? 'unordered' : 'unordered';

        const styles = getListItemStyles(li, defaultFontSize);
        
        if (actualListType === 'ordered') {
          result.push({
            type: 'list',
            content: textSegments,
            styles,
            listType: 'ordered',
            listNumber: counter++,
          });
        } else {
          result.push({
            type: 'list',
            content: textSegments,
            styles,
            listType: 'unordered',
          });
        }
      });
    } else if (isListItem && listType) {
      // Handle Quill list items with data-list attribute
      const textSegments = extractTextSegments(el);
      if (textSegments.length > 0) {
        const styles = getListItemStyles(el, defaultFontSize);
        
        // CRITICAL: Check for size classes in child elements
        const sizeChild = el.querySelector('.ql-size-small, .ql-size-large, .ql-size-huge');
        if (sizeChild) {
          if (sizeChild.classList.contains('ql-size-small')) {
            styles.fontSize = defaultFontSize * 1.0;
          } else if (sizeChild.classList.contains('ql-size-large')) {
            styles.fontSize = defaultFontSize * 1.5;
          } else if (sizeChild.classList.contains('ql-size-huge')) {
            styles.fontSize = defaultFontSize * 2.5;
          }
        }
        
        if (listType === 'ordered') {
          orderedListCounter++;
          result.push({
            type: 'list',
            content: textSegments,
            styles,
            listType: 'ordered',
            listNumber: orderedListCounter,
          });
        } else {
          result.push({
            type: 'list',
            content: textSegments,
            styles,
            listType: 'unordered',
          });
        }
      }
    } else if (el.tagName === 'P') {
      // Handle paragraphs
      const textSegments = extractTextSegments(el);
      if (textSegments.length === 0) return;

      const styles = getParagraphStyles(el, defaultFontSize);
      
      // CRITICAL: Check for size classes in child elements
      const sizeChild = el.querySelector('.ql-size-small, .ql-size-large, .ql-size-huge');
      if (sizeChild) {
        if (sizeChild.classList.contains('ql-size-small')) {
          styles.fontSize = defaultFontSize * 0.85;
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
      // Handle headings
      const textSegments = extractTextSegments(el);
      if (textSegments.length === 0) return;

      const level = parseInt(el.tagName[1]);
      const styles = getHeadingStyles(el, defaultFontSize, level);
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

// Helper function to get paragraph styles
function getParagraphStyles(el: Element, defaultFontSize: number) {
  const styles: ParsedElement['styles'] = {
    fontSize: defaultFontSize,
    textAlign: 'left',
    fontWeight: 'normal',
    fontStyle: 'normal',
  };

  // Check alignment classes
  if (el.classList.contains('ql-align-center')) styles.textAlign = 'center';
  if (el.classList.contains('ql-align-right')) styles.textAlign = 'right';
  if (el.classList.contains('ql-align-justify')) styles.textAlign = 'justify';

  // Check font size classes - CRITICAL: Check classes first
  if (el.classList.contains('ql-size-small')) {
    styles.fontSize = defaultFontSize * 1.0;
  } else if (el.classList.contains('ql-size-large')) {
    styles.fontSize = defaultFontSize * 1.5;
  } else if (el.classList.contains('ql-size-huge')) {
    styles.fontSize = defaultFontSize * 2.5;
  }

  // Parse inline styles - This can override class-based sizes
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

// Helper function to get heading styles
function getHeadingStyles(el: Element, defaultFontSize: number, level: number) {
  const styles: ParsedElement['styles'] = {
    fontSize: defaultFontSize + (8 - level * 2),
    fontWeight: 'bold',
    textAlign: 'left',
  };

  // Check alignment
  if (el.classList.contains('ql-align-center')) styles.textAlign = 'center';
  if (el.classList.contains('ql-align-right')) styles.textAlign = 'right';
  if (el.classList.contains('ql-align-justify')) styles.textAlign = 'justify';

  // Parse inline styles
  const styleAttr = el.getAttribute('style');
  if (styleAttr) {
    const colorMatch = styleAttr.match(/color:\s*rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (colorMatch) {
      styles.color = `rgb(${colorMatch[1]}, ${colorMatch[2]}, ${colorMatch[3]})`;
    }
  }

  return styles;
}

// Helper function to get list item styles
function getListItemStyles(el: Element, defaultFontSize: number) {
  const styles: ParsedElement['styles'] = {
    fontSize: defaultFontSize,
    textAlign: 'left',
    fontWeight: 'normal',
    fontStyle: 'normal',
    marginLeft: 10,
  };

  // Check alignment
  if (el.classList.contains('ql-align-center')) styles.textAlign = 'center';
  if (el.classList.contains('ql-align-right')) styles.textAlign = 'right';
  if (el.classList.contains('ql-align-justify')) styles.textAlign = 'justify';

  // Check font size classes - CRITICAL: Check classes first
  if (el.classList.contains('ql-size-small')) {
    styles.fontSize = defaultFontSize * 1.0;
  } else if (el.classList.contains('ql-size-large')) {
    styles.fontSize = defaultFontSize * 1.5;
  } else if (el.classList.contains('ql-size-huge')) {
    styles.fontSize = defaultFontSize * 2.5;
  }

  // Parse inline styles - This can override class-based sizes
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

// Component to render parsed elements
export const renderParsedElements = (elements: ParsedElement[], defaultFontSize: number = 8) => {
  return elements.map((element, index) => {
    const baseStyle: any = {
      fontSize: element.styles.fontSize || defaultFontSize,
      marginTop: element.type === 'heading' ? 6 : 3,
      marginBottom: element.type === 'heading' ? 3 : 1,
      marginLeft: element.styles.marginLeft || 0,
    };

    // Add paragraph-level color if specified
    if (element.styles.color) {
      baseStyle.color = element.styles.color;
    }

    // Add paragraph-level background color if specified
    if (element.styles.backgroundColor && element.styles.backgroundColor !== 'transparent') {
      baseStyle.backgroundColor = element.styles.backgroundColor;
      baseStyle.paddingHorizontal = 4;
      baseStyle.paddingVertical = 2;
    }

    // Helper to render text segments
    const renderTextSegments = (segments: TextSegment[], baseFontSize: number) => {
      return segments.map((segment, segIndex) => {
        let fontFamily = 'Helvetica';
        
        if (element.styles.fontFamily) {
          const familyLower = element.styles.fontFamily.toLowerCase();
          if (familyLower.includes('serif') && !familyLower.includes('sans')) {
            fontFamily = 'Times-Roman';
          } else if (familyLower.includes('mono') || familyLower.includes('courier')) {
            fontFamily = 'Courier';
          }
        }
        
        // Apply bold and italic combinations
        if (segment.bold && segment.italic) {
          fontFamily = fontFamily === 'Times-Roman' ? 'Times-BoldItalic' : 
                       fontFamily === 'Courier' ? 'Courier-BoldOblique' : 'Helvetica-BoldOblique';
        } else if (segment.bold) {
          fontFamily = fontFamily === 'Times-Roman' ? 'Times-Bold' : 
                       fontFamily === 'Courier' ? 'Courier-Bold' : 'Helvetica-Bold';
        } else if (segment.italic) {
          fontFamily = fontFamily === 'Times-Roman' ? 'Times-Italic' : 
                       fontFamily === 'Courier' ? 'Courier-Oblique' : 'Helvetica-Oblique';
        }

        const segmentStyle: any = {
          fontFamily,
          fontSize: segment.fontSize || baseFontSize,
        };

        // Build text decoration
        const decorations = [];
        if (segment.underline) decorations.push('underline');
        if (segment.strikethrough) decorations.push('line-through');
        if (decorations.length > 0) {
          segmentStyle.textDecoration = decorations.join(' ');
        }

        // Add segment-level color
        if (segment.color) {
          segmentStyle.color = segment.color;
        }

        // Add segment-level background
        if (segment.backgroundColor && segment.backgroundColor !== 'transparent') {
          segmentStyle.backgroundColor = segment.backgroundColor;
          segmentStyle.paddingHorizontal = 2;
        }

        return (
          <Text key={segIndex} style={segmentStyle}>
            {segment.text}
          </Text>
        );
      });
    };

    if (element.type === 'paragraph' || element.type === 'heading') {
      return (
        <View key={index} style={{ 
          alignItems: element.styles.textAlign === 'center' ? 'center' : 
                      element.styles.textAlign === 'right' ? 'flex-end' : 'flex-start',
          width: '100%'
        }}>
          <Text style={baseStyle}>
            {Array.isArray(element.content) 
              ? renderTextSegments(element.content, element.styles.fontSize || defaultFontSize)
              : element.content}
          </Text>
        </View>
      );
    }

    if (element.type === 'list') {
      // CRITICAL FIX: Use correct prefix based on listType
      const prefix = element.listType === 'ordered' 
        ? `${element.listNumber || 1}. ` 
        : '•';

      return (
        <View key={index} style={{ 
          flexDirection: 'row', 
          marginTop: 2,
          width: '100%',
          paddingLeft: 0,
          justifyContent: element.styles.textAlign === 'center' ? 'center' : 
                          element.styles.textAlign === 'right' ? 'flex-end' : 'flex-start'
        }}>
          <Text style={{ ...baseStyle, marginLeft: 0, marginRight: 0 }}>{prefix}</Text>
          <Text style={{ ...baseStyle, flex: element.styles.textAlign === 'left' ? 1 : undefined, marginLeft: 0 }}>
            {Array.isArray(element.content) 
              ? renderTextSegments(element.content, element.styles.fontSize || defaultFontSize)
              : element.content}
          </Text>
        </View>
      );
    }

    return null;
  });
};