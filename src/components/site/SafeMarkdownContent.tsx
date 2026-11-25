import React from 'react'
import Link from 'next/link'
import { parseSafeMarkdown, type MarkdownInline } from '@/lib/blog-posts'

interface SafeMarkdownContentProps {
  content: string
}

function renderInlines(inlines: MarkdownInline[], keyPrefix: string) {
  return inlines.map((token, idx) => {
    const key = `${keyPrefix}-${idx}`
    if (token.type === 'strong') {
      return <strong key={key}>{token.value}</strong>
    }
    if (token.type === 'em') {
      return <em key={key}>{token.value}</em>
    }
    if (token.type === 'link') {
      const contentNode = token.strong ? <strong>{token.label}</strong> : token.label
      if (token.href.startsWith('/')) {
        return (
          <Link key={key} href={token.href} className="ii-md-link">
            {contentNode}
          </Link>
        )
      }
      return (
        <a
          key={key}
          href={token.href}
          target="_blank"
          rel="noopener noreferrer"
          className="ii-md-link"
        >
          {contentNode}
        </a>
      )
    }
    return <React.Fragment key={key}>{token.value}</React.Fragment>
  })
}

export default function SafeMarkdownContent({ content }: SafeMarkdownContentProps) {
  const blocks = parseSafeMarkdown(content)

  if (blocks.length === 0) return null

  return (
    <div className="ii-md">
      {blocks.map((block, idx) => {
        const key = `blk-${idx}`
        if (block.type === 'h2') {
          return <h2 key={key}>{renderInlines(block.inlines, key)}</h2>
        }
        if (block.type === 'h3') {
          return <h3 key={key}>{renderInlines(block.inlines, key)}</h3>
        }
        if (block.type === 'blockquote') {
          return (
            <blockquote key={key} className="cit">
              {renderInlines(block.inlines, key)}
            </blockquote>
          )
        }
        if (block.type === 'ul') {
          return (
            <ul key={key} className="ir-lista">
              {block.items.map((item, itemIdx) => (
                <li key={`${key}-li-${itemIdx}`}>
                  <span>{renderInlines(item, `${key}-li-${itemIdx}`)}</span>
                </li>
              ))}
            </ul>
          )
        }
        return <p key={key}>{renderInlines(block.inlines, key)}</p>
      })}
    </div>
  )
}
