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
    'package.priceMode': {
        area: 'Pacotes',
        title: 'Como o preço é calculado',
        body: 'Soma dos itens: o total é a soma de quantidade × valor de cada item incluído. Valor fixo: você define o total e os itens só descrevem o que vem no pacote. Sob consulta: não mostra valor.',
    },
    'package.priceLabel': {
        area: 'Pacotes',
        title: 'Texto junto ao preço',
        body: 'Complemento opcional que aparece ao lado do valor, como "a partir de", "por pessoa" ou "por mês". No modo Sob consulta, substitui o valor.',
    },
    'package.discount': {
        area: 'Pacotes',
        title: 'Desconto',
        body: 'Aplicado sobre o total do pacote (incluindo opcionais que o cliente marcar). Em % (ex.: 10) ou em reais. O total nunca fica negativo.',
    },
    'item.kind': {
        area: 'Pacotes',
        title: 'Tipo do item',
        body: 'Incluído: faz parte do pacote. Opcional: o cliente liga ou desliga na proposta e o total muda na hora. Cortesia: aparece com o valor riscado, como presente, e não soma no total.',
    },
    'item.quantity': {
        area: 'Pacotes',
        title: 'Quantidade e unidade',
        body: 'Quantas unidades do item: horas, diárias, páginas, sessões... Aceita decimais (ex.: 1,5). A unidade é só o texto exibido, como "h" ou "diária".',
    },
    'item.unitPrice': {
        area: 'Pacotes',
        title: 'Valor unitário',
        body: 'Preço de UMA unidade. O sistema multiplica pela quantidade. Deixe em branco se o pacote tem valor fixo e o item só descreve o que está incluso.',
    },
    'plan.limit': {
        area: 'Planos',
        title: 'Limites do plano',
        body: 'Cada plano tem um número de propostas por mês e de pessoas na equipe. O contador de propostas zera no dia 1 de cada mês.',
    },
    'proposal.template': {
        area: 'Propostas',
        title: 'Modelo de proposta',
        body: 'Ponto de partida com seções e textos prontos para o seu ramo. Tudo pode ser editado depois. Mudar o modelo mais tarde não altera propostas já enviadas.',
    },
    'blocks.editor': {
        area: 'Propostas',
        title: 'Página em blocos',
        body: 'A proposta é montada em blocos (capa, escopo, preços, FAQ…). Arraste para reordenar, use o olho para ocultar sem apagar e clique no bloco para editar o conteúdo.',
    },
    'blocks.placeholders': {
        area: 'Propostas',
        title: 'Textos automáticos',
        body: 'Escreva {cliente} e {empresa} em qualquer texto: na página o cliente vê o nome dele e o da sua empresa. Assim um modelo serve para todos os clientes.',
    },
    'blocks.title': {
        area: 'Propostas',
        title: 'Título da seção',
        body: 'Aparece em destaque no topo do bloco e no menu lateral da proposta. Deixe vazio para usar o título padrão do bloco.',
    },
    'blocks.media': {
        area: 'Propostas',
        title: 'Imagens e vídeos',
        body: 'Envie arquivos do seu computador ou celular (JPG, PNG, WEBP, MP4). Por segurança, a proposta só exibe mídias enviadas por aqui, não links de outros sites.',
    },
    'blocks.richText': {
        area: 'Propostas',
        title: 'Texto formatado',
        body: 'Use os botões para negrito, itálico e listas. Cole texto sem medo: formatações estranhas e códigos são removidos automaticamente.',
    },
    'blocks.pricing': {
        area: 'Propostas',
        title: 'Bloco de preços',
        body: 'Mostra os pacotes marcados na aba Pacotes, com total calculado. O cliente liga e desliga os opcionais e vê o valor final na hora.',
    },
    'blocks.contact': {
        area: 'Propostas',
        title: 'Botões de contato',
        body: 'WhatsApp, e-mail e Instagram vêm do perfil da empresa. Se algum não aparecer, preencha-o no perfil.',
    },
    'blocks.saveTemplate': {
        area: 'Propostas',
        title: 'Salvar como modelo',
        body: 'Guarda os blocos e o tema desta proposta para reutilizar nas próximas. Os pacotes e o nome do cliente não entram no modelo. Disponível a partir do plano Profissional.',
    },
    'blocks.convert': {
        area: 'Propostas',
        title: 'Converter para blocos',
        body: 'Monta a proposta no novo editor usando seus textos, depoimentos e mídias atuais. Nada muda para o cliente até você clicar em Salvar.',
    },
    'blocks.acceptance': {
        area: 'Propostas',
        title: 'Aceite online',
        body: 'O cliente escolhe o pacote, informa nome e e-mail e aceita. Guardamos data, hora, IP e o conteúdo exato da proposta como comprovante. A proposta fica marcada como aceita.',
    },
    'blocks.acceptanceOptions': {
        area: 'Propostas',
        title: 'Opções do aceite',
        body: 'Pedir ajuste e recusar ajudam a entender o que travou a venda. Exigir CPF/CNPJ é útil quando o aceite vira contrato.',
    },
    'proposal.responses': {
        area: 'Propostas',
        title: 'Respostas do cliente',
        body: 'Cada aceite, pedido de ajuste ou recusa feito pelo link fica registrado aqui com data, IP e o valor escolhido. Nada é apagado, nem ao reabrir a proposta.',
    },
    'proposal.reopen': {
        area: 'Propostas',
        title: 'Reabrir proposta',
        body: 'Depois do aceite, o link para de receber respostas. Reabra para o cliente poder aceitar de novo, por exemplo após um ajuste. O histórico continua guardado.',
    },
    'team.notifications': {
        area: 'Equipe',
        title: 'Avisos por e-mail',
        body: 'Você recebe um e-mail quando o cliente abre a proposta pela primeira vez e quando ele aceita, pede ajuste ou recusa. Responder o aviso escreve direto para o cliente.',
    },
}
