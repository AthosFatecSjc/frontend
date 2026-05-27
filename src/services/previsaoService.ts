import axios from 'axios'
import type { ResultadoPrevisao, DadoPrevisaoAgrupado } from '@/types/previsao'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
})

/**
 * Busca dados de previsão para um indicador específico
 * @param conjuntoId - ID do conjunto de unidades consumidoras
 * @param indicador - DEC ou FEC
 */
export async function fetchPrevisao(
  conjuntoId: string,
  indicador: 'DEC' | 'FEC' = 'DEC'
): Promise<ResultadoPrevisao> {
  try {
    const response = await api.get(`/previsoes/${conjuntoId}/${indicador}`)
    return response.data
  } catch (error) {
    console.error('Erro ao buscar previsão:', error)
    // Retorna dados mockados para demonstração
    return gerarDadosMockados(conjuntoId, indicador)
  }
}

/**
 * Gera dados mockados para demonstração
 */
function gerarDadosMockados(conjuntoId: string, indicador: 'DEC' | 'FEC'): ResultadoPrevisao {
  const dados: DadoPrevisaoAgrupado[] = []
  const hoje = new Date()
  
  // Gera 24 meses de histórico
  for (let i = 23; i >= 0; i--) {
    const data = new Date(hoje)
    data.setMonth(data.getMonth() - i)
    
    const valor = indicador === 'DEC' ? 10 + Math.random() * 5 : 5 + Math.random() * 3
    const dataStr = data.toISOString().split('T')[0]
    
    dados.push({
      data: dataStr || '2024-01-01',
      valorReal: valor,
    })
  }
  
  // Gera 12 meses de previsão
  for (let i = 1; i <= 12; i++) {
    const data = new Date(hoje)
    data.setMonth(data.getMonth() + i)
    
    const ultimoValor = dados[dados.length - 1]?.valorReal || 10
    const previsao = ultimoValor + (Math.random() - 0.5) * 2
    const desvio = 1 + Math.random() * 0.5
    const dataStr = data.toISOString().split('T')[0]
    
    dados.push({
      data: dataStr || '2024-01-01',
      valorPrevisao: Math.max(0, previsao),
      intervaloInferior: Math.max(0, previsao - desvio),
      intervaloSuperior: previsao + desvio,
    })
  }
  
  return {
    indicador,
    distribuidora: 'Equatorial PA',
    conjuntoId,
    conjuntoNome: 'Conjunto de Teste',
    dados,
    ultimoValorHistorico: dados[23]?.valorReal || 0,
    previsaoMedia: dados.slice(24).reduce((sum, d) => sum + (d.valorPrevisao || 0), 0) / 12,
  }
}

/**
 * Busca previsões para múltiplos indicadores
 */
export async function fetchPrevisoes(
  conjuntoId: string
): Promise<{ dec: ResultadoPrevisao; fec: ResultadoPrevisao }> {
  const [dec, fec] = await Promise.all([
    fetchPrevisao(conjuntoId, 'DEC'),
    fetchPrevisao(conjuntoId, 'FEC'),
  ])

  return { dec, fec }
}
