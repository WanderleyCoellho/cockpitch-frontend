import { z } from 'zod'

// Sem isso o zod testa `new Function` para compilar os schemas, e a CSP (sem 'unsafe-eval') registra
// uma violação a cada carga da página. O zod lê esta opção quando cada schema é criado, então este
// módulo precisa ser importado antes de qualquer outro que declare schemas (ver main.jsx).
z.config({ jitless: true })
