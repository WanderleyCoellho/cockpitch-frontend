/**
 * Catálogo único de textos de ajuda (spec in-app-guidance).
 * Os campos usam `helpKey`; a mesma fonte alimenta as dicas na tela e a futura central de ajuda (/ajuda).
 */
export type HelpEntry = {
    title: string
    /** Até ~240 caracteres: o que é, para que serve e um exemplo. */
    body: string
    area: 'Conta' | 'Equipe' | 'Planos' | 'Propostas' | 'Pacotes'
}

export const HELP: Record<string, HelpEntry> = {
    'register.workspaceName': {
        area: 'Conta',
        title: 'Nome da empresa',
        body: 'Como seu negócio aparece para os clientes nas propostas. Pode ser seu nome profissional se você trabalha sozinho. Ex.: "Estúdio Luz" ou "Ana Souza Arquitetura". Dá para mudar depois.',
    },
    'register.segment': {
        area: 'Conta',
        title: 'Segmento',
        body: 'O tipo de serviço que você vende. Usamos isso para sugerir modelos de proposta e textos prontos para o seu ramo. Não limita nada: você pode vender qualquer serviço.',
    },
    'team.role': {
        area: 'Equipe',
        title: 'Papéis da equipe',
        body: 'Dono: assina o plano e controla tudo. Admin: edita perfil, pacotes e equipe. Membro: cria e edita propostas usando os pacotes da empresa.',
    },
    'team.invite': {
        area: 'Equipe',
        title: 'Convidar pessoas',
        body: 'Gera um link de convite válido por 7 dias para o e-mail informado. Envie o link pelo WhatsApp ou e-mail; a pessoa cria a conta com esse e-mail e já entra na sua equipe.',
    },
    'team.pending': {
        area: 'Equipe',
        title: 'Convites pendentes',
        body: 'Convites ainda não aceitos ocupam uma vaga do plano. Cancele os que não serão mais usados para liberar a vaga.',
    },
    'workspace.switch': {
        area: 'Equipe',
        title: 'Trocar de empresa',
        body: 'Se você participa de mais de uma empresa (a sua e a de um cliente, por exemplo), escolha aqui em qual delas está trabalhando agora.',
    },
    'plan.limit': {
        area: 'Planos',
        title: 'Limites do plano',
        body: 'Cada plano tem um número de propostas por mês e de pessoas na equipe. O contador de propostas zera no dia 1 de cada mês.',
    },
}
