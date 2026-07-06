export class TabAudioCapture {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private onTranscriptionReceived: (text: string, timestamp: string) => void;
  private intervalId: any = null;
  public isRecording: boolean = false;
  
  constructor(onTranscription: (text: string, timestamp: string) => void) {
    this.onTranscriptionReceived = onTranscription;
  }

  public async start() {
    if (this.isRecording) return;
    try {
      // Solicitamos a permissão e o stream do tab ativo
      const stream = await this.getTabStream();
      if (!stream) {
        throw new Error("Não foi possível obter o áudio da aba.");
      }
      
      this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      this.isRecording = true;

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      
      // A cada 10 segundos, para o recorder, envia o áudio, e reinicia
      this.intervalId = setInterval(() => {
        this.processChunk();
      }, 10000);
      
    } catch (e) {
      console.error("[TabAudioCapture] Erro ao iniciar captura:", e);
      throw e;
    }
  }

  public stop() {
    if (!this.isRecording) return;
    this.isRecording = false;
    clearInterval(this.intervalId);
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    
    // Process final chunk
    setTimeout(() => this.processChunk(), 500);
  }

  private async processChunk() {
    if (!this.mediaRecorder) return;
    
    // Para forçar o ondataavailable
    if (this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
      this.mediaRecorder.start();
    }
    
    if (this.audioChunks.length === 0) return;
    
    const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
    this.audioChunks = []; // Reseta o buffer
    
    // Converte para base64
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const base64data = reader.result as string;
      const base64Content = base64data.split(',')[1];
      
      try {
        const backendUrl = import.meta.env.VITE_TODEACORDO_API_BASE_URL || '';
        const res = await fetch(`${backendUrl}/api/transcribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            audio: base64Content,
            mimetype: 'audio/webm'
          })
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.text && data.text.trim().length > 2) {
            this.onTranscriptionReceived(data.text, data.timestamp);
          }
        } else {
          console.error('[TabAudioCapture] Erro no STT:', await res.text());
        }
      } catch (err) {
        console.error('[TabAudioCapture] Erro de rede STT:', err);
      }
    };
  }

  private getTabStream(): Promise<MediaStream> {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || tabs.length === 0) {
          reject(new Error("Nenhuma aba ativa encontrada."));
          return;
        }
        
        const targetTabId = tabs[0].id;
        
        chrome.tabCapture.getMediaStreamId({ targetTabId }, (streamId) => {
          if (!streamId) {
            reject(new Error(`Erro tabCapture: ${chrome.runtime.lastError?.message || 'Sem streamId'}`));
            return;
          }
          
          navigator.mediaDevices.getUserMedia({
            audio: {
              mandatory: {
                chromeMediaSource: 'tab',
                chromeMediaSourceId: streamId
              }
            } as any
          }).then(stream => {
            resolve(stream);
          }).catch(err => {
            reject(new Error("Erro getUserMedia: " + err.message));
          });
        });
      });
    });
  }
}
