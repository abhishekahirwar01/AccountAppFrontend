// hooks/useFormFocus.ts
import { useEffect, useRef } from 'react';
import { FieldErrors } from 'react-hook-form';

export const useFormFocus = (errors: FieldErrors) => {
  const fieldRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      // Find the first field with an error
      const firstErrorField = Object.keys(errors)[0];
      const fieldElement = fieldRefs.current[firstErrorField];
      
      if (fieldElement) {
        // Scroll to and focus the field
        fieldElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        fieldElement.focus({ preventScroll: true });
      }
    }
  }, [errors]);

  const registerField = (fieldName: string, element: HTMLElement | null) => {
    fieldRefs.current[fieldName] = element;
  };

  return { registerField };
};