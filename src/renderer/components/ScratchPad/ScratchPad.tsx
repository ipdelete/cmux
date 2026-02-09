import * as React from 'react';
import { useEffect, useRef } from 'react';
import { Icon } from '../Icon';

interface ScratchPadProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  onChange: (content: string) => void;
}

export function ScratchPad({ isOpen, onClose, content, onChange }: ScratchPadProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <div className={`scratch-pad ${isOpen ? 'scratch-pad--open' : ''}`}>
      <div className="scratch-pad__header">
        <span className="scratch-pad__title">Scratch Pad</span>
        <button className="scratch-pad__close" onClick={onClose}>
          <Icon name="close" size="sm" />
        </button>
      </div>
      <textarea
        ref={textareaRef}
        className="scratch-pad__textarea"
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Jot down notes for this agent..."
        spellCheck={false}
      />
    </div>
  );
}
