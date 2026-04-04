interface HtmlRendererProps {
  content: string | string[] | null | undefined;
  className?: string;
}

function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

export default function HtmlRenderer({ content, className = "" }: HtmlRendererProps) {
  if (!content) return null;

  if (typeof content !== "string") {
    return null;
  }

  const decoded = decodeHtmlEntities(content);

  if (!decoded.trim()) {
    return null;
  }

  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(decoded);

  if (hasHtmlTags) {
    const listStyles = `
      .html-renderer ul { list-style-type: disc !important; padding-left: 1.5rem !important; margin: 0.5rem 0 !important; }
      .html-renderer ol { list-style-type: decimal !important; padding-left: 1.5rem !important; margin: 0.5rem 0 !important; }
      .html-renderer li { margin-bottom: 0.25rem !important; }
      .html-renderer p { margin: 0.5rem 0 !important; }
    `;
    return (
      <div 
        className={`text-sm text-gray-700 leading-relaxed ${className}`}
      >
        <style>{listStyles}</style>
        <div className="html-renderer" dangerouslySetInnerHTML={{ __html: decoded }} />
      </div>
    );
  }

  const lines = decoded.split("\n").filter(Boolean);
  if (lines.length > 0) {
    return (
      <ol className={`list-decimal list-inside space-y-1 ${className}`}>
        {lines.map((line, index) => (
          <li key={index} className="text-sm text-gray-700 leading-relaxed">
            {line}
          </li>
        ))}
      </ol>
    );
  }

  return null;
}
