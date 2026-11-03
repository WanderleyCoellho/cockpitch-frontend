# Relatório de segurança — cockpitch-frontend

Gerado em 2026-10-29 09:01 · raiz `D:\Projetos LumenDev\Lumen Deal\cockpitch-frontend`

**Status: sem bloqueio** — Crítico: 0 · Alto: 0 · Médio: 3 · Baixo: 0 · Info: 1

## O que rodou

| Categoria | Ferramenta | Modo | Observação |
|---|---|---|---|
| Dependências (SCA) | osv-scanner | nativo |  |
| Segredos | gitleaks | nativo |  |

## Achados

| Gravidade | Categoria | Achado | Local | Correção | ID |
|---|---|---|---|---|---|
| Médio | Dependências (SCA) | quill@1.3.7 — GHSA-4943-9vgg-gr5r (CVE-2021-3163)<br>Cross-site Scripting in quill | `package-lock.json` | sem versão corrigida publicada — avaliar troca ou mitigação | `npm:quill@1.3.7:GHSA-4943-9vgg-gr5r` |
| Médio | Dependências (SCA) | react-router@6.30.6 — GHSA-337j-9hxr-rhxg (CVE-2026-53666)<br>React Router: Arbitrary Constructor Injection via deserializeErrors() in React Router SSR Hydration | `package-lock.json` | atualizar para >= 7.18.0 | `npm:react-router@6.30.6:GHSA-337j-9hxr-rhxg` |
| Médio | Dependências (SCA) | react-router@6.30.6 — GHSA-wrjc-x8rr-h8h6 (CVE-2026-53669)<br>React Router: Open redirect via backslash in <Link> and useNavigate (CVE-2025-68470 bypass) | `package-lock.json` | atualizar para >= 7.18.0 | `npm:react-router@6.30.6:GHSA-wrjc-x8rr-h8h6` |
| Info | Dependências (SCA) | 3 pacote(s) com script de instalação<br>core-js, esbuild, fsevents | `package-lock.json` | confirme que cada um é esperado; para pacotes novos, revise o script antes de instalar | `dc4b4ec77aea` |
| Alto (aceito) | Dependências (SCA) | zod@3.25.76 — GHSA-mrhx-c7xc-m3w5 (CVE-2023-54404)<br>Zod can exhaust memory while validating oversized constrained collections | `package-lock.json` | atualizar para >= 4.6.6<br>_aceito: No frontend o zod valida só formulários no navegador da própria pessoa: entrada gigante só trava a aba dela, sem efeito no servidor. Migrar para zod 4 junto com o backend. (até 2026-12-27)_ | `npm:zod@3.25.76:GHSA-mrhx-c7xc-m3w5` |

## O que este relatório não garante

Scanners encontram padrões conhecidos. Não detectam falha de autorização, lógica de negócio, vazamento entre usuários nem XSS que dependa de fluxo entre arquivos. Use `references/checklist-manual.md` da skill `security-audit` antes de declarar algo seguro.
