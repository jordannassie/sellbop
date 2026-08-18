'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeSanitize from 'rehype-sanitize'
import { cn } from '@/lib/utils'
import type { Components } from 'react-markdown'

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h2 className="text-xl font-bold text-black mt-6 mb-2 first:mt-0">{children}</h2>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-bold text-black mt-5 mb-2 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold text-black mt-4 mb-1.5 first:mt-0">{children}</h3>
  ),
  p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1.5">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed pl-0.5">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-black underline underline-offset-2 hover:text-neutral-600 transition-colors"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold text-neutral-900">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
}

interface ProductDescriptionMarkdownProps {
  content: string
  className?: string
}

export function ProductDescriptionMarkdown({ content, className }: ProductDescriptionMarkdownProps) {
  return (
    <div className={cn('text-neutral-600 text-[15px]', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeSanitize]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
