/**
 * MODAL DE CANCELAMENTO DE VENDA (F5)
 * Pede confirmação antes de descartar a venda atual
 */
import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface CancelSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: () => void;
  itemCount: number;
}

export const CancelSaleModal: React.FC<CancelSaleModalProps> = ({
  isOpen,
  onClose,
  onConfirmCancel,
  itemCount,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter') onConfirmCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onConfirmCancel]);

  if (!isOpen) return null;

  return (
    <div
      id="cancel-sale-overlay"
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-2xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.12)] border border-[#E2E8F0] overflow-hidden animate-slide-down">
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center mb-4">
            <AlertTriangle size={28} />
          </div>

          <h3 className="text-[19px] font-bold text-[#1E293B]">
            Cancelar Venda Atual?
          </h3>

          <p className="text-[14px] text-[#64748B] mt-2">
            Esta ação removerá todos os {itemCount} itens do carrinho e reiniciará o atendimento. Essa ação não pode ser desfeita.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border border-slate-300 text-[14px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Continuar Venda (Esc)
            </button>

            <button
              onClick={onConfirmCancel}
              className="flex-1 h-12 rounded-xl bg-[#DC2626] text-[14px] font-semibold text-white hover:bg-red-700 active:scale-98 transition-all cursor-pointer shadow-sm shadow-red-500/20"
            >
              Sim, Cancelar (Enter)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
