import DOMPurify from 'dompurify'

const ALLOWED_TAGS = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'blockquote', 'a', 'span']

/**
 * Sanitiza HTML vindo de usuário antes de renderizar com dangerouslySetInnerHTML.
 * O backend também sanitiza na escrita; esta é a segunda camada (dados legados, outros clientes).
 */
export function sanitizeHtml(html: string | null | undefined): string {
    if (!html) return ''
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS,
        ALLOWED_ATTR: ['href', 'target', 'rel'],
        ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:)/i,
    })
}

// Links externos sempre abrem em nova aba sem dar acesso ao window.opener.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
        node.setAttribute('target', '_blank')
        node.setAttribute('rel', 'noopener noreferrer nofollow')
    }
})
