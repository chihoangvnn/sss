'use client'

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  className?: string;
}

export function CodeBlock({ 
  code, 
  language = 'text', 
  title, 
  showLineNumbers = true,
  highlightLines = [],
  className = ''
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const lines = code.split('\n');

  // Simple syntax highlighting for common languages
  const highlightSyntax = (line: string, lang: string): string => {
    if (!lang || lang === 'text') return line;

    let highlighted = line;

    // JavaScript/TypeScript highlighting
    if (['javascript', 'js', 'typescript', 'ts', 'jsx', 'tsx'].includes(lang)) {
      // Keywords
      highlighted = highlighted.replace(
        /\b(const|let|var|function|return|if|else|for|while|import|export|from|class|extends|interface|type)\b/g,
        '<span class="text-purple-600 font-semibold">$1</span>'
      );
      // Strings
      highlighted = highlighted.replace(
        /(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g,
        '<span class="text-green-600">$1$2$1</span>'
      );
      // Comments
      highlighted = highlighted.replace(
        /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
        '<span class="text-gray-500 italic">$1</span>'
      );
      // Numbers
      highlighted = highlighted.replace(
        /\b(\d+\.?\d*)\b/g,
        '<span class="text-blue-600">$1</span>'
      );
    }

    // CSS highlighting
    if (['css', 'scss', 'sass'].includes(lang)) {
      // Properties
      highlighted = highlighted.replace(
        /([a-zA-Z-]+)(\s*:)/g,
        '<span class="text-blue-600">$1</span>$2'
      );
      // Values
      highlighted = highlighted.replace(
        /(:\s*)([^;{]+)/g,
        '$1<span class="text-green-600">$2</span>'
      );
      // Selectors
      highlighted = highlighted.replace(
        /([.#]?[a-zA-Z][a-zA-Z0-9-]*)\s*{/g,
        '<span class="text-purple-600 font-semibold">$1</span> {'
      );
    }

    // HTML highlighting
    if (['html', 'xml'].includes(lang)) {
      // Tags
      highlighted = highlighted.replace(
        /(&lt;\/?)([a-zA-Z][a-zA-Z0-9]*)(.*?)(&gt;)/g,
        '$1<span class="text-blue-600 font-semibold">$2</span>$3$4'
      );
      // Attributes
      highlighted = highlighted.replace(
        /([a-zA-Z-]+)(=)(["'])(.*?)\3/g,
        '<span class="text-green-600">$1</span>$2<span class="text-orange-600">$3$4$3</span>'
      );
    }

    // JSON highlighting
    if (lang === 'json') {
      // Keys
      highlighted = highlighted.replace(
        /"([^"]+)"(\s*:)/g,
        '<span class="text-blue-600">"$1"</span>$2'
      );
      // String values
      highlighted = highlighted.replace(
        /(:\s*)"([^"]*)"(?=\s*[,}])/g,
        '$1<span class="text-green-600">"$2"</span>'
      );
      // Numbers and booleans
      highlighted = highlighted.replace(
        /(:\s*)(true|false|\d+\.?\d*)(?=\s*[,}])/g,
        '$1<span class="text-purple-600">$2</span>'
      );
    }

    return highlighted;
  };

  const getLanguageLabel = (lang: string): string => {
    const languageMap: { [key: string]: string } = {
      'js': 'JavaScript',
      'javascript': 'JavaScript',
      'ts': 'TypeScript',
      'typescript': 'TypeScript',
      'jsx': 'React JSX',
      'tsx': 'React TSX',
      'css': 'CSS',
      'scss': 'SCSS',
      'sass': 'Sass',
      'html': 'HTML',
      'xml': 'XML',
      'json': 'JSON',
      'python': 'Python',
      'py': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'php': 'PHP',
      'ruby': 'Ruby',
      'go': 'Go',
      'rust': 'Rust',
      'swift': 'Swift',
      'kotlin': 'Kotlin',
      'bash': 'Bash',
      'shell': 'Shell',
      'sql': 'SQL',
      'yaml': 'YAML',
      'yml': 'YAML',
      'markdown': 'Markdown',
      'md': 'Markdown'
    };

    return languageMap[lang.toLowerCase()] || lang.toUpperCase();
  };

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      {(title || language) && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-3">
            {title && (
              <span className="text-sm font-medium text-gray-300">{title}</span>
            )}
            {language && (
              <span className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded">
                {getLanguageLabel(language)}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200 hover:bg-gray-700"
          >
            {copied ? (
              <Check className="w-3 h-3" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </Button>
        </div>
      )}

      {/* Code Content */}
      <div className="relative">
        {/* Copy button (when no header) */}
        {!title && !language && (
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="absolute top-2 right-2 h-6 w-6 p-0 text-gray-400 hover:text-gray-200 hover:bg-gray-800 z-10"
          >
            {copied ? (
              <Check className="w-3 h-3" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </Button>
        )}

        <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
          <code className="text-gray-300 font-mono">
            {lines.map((line, index) => {
              const lineNumber = index + 1;
              const isHighlighted = highlightLines.includes(lineNumber);
              
              return (
                <div
                  key={index}
                  className={`flex ${isHighlighted ? 'bg-yellow-900/30 border-l-2 border-yellow-500' : ''}`}
                >
                  {showLineNumbers && (
                    <span className="text-gray-500 text-xs mr-4 select-none w-8 text-right flex-shrink-0">
                      {lineNumber}
                    </span>
                  )}
                  <span
                    className="flex-1"
                    dangerouslySetInnerHTML={{
                      __html: highlightSyntax(
                        line.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
                        language
                      ) || '&nbsp;'
                    }}
                  />
                </div>
              );
            })}
          </code>
        </pre>
      </div>

      {/* Scrollbar styling for mobile */}
      <style jsx>{`
        pre::-webkit-scrollbar {
          height: 8px;
        }
        pre::-webkit-scrollbar-track {
          background: rgba(107, 114, 128, 0.1);
        }
        pre::-webkit-scrollbar-thumb {
          background: rgba(107, 114, 128, 0.3);
          border-radius: 4px;
        }
        pre::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 0.5);
        }
      `}</style>
    </div>
  );
}