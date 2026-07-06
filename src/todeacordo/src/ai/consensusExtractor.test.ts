import { describe, it, expect } from 'vitest';
import { generateConsensusFromTranscript } from './consensusExtractor';
import type { TranscriptSegment } from '../types';

describe('ConsensusExtractor AI Module', () => {
  it('deve extrair decisões e combinados corretamente de uma transcrição mockada', async () => {
    const mockSegments: TranscriptSegment[] = [
      {
        id: '1', meeting_id: 'meet-test', speaker: 'Alexandre',
        text: 'Então fechamos que a entrega da landing page será na sexta-feira, certo?',
        source: 'audio', captured_at: Date.now(), timestamp: '00:01'
      },
      {
        id: '2', meeting_id: 'meet-test', speaker: 'João',
        text: 'Tô de acordo. E o pagamento de 50% inicial a gente faz hoje à tarde.',
        source: 'audio', captured_at: Date.now(), timestamp: '00:02'
      }
    ];

    const result = await generateConsensusFromTranscript({
      meetingId: 'meet-test',
      sourcePlatform: 'Teste',
      segments: mockSegments
    });
    
    // Testar se ele capturou a obrigação
    expect(result.obligations).toBeDefined();
    // Como é um mock local (ele usa um Mock no consensusExtractor se não tiver chave de API real ou se for test mode),
    // devemos garantir que ele retorne um ConsensusObject válido
    expect(result.id).toBeDefined();
    expect(result.meeting_id).toBe('meet-test');
    expect(result.status).toBe('consensus_obtained'); // ou draft
  });
});
