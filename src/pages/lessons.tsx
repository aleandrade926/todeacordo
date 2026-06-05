import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";

const theoreticalLessons = [
  {
    id: 1,
    title: "Seu Novo Superpoder - Conhecendo o Teclado",
    description: "Aprenda sobre as diferentes zonas do teclado e encontre as marcas táteis em F e J",
    content: `
      <h3>O Mapa do Tesouro em Suas Mãos</h3>
      <p>Para dominar qualquer ferramenta, primeiro precisamos entender sua estrutura. Seu teclado é dividido em algumas áreas principais:</p>
      <ul>
        <li><strong>Zona Alfabética:</strong> O coração do teclado, onde as letras vivem.</li>
        <li><strong>Fileira Guia (Home Row):</strong> A fileira central de letras (ASDF JKLÇ). Ela é a sua base, seu ponto de partida e de retorno para cada movimento.</li>
        <li><strong>Teclas de Modificação:</strong> Teclas como Shift, Ctrl e Alt. Elas são como "temperos" que dão novos poderes às outras teclas.</li>
      </ul>
      
      <h3>O Ponto de Partida Secreto: As Marcas em 'F' e 'J'</h3>
      <p>Passe o dedo indicador sobre as teclas 'F' e 'J' agora mesmo. Sentiu um pequeno relevo nelas? Essas não são marcas aleatórias. Elas são suas guias táteis, projetadas para que você encontre a posição inicial correta sem precisar olhar.</p>
    `,
    duration: "5 min",
    category: "fundamentos"
  },
  {
    id: 2,
    title: "O Segredo dos Profissionais - Digitando com a Mente",
    description: "Entenda como funciona a digitação por tato e as 3 fases da evolução",
    content: `
      <h3>Como a Mágica Acontece?</h3>
      <p>Digitar por tato significa criar uma conexão direta entre seu cérebro e seus dedos, liberando seus olhos para se concentrarem no texto, na tela, na sua criação.</p>
      
      <h3>As 3 Fases da Sua Evolução</h3>
      <ol>
        <li><strong>Fase 1: O Estranho no Ninho (Dias 1-7):</strong> No começo, vai parecer lento e difícil. Você vai pensar em cada letra. Isso é normal!</li>
        <li><strong>Fase 2: As Coisas Começam a Fluir (Dias 8-21):</strong> Aqui, a mágica começa. Você vai errar menos e a velocidade começará a aumentar naturalmente.</li>
        <li><strong>Fase 3: O Piloto Automático (Dias 22+):</strong> Você não pensa mais para digitar, você apenas digita. Seus dedos sabem o que fazer.</li>
      </ol>
    `,
    duration: "7 min",
    category: "fundamentos"
  },
  {
    id: 3,
    title: "O Alicerce do Velocista - Sua Postura Ergonômica",
    description: "Configure sua estação de trabalho para máximo conforto e eficiência",
    content: `
      <h3>Arrumando Sua Estação de Batalha</h3>
      <p>Digitar rápido com a postura errada é a receita para dores, fadiga e até lesões sérias. A ergonomia é o que vai te dar a resistência para ser veloz por muito mais tempo.</p>
      
      <h4>Ajustes importantes:</h4>
      <ul>
        <li><strong>O Monitor:</strong> Posicione-o de forma que o topo da tela fique na altura dos seus olhos. Você deve olhar levemente para baixo.</li>
        <li><strong>A Cadeira:</strong> Seus pés devem estar firmemente apoiados no chão, com os joelhos formando um ângulo próximo a 90 graus.</li>
        <li><strong>O Teclado e os Braços:</strong> Seus cotovelos também devem formar um ângulo de 90 graus. Seus pulsos devem ficar retos e relaxados.</li>
      </ul>
      
      <h3>A Regra de Ouro: 20-20-20</h3>
      <p>A cada 20 minutos de trabalho focado na tela, desvie o olhar por 20 segundos para um objeto que esteja a 20 pés de distância (cerca de 6 metros).</p>
    `,
    duration: "6 min",
    category: "ergonomia"
  },
  {
    id: 4,
    title: "O Salto Quântico da Produtividade - Atalhos de Teclado",
    description: "Domine os atalhos essenciais que funcionam em quase todo lugar",
    content: `
      <h3>Os Atalhos Essenciais</h3>
      <p>Se digitar rápido é como correr, usar atalhos de teclado é como se teletransportar. Profissionais que dominam os principais atalhos podem economizar até 8 dias de trabalho por ano!</p>
      
      <h4>Navegação e Edição Básica:</h4>
      <ul>
        <li><strong>Ctrl + C:</strong> Copia o item selecionado</li>
        <li><strong>Ctrl + V:</strong> Cola o item copiado</li>
        <li><strong>Ctrl + X:</strong> Recorta (move) o item selecionado</li>
        <li><strong>Ctrl + Z:</strong> Desfaz a última ação</li>
        <li><strong>Ctrl + S:</strong> Salva o arquivo atual</li>
      </ul>
      
      <h4>Gerenciamento de Janelas:</h4>
      <ul>
        <li><strong>Alt + Tab:</strong> Alterna entre os programas abertos</li>
        <li><strong>Ctrl + T:</strong> Abre uma nova aba (em navegadores)</li>
        <li><strong>Ctrl + W:</strong> Fecha a aba atual</li>
        <li><strong>Win + D:</strong> Minimiza tudo e mostra a Área de Trabalho</li>
      </ul>
    `,
    duration: "10 min",
    category: "produtividade"
  }
];

const practicalTips = [
  {
    title: "Posicionamento dos Dedos",
    content: "Seus dedos indicadores devem sempre retornar às teclas F e J. Elas têm pequenos relevos para você encontrá-las sem olhar.",
    icon: "fas fa-hand-paper"
  },
  {
    title: "Respiração Durante a Digitação",
    content: "Mantenha uma respiração calma e regular. A tensão nos ombros e no pescoço prejudica a velocidade.",
    icon: "fas fa-lungs"
  },
  {
    title: "Ritmo Constante",
    content: "É melhor manter um ritmo constante do que alternar entre rápido e lento. A consistência leva à velocidade.",
    icon: "fas fa-metronome"
  },
  {
    title: "Correção de Erros",
    content: "Sempre corrija erros imediatamente. Não deixe para corrigir depois - isso quebra o fluxo de aprendizagem.",
    icon: "fas fa-eraser"
  }
];

export default function Lessons() {
  const [, setLocation] = useLocation();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Lições Teóricas</h1>
        <p className="text-slate-600">
          Aprenda a teoria por trás da digitação eficiente e produtiva
        </p>
      </div>

      <Tabs defaultValue="theory" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="theory" data-testid="tab-theory">Teoria</TabsTrigger>
          <TabsTrigger value="tips" data-testid="tab-tips">Dicas Práticas</TabsTrigger>
        </TabsList>

        <TabsContent value="theory">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {theoreticalLessons.map((lesson) => (
              <Card key={lesson.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{lesson.title}</CardTitle>
                      <p className="text-slate-600 text-sm">{lesson.description}</p>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {lesson.duration}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Badge className="capitalize">{lesson.category}</Badge>
                    
                    <div 
                      className="prose prose-sm max-w-none text-slate-700"
                      dangerouslySetInnerHTML={{ __html: lesson.content }}
                      data-testid={`lesson-content-${lesson.id}`}
                    />
                    
                    <div className="flex justify-between items-center pt-4">
                      <Button
                        onClick={() => setLocation('/training')}
                        variant="outline"
                        size="sm"
                        data-testid={`button-practice-lesson-${lesson.id}`}
                      >
                        <i className="fas fa-dumbbell mr-2"></i>
                        Praticar Agora
                      </Button>
                      
                      <span className="text-xs text-slate-500">
                        Lição {lesson.id} de {theoreticalLessons.length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tips">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {practicalTips.map((tip, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <i className={`${tip.icon} text-primary text-xl`}></i>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 mb-2">{tip.title}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed">{tip.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Ergonomic Exercise Card */}
          <Card className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800">
                <i className="fas fa-stretch mr-2"></i>
                Exercícios de Alongamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-green-800 mb-2">Alongamento de Pulsos</h4>
                  <p className="text-sm text-green-700 mb-3">
                    Estenda o braço para a frente e, com a outra mão, puxe suavemente os dedos para trás por 15 segundos. Repita com a outra mão.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-green-800 mb-2">Rotação de Ombros</h4>
                  <p className="text-sm text-green-700 mb-3">
                    Faça 5 movimentos circulares lentos com os ombros para trás, e depois 5 para a frente.
                  </p>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-white/60 rounded-lg">
                <p className="text-sm text-green-800">
                  <i className="fas fa-clock mr-2"></i>
                  <strong>Lembrete:</strong> Faça estes exercícios a cada 20 minutos de digitação para prevenir fadiga e lesões.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
