import { CKEditor } from '@ckeditor/ckeditor5-react';
// @ts-ignore
import DecoupledEditor from '@ckeditor/ckeditor5-build-decoupled-document';
import { useState, useRef } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (data: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  minHeight?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  label,
  placeholder,
  error,
  disabled = false,
  minHeight = '200px',
}: RichTextEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const editorRef = useRef<any>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const handleReady = (editor: any) => {
    editorRef.current = editor;
    
    // Extract and render toolbar manually
    if (toolbarRef.current && editor.ui.view.toolbar) {
      toolbarRef.current.appendChild(editor.ui.view.toolbar.element);
    }
    
    // Set editable height
    const editableElement = editor.ui.view.editable?.element;
    if (editableElement) {
      editableElement.style.minHeight = minHeight;
    }
    
    setIsReady(true);
  };

  const handleChange = (_event: any, editor: any) => {
    const data = editor.getData();
    onChange(data);
  };

  const borderColor = error
    ? 'border-red-500'
    : isFocused
    ? 'border-primary-500 shadow-[0_0_0_3px_rgba(14,165,233,0.15)]'
    : 'border-gray-300';

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-medium text-gray-700">
          {label}
        </label>
      )}

      <div
        className={`ckeditor-wrapper rounded-xl overflow-hidden transition-all duration-200 ${
          disabled ? 'bg-gray-50 cursor-not-allowed opacity-75' : 'bg-white'
        } ${borderColor}`}
      >
        {/* Toolbar Container - CKEditor will inject toolbar here */}
        <div
          ref={toolbarRef}
          className="ck-toolbar-container bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200"
        />
        
        {/* Editor Content Area */}
        <div className="ck-content-area" style={{ minHeight }}>
          {!isReady && !disabled && (
            <div className="animate-pulse p-4">
              <div className="flex gap-1 mb-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-8 w-8 bg-gray-200 rounded" />
                ))}
              </div>
              <div className="h-24 bg-gray-100 rounded" />
            </div>
          )}
          <CKEditor
            editor={DecoupledEditor as any}
            data={value || ''}
            onReady={handleReady}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            config={{
              placeholder: placeholder || 'Enter text here...',
              toolbar: [
                {
                  label: 'Document',
                  items: ['Source'],
                },
                {
                  label: 'Basic Formatting',
                  items: ['Bold', 'Italic', 'Underline', 'Strike'],
                },
                {
                  label: 'Lists',
                  items: ['BulletedList', 'NumberedList', 'TodoList'],
                },
                {
                  label: 'Alignment',
                  items: ['Alignment:left', 'Alignment:center', 'Alignment:right', 'Alignment:justify'],
                },
                {
                  label: 'Insert',
                  items: ['Link', 'Image', 'insertTable', 'Blockquote', 'MediaEmbed'],
                },
                {
                  label: 'Formatting',
                  items: ['Heading', 'FontSize', 'FontColor', 'FontFamily'],
                },
                {
                  label: 'Extras',
                  items: ['Highlight', 'SpecialCharacters', 'HorizontalLine', 'RemoveFormat'],
                },
                '|',
                'Undo',
                'Redo',
              ],
              heading: {
                options: [
                  { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
                  { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_h1' },
                  { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_h2' },
                  { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_h3' },
                  { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_h4' },
                ],
              },
              table: {
                contentToolbar: [
                  'tableColumn',
                  'tableRow',
                  'mergeTableCells',
                  'tableProperties',
                  'tableCellProperties',
                ],
              },
              alignment: {
                options: ['left', 'center', 'right', 'justify'],
              },
              link: {
                addTargetToExternalLinks: true,
              },
              fontSize: {
                options: [9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48],
                supportAllValues: true,
              },
              fontFamily: {
                options: [
                  'default',
                  'Arial, Helvetica, sans-serif',
                  'Courier New, Courier, monospace',
                  'Georgia, serif',
                  'Times New Roman, Times, serif',
                  'Verdana, Geneva, sans-serif',
                ],
              },
            }}
          />
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      <style>{`
        .ckeditor-wrapper .ck-editor {
          width: 100%;
        }
        
        .ckeditor-wrapper .ck-toolbar-container .ck-toolbar {
          border: none !important;
          border-radius: 0 !important;
          background: transparent !important;
          padding: 8px 12px !important;
          display: flex !important;
          flex-wrap: wrap !important;
          gap: 4px !important;
          position: relative !important;
        }
        
        .ckeditor-wrapper .ck-toolbar-container .ck-toolbar__items {
          display: flex !important;
          flex-wrap: wrap !important;
          gap: 2px !important;
          align-items: center !important;
          flex-grow: 1 !important;
        }
        
        .ckeditor-wrapper .ck-toolbar-container .ck-button {
          border-radius: 6px !important;
          transition: all 0.15s ease !important;
          padding: 6px 8px !important;
          border: none !important;
          background: transparent !important;
        }
        
        .ckeditor-wrapper .ck-toolbar-container .ck-button:hover {
          background-color: rgba(14, 165, 233, 0.1) !important;
        }
        
        .ckeditor-wrapper .ck-toolbar-container .ck-button.ck-on {
          background-color: rgba(14, 165, 233, 0.2) !important;
          color: #0ea5e9 !important;
        }
        
        .ckeditor-wrapper .ck-toolbar-container .ck-button:focus {
          box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.3) !important;
        }
        
        .ckeditor-wrapper .ck-toolbar-container .ck-toolbar__separator {
          margin: 0 4px !important;
          background: #d1d5db !important;
        }
        
        .ckeditor-wrapper .ck-toolbar-container .ck-dropdown__panel {
          border-radius: 8px !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
        }
        
        .ckeditor-wrapper .ck-toolbar-container .ck-list {
          border-radius: 8px !important;
        }
        
        .ckeditor-wrapper .ck-content-area {
          background: white;
          border-radius: 0 0 10px 10px;
          position: relative;
        }
        
        .ckeditor-wrapper .ck-content-area .ck-editor {
          position: static !important;
        }
        
        .ckeditor-wrapper .ck-content-area .ck-editor__editable {
          border: none !important;
          border-radius: 0 0 10px 10px !important;
          padding: 16px !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          font-size: 14px !important;
          line-height: 1.6 !important;
          color: #374151 !important;
          box-shadow: none !important;
          position: static !important;
          transform: none !important;
        }
        
        .ckeditor-wrapper .ck-content-area .ck-editor__editable:focus {
          outline: none !important;
          box-shadow: none !important;
        }
        
        .ckeditor-wrapper .ck-content-area .ck-content {
          border: none !important;
          padding: 0 !important;
          min-height: ${minHeight};
        }
        
        .ckeditor-wrapper .ck-content p {
          margin-bottom: 0.75em;
        }
        
        .ckeditor-wrapper .ck-content h1,
        .ckeditor-wrapper .ck-content h2,
        .ckeditor-wrapper .ck-content h3,
        .ckeditor-wrapper .ck-content h4 {
          margin-top: 1em;
          margin-bottom: 0.5em;
          font-weight: 600;
          color: #111827;
        }
        
        .ckeditor-wrapper .ck-content h1 { font-size: 1.75em; }
        .ckeditor-wrapper .ck-content h2 { font-size: 1.5em; }
        .ckeditor-wrapper .ck-content h3 { font-size: 1.25em; }
        .ckeditor-wrapper .ck-content h4 { font-size: 1.1em; }
        
        .ckeditor-wrapper .ck-content ul,
        .ckeditor-wrapper .ck-content ol {
          margin-left: 1.5em;
          margin-bottom: 0.75em;
        }
        
        .ckeditor-wrapper .ck-content li {
          margin-bottom: 0.25em;
        }
        
        .ckeditor-wrapper .ck-content blockquote {
          border-left: 4px solid #0ea5e9;
          padding-left: 1em;
          margin: 1em 0;
          font-style: italic;
          color: #6b7280;
          background: #f9fafb;
          padding: 12px 16px;
          border-radius: 0 8px 8px 0;
        }
        
        .ckeditor-wrapper .ck-content code {
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
        }
        
        .ckeditor-wrapper .ck-content pre {
          background: #1f2937;
          color: #f9fafb;
          padding: 16px;
          border-radius: 8px;
          overflow-x: auto;
        }
        
        .ckeditor-wrapper .ck-content pre code {
          background: transparent;
          padding: 0;
          color: inherit;
        }
        
        .ckeditor-wrapper .ck-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
        }
        
        .ckeditor-wrapper .ck-content table td,
        .ckeditor-wrapper .ck-content table th {
          border: 1px solid #e5e7eb;
          padding: 8px 12px;
        }
        
        .ckeditor-wrapper .ck-content table th {
          background: #f9fafb;
          font-weight: 600;
        }
        
        .ckeditor-wrapper .ck-content a {
          color: #0ea5e9;
          text-decoration: underline;
        }
        
        .ckeditor-wrapper .ck-content img {
          max-width: 100%;
          border-radius: 8px;
          margin: 0.5em 0;
        }
        
        .ckeditor-wrapper .ck-content mark {
          background: #fef08a;
          padding: 2px 4px;
          border-radius: 2px;
        }
        
        .ckeditor-wrapper .ck-content hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 1.5em 0;
        }
        
        .ckeditor-wrapper .ck-placeholder::before {
          color: #9ca3af;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
