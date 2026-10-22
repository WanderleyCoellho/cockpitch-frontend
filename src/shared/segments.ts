export type WorkspaceSegment =
    | 'PHOTO_VIDEO'
    | 'EVENTS'
    | 'AGENCY'
    | 'CONSULTING'
    | 'HEALTH_BEAUTY'
    | 'CONSTRUCTION'
    | 'EDUCATION'
    | 'TECH'
    | 'GENERAL'

export const SEGMENTS: Array<{ id: WorkspaceSegment; label: string; example: string }> = [
    { id: 'PHOTO_VIDEO', label: 'Fotografia e vídeo', example: 'casamentos, ensaios, filmagens' },
    { id: 'EVENTS', label: 'Eventos', example: 'buffet, decoração, cerimonial, DJ' },
    { id: 'AGENCY', label: 'Agência e marketing', example: 'social media, design, tráfego' },
    { id: 'CONSULTING', label: 'Consultoria e serviços profissionais', example: 'jurídico, contábil, RH' },
    { id: 'HEALTH_BEAUTY', label: 'Saúde e beleza', example: 'clínicas, estética, salões' },
    { id: 'CONSTRUCTION', label: 'Obras e reformas', example: 'arquitetura, marcenaria, instalações' },
    { id: 'EDUCATION', label: 'Educação e treinamentos', example: 'cursos, mentorias, palestras' },
    { id: 'TECH', label: 'Tecnologia', example: 'software, sites, suporte de TI' },
    { id: 'GENERAL', label: 'Outro', example: 'qualquer outro tipo de serviço' },
]

export function segmentLabel(id?: string | null) {
    return SEGMENTS.find((segment) => segment.id === id)?.label ?? 'Outro'
}
