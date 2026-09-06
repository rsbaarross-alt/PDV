/**
 * ZONA D — BARRA DE TOTALIZAÇÃO (80px altura fixa)
 * Qtd Itens | Subtotal | Desconto | TOTAL (40px bold) | [F12 PAGAR] (240x56px)
 */
import React, { useState } from 'react';
import { formatBRL } from '../utils/formatters';
import { CreditCard, Tag, Percent, ArrowRight } from 'lucide-react';

interface TotalFooterProps {
  itemCount: number;
  subtotal: number;
  discount: number;
  discountType: 'reais' | 'porcentagem';
  onDiscountChange: (val: number, type: 'reais' | 'porcentagem') => void;
  total: number;
  onOpenPayment: () => void;
  disabled: boolean;
}

export const TotalFooter: React.FC<TotalFooterProps> = ({
  itemCount,
  subtotal,
  discount,
  discountType,
  onDiscountChange,
  total,
  onOpenPayment,
  disabled,
}) => {
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [discountVal, setDiscountVal] = useState<string>(discount > 0 ? String(discount) : '');

  const handleApplyDiscount = () => {
    const parsed = parseFloat(discountVal.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0) {
      onDiscountChange(parsed, discountType);
    } else {
      onDiscountChange(0, discountType);
    }
  };

  return (
    <footer
      id="pdv-total-bar"
      className="h-20 w-full bg-[#F9FAFB] border-t border-[#E2E8F0] px-6 flex items-center justify-between z-30 select-none"
    >
      {/* Lado Esquerdo: Qtd Itens | Subtotal | Campo de Desconto */}
      <div className="flex items-center gap-6">
        {/* Itens */}
        <div>
          <span className="text-[12px] font-medium text-[#64748B] block uppercase tracking-wider">
            Itens
          </span>
          <span className="text-[18px] font-bold text-[#1E293B]">
            {itemCount}
          </span>
        </div>

        <div className="h-8 w-px bg-[#E2E8F0]" />

        {/* Subtotal */}
        <div>
          <span className="text-[12px] font-medium text-[#64748B] block uppercase tracking-wider">
            Subtotal
          </span>
          <span className="text-[18px] font-semibold text-[#1E293B]">
            {formatBRL(subtotal)}
          </span>
        </div>

        <div className="h-8 w-px bg-[#E2E8F0]" />

        {/* Desconto */}
        <div className="flex items-center gap-2">
          {!showDiscountInput ? (
            <button
              onClick={() => setShowDiscountInput(true)}
              disabled={disabled}
              className="flex items-center gap-1.5 text-[13px] text-[#1D4ED8] hover:text-blue-800 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-200 transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <Tag size={14} />
              <span>
                {discount > 0
                  ? `Desconto: -${discountType === 'reais' ? formatBRL(discount) : `${discount}%`}`
                  : '+ Adicionar Desconto'}
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-white border border-[#1D4ED8] rounded-lg p-1 shadow-2xs">
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="0"
                value={discountVal}
                onChange={(e) => setDiscountVal(e.target.value)}
                onBlur={handleApplyDiscount}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApplyDiscount();
                  if (e.key === 'Escape') setShowDiscountInput(false);
                }}
                autoFocus
                className="w-16 text-[13px] font-bold text-[#1E293B] px-1 outline-none text-right"
              />
              <button
                onClick={() => {
                  const nextType = discountType === 'reais' ? 'porcentagem' : 'reais';
                  const parsed = parseFloat(discountVal.replace(',', '.'));
                  onDiscountChange(!isNaN(parsed) ? parsed : 0, nextType);
                }}
                className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
                title="Alternar entre R$ e %"
              >
                {discountType === 'reais' ? 'R$' : '%'}
              </button>
              <button
                onClick={() => {
                  handleApplyDiscount();
                  setShowDiscountInput(false);
                }}
                className="text-[11px] font-bold text-white bg-[#1D4ED8] px-2 py-1 rounded hover:bg-blue-800"
              >
                OK
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lado Direito: TOTAL em 40px bold + Botão FINALIZAR VENDA (F12) */}
      <div className="flex items-center gap-6">
        {/* TOTAL */}
        <div className="text-right flex flex-col justify-center">
          <span className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wider block">
            Total a Pagar
          </span>
          <div
            id="pdv-total-amount"
            className="text-[40px] leading-none font-bold text-[#1E293B] tracking-[-0.02em]"
          >
            {formatBRL(total)}
          </div>
        </div>

        {/* Botão FINALIZAR VENDA (F12) */}
        <button
          id="btn-finalizar-venda"
          onClick={onOpenPayment}
          disabled={disabled}
          aria-label="Finalizar Venda (Tecla F12)"
          className={`w-[240px] h-14 rounded-[10px] bg-[#1D4ED8] text-white text-[15px] font-semibold uppercase tracking-[0.04em] flex items-center justify-center gap-2.5 shadow-md shadow-blue-700/20 transition-all duration-150 select-none ${
            disabled
              ? 'opacity-40 cursor-not-allowed bg-slate-400 shadow-none'
              : 'hover:bg-[#1e40af] active:bg-[#1e3a8a] active:scale-[0.98] cursor-pointer'
          }`}
        >
          <CreditCard size={18} />
          <span>Finalizar Venda</span>
          <kbd className="text-[11px] bg-white/20 px-1.5 py-0.5 rounded text-white font-mono font-bold tracking-normal">
            F12
          </kbd>
        </button>
      </div>
    </footer>
  );
};
