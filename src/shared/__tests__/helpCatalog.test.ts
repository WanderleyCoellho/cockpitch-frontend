import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'
import { HELP } from '../help/content'
import { planIdForTier, PLANS, PUBLIC_PLAN_IDS } from '../plans'

function walk(dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) return entry.name === '__tests__' ? [] : walk(full)
        return /\.(tsx?|jsx?)$/.test(entry.name) ? [full] : []
    })
}

describe('catálogo de ajuda', () => {
    it('toda helpKey usada nas telas existe no catálogo', () => {
        const srcDir = path.resolve(__dirname, '../..')
        const used = new Set<string>()
        for (const file of walk(srcDir)) {
            const content = fs.readFileSync(file, 'utf8')
            for (const match of content.matchAll(/helpKey="([^"]+)"/g)) used.add(match[1])
        }
        expect(used.size).toBeGreaterThan(0)
        const missing = [...used].filter((key) => !HELP[key])
        expect(missing).toEqual([])
    })

    it('textos de dica cabem no tooltip (até 240 caracteres)', () => {
        const tooLong = Object.entries(HELP).filter(([, entry]) => entry.body.length > 240).map(([key]) => key)
        expect(tooLong).toEqual([])
    })
})

describe('planos', () => {
    it('mapeia o plano do servidor para a vitrine', () => {
        expect(planIdForTier('STARTER')).toBe('basic')
        expect(planIdForTier('PRO')).toBe('pro')
        expect(planIdForTier('AGENCY')).toBe('team')
        expect(planIdForTier('FREE')).toBe('free')
        expect(PUBLIC_PLAN_IDS.map((id) => PLANS[id].price)).toEqual([0, 49, 99, 249])
    })
})
