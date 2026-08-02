import type { TranscriptSegment, LiveCaptionDraft } from '../../types';
import { MEET_SELECTORS } from './selectors';
import { MeetingDetector } from './detector';

export type CaptionEvent = 
  | { type: 'caption_draft_updated'; draft: LiveCaptionDraft }
  | { type: 'transcript_segment_committed'; segment: TranscriptSegment }
  | { type: 'transcript_segment_updated'; segment: TranscriptSegment };

export type OnCaptionEventCallback = (event: CaptionEvent) => void;

export function normalizeForDedupe(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[\n\r]+/g, ' ')
    .trim();
}

export function hashText(normalized: string): string {
  let hash = 0;
  if (normalized.length === 0) return '0';
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString(36);
}

export function isMeetSystemText(text: string): boolean {
  const norm = normalizeForDedupe(text);
  const systemPhrases = [
    'esta participando', 'sua camera esta desativada', 'seu microfone esta desativado',
    'organizador encerrou', 'reuniao encerrada', 'idioma', 'language', 'portugues brasil',
    'tamanho da fonte', 'format_size', 'cor da fonte', 'abrir configuracoes',
    'configuracoes de legenda', 'captions', 'settings', 'circle', 'cc',
    'participante entrou', 'participante saiu', 'esta apresentando', 'apresentacao de',
    'compartilhando a tela', 'gostaria de falar', 'pediu para participar',
    'permitir', 'desativar som', 'ativar som', 'sair da chamada', 'detalhes da reuniao',
    'sua reuniao esta pronta', 'adicionar outras pessoas', 'ou compartilhe este link',
    'precisarao receber sua permissao', 'participando como', 'copiar link', 'content_copy', 'person_add'
  ];
  return systemPhrases.some(phrase => norm.includes(phrase));
}

export function cleanSpeakerFromText(speaker: string, text: string): string {
  let cleaned = text.trim();
  const lowerSpeaker = speaker.toLowerCase().trim();
  
  cleaned = cleaned.replace(/^(Você\s*)+/i, '').trim();
  
  if (lowerSpeaker && lowerSpeaker !== 'desconhecido') {
    const lowerText = cleaned.toLowerCase();
    if (lowerText.startsWith(lowerSpeaker + ' ')) {
      cleaned = cleaned.substring(speaker.length).trim();
    }
  }
  
  return cleaned;
}

export function isExpansionOfSameCaption(prevNorm: string, newNorm: string): boolean {
  if (!prevNorm || !newNorm) return false;
  if (newNorm.startsWith(prevNorm)) return true;
  if (newNorm.includes(prevNorm)) return true;
  return false; 
}

export function isExpansionOfCommittedSegment(committedNorm: string, newNorm: string): boolean {
  if (!committedNorm || !newNorm) return false;
  if (newNorm.startsWith(committedNorm)) return true;
  if (newNorm.includes(committedNorm)) return true;

  const commWords = committedNorm.split(' ').filter(w => w.length > 0);
  const newWords = newNorm.split(' ').filter(w => w.length > 0);
  
  if (commWords.length < 3) return false;
  
  // Verificar prefixo exato LCP
  let matchCount = 0;
  const minLen = Math.min(commWords.length, newWords.length);
  for (let i = 0; i < minLen; i++) {
    if (commWords[i] === newWords[i]) {
      matchCount++;
    } else {
      break;
    }
  }
  // Se bater 60% do prefixo perfeitamente, é expansão
  if (matchCount / commWords.length >= 0.60) return true;
  
  // Similaridade de overlap de palavras (bag of words)
  const overlap = commWords.filter(w => newWords.includes(w)).length;
  // Se 75% das palavras do commit original estiverem no novo texto
  if (commWords.length >= 4 && overlap / commWords.length >= 0.75) return true;

  return false;
}

export function extractNovelSuffix(previousText: string, newText: string): string {
  const pNorm = normalizeForDedupe(previousText);
  const nNorm = normalizeForDedupe(newText);
  
  if (!nNorm.includes(pNorm)) return newText; // Se não contiver, é tudo novo
  
  // Tentar encontrar o sufixo no texto original (case insensitive search via regex)
  // Escapar o texto anterior para regex
  const escapedPrev = previousText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escapedPrev, 'i');
  
  const match = newText.match(regex);
  if (match && match.index !== undefined) {
    const suffix = newText.slice(match.index + match[0].length).trim();
    if (suffix.startsWith('.') || suffix.startsWith(',')) {
      return suffix.substring(1).trim();
    }
    return suffix;
  }
  
  return newText;
}

function isInsideSettingsOrMenu(el: HTMLElement): boolean {
  let parent = el.parentElement;
  while (parent) {
    const role = parent.getAttribute('role');
    if (role === 'menu' || role === 'dialog' || role === 'tabpanel') {
      return true;
    }
    if (parent.classList.contains('xl4id') || parent.classList.contains('Q551Z') || parent.classList.contains('FK844c')) {
      return true;
    }
    parent = parent.parentElement;
  }
  return false;
}

export class CaptionExtractor {
  private observer: MutationObserver | null = null;
  private onEvent: OnCaptionEventCallback;
  private isCapturing: boolean = false;
  private meetingId: string;
  
  private activeDraft: LiveCaptionDraft | null = null;
  private commitTimer: ReturnType<typeof setTimeout> | null = null;
  private emittedHashes: Set<string> = new Set();
  
  // Rolling segment memory
  private recentCommittedSegments: TranscriptSegment[] = [];
  
  // Telemetria / Debug (Tarefa 11)
  public activeDraftText = '';
  public activeDraftSpeaker = '';
  public activeDraftUpdatedAt = 0;
  public committedSegmentsCount = 0;
  public draftUpdateCount = 0;
  public lastCommitReason = '';
  public lastDiscardReason = '';
  public lastCleanedText = '';
  public lastSpeakerCleaned = '';
  
  // Novos campos do Rolling Segment
  public lastCommittedText = '';
  public lastCommittedId = '';
  public lastSegmentUpdatedId = '';
  public updateReason = '';
  public isExpansionOfCommitted = false;
  public novelSuffix = '';
  public segmentUpdatedCount = 0;

  public currentCaptureAllowed = false;
  public captureBlockedReason = '';
  public lastSystemTextFiltered = '';
  public systemTextFilteredCount = 0;
  public lastMutationAt = 0;

  constructor(meetingId: string, onEvent: OnCaptionEventCallback) {
    this.meetingId = meetingId;
    this.onEvent = onEvent;
  }

  public getEmittedHashesCount(): number {
    return this.emittedHashes.size;
  }

  public start() {
    if (this.isCapturing) return;
    this.observer = new MutationObserver(this.handleMutations.bind(this));
    try {
      this.observer.observe(document.body, { childList: true, subtree: true, characterData: true });
      this.isCapturing = true;
    } catch (err: any) {
      console.error('[CaptionExtractor] Erro start:', err);
    }
  }

  public stop() {
    if (!this.isCapturing) return;
    this.forceCommitActiveDraft('stop-capture');
    this.emittedHashes.clear();
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.isCapturing = false;
  }

  public reconnect() {
    if (this.isCapturing && this.observer) {
      try {
        this.observer.disconnect();
        this.observer.observe(document.body, { childList: true, subtree: true, characterData: true });
        console.log('[CaptionExtractor] Observer reconectado com sucesso.');
      } catch (err) {
        console.error('[CaptionExtractor] Erro ao reconectar observer:', err);
      }
    }
  }

  private generateId(): string {
    return 'seg-' + Math.random().toString(36).substring(2, 11);
  }

  private handleMutations(_mutations: MutationRecord[]) {
    this.lastMutationAt = Date.now();
    let containerFound: HTMLElement | null = null;
    for (const selector of MEET_SELECTORS.CAPTIONS_CONTAINERS) {
      const el = document.querySelector(selector) as HTMLElement;
      if (el && !isInsideSettingsOrMenu(el)) {
        containerFound = el;
        break;
      }
    }

    const state = MeetingDetector.detectState();
    
    // Se o estado não for ACTIVE, MAS houver um container e tiver texto ou draft ativo, permitimos.
    const hasActiveText = containerFound && containerFound.textContent && containerFound.textContent.trim().length > 0;
    
    if (state !== 'ACTIVE' && !hasActiveText && !this.activeDraft) {
      this.forceCommitActiveDraft('meeting-inactive');
      this.currentCaptureAllowed = false;
      this.captureBlockedReason = `Reunião inativa: ${state}`;
      return;
    }

    this.currentCaptureAllowed = true;
    this.captureBlockedReason = 'Nenhum';

    if (!containerFound) return;

    const blocks = containerFound.children;
    if (blocks.length === 0) {
      this.processBlockElement(containerFound);
      return;
    }
    for (let i = 0; i < blocks.length; i++) {
      this.processBlockElement(blocks[i] as HTMLElement);
    }
  }

  private processBlockElement(blockEl: HTMLElement) {
    const rawText = (blockEl.innerText || '').trim();
    if (!rawText) return;

    let speaker = 'Desconhecido';
    for (const sel of MEET_SELECTORS.SPEAKER_NAMES) {
      const el = blockEl.querySelector(sel);
      if (el) {
        speaker = (el.textContent || '').trim();
        break;
      }
    }

    let text = '';
    const textSegments: string[] = [];
    for (const sel of MEET_SELECTORS.CAPTION_TEXTS) {
      const nodes = blockEl.querySelectorAll(sel);
      if (nodes.length > 0) {
        nodes.forEach(node => {
          const t = (node.textContent || '').trim();
          if (t) textSegments.push(t);
        });
        break;
      }
    }

    if (textSegments.length > 0) {
      text = textSegments.join(' ');
    } else {
      text = rawText; // fallback simple
    }

    if (isMeetSystemText(text)) {
      this.systemTextFilteredCount++;
      this.lastSystemTextFiltered = text;
      return;
    }
    
    // Limpar
    let cleanedText = cleanSpeakerFromText(speaker, text);
    this.lastCleanedText = cleanedText;
    this.lastSpeakerCleaned = speaker;

    if (cleanedText.length < 2) return;

    const normText = normalizeForDedupe(cleanedText);
    const now = Date.now();
    
    // 1. Tentar fazer Upsert (Rolling Segment)
    const recentCommits = [...this.recentCommittedSegments].reverse(); // Do mais recente para o mais antigo
    let updatedCommitted = false;
    
    for (const seg of recentCommits) {
      if (now - seg.captured_at > 20000) continue; // Ignorar se muito antigo (20s)
      
      const isSameSpeaker = seg.speaker === speaker || seg.speaker === 'Desconhecido';
      
      if (isSameSpeaker && isExpansionOfCommittedSegment(seg.normalized_text || '', normText)) {
        // Encontramos um match! Vamos atualizar o segmento existente
        
        // Se a expansão for apenas o que o draft já tem, evitamos duplicar no DB excessivamente, 
        // mas devemos emitir o update.
        seg.text = cleanedText;
        seg.normalized_text = normText;
        seg.normalized_hash = hashText(normText);
        seg.captured_at = now;
        seg.updated_count = (seg.updated_count || 0) + 1;
        
        this.emittedHashes.add(seg.normalized_hash);
        
        this.lastSegmentUpdatedId = seg.id;
        this.updateReason = 'expansion-of-committed';
        this.isExpansionOfCommitted = true;
        this.segmentUpdatedCount++;
        
        // Limpar o draft atual, já que a nova fala foi engolida pelo commit anterior
        if (this.activeDraft) {
          this.activeDraft = null;
          this.activeDraftText = '';
          this.activeDraftSpeaker = '';
          this.emitDraftUpdated();
        }
        
        // Reiniciar timer para não comitar nada falso
        this.resetCommitTimer();
        
        this.onEvent({ type: 'transcript_segment_updated', segment: seg });
        updatedCommitted = true;
        break;
      }
    }
    
    if (updatedCommitted) {
      return; // Já resolvemos via Upsert
    }
    
    this.isExpansionOfCommitted = false;
    
    // 2. Se não foi update, tentamos atualizar o Draft ativo
    if (this.activeDraft) {
      const isSameSpeaker = this.activeDraft.speaker === speaker;
      const isExpansion = isExpansionOfSameCaption(this.activeDraft.normalized_text, normText);
      
      if (isSameSpeaker && (isExpansion || normText.includes(this.activeDraft.normalized_text))) {
        // Atualiza o draft
        this.activeDraft.text = cleanedText;
        this.activeDraft.normalized_text = normText;
        this.activeDraft.updated_at = now;
        
        this.activeDraftText = cleanedText;
        this.activeDraftSpeaker = speaker;
        this.activeDraftUpdatedAt = now;
        this.draftUpdateCount++;
        
        this.emitDraftUpdated();
        this.resetCommitTimer();
      } else {
        // Speaker trocou ou nova frase clara - Commit do draft anterior
        this.forceCommitActiveDraft('speaker-change-or-new-caption');
        
        // Tentar extrair sufixo se a nova frase tiver engolido a antiga
        let suffix = cleanedText;
        if (isSameSpeaker && this.lastCommittedText && normText.includes(normalizeForDedupe(this.lastCommittedText))) {
           suffix = extractNovelSuffix(this.lastCommittedText, cleanedText);
           this.novelSuffix = suffix;
        }
        
        if (suffix.length > 2) {
          this.startNewDraft(speaker, suffix, normalizeForDedupe(suffix), now);
        }
      }
    } else {
      // Nenhum draft ativo, cria um
      let suffix = cleanedText;
      const last = this.recentCommittedSegments.length > 0 ? this.recentCommittedSegments[this.recentCommittedSegments.length - 1] : null;
      if (last && (last.speaker === speaker || last.speaker === 'Desconhecido') && normText.includes(last.normalized_text || '')) {
         suffix = extractNovelSuffix(last.text, cleanedText);
         this.novelSuffix = suffix;
      }
      
      if (suffix.length > 2) {
        this.startNewDraft(speaker, suffix, normalizeForDedupe(suffix), now);
      }
    }
  }

  private startNewDraft(speaker: string, text: string, normText: string, now: number) {
    this.activeDraft = {
      id: this.generateId(),
      speaker,
      text,
      normalized_text: normText,
      started_at: now,
      updated_at: now,
      source_node_signature: '',
      status: 'live'
    };
    this.activeDraftText = text;
    this.activeDraftSpeaker = speaker;
    this.activeDraftUpdatedAt = now;
    
    this.emitDraftUpdated();
    this.resetCommitTimer();
  }

  private resetCommitTimer() {
    if (this.commitTimer) clearTimeout(this.commitTimer);
    // Regra de Commit: 3 segundos inativo (Tarefa 6)
    this.commitTimer = setTimeout(() => {
      this.forceCommitActiveDraft('timeout-3s');
    }, 3000);
  }

  private forceCommitActiveDraft(reason: string) {
    if (this.commitTimer) {
      clearTimeout(this.commitTimer);
      this.commitTimer = null;
    }
    
    if (!this.activeDraft) return;
    
    const draft = this.activeDraft;
    this.activeDraft = null;
    this.activeDraftText = '';
    this.activeDraftSpeaker = '';

    const hash = hashText(draft.normalized_text);
    
    if (draft.normalized_text.length < 2) {
      this.lastDiscardReason = 'too-short';
      return;
    }
    
    if (this.emittedHashes.has(hash)) {
      this.lastDiscardReason = 'already-committed';
      return;
    }
    
    this.emittedHashes.add(hash);
    this.lastCommitReason = reason;
    this.committedSegmentsCount++;

    const segment: TranscriptSegment = {
      id: draft.id,
      meeting_id: this.meetingId,
      timestamp: new Date(draft.started_at).toISOString(),
      speaker: draft.speaker || 'Desconhecido',
      text: draft.text,
      source: 'google-meet',
      captured_at: draft.updated_at,
      normalized_text: draft.normalized_text,
      normalized_hash: hash,
      dedupe_reason: reason,
      updated_count: 0
    };
    
    this.lastCommittedText = segment.text;
    this.lastCommittedId = segment.id;
    
    this.recentCommittedSegments.push(segment);
    if (this.recentCommittedSegments.length > 10) {
      this.recentCommittedSegments.shift();
    }

    this.onEvent({ type: 'transcript_segment_committed', segment });
  }

  private emitDraftUpdated() {
    if (this.activeDraft) {
      this.onEvent({ type: 'caption_draft_updated', draft: this.activeDraft });
    }
  }
}
