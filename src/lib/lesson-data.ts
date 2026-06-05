import type { Lesson } from "@shared/schema";

export const lessonTexts: Record<number, string> = {
  1: "asdf jklç asdf jklç asdfg hjklç asdfg hjklç agag sjsj dkdk fkfk lglg add jjj sss lll ddd kkk fff",
  2: "asdf jklç asdf jklç fff jjj ddd kkk sss lll aaa ;;; asdf jklç hjkl fdsa lkjh fdsa",
  3: "o sol brilha forte hoje a casa amarela tem um jardim digitar rapido abre novas portas o rapaz alto viu o passaro azul",
  4: "a vida e bela hoje o dia esta lindo vamos estudar com alegria o trabalho dignifica o homem a pratica leva a perfeicao",
  5: "A reunião foi agendada para 18/07/2025 às 15:30. O valor total do projeto é de R$ 4.850,00 (quatro mil, oitocentos e cinquenta reais).",
  6: "Por favor, confirme o recebimento do pedido #G-2025/7-B. O relatório deve ser entregue até 25/07/2025. Entre em contato pelo telefone (11) 99999-9999.",
  7: "Parabéns por completar a primeira semana! Você dominou a fileira guia, aprendeu palavras básicas e começou a digitar textos reais. Continue praticando diariamente para manter o progresso."
};

export function getLessonText(day: number): string {
  return lessonTexts[day] || lessonTexts[1];
}

export const weeklyGoals: Record<number, { targetWpm: number; description: string }> = {
  1: { targetWpm: 30, description: "Foco em memorizar 100% do teclado e criar a base da digitação por tato" },
  2: { targetWpm: 50, description: "Foco em ganhar fluidez entre palavras e eliminar os vícios de olhar para o teclado" },
  3: { targetWpm: 60, description: "Foco em aumentar a resistência com textos mais longos e variados" },
  4: { targetWpm: 80, description: "Foco em atingir a velocidade de elite com técnicas avançadas" }
};

export function getWeeklyGoal(week: number) {
  return weeklyGoals[week] || weeklyGoals[1];
}
