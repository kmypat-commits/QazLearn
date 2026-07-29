import { useRef, useEffect, useCallback } from 'react';

interface ParagraphAnswerInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ParagraphAnswerInput({
  value,
  onChange,
  disabled = false,
  placeholder = 'Введите свой перевод...',
}: ParagraphAnswerInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 120), 400)}px`;
    }
  }, []);

  useEffect(() => {
    autoResize();
  }, [value, autoResize]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      disabled={disabled}
      placeholder={placeholder}
      rows={4}
      className="w-full min-h-[120px] max-h-[400px] p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-base font-mono leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      dir="auto"
    />
  );
}
