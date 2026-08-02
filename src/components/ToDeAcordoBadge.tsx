interface ToDeAcordoBadgeProps {
  type?: 'default' | 'validated' | 'reservations' | 'evidence' | 'privacy';
  className?: string;
}

export const ToDeAcordoBadge = ({ type = 'default', className = '' }: ToDeAcordoBadgeProps) => {
  const getBadgeStyle = () => {
    switch (type) {
      case 'validated':
        return { bg: 'bg-green-100', border: 'border-green-200', text: 'text-green-800', icon: '✓', label: 'Validado com ToDeAcordo' };
      case 'reservations':
        return { bg: 'bg-amber-100', border: 'border-amber-200', text: 'text-amber-800', icon: '⚠️', label: 'Com ressalvas no ToDeAcordo' };
      case 'evidence':
        return { bg: 'bg-indigo-100', border: 'border-indigo-200', text: 'text-indigo-800', icon: '🔍', label: 'Entendimento com evidências' };
      case 'privacy':
        return { bg: 'bg-slate-100', border: 'border-slate-200', text: 'text-slate-800', icon: '🔒', label: 'Sem gravação de áudio' };
      default:
        return { bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-700', icon: '⚡', label: 'Gerado com ToDeAcordo' };
    }
  };

  const style = getBadgeStyle();

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border ${style.bg} ${style.border} ${style.text} ${className}`}>
      <span>{style.icon}</span>
      <span>{style.label}</span>
    </div>
  );
};
