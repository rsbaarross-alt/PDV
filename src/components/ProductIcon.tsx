/**
 * Componente de Ícone do Produto baseado em Lucide Icons
 */
import React from 'react';
import {
  Wine,
  Coffee,
  Droplets,
  GlassWater,
  Croissant,
  Cake,
  Sandwich,
  Beef,
  Sparkles,
  ShieldAlert,
  Apple,
  Cherry,
  Package,
} from 'lucide-react';

interface ProductIconProps {
  name: string;
  categoria?: string;
  size?: number;
  className?: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Wine,
  Coffee,
  Droplets,
  GlassWater,
  Croissant,
  Cake,
  Sandwich,
  Beef,
  Sparkles,
  ShieldAlert,
  Apple,
  Cherry,
  Package,
};

export const ProductIcon: React.FC<ProductIconProps> = ({
  name,
  categoria,
  size = 24,
  className = '',
}) => {
  const IconComponent = ICON_MAP[name] || Package;

  // Paletas sutis por categoria
  const getCategoryBg = (cat?: string) => {
    switch (cat) {
      case 'Bebidas':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Padaria':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Frios':
        return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'Limpeza':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Hortifruti':
        return 'bg-green-50 text-green-600 border-green-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div
      className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-colors ${getCategoryBg(
        categoria
      )} ${className}`}
    >
      <IconComponent size={size} />
    </div>
  );
};
