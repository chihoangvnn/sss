import { useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  height?: string;
  id?: string;
  'data-testid'?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Nhập nội dung...",
  className = "",
  disabled = false,
  readOnly = false,
  height = "120px",
  id,
  'data-testid': dataTestId
}: RichTextEditorProps) {
  const quillRef = useRef<ReactQuill>(null);

  // Toolbar configuration for rich text editing
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link'],
      ['clean']
    ]
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'link'
  ];

  // Focus method for external access
  const focus = () => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      editor.focus();
    }
  };

  // Apply custom styling to match design system
  useEffect(() => {
    const quillContainer = document.querySelector('.ql-container');
    const quillToolbar = document.querySelector('.ql-toolbar');
    
    if (quillContainer) {
      (quillContainer as HTMLElement).style.borderColor = 'hsl(var(--border))';
      (quillContainer as HTMLElement).style.borderRadius = '0 0 6px 6px';
      (quillContainer as HTMLElement).style.minHeight = height;
    }
    
    if (quillToolbar) {
      (quillToolbar as HTMLElement).style.borderColor = 'hsl(var(--border))';
      (quillToolbar as HTMLElement).style.borderRadius = '6px 6px 0 0';
      (quillToolbar as HTMLElement).style.backgroundColor = 'hsl(var(--muted))';
    }
  }, [height]);

  return (
    <div className={`rich-text-editor ${className}`}>
      {/* @ts-ignore - ReactQuill TypeScript compatibility issue */}
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly || disabled}
        modules={modules}
        formats={formats}
        id={id}
        data-testid={dataTestId}
        style={{
          backgroundColor: disabled ? 'hsl(var(--muted))' : 'white',
          opacity: disabled ? 0.5 : 1,
        }}
      />
      
    </div>
  );
}

// Export focus function for external use
export type RichTextEditorRef = {
  focus: () => void;
};