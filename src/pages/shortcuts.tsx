import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useToast } from "../hooks/use-toast";

interface Shortcut {
  id: string;
  keys: string[];
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  canPractice: boolean;
  systemNote?: string;
}

const shortcuts: Shortcut[] = [
  // Essenciais - Atalhos universais que todos devem conhecer
  { id: 'copy', keys: ['Ctrl', 'C'], description: 'Copiar item selecionado', category: 'essential', difficulty: 'easy', canPractice: true },
  { id: 'paste', keys: ['Ctrl', 'V'], description: 'Colar item copiado', category: 'essential', difficulty: 'easy', canPractice: true },
  { id: 'cut', keys: ['Ctrl', 'X'], description: 'Recortar item selecionado', category: 'essential', difficulty: 'easy', canPractice: true },
  { id: 'undo', keys: ['Ctrl', 'Z'], description: 'Desfazer última ação', category: 'essential', difficulty: 'easy', canPractice: true },
  { id: 'select-all', keys: ['Ctrl', 'A'], description: 'Selecionar tudo', category: 'essential', difficulty: 'easy', canPractice: true },
  { id: 'redo', keys: ['Ctrl', 'Y'], description: 'Refazer última ação', category: 'essential', difficulty: 'easy', canPractice: true },

  // Básicos - Atalhos comuns e muito úteis
  { id: 'find', keys: ['Ctrl', 'F'], description: 'Abrir busca na página', category: 'basic', difficulty: 'easy', canPractice: true },
  { id: 'bold', keys: ['Ctrl', 'B'], description: 'Aplicar negrito ao texto', category: 'basic', difficulty: 'easy', canPractice: true },
  { id: 'italic', keys: ['Ctrl', 'I'], description: 'Aplicar itálico ao texto', category: 'basic', difficulty: 'easy', canPractice: true },
  { id: 'underline', keys: ['Ctrl', 'U'], description: 'Aplicar sublinhado ao texto', category: 'basic', difficulty: 'easy', canPractice: true },

  // Intermediários - Para quem já domina os básicos
  { id: 'word-left', keys: ['Ctrl', '←'], description: 'Mover cursor uma palavra à esquerda', category: 'intermediate', difficulty: 'medium', canPractice: true },
  { id: 'word-right', keys: ['Ctrl', '→'], description: 'Mover cursor uma palavra à direita', category: 'intermediate', difficulty: 'medium', canPractice: true },
  { id: 'select-word-left', keys: ['Ctrl', 'Shift', '←'], description: 'Selecionar palavra à esquerda', category: 'intermediate', difficulty: 'medium', canPractice: true },
  { id: 'select-word-right', keys: ['Ctrl', 'Shift', '→'], description: 'Selecionar palavra à direita', category: 'intermediate', difficulty: 'medium', canPractice: true },

  // Referência - Atalhos úteis mas não praticáveis aqui
  { id: 'save', keys: ['Ctrl', 'S'], description: 'Salvar arquivo atual', category: 'reference', difficulty: 'easy', canPractice: false, systemNote: 'Interceptado pelo navegador' },
  { id: 'refresh', keys: ['Ctrl', 'R'], description: 'Recarregar página', category: 'reference', difficulty: 'easy', canPractice: false, systemNote: 'Interceptado pelo navegador' },
  { id: 'new-tab', keys: ['Ctrl', 'T'], description: 'Abrir nova aba (navegadores)', category: 'reference', difficulty: 'easy', canPractice: false, systemNote: 'Interceptado pelo navegador' },
  { id: 'close-tab', keys: ['Ctrl', 'W'], description: 'Fechar aba atual', category: 'reference', difficulty: 'easy', canPractice: false, systemNote: 'Interceptado pelo navegador' },
  { id: 'alt-tab', keys: ['Alt', 'Tab'], description: 'Alternar entre programas abertos', category: 'reference', difficulty: 'medium', canPractice: false, systemNote: 'Interceptado pelo sistema operacional' },
  { id: 'win-d', keys: ['Win', 'D'], description: 'Mostrar área de trabalho', category: 'reference', difficulty: 'medium', canPractice: false, systemNote: 'Interceptado pelo sistema operacional' },
  { id: 'win-l', keys: ['Win', 'L'], description: 'Bloquear computador', category: 'reference', difficulty: 'medium', canPractice: false, systemNote: 'Interceptado pelo sistema operacional' },
  
  // Teclas especiais - Podem não estar disponíveis em todos os teclados
  { id: 'line-start', keys: ['Home'], description: 'Ir para início da linha', category: 'special', difficulty: 'medium', canPractice: false, systemNote: 'Tecla pode não estar disponível em todos os teclados' },
  { id: 'line-end', keys: ['End'], description: 'Ir para fim da linha', category: 'special', difficulty: 'medium', canPractice: false, systemNote: 'Tecla pode não estar disponível em todos os teclados' },
  { id: 'delete-word', keys: ['Ctrl', 'Backspace'], description: 'Apagar palavra anterior', category: 'special', difficulty: 'hard', canPractice: false, systemNote: 'Comportamento varia entre navegadores' },
  { id: 'doc-home', keys: ['Ctrl', 'Home'], description: 'Ir para início do documento', category: 'special', difficulty: 'medium', canPractice: false, systemNote: 'Requer tecla Home + interceptado pelo navegador' },
  { id: 'doc-end', keys: ['Ctrl', 'End'], description: 'Ir para fim do documento', category: 'special', difficulty: 'medium', canPractice: false, systemNote: 'Requer tecla End + interceptado pelo navegador' }
];

export default function Shortcuts() {
  const [practiceMode, setPracticeMode] = useState(false);
  const [currentShortcut, setCurrentShortcut] = useState<Shortcut | null>(null);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [practiceText, setPracticeText] = useState("");
  const practiceAreaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const categoryNames: Record<string, string> = {
    essential: 'Essenciais',
    basic: 'Básicos',
    intermediate: 'Intermediários',
    reference: 'Referência',
    special: 'Teclas Especiais'
  };

  const difficultyColors: Record<string, string> = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800'
  };

  // Normalize key names for consistent detection
  const normalizeKey = (key: string): string => {
    const keyMap: Record<string, string> = {
      'Control': 'Ctrl',
      'Meta': 'Win',
      'Command': 'Win',
      'ArrowLeft': '←',
      'ArrowRight': '→',
      'ArrowUp': '↑',
      'ArrowDown': '↓',
      ' ': 'Space'
    };
    return keyMap[key] || key;
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!practiceMode || !currentShortcut) return;

    // Always prevent default for practice shortcuts to avoid browser interference
    if (event.ctrlKey || event.altKey || event.metaKey) {
      event.preventDefault();
    }

    const normalizedKey = normalizeKey(event.key);
    
    // Add key to pressed set
    const newPressedKeys = new Set([...pressedKeys, normalizedKey]);
    setPressedKeys(newPressedKeys);
    
    // Check if we have all required keys
    const requiredKeys = new Set(currentShortcut.keys);
    
    // Check if all required keys are pressed
    const allKeysPressed = currentShortcut.keys.every(key => newPressedKeys.has(key));
    
    if (allKeysPressed && newPressedKeys.size === requiredKeys.size) {
      // Correct combination
      setScore(prev => prev + 1);
      setAttempts(prev => prev + 1);
      
      toast({
        title: "Correto! ✅",
        description: `${currentShortcut.keys.join(' + ')}: ${currentShortcut.description}`,
      });
      
      setTimeout(() => {
        getRandomShortcut();
        setPressedKeys(new Set());
      }, 1500);
      
    } else if (newPressedKeys.size > requiredKeys.size) {
      // Too many keys pressed
      setAttempts(prev => prev + 1);
      
      toast({
        title: "Tente novamente ❌",
        description: `Muitas teclas pressionadas. Combinação correta: ${currentShortcut.keys.join(' + ')}`,
        variant: "destructive"
      });
      
      setPressedKeys(new Set());
    }
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    if (!practiceMode) return;
    
    const normalizedKey = normalizeKey(event.key);
    setPressedKeys(prev => {
      const newSet = new Set(prev);
      newSet.delete(normalizedKey);
      return newSet;
    });
  };

  const getRandomShortcut = () => {
    // Prioritize essential and basic shortcuts for practice
    const practiceableShortcuts = shortcuts.filter(s => s.canPractice);
    const priorityShortcuts = practiceableShortcuts.filter(s => 
      s.category === 'essential' || s.category === 'basic'
    );
    
    // 80% chance to get priority shortcuts, 20% for intermediate
    const usePriority = Math.random() < 0.8;
    const shortcutsToChooseFrom = usePriority && priorityShortcuts.length > 0 
      ? priorityShortcuts 
      : practiceableShortcuts;
    
    const randomIndex = Math.floor(Math.random() * shortcutsToChooseFrom.length);
    setCurrentShortcut(shortcutsToChooseFrom[randomIndex]);
    setPressedKeys(new Set());
  };

  const startPractice = () => {
    setPracticeMode(true);
    setScore(0);
    setAttempts(0);
    setPracticeText("Foque nesta área e execute os atalhos...");
    getRandomShortcut();
    
    // Focus on practice area
    setTimeout(() => {
      practiceAreaRef.current?.focus();
    }, 100);
  };

  const stopPractice = () => {
    setPracticeMode(false);
    setCurrentShortcut(null);
    setPressedKeys(new Set());
    setPracticeText("");
  };

  // Effect to manage keyboard event listeners
  useEffect(() => {
    if (practiceMode) {
      const handleKeyDownWrapper = (e: KeyboardEvent) => handleKeyDown(e);
      const handleKeyUpWrapper = (e: KeyboardEvent) => handleKeyUp(e);
      
      document.addEventListener('keydown', handleKeyDownWrapper);
      document.addEventListener('keyup', handleKeyUpWrapper);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDownWrapper);
        document.removeEventListener('keyup', handleKeyUpWrapper);
      };
    }
  }, [practiceMode, currentShortcut, pressedKeys]);

  const renderShortcutKeys = (keys: string[]) => {
    return (
      <div className="flex items-center space-x-1">
        {keys.map((key, index) => (
          <span key={index} className="flex items-center">
            <kbd className={`px-3 py-2 border rounded text-sm font-mono ${
              Array.from(pressedKeys).includes(key)
                ? 'bg-green-200 border-green-400 text-green-800' 
                : 'bg-slate-100 border-slate-300 text-slate-700'
            }`}>
              {key}
            </kbd>
            {index < keys.length - 1 && <span className="mx-2 text-slate-400 font-bold">+</span>}
          </span>
        ))}
      </div>
    );
  };

  const shortcutsByCategory = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Atalhos de Teclado</h1>
        <p className="text-slate-600">
          Domine os atalhos essenciais para aumentar sua produtividade
        </p>
      </div>

      {/* Practice Mode */}
      {practiceMode ? (
        <div className="space-y-6">
          {/* Practice Area */}
          <Card className="bg-gradient-to-r from-primary/10 to-blue/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Área de Prática</span>
                <Button 
                  onClick={stopPractice}
                  variant="outline"
                  size="sm"
                  data-testid="button-stop-practice"
                >
                  Parar Prática
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                ref={practiceAreaRef}
                value={practiceText}
                onChange={(e) => setPracticeText(e.target.value)}
                placeholder="Clique aqui e execute os atalhos solicitados..."
                className="w-full h-32 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                data-testid="practice-textarea"
              />
              <p className="text-sm text-slate-600 mt-2">
                💡 Esta é sua área de prática. Clique aqui primeiro, depois execute os atalhos que aparecerem abaixo.
              </p>
            </CardContent>
          </Card>

          {/* Current Challenge */}
          {currentShortcut && (
            <Card className="bg-gradient-to-r from-primary to-blue-600 text-white">
              <CardHeader>
                <CardTitle>Execute este atalho:</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-xl text-blue-100 mb-4">{currentShortcut.description}</p>
                    <div className="flex justify-center mb-4">
                      {renderShortcutKeys(currentShortcut.keys)}
                    </div>
                    <Badge className="bg-white/20 text-white">
                      {categoryNames[currentShortcut.category]} - {currentShortcut.difficulty}
                    </Badge>
                  </div>

                  <div className="flex justify-center space-x-8 text-center">
                    <div>
                      <p className="text-2xl font-bold">{score}</p>
                      <p className="text-blue-200 text-sm">Acertos</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{attempts}</p>
                      <p className="text-blue-200 text-sm">Tentativas</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {attempts > 0 ? Math.round((score / attempts) * 100) : 0}%
                      </p>
                      <p className="text-blue-200 text-sm">Precisão</p>
                    </div>
                  </div>

                  {pressedKeys.size > 0 && (
                    <div className="text-center">
                      <p className="text-blue-200 text-sm mb-2">Teclas pressionadas:</p>
                      <div className="flex justify-center">
                        <div className="flex items-center space-x-1">
                          {Array.from(pressedKeys).map((key, index) => (
                            <span key={index} className="flex items-center">
                              <kbd className="px-3 py-2 bg-green-200 border border-green-400 rounded text-sm font-mono text-green-800">
                                {key}
                              </kbd>
                              {index < pressedKeys.size - 1 && <span className="mx-2 text-blue-200 font-bold">+</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Modo Prática Interativa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 mb-2">
                    Pratique os atalhos de forma interativa. O sistema irá mostrar uma descrição e você deve executar o atalho correto na área de prática.
                  </p>
                  <p className="text-sm text-slate-500">
                    📝 Dica: Mantenha todas as teclas pressionadas simultaneamente
                  </p>
                </div>
                <Button 
                  onClick={startPractice}
                  className="bg-primary hover:bg-blue-600"
                  data-testid="button-start-practice"
                >
                  Iniciar Prática
                </Button>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  <strong>Foco na prática:</strong> O sistema prioriza atalhos essenciais e básicos que todos podem usar facilmente. 
                  Atalhos mais avançados ou específicos ficam disponíveis como referência.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shortcuts Reference */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all" data-testid="tab-all-shortcuts">Todos</TabsTrigger>
          <TabsTrigger value="essential" data-testid="tab-essential-shortcuts">Essenciais</TabsTrigger>
          <TabsTrigger value="basic" data-testid="tab-basic-shortcuts">Básicos</TabsTrigger>
          <TabsTrigger value="intermediate" data-testid="tab-intermediate-shortcuts">Intermediários</TabsTrigger>
          <TabsTrigger value="reference" data-testid="tab-reference-shortcuts">Referência</TabsTrigger>
          <TabsTrigger value="special" data-testid="tab-special-shortcuts">Especiais</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="space-y-6">
            {/* Practice Notice */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Como funciona a prática</h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <p><strong>🟢 Praticáveis:</strong> Atalhos que funcionam perfeitamente na aplicação</p>
                  <p><strong>🟡 Referência:</strong> Atalhos úteis mas interceptados pelo navegador/sistema</p>
                  <p><strong>🔵 Especiais:</strong> Dependem de teclas que podem não estar em todos os teclados</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shortcuts.map((shortcut) => (
                <Card key={shortcut.id} className={`hover:shadow-md transition-shadow ${
                  !shortcut.canPractice ? 'bg-orange-50 border-orange-200' : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        {renderShortcutKeys(shortcut.keys)}
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge className={difficultyColors[shortcut.difficulty]}>
                          {shortcut.difficulty}
                        </Badge>
                        {!shortcut.canPractice && (
                          <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800">
                            Referência
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 mb-2">{shortcut.description}</p>
                    {shortcut.systemNote && (
                      <p className="text-xs text-orange-600 mb-2">⚠️ {shortcut.systemNote}</p>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {categoryNames[shortcut.category]}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {Object.entries(shortcutsByCategory).map(([category, categoryShortcuts]) => (
          <TabsContent key={category} value={category}>
            <div className="space-y-6">
              <Card className="bg-gradient-to-r from-slate-50 to-slate-100">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {categoryNames[category]}
                  </h3>
                  <p className="text-slate-600">
                    {category === 'essential' && 'Atalhos que todos devem conhecer - universais e amplamente utilizados'}
                    {category === 'basic' && 'Atalhos comuns e muito úteis no dia a dia'}
                    {category === 'intermediate' && 'Para quem já domina os atalhos essenciais e básicos'}
                    {category === 'reference' && 'Atalhos úteis mas interceptados pelo navegador/sistema'}
                    {category === 'special' && 'Atalhos que dependem de teclas especiais ou têm comportamento inconsistente'}
                  </p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {categoryShortcuts.map((shortcut) => (
                  <Card key={shortcut.id} className={`hover:shadow-md transition-shadow ${
                    !shortcut.canPractice ? 'bg-orange-50 border-orange-200' : ''
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          {renderShortcutKeys(shortcut.keys)}
                        </div>
                        <div className="flex flex-col gap-1">
                          <Badge className={difficultyColors[shortcut.difficulty]}>
                            {shortcut.difficulty}
                          </Badge>
                          {!shortcut.canPractice && (
                            <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800">
                              Referência
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-700 mb-2">{shortcut.description}</p>
                      {shortcut.systemNote && (
                        <p className="text-xs text-orange-600">⚠️ {shortcut.systemNote}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}