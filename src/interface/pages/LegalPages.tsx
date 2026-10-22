import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

/** Contato para assuntos de privacidade (LGPD). Trocar aqui quando houver um e-mail dedicado. */
export const PRIVACY_CONTACT = 'lumendevstudios@gmail.com'
const UPDATED_AT = '6 de outubro de 2026'

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

export function PrivacyPage() {
    return (
        <LegalLayout title="Política de Privacidade">
            <section>
                <p>
                    Esta política explica como o <strong>Lumen Deal</strong> (deal.lumendevstudios.com), produto da <strong>Lumen Dev Studios</strong>,
                    trata dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018 — LGPD).
                </p>
            </section>

            <section>
                <h2>1. Quem somos e papéis</h2>
                <p>
                    O Lumen Deal é uma plataforma para empresas e profissionais criarem e enviarem propostas comerciais. Para os dados de quem
                    usa o painel (contas, equipes e assinaturas), a Lumen Dev Studios é a <strong>controladora</strong>. Para os dados dos clientes
                    finais que recebem e respondem propostas, a empresa que enviou a proposta é a controladora e o Lumen Deal atua como
                    <strong> operador</strong>, tratando esses dados apenas para prestar o serviço contratado por ela.
                </p>
            </section>

            <section>
                <h2>2. Dados que coletamos</h2>
                <ul>
                    <li><strong>Conta:</strong> nome, e-mail e senha (guardada apenas de forma criptografada, com hash).</li>
                    <li>
                        <strong>Entrar com Google:</strong> nome, e-mail e o identificador da conta Google, fornecidos pelo Google quando você
                        escolhe essa opção. Não acessamos seu Gmail, contatos, Drive nem qualquer outro dado da conta Google.
                    </li>
                    <li><strong>Empresa e conteúdo:</strong> nome e segmento da empresa, perfil público, pacotes, preços, propostas, imagens e vídeos enviados.</li>
                    <li><strong>Equipe:</strong> e-mails convidados, papéis e preferências de aviso por e-mail.</li>
                    <li>
                        <strong>Clientes que respondem propostas:</strong> nome, e-mail, CPF/CNPJ (quando a empresa exige), mensagem, pacote e opcionais
                        escolhidos, data e hora, endereço IP e navegador, usados como comprovante do aceite.
                    </li>
                    <li><strong>Uso:</strong> aberturas das propostas (data, hora e um identificador de sessão) para as estatísticas da empresa.</li>
                    <li>
                        <strong>Pagamentos:</strong> processados pela Stripe. Não armazenamos números de cartão; guardamos apenas identificadores da
                        assinatura e comprovantes que você enviar.
                    </li>
                </ul>
            </section>

            <section>
                <h2>3. Para que usamos e base legal</h2>
                <ul>
                    <li>Criar e manter sua conta, autenticar o acesso e prestar o serviço (execução de contrato).</li>
                    <li>Enviar avisos do próprio serviço: convites de equipe, aberturas e respostas de propostas e confirmações de aceite (execução de contrato).</li>
                    <li>Registrar o aceite de propostas como comprovante para a empresa e o cliente (execução de contrato e exercício regular de direitos).</li>
                    <li>Segurança, prevenção de fraude e abuso (legítimo interesse).</li>
                    <li>Cobrança e obrigações fiscais (cumprimento de obrigação legal).</li>
                </ul>
                <p>Não vendemos dados pessoais e não usamos seus dados para publicidade de terceiros.</p>
            </section>

            <section>
                <h2>4. Com quem compartilhamos</h2>
                <p>Somente com fornecedores necessários para operar o serviço, que tratam os dados conforme nossas instruções:</p>
                <ul>
                    <li><strong>Railway</strong> — servidores, banco de dados e armazenamento de arquivos.</li>
                    <li><strong>Vercel</strong> — hospedagem do site e do painel.</li>
                    <li><strong>Resend</strong> — envio de e-mails.</li>
                    <li><strong>Stripe</strong> — pagamentos e assinaturas.</li>
                    <li><strong>Google</strong> — autenticação, quando você escolhe "Entrar com Google".</li>
                </ul>
                <p>
                    Alguns desses fornecedores mantêm servidores fora do Brasil (principalmente nos Estados Unidos). Nesses casos a transferência
                    internacional ocorre para a execução do contrato e com fornecedores que adotam padrões de segurança reconhecidos.
                </p>
            </section>

            <section>
                <h2>5. Por quanto tempo guardamos</h2>
                <p>
                    Mantemos os dados enquanto a conta estiver ativa. Comprovantes de aceite e registros financeiros podem ser mantidos pelo prazo
                    necessário para cumprir obrigações legais ou para a defesa de direitos. Após o encerramento da conta, os demais dados são
                    excluídos ou anonimizados em até 90 dias.
                </p>
            </section>

            <section>
                <h2>6. Segurança</h2>
                <p>
                    Usamos conexão criptografada (HTTPS), senhas com hash, arquivos privados com links temporários, controle de acesso por empresa e
                    papel, e limites contra tentativas abusivas. Nenhum sistema é totalmente imune; se ocorrer um incidente relevante, avisaremos
                    os afetados e a ANPD conforme a lei.
                </p>
            </section>

            <section>
                <h2>7. Seus direitos</h2>
                <p>
                    Você pode pedir confirmação de tratamento, acesso, correção, anonimização, portabilidade, exclusão, informações sobre
                    compartilhamento e revogação de consentimento, nos termos do art. 18 da LGPD. Se você é cliente de uma empresa que usa o
                    Lumen Deal, faça o pedido diretamente a ela; nós a apoiaremos no atendimento. Respondemos em até 15 dias.
                </p>
            </section>

            <section>
                <h2>8. Cookies e armazenamento no navegador</h2>
                <p>
                    Não usamos cookies de publicidade nem rastreadores de terceiros. O painel guarda no seu navegador apenas o necessário para
                    manter a sessão e lembrar a empresa selecionada. O botão "Entrar com Google" é fornecido pelo próprio Google, sujeito à
                    política de privacidade do Google.
                </p>
            </section>

            <section>
                <h2>9. Crianças</h2>
                <p>O Lumen Deal é destinado a empresas e profissionais e não é direcionado a menores de 18 anos.</p>
            </section>

            <section>
                <h2>10. Alterações e contato</h2>
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
                <h2>4. Aceite online</h2>
                <p>
                    O registro de aceite (nome, e-mail, data, hora, IP e o conteúdo exato da proposta) serve como comprovante entre você e seu
                    cliente. Ele não substitui um contrato quando a lei ou o negócio exigirem forma específica, e não é uma assinatura com
                    certificado digital ICP-Brasil.
                </p>
            </section>
            <section>
                <h2>5. Planos e pagamentos</h2>
                <p>
                    Planos pagos são cobrados de forma recorrente pela Stripe. Você pode cancelar a qualquer momento; o acesso pago segue até o fim
                    do período já cobrado. Preços podem mudar com aviso prévio de 30 dias.
                </p>
            </section>
            <section>
                <h2>6. Disponibilidade e responsabilidade</h2>
                <p>
                    Trabalhamos para manter o serviço disponível e seguro, mas ele é oferecido "no estado em que se encontra". Não respondemos por
                    negócios fechados ou não fechados com seus clientes, nem por danos indiretos. Nossa responsabilidade total fica limitada ao
                    valor pago nos 12 meses anteriores ao evento.
                </p>
            </section>
            <section>
                <h2>7. Encerramento</h2>
                <p>
                    Você pode encerrar a conta quando quiser. Podemos suspender contas que violem estes termos. Após o encerramento, os dados seguem
                    o prazo descrito na Política de Privacidade.
                </p>
            </section>
            <section>
                <h2>8. Lei e contato</h2>
                <p>
                    Aplicam-se as leis do Brasil. Dúvidas: <a href={`mailto:${PRIVACY_CONTACT}`}>{PRIVACY_CONTACT}</a>.
                </p>
            </section>
        </LegalLayout>
    )
}
