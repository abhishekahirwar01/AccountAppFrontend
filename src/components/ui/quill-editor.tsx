"use client";

import React, { useEffect, useRef } from "react";
import { useQuill } from "react-quilljs";
import "quill/dist/quill.snow.css";

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const QuillEditor: React.FC<QuillEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter your notes here...",
  className = ""
}) => {
  const { quill, quillRef } = useQuill({
    modules: {
      toolbar: {
        container: [
          [{ 'header': [1, 2, 3, false] }],
          [{ 'font': [] }, { 'size': ['small', 'normal', 'large', 'huge'] }],
          ["bold", "italic", "underline", "strike"],
          // [{ color: [] }, { background: [] }],
          [{ 'align': [] }],
          [{ list: "ordered" }, { list: "bullet" }],
          ["clean"],
        ],
      },
    },
    placeholder,
    theme: "snow",
  });

  const isMounted = useRef(false);

  useEffect(() => {
    if (quill && !isMounted.current) {
      // Set initial content
      if (value) {
        quill.clipboard.dangerouslyPasteHTML(value);
      }
      isMounted.current = true;
    }
  }, [quill, value]);

  useEffect(() => {
    if (quill) {
      // Listen for text changes
      const handleTextChange = () => {
        const htmlContent = quill.root.innerHTML;
        if (htmlContent !== value) {
          onChange(htmlContent);
        }
      };

      quill.on("text-change", handleTextChange);

      // Cleanup
      return () => {
        quill.off("text-change", handleTextChange);
      };
    }
  }, [quill, onChange, value]);

  return (
    <div className={`quill-editor ${className}`}>
      <div ref={quillRef} />
      <style jsx>{`
        .quill-editor .ql-toolbar {
          border-top: 1px solid #ccc;
          border-left: 1px solid #ccc;
          border-right: 1px solid #ccc;
          border-bottom: none;
          border-radius: 4px 4px 0 0;
        }
        .quill-editor .ql-container {
          border: 1px solid #ccc;
          border-radius: 0 0 4px 4px;
          min-height: 120px;
        }
        .quill-editor .ql-editor {
          min-height: 120px;
          padding: 12px 15px;
        }
        .quill-editor .ql-editor.ql-blank::before {
          color: #999;
          font-style: normal;
        }
      `}</style>
    </div>
  );
};

export default QuillEditor;

