import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface RichTextContextType {
  activeNoteId: string | null;
  setActiveNoteId: (id: string | null) => void;
  applyFormat: (type: 'bold' | 'italic' | 'underline' | 'color' | 'highlight', value?: string) => void;
  insertText: (text: string) => void;
  registerInput: (ref: HTMLInputElement | HTMLTextAreaElement | null, onUpdate: (content: string) => void) => void;
}

const RichTextContext = createContext<RichTextContextType | undefined>(undefined);

export const RichTextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const updateCallbackRef = useRef<((content: string) => void) | null>(null);

  const registerInput = useCallback((ref: HTMLInputElement | HTMLTextAreaElement | null, onUpdate: (content: string) => void) => {
    inputRef.current = ref;
    updateCallbackRef.current = onUpdate;
  }, []);

  const insertText = useCallback((insertedText: string) => {
    if (!inputRef.current || !updateCallbackRef.current) return;

    const input = inputRef.current;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const text = input.value;

    const updatedContent = text.substring(0, start) + insertedText + text.substring(end);
    updateCallbackRef.current(updatedContent);

    setTimeout(() => {
      input.focus();
      const newPos = start + insertedText.length;
      input.setSelectionRange(newPos, newPos);
    }, 0);
  }, []);

  const applyFormat = useCallback((type: 'bold' | 'italic' | 'underline' | 'color' | 'highlight', value?: string) => {
    if (!inputRef.current || !updateCallbackRef.current) return;

    const input = inputRef.current;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const text = input.value;
    const selectedText = text.substring(start, end);

    let prefix = '';
    let suffix = '';

    switch (type) {
      case 'bold':
        prefix = '**';
        suffix = '**';
        break;
      case 'italic':
        prefix = '*';
        suffix = '*';
        break;
      case 'underline':
        prefix = '__';
        suffix = '__';
        break;
      case 'color':
        prefix = `<span style="color: ${value}">`;
        suffix = '</span>';
        break;
      case 'highlight':
        prefix = `<mark style="background-color: ${value}">`;
        suffix = '</mark>';
        break;
    }

    const newText = `${prefix}${selectedText}${suffix}`;
    const updatedContent = text.substring(0, start) + newText + text.substring(end);
    
    updateCallbackRef.current(updatedContent);

    setTimeout(() => {
      input.focus();
      const cursorOffset = prefix.length;
      input.setSelectionRange(start + cursorOffset, end + cursorOffset);
    }, 0);
  }, []);

  return (
    <RichTextContext.Provider value={{ activeNoteId, setActiveNoteId, applyFormat, insertText, registerInput }}>
      {children}
    </RichTextContext.Provider>
  );
};

export const useRichText = () => {
  const context = useContext(RichTextContext);
  if (!context) throw new Error('useRichText must be used within a RichTextProvider');
  return context;
};
