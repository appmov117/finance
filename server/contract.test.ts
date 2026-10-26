import { describe, expect, it } from 'vitest'
import { amountInWords, buildPagare, pesosInWords } from './contract.ts'

describe('pesosInWords', () => {
  it.each([
    [1, 'UN'], [15, 'QUINCE'], [21, 'VEINTIÚN'], [35, 'TREINTA Y CINCO'], [100, 'CIEN'], [101, 'CIENTO UN'],
    [500, 'QUINIENTOS'], [1000, 'MIL'], [2400, 'DOS MIL CUATROCIENTOS'], [21000, 'VEINTIÚN MIL'],
    [150250, 'CIENTO CINCUENTA MIL DOSCIENTOS CINCUENTA'], [1_000_000, 'UN MILLÓN'],
  ])('%i', (n, words) => expect(pesosInWords(n)).toBe(words))

  it('agrega centavos y moneda', () => {
    expect(amountInWords(240050)).toBe('DOS MIL CUATROCIENTOS PESOS 50/100 M.N.')
    expect(amountInWords(100_000_000)).toBe('UN MILLÓN DE PESOS 00/100 M.N.')
  })
})

describe('buildPagare', () => {
  const text = buildPagare({
    folio: 7,
    terms: { principal: 200000, rateBp: 2000, weeks: 10, lateFee: 5000, startDate: '2026-01-01' },
    signDate: '2026-01-01',
    city: 'Mérida, Yucatán',
    lender: { name: 'Rosa Hoil', address: '' },
    debtor: { name: 'Ana López', address: 'Centro', phone: '9991234567' },
  })

  it('incluye los requisitos del pagaré', () => {
    expect(text).toContain('PAGARÉ')
    expect(text).toContain('Debo y pagaré incondicionalmente')
    expect(text).toContain('a la orden de Rosa Hoil')
    expect(text).toContain('$2,400.00 (DOS MIL CUATROCIENTOS PESOS 00/100 M.N.)')
    expect(text).toContain('En Mérida, Yucatán, a 1 de enero de 2026.')
    expect(text).toContain('10 exhibiciones semanales y consecutivas de $240.00')
    expect(text).toContain('La primera vence el 8 de enero de 2026')
    expect(text).toContain('pena moratoria de $50.00')
    expect(text).toContain('Nombre: Ana López')
  })
})
