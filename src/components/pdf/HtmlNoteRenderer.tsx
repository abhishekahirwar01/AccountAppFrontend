
import React from 'react';
import { Text } from "@react-pdf/renderer";
import HTML from "react-pdf-html"; 

interface HtmlNoteRendererProps {
  notes: string | null | undefined;
}

const HtmlNoteRenderer: React.FC<HtmlNoteRendererProps> = ({ notes }) => {
  if (!notes || notes.trim() === '') {
    return (
      <Text style={{ textAlign: "left", marginTop: 2, fontSize: 8 }}>
        No terms and conditions specified
      </Text>
    );
  }

  
  const htmlStylesheet = {
 
    p: { margin: 0, padding: 0, fontSize: 8, marginTop: 4 },
    
    
    h1: { fontSize: 10, margin: 0, marginTop: 4, marginBottom: 2, fontWeight: 'bold' as any }, 
    h2: { fontSize: 9, margin: 0, marginTop: 4, marginBottom: 2, fontWeight: 'bold' as any }, 
    h3: { fontSize: 8.5, margin: 0, marginTop: 4, marginBottom: 2, fontWeight: 'bold' as any }, 
    

    li: { fontSize: 8, marginLeft: 10, marginTop: 2 },
    ul: { margin: 0, padding: 0 },
    ol: { margin: 0, padding: 0 },

  
    strong: { fontWeight: 'bold' as any },
    em: { fontStyle: 'italic' as any },
  };

  return (
    <HTML stylesheet={htmlStylesheet}>
      {notes}
    </HTML>
  );
};

export default HtmlNoteRenderer;