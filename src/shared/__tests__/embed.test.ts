import { describe, expect, it } from 'vitest'
import { getEmbedUrl } from '../../interface/components/proposal/public/media'

describe('vídeos incorporados sem rastreamento', () => {
    it('YouTube em qualquer formato vai para youtube-nocookie', () => {
        for (const url of ['https://www.youtube.com/watch?v=abc123', 'https://youtu.be/abc123', 'https://youtube.com/shorts/abc123', 'https://www.youtube.com/embed/abc123?autoplay=1']) {
            expect(getEmbedUrl(url)).toBe('https://www.youtube-nocookie.com/embed/abc123')
        }
    })

    it('Vimeo com "do not track"; outros links não viram iframe', () => {
        expect(getEmbedUrl('https://vimeo.com/123456')).toBe('https://player.vimeo.com/video/123456?dnt=1')
        expect(getEmbedUrl('https://exemplo.com/video')).toBeNull()
        expect(getEmbedUrl('javascript:alert(1)')).toBeNull()
    })
})
