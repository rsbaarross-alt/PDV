/**
 * MODAL DE ATALHOS DE TECLADO DO PDV
 * Apresenta a tabela de atalhos para os operadores do caixa
 */
import React, { useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';

interface ShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsHelpModal: React.FC<ShortcutsHelpModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    { key: 'F3', desc: 'Focar na busca rápida (limpa campo atual)' },
    { key: 'F12', desc: 'Finalizar venda (abre modal de pagamento)' },
    { key: 'F5', desc: 'Cancelar venda atual (solicita confirmação)' },
    { key: 'F8', desc: 'Consultar preço e estoque sem adicionar ao carrinho' },
    { key: 'Esc', desc: 'Fechar qualquer modal, dropdown ou limpar foco' },
    { key: 'Enter', desc: 'Na busca: adiciona a primeira sugestão ao carrinho' },
    { key: '↑ / ↓', desc: 'Na busca: navegar entre as sugestões de produtos' },
    { key: '1, 2, 3, 4', desc: 'No modal de pagamento: selecionar Dinheiro, Crédito, Débito ou Pix' },
  ];

  return (
    <div
      id="shortcuts-modal-overlay"
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-2xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[500px] bg-white rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.12)] border border-[#E2E8F0] overflow-hidden animate-slide-down">
        <div className="px-5 py-4 bg-[#F9FAFB] border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard size={18} className="text-[#1D4ED8]" />
            <h3 className="text-[16px] font-bold text-[#1E293B]">
              Atalhos de Teclado Operacionais
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <p className="text-[13px] text-[#64748B] mb-4">
            Projetado para máxima velocidade operacional no caixa sem necessidade de mouse:
          </p>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {shortcuts.map((s, idx) => (
              <div key={idx} className="p-3 flex items-center justify-between hover:bg-[#F9FAFB]">
                <span className="text-[13px] text-[#1E293B] font-medium">
                  {s.desc}
                </span>
                <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-[12px] text-slate-700 shadow-2xs">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 py-3 bg-[#F9FAFB] border-t border-[#E2E8F0] text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1D4ED8] text-white font-semibold text-[13px] hover:bg-blue-800 transition-colors"
          >
            Entendido (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
