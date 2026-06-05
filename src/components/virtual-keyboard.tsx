import { cn } from "@/lib/utils";

interface VirtualKeyboardProps {
  currentKey?: string;
  className?: string;
}

const keyboardLayout = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ç'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

export default function VirtualKeyboard({ currentKey, className }: VirtualKeyboardProps) {
  const renderKey = (key: string) => {
    const isCurrentKey = currentKey?.toUpperCase() === key.toUpperCase();
    const isHomeRowKey = ['A', 'S', 'D', 'F', 'J', 'K', 'L', 'Ç'].includes(key);
    
    return (
      <div
        key={key}
        className={cn(
          "w-8 h-8 border rounded text-xs flex items-center justify-center font-mono transition-colors",
          isCurrentKey && "border-2 border-primary bg-primary text-white font-bold",
          isHomeRowKey && !isCurrentKey && "border-primary bg-primary/10",
          !isCurrentKey && !isHomeRowKey && "border-slate-300 bg-white"
        )}
        data-testid={`key-${key.toLowerCase()}`}
      >
        {key}
      </div>
    );
  };

  return (
    <div className={cn("bg-white border border-slate-200 rounded-lg p-4", className)}>
      <h4 className="font-medium text-slate-900 mb-3">Teclado Virtual</h4>
      <div className="space-y-2" data-testid="virtual-keyboard">
        {keyboardLayout.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center space-x-1">
            {row.map(renderKey)}
          </div>
        ))}
        
        {/* Space bar */}
        <div className="flex justify-center mt-2">
          <div
            className={cn(
              "w-32 h-8 border rounded text-xs flex items-center justify-center font-mono transition-colors",
              currentKey === ' ' 
                ? "border-2 border-primary bg-primary text-white font-bold"
                : "border-slate-300 bg-white"
            )}
            data-testid="key-space"
          >
            ESPAÇO
          </div>
        </div>
      </div>
    </div>
  );
}
