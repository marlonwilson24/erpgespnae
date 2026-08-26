import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate } from '../utils';

describe('Utilitários Gerais (utils.ts)', () => {
  describe('formatCurrency', () => {
    it('deve formatar valores numéricos para moeda BRL corretamente', () => {
      const resultado = formatCurrency(1250.5);
      // Remove espaços não inquebráveis para facilitar a comparação
      const limpo = resultado.replace(/\u00a0/g, ' ');
      expect(limpo).toContain('R$');
      expect(limpo).toContain('1.250,50');
    });

    it('deve formatar zero corretamente', () => {
      const resultado = formatCurrency(0).replace(/\u00a0/g, ' ');
      expect(resultado).toContain('R$');
      expect(resultado).toContain('0,00');
    });

    it('deve tratar valores negativos', () => {
      const resultado = formatCurrency(-500.75).replace(/\u00a0/g, ' ');
      expect(resultado).toContain('R$');
      expect(resultado).toContain('500,75');
    });
  });

  describe('formatDate', () => {
    it('deve formatar data ISO YYYY-MM-DD para DD/MM/YYYY', () => {
      expect(formatDate('2026-08-25')).toBe('25/08/2026');
    });

    it('deve formatar data com timestamp ISO corretamente', () => {
      expect(formatDate('2026-01-01T12:00:00Z')).toBe('01/01/2026');
    });

    it('deve retornar string vazia ou fallback para entrada inválida', () => {
      expect(formatDate('')).toBe('');
      expect(formatDate(null as any)).toBe('');
    });
  });
});
