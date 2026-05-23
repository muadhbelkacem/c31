'use client';
import parse from 'html-react-parser';
import DOMPurify from 'dompurify';

interface FormattedDescriptionProps {
  content: string;
  className?: string;
}

// Decode HTML entities like &lt;ul&gt; → <ul>
function decodeHtmlEntities(encoded: string): string {
  if (typeof window === 'undefined') return encoded;

  const textarea = document.createElement('textarea');
  textarea.innerHTML = encoded;
  return textarea.value;
}

export default function FormattedDescription({ content, className = '' }: FormattedDescriptionProps) {
  if (!content) return null;

  const processContent = (text: string): string => {
    // 1. First decode HTML entities
    let processed = decodeHtmlEntities(text);

    // Debug: Check what we're working with
    console.log('Processing content:', {
      originalLength: text.length,
      hasHTML: /<[^>]*>/.test(processed),
      hasEntities: /&[a-z]+;/.test(text),
      decodedHasHTML: /<[^>]*>/.test(processed),
      preview: processed.substring(0, 100) + '...'
    });

    // If content contains HTML tags after decoding
    if (/<[^>]*>/.test(processed)) {
      // Clean up common HTML formatting issues
      processed = processed
        .replace(/\n/g, '<br />')
        .replace(/<br>\s*<br>/g, '<br /><br />')
        .replace(/<ul>\s*<br>/g, '<ul>')
        .replace(/<br>\s*<\/ul>/g, '</ul>')
        .replace(/<li>\s*<br>/g, '<li>')
        .replace(/<br>\s*<\/li>/g, '</li>')
        .replace(/<strong>\s*<br>/g, '<strong>')
        .replace(/<br>\s*<\/strong>/g, '</strong>');
    } else {
      // Content is plain text - convert newlines and basic markdown
      processed = processed
        .replace(/\n/g, '<br />')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }

    // Sanitize the final HTML
    return DOMPurify.sanitize(processed, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'a'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id', 'style']
    });
  };

  const processedContent = processContent(content);
  
  console.log('Final processed content:', {
    length: processedContent.length,
    preview: processedContent.substring(0, 200) + '...',
    hasLists: /<ul>|<ol>/.test(processedContent),
    hasBold: /<strong>|<b>/.test(processedContent)
  });

  return (
    <div className={className}>
      {parse(processedContent)}
    </div>
  );
}