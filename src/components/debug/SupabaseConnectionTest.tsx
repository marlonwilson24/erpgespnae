import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

type ConnectionStatus = 'loading' | 'success' | 'error';

interface TestResult {
  status: ConnectionStatus;
  message: string;
  details?: string;
  latencyMs?: number;
}

export function SupabaseConnectionTest() {
  const [result, setResult] = useState<TestResult>({ status: 'loading', message: 'Testando conexão...' });

  useEffect(() => {
    async function testConnection() {
      const start = performance.now();
      try {
        // Testa fazendo uma query simples — sem precisar de tabela específica
        const { error } = await supabase.from('profiles').select('count').limit(1);
        const latencyMs = Math.round(performance.now() - start);

        if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
          // PGRST116 = no rows / 42P01 = tabela não existe — ambos indicam conexão OK
          setResult({
            status: 'error',
            message: 'Conexão falhou',
            details: `Código: ${error.code} — ${error.message}`,
            latencyMs,
          });
        } else {
          setResult({
            status: 'success',
            message: 'Conexão estabelecida com sucesso!',
            details: error ? `Nota: tabela "profiles" não encontrada ainda (${error.code}), mas o servidor respondeu.` : 'Query executada com sucesso.',
            latencyMs,
          });
        }
      } catch (err: unknown) {
        const latencyMs = Math.round(performance.now() - start);
        setResult({
          status: 'error',
          message: 'Erro de rede ou configuração',
          details: err instanceof Error ? err.message : String(err),
          latencyMs,
        });
      }
    }

    testConnection();
  }, []);

  const colors = {
    loading: { bg: '#1e293b', border: '#334155', icon: '⏳', label: 'Testando...' },
    success: { bg: '#052e16', border: '#166534', icon: '✅', label: 'Conectado' },
    error: { bg: '#450a0a', border: '#991b1b', icon: '❌', label: 'Erro' },
  };

  const c = colors[result.status];
  const url = import.meta.env.VITE_SUPABASE_URL as string;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>
      <div style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 16,
        padding: '40px 48px',
        maxWidth: 480,
        width: '100%',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ fontSize: 32 }}>
            {result.status === 'loading' ? (
              <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
            ) : result.status === 'success' ? '✅' : '❌'}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f8fafc' }}>
              Supabase Connection Test
            </h1>
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 99,
              background: result.status === 'success' ? '#166534' : result.status === 'error' ? '#991b1b' : '#334155',
              color: result.status === 'success' ? '#86efac' : result.status === 'error' ? '#fca5a5' : '#94a3b8',
            }}>
              {c.label}
            </span>
          </div>
        </div>

        {/* Status message */}
        <p style={{ margin: '0 0 16px', fontSize: 15, color: '#e2e8f0', fontWeight: 500 }}>
          {result.message}
        </p>

        {/* Details */}
        {result.details && (
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 16,
            fontSize: 13,
            color: '#94a3b8',
            lineHeight: 1.6,
          }}>
            {result.details}
          </div>
        )}

        {/* Latency */}
        {result.latencyMs !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>Latência:</span>
            <span style={{
              fontSize: 13,
              fontWeight: 600,
              color: result.latencyMs < 300 ? '#4ade80' : result.latencyMs < 800 ? '#facc15' : '#f87171',
            }}>
              {result.latencyMs} ms
            </span>
          </div>
        )}

        {/* Project info */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#64748b', minWidth: 80 }}>URL:</span>
            <span style={{ fontSize: 12, color: '#7dd3fc', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {url}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#64748b', minWidth: 80 }}>Ambiente:</span>
            <span style={{ fontSize: 12, color: '#a5b4fc', fontFamily: 'monospace' }}>
              {import.meta.env.MODE}
            </span>
          </div>
        </div>

        {/* Retry button */}
        {result.status === 'error' && (
          <button
            onClick={() => {
              setResult({ status: 'loading', message: 'Testando conexão...' });
              window.location.reload();
            }}
            style={{
              marginTop: 20,
              width: '100%',
              padding: '10px',
              background: '#1e40af',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Tentar novamente
          </button>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
