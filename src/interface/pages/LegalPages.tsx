import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

/** Contato para assuntos de privacidade (LGPD). Trocar aqui quando houver um e-mail dedicado. */
export const PRIVACY_CONTACT = 'contato@lumendevstudios.com'
const UPDATED_AT = '3 de novembro de 2026'

function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="min-h-screen bg-[#0B0B0B] text-white/80">
            <header className="border-b border-white/10">
                <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
                    <Link to="/login" className="text-lg font-semibold text-white">
                        Lumen <span className="text-[#C9A84C]">Deal</span>
                    </Link>
                    <nav className="flex gap-5 text-sm text-white/50">
                        <Link to="/privacidade" className="hover:text-white">Privacidade</Link>
                        <Link to="/termos" className="hover:text-white">Termos de uso</Link>
                    </nav>
                </div>
            </header>
            <main className="max-w-3xl mx-auto px-6 py-12">
                <h1 className="text-3xl font-semibold text-white">{title}</h1>
                <p className="mt-2 text-sm text-white/40">Última atualização: {UPDATED_AT}</p>
                <div className="mt-10 space-y-8 leading-relaxed [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_p+p]:mt-3 [&_strong]:text-white [&_a]:text-[#C9A84C] [&_a]:underline">
                    {children}
                </div>
            </main>
            <footer className="border-t border-white/10 py-8 text-center text-xs text-white/35">
                Lumen Deal é um produto da Lumen Dev Studios · <a href="https://lumendevstudios.com" className="hover:text-white/60">lumendevstudios.com</a>
            </footer>
        </div>
    )
}

/** Itens guardados no navegador (seção de cookies). Manter em dia com o código. */
const BROWSER_STORAGE: Array<{ name: string; where: string; purpose: string; duration: string }> = [
    { name: 'auth_token', where: 'Armazenamento local', purpose: 'Manter você conectado ao painel.', duration: 'Até sair da conta (a sessão vale 7 dias)' },
    { name: 'lumen_active_workspace', where: 'Armazenamento local', purpose: 'Lembrar qual empresa está selecionada.', duration: 'Até sair da conta' },
    { name: 'lumen-deal:block-tips-hidden', where: 'Armazenamento local', purpose: 'Lembrar se você ocultou as dicas do editor.', duration: 'Até limpar os dados do navegador' },
    { name: 'lumen_google_pending', where: 'Armazenamento da aba', purpose: 'Guardar o login com Google enquanto você termina o cadastro.', duration: 'Até fechar a aba' },
    { name: 'ops_access_token', where: 'Cookie (HttpOnly)', purpose: 'Sessão do painel interno da equipe Lumen Dev Studios. Não é usado por clientes.', duration: '12 horas' },
]

export function PrivacyPage() {
    return (
        <LegalLayout title="Política de Privacidade">
            <section>
                <p>
                    Esta política explica como o <strong>Lumen Deal</strong> (deal.lumendevstudios.com), produto da <strong>Lumen Dev Studios</strong>,
                    trata dados pessoais, em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei 13.709/2018 — LGPD). Ela vale para quem
                    usa o painel e para quem recebe e responde propostas enviadas pelo Lumen Deal.
                </p>
                <p>
                    <strong>Em resumo:</strong> usamos os dados só para prestar o serviço, não vendemos dados, não usamos cookies de publicidade nem
                    rastreadores, e você pode pedir acesso, correção ou exclusão pelo e-mail{' '}
                    <a href={`mailto:${PRIVACY_CONTACT}`}>{PRIVACY_CONTACT}</a>.
                </p>
            </section>

            <section>
                <h2>1. Quem somos, papéis e canal de contato</h2>
                <p>
                    O Lumen Deal é uma plataforma para empresas e profissionais criarem, enviarem e assinarem propostas comerciais. Para os dados de
                    quem usa o painel (contas, equipes e assinaturas), a Lumen Dev Studios é a <strong>controladora</strong>. Para os dados dos
                    clientes que recebem e respondem propostas, a empresa que enviou a proposta é a <strong>controladora</strong> e o Lumen Deal atua
                    como <strong>operador</strong>, tratando esses dados apenas para prestar o serviço contratado por ela.
                </p>
                <p>
                    Canal de comunicação com o titular e com a ANPD (encarregado):{' '}
                    <a href={`mailto:${PRIVACY_CONTACT}`}>{PRIVACY_CONTACT}</a>.
                </p>
            </section>

            <section>
                <h2>2. Dados que tratamos</h2>
                <ul>
                    <li><strong>Conta:</strong> nome, e-mail e senha (guardada apenas como hash, nunca em texto).</li>
                    <li>
                        <strong>Entrar com Google:</strong> nome, e-mail e o identificador da conta Google, fornecidos pelo Google quando você escolhe
                        essa opção. No primeiro acesso confirmamos o e-mail com um link e você cria uma senha. Não acessamos Gmail, contatos, Drive nem
                        outros dados da conta Google.
                    </li>
                    <li><strong>Empresa e conteúdo:</strong> nome e segmento da empresa, perfil público, pacotes, preços, propostas, imagens e vídeos enviados.</li>
                    <li><strong>Equipe:</strong> e-mails convidados, papéis e preferências de aviso por e-mail.</li>
                    <li>
                        <strong>Assinatura da empresa:</strong> nome, cargo (opcional), CPF, assinatura desenhada ou digitada, e-mail confirmado por
                        código, data, hora, IP e navegador. Se você permitir, a assinatura e o CPF ficam salvos no seu perfil para as próximas propostas;
                        você pode apagá-los quando quiser.
                    </li>
                    <li>
                        <strong>Clientes que respondem propostas:</strong> nome, e-mail, mensagem, pacote e opcionais escolhidos, data, hora, endereço IP e
                        navegador. Para <strong>aceitar e assinar</strong>, também CPF, assinatura desenhada ou digitada e a confirmação do e-mail por um
                        código de 6 dígitos.
                    </li>
                    <li>
                        <strong>Uso:</strong> aberturas das propostas (data, hora e um identificador de sessão gerado na página, que não fica salvo no
                        navegador) para as estatísticas da empresa.
                    </li>
                    <li>
                        <strong>Pagamentos:</strong> processados pela Stripe. Não recebemos nem guardamos números de cartão; guardamos identificadores do
                        cliente e da assinatura na Stripe, o histórico de cobrança e comprovantes que você enviar.
                    </li>
                </ul>
                <p>
                    <strong>O que fica visível na proposta:</strong> a proposta é acessível a quem tiver o link. Depois de assinada, ela mostra o nome,
                    a assinatura e o CPF <strong>parcialmente oculto</strong> de quem assinou, e o código de verificação do conteúdo. E-mail, IP,
                    navegador e o CPF completo ficam visíveis só para a equipe da empresa, no painel.
                </p>
            </section>

            <section>
                <h2>3. Para que usamos e base legal</h2>
                <ul>
                    <li>Criar e manter sua conta, autenticar o acesso e prestar o serviço — <strong>execução de contrato</strong> (art. 7º, V).</li>
                    <li>
                        Enviar e-mails do próprio serviço: confirmação de conta, códigos de assinatura, convites de equipe, aberturas e respostas de
                        propostas — <strong>execução de contrato</strong> (art. 7º, V).
                    </li>
                    <li>
                        Registrar o aceite e as assinaturas como comprovante para a empresa e o cliente — <strong>execução de contrato</strong> e{' '}
                        <strong>exercício regular de direitos</strong> (art. 7º, V e VI).
                    </li>
                    <li>
                        Segurança, prevenção de fraude e abuso (limites de tentativas, registro de IP, alertas de contestação de pagamento) —{' '}
                        <strong>legítimo interesse</strong> (art. 7º, IX).
                    </li>
                    <li>Cobrança, emissão de notas e obrigações fiscais — <strong>cumprimento de obrigação legal</strong> (art. 7º, II).</li>
                </ul>
                <p>
                    Não vendemos dados pessoais, não os usamos para publicidade de terceiros e não tomamos decisões automatizadas sobre você. A Stripe
                    pode fazer análises automáticas de fraude nos pagamentos, conforme a política dela.
                </p>
            </section>

            <section>
                <h2>4. Com quem compartilhamos</h2>
                <p>Somente com fornecedores necessários para operar o serviço, que tratam os dados conforme nossas instruções:</p>
                <ul>
                    <li><strong>Railway</strong> — servidores, banco de dados e armazenamento de arquivos.</li>
                    <li><strong>Vercel</strong> — hospedagem do site e do painel.</li>
                    <li><strong>Resend</strong> — envio de e-mails.</li>
                    <li><strong>Stripe</strong> — pagamentos e assinaturas.</li>
                    <li><strong>Google</strong> — autenticação, quando você escolhe "Entrar com Google", e as fontes tipográficas das páginas (o navegador as busca no Google, que recebe o endereço IP).</li>
                    <li><strong>YouTube e Vimeo</strong> — somente quando a empresa coloca um vídeo desses serviços na proposta; usamos os modos sem cookies de rastreamento.</li>
                </ul>
                <p>
                    Também podemos compartilhar dados quando a lei ou uma ordem de autoridade competente exigir. A empresa que envia a proposta acessa
                    os dados de quem respondeu a ela.
                </p>
            </section>

            <section>
                <h2>5. Transferência internacional</h2>
                <p>
                    Os servidores do serviço e de vários fornecedores ficam fora do Brasil, principalmente nos Estados Unidos. A transferência ocorre
                    nos termos do art. 33 da LGPD, para a execução do contrato e com fornecedores que adotam garantias e padrões de segurança
                    reconhecidos.
                </p>
            </section>

            <section>
                <h2>6. Por quanto tempo guardamos</h2>
                <ul>
                    <li>Dados da conta e conteúdo: enquanto a conta estiver ativa.</li>
                    <li>
                        Comprovantes de aceite e assinaturas: enquanto a proposta existir. Se a empresa for encerrada porque o dono excluiu a conta, ficam
                        só as propostas aceitas pelo cliente (proposta, aceite e assinaturas), por 5 anos, para a defesa de direitos das duas partes; o
                        restante da empresa é apagado na hora.
                    </li>
                    <li>Registros financeiros e fiscais: pelo prazo exigido pela legislação.</li>
                    <li>
                        Códigos de assinatura: valem 10 minutos e o registro do pedido é apagado em 2 dias. Links de confirmação de conta: valem 24 horas
                        e são apagados 7 dias depois de vencer. Convites de equipe não aceitos: apagados 30 dias depois de vencer.
                    </li>
                    <li>
                        E-mails enviados pelo sistema: os que levam código ou link de acesso são apagados assim que o código ou link vence; nos demais,
                        destinatário e conteúdo são apagados em 90 dias.
                    </li>
                    <li>Registro de avisos de pagamento da Stripe: 90 dias.</li>
                    <li>
                        Ao excluir a conta, os dados dela são apagados na hora. Ficam apenas as assinaturas que você fez em propostas (como prova do que foi
                        assinado) e os registros financeiros exigidos por lei.
                    </li>
                </ul>
            </section>

            <section>
                <h2>7. Segurança</h2>
                <p>
                    Usamos conexão criptografada (HTTPS), senhas com hash, confirmação de e-mail por código ou link, arquivos privados com links
                    temporários, controle de acesso por empresa e papel, e limites contra tentativas abusivas. Nenhum sistema é totalmente imune; se
                    ocorrer um incidente que possa causar risco ou dano relevante, avisaremos os afetados e a ANPD, conforme o art. 48 da LGPD.
                </p>
            </section>

            <section>
                <h2>8. Seus direitos</h2>
                <p>
                    Pelo art. 18 da LGPD, você pode pedir: confirmação de que tratamos seus dados, acesso, correção, anonimização, bloqueio ou
                    eliminação de dados desnecessários, portabilidade, eliminação dos dados tratados com consentimento, informação sobre com quem
                    compartilhamos, e revisão de decisões automatizadas. Também pode se opor a tratamentos baseados em legítimo interesse.
                </p>
                <p>
                    No próprio painel, em <strong>Equipe → Sua conta e seus dados</strong>, você baixa seus dados (acesso e portabilidade, em arquivo
                    JSON) e exclui sua conta. Se você é dono de uma empresa com equipe, escolhe na hora se passa a empresa para outra pessoa ou a
                    encerra.
                </p>
                <p>
                    Para os demais pedidos, escreva para <a href={`mailto:${PRIVACY_CONTACT}`}>{PRIVACY_CONTACT}</a> a partir do e-mail da conta. Respondemos em até
                    15 dias. Se você é cliente de uma empresa que usa o Lumen Deal, faça o pedido diretamente a ela; nós a apoiaremos no atendimento.
                    Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).
                </p>
            </section>

            <section>
                <h2>9. Cookies e armazenamento no navegador</h2>
                <p>
                    O Lumen Deal <strong>não usa cookies de publicidade, de análise nem rastreadores</strong>. Guardamos no navegador apenas o necessário
                    para o serviço funcionar, por isso não pedimos consentimento para eles:
                </p>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="text-left text-white">
                                <th className="py-2 pr-3 border-b border-white/10 font-semibold">Nome</th>
                                <th className="py-2 pr-3 border-b border-white/10 font-semibold">Onde</th>
                                <th className="py-2 pr-3 border-b border-white/10 font-semibold">Para quê</th>
                                <th className="py-2 border-b border-white/10 font-semibold">Duração</th>
                            </tr>
                        </thead>
                        <tbody>
                            {BROWSER_STORAGE.map((item) => (
                                <tr key={item.name} className="align-top">
                                    <td className="py-2 pr-3 border-b border-white/5 font-mono text-xs text-white/70">{item.name}</td>
                                    <td className="py-2 pr-3 border-b border-white/5">{item.where}</td>
                                    <td className="py-2 pr-3 border-b border-white/5">{item.purpose}</td>
                                    <td className="py-2 border-b border-white/5">{item.duration}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p>Serviços de terceiros que você pode encontrar no Lumen Deal têm cookies próprios, regidos pelas políticas deles:</p>
                <ul>
                    <li><strong>Google</strong> — o botão "Entrar com Google" pode guardar cookies do Google quando você o usa.</li>
                    <li><strong>Stripe</strong> — a página de pagamento (checkout.stripe.com) usa cookies para o pagamento e a prevenção de fraude.</li>
                    <li><strong>YouTube e Vimeo</strong> — vídeos em propostas usam os modos sem rastreamento (youtube-nocookie e "do not track").</li>
                </ul>
                <p>
                    Você pode apagar esses dados nas configurações do navegador; fazer isso encerra a sessão no painel. Se um dia usarmos cookies que
                    não sejam necessários, pediremos seu consentimento antes.
                </p>
            </section>

            <section>
                <h2>10. Crianças</h2>
                <p>O Lumen Deal é destinado a empresas e profissionais e não é direcionado a menores de 18 anos.</p>
            </section>

            <section>
                <h2>11. Alterações e contato</h2>
                <p>
                    Podemos atualizar esta política; a data no topo indica a última versão, e mudanças relevantes serão avisadas no painel ou por
                    e-mail. Dúvidas e pedidos sobre dados pessoais: <a href={`mailto:${PRIVACY_CONTACT}`}>{PRIVACY_CONTACT}</a>.
                </p>
            </section>
        </LegalLayout>
    )
}

export function TermsPage() {
    return (
        <LegalLayout title="Termos de Uso">
            <section>
                <p>
                    Estes termos regem o uso do <strong>Lumen Deal</strong>, produto da <strong>Lumen Dev Studios</strong>. Ao criar uma conta ou usar
                    o serviço, você concorda com eles e com a <Link to="/privacidade">Política de Privacidade</Link>.
                </p>
            </section>
            <section>
                <h2>1. O serviço</h2>
                <p>
                    O Lumen Deal permite criar propostas comerciais online, enviá-las por link e receber aceites, pedidos de ajuste e recusas dos
                    seus clientes. Recursos e limites variam conforme o plano contratado.
                </p>
            </section>
            <section>
                <h2>2. Conta e equipe</h2>
                <ul>
                    <li>Você é responsável pelas informações da conta e por manter o acesso seguro.</li>
                    <li>O dono da empresa responde pelas pessoas que convida e pelos papéis que atribui.</li>
                    <li>É preciso ter 18 anos ou mais e poder contratar em nome da empresa informada.</li>
                </ul>
            </section>
            <section>
                <h2>3. Conteúdo e uso adequado</h2>
                <ul>
                    <li>O conteúdo das propostas (textos, preços, imagens, condições) é seu e de sua responsabilidade.</li>
                    <li>É proibido usar o serviço para conteúdo ilegal, enganoso, que viole direitos de terceiros ou para envio de spam.</li>
                    <li>Você nos autoriza a armazenar e exibir esse conteúdo apenas para prestar o serviço.</li>
                </ul>
            </section>
            <section>
                <h2>4. Aceite online e assinatura eletrônica</h2>
                <p>
                    O aceite é assinado eletronicamente: registramos nome, CPF, assinatura desenhada ou digitada, e-mail confirmado por código, data,
                    hora, IP, navegador e um código de verificação (SHA-256) do conteúdo exato da proposta. Esse registro serve como comprovante
                    entre você e seu cliente. É uma assinatura eletrônica sem certificado digital ICP-Brasil e não substitui um contrato quando a lei
                    ou o negócio exigirem forma específica.
                </p>
            </section>
            <section>
                <h2>5. Dados dos seus clientes (LGPD)</h2>
                <p>
                    Nos dados pessoais dos seus clientes coletados pelas propostas, sua empresa é a <strong>controladora</strong> e o Lumen Deal é o{' '}
                    <strong>operador</strong> (LGPD, arts. 5º, 37 a 40). Ao usar o serviço, as partes combinam:
                </p>
                <ul>
                    <li>Você define para que os dados são usados e precisa ter base legal para coletá-los e tratá-los.</li>
                    <li>Nós tratamos esses dados só para prestar o serviço e seguindo suas instruções, nunca para fins próprios.</li>
                    <li>Quem acessa esses dados do nosso lado tem dever de sigilo.</li>
                    <li>
                        Usamos os fornecedores listados na <Link to="/privacidade">Política de Privacidade</Link> e avisamos antes de incluir outros que
                        recebam esses dados.
                    </li>
                    <li>Mantemos as medidas de segurança descritas na política.</li>
                    <li>Se houver um incidente com esses dados, avisamos você sem demora, com o que soubermos, para que você avalie o aviso à ANPD e aos titulares.</li>
                    <li>Ajudamos você a atender pedidos dos seus clientes (acesso, correção, exclusão).</li>
                    <li>
                        Quando a empresa é encerrada, apagamos esses dados, menos as propostas aceitas, guardadas por 5 anos como comprovante para as
                        duas partes. Esse prazo também está na Política de Privacidade.
                    </li>
                </ul>
            </section>
            <section>
                <h2>6. Planos e pagamentos</h2>
                <p>
                    Planos pagos são cobrados de forma recorrente pela Stripe. Você pode cancelar a qualquer momento; o acesso pago segue até o fim
                    do período já cobrado. Preços podem mudar com aviso prévio de 30 dias.
                </p>
            </section>
            <section>
                <h2>7. Disponibilidade e responsabilidade</h2>
                <p>
                    Trabalhamos para manter o serviço disponível e seguro, mas ele é oferecido "no estado em que se encontra". Não respondemos por
                    negócios fechados ou não fechados com seus clientes, nem por danos indiretos. Nossa responsabilidade total fica limitada ao
                    valor pago nos 12 meses anteriores ao evento.
                </p>
            </section>
            <section>
                <h2>8. Encerramento</h2>
                <p>
                    Você pode excluir sua conta quando quiser, pelo painel. Se for dono de uma empresa com equipe, escolhe entre passar a empresa
                    para outra pessoa da equipe ou encerrá-la:
                </p>
                <ul>
                    <li>
                        Passando para outra pessoa, a assinatura continua e sua forma de pagamento é removida. O novo dono usa o período já pago e tem até
                        7 dias depois dele para cadastrar a forma de pagamento; se a cobrança já estiver atrasada, os 7 dias contam da troca. Sem pagamento
                        em dia no fim do prazo, a assinatura é cancelada e a empresa passa para o plano Grátis.
                    </li>
                    <li>Encerrando a empresa, a assinatura é cancelada na hora e a equipe perde o acesso. Cada pessoa pode criar uma empresa nova no plano Grátis.</li>
                </ul>
                <p>Podemos suspender contas que violem estes termos. Depois do encerramento, os dados seguem os prazos da Política de Privacidade.</p>
            </section>
            <section>
                <h2>9. Lei e contato</h2>
                <p>
                    Aplicam-se as leis do Brasil. Dúvidas: <a href={`mailto:${PRIVACY_CONTACT}`}>{PRIVACY_CONTACT}</a>.
                </p>
            </section>
        </LegalLayout>
    )
}
