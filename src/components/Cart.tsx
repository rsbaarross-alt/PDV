/**
 * ZONA C — CARRINHO / VENDA ATUAL (40% largura)
 * Lista scrollável de itens, controles rápidos de quantidade,
 * barra lateral de item recente, remoção e feedback imediato
 */
import React from 'react';
import { CartItem } from '../types';
import { formatBRL, formatUnitQuantity } from '../utils/formatters';
import { ShoppingCart, Trash2, Plus, Minus, X, PackageOpen, RotateCcw } from 'lucide-react';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onSetQuantity: (id: string, newQty: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

export const Cart: React.FC<CartProps> = ({
  items,
  onUpdateQuantity,
  onSetQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  const totalItemCount = items.reduce((acc, curr) => acc + (curr.produto.unidade === 'un' ? curr.quantidade : 1), 0);

  return (
    <div
      id="pdv-cart-zone"
      className="w-full lg:w-[40%] h-full flex flex-col bg-white overflow-hidden select-none"
    >
      {/* Header Fixo da Venda Atual */}
      <div className="h-12 px-4 bg-[#F9FAFB] border-b border-[#E2E8F0] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart size={18} className="text-[#1D4ED8]" />
          <h2 className="text-[14px] font-bold uppercase tracking-wider text-[#1E293B]">
            Venda Atual
          </h2>
          <span
            id="cart-item-count-badge"
            className="px-2 py-0.5 rounded-full text-[12px] font-bold bg-[#EFF6FF] text-[#1D4ED8] border border-blue-200"
          >
            {totalItemCount} {totalItemCount === 1 ? 'item' : 'itens'}
          </span>
        </div>

        {items.length > 0 && (
          <button
            onClick={onClearCart}
            aria-label="Limpar todos os itens da venda atual"
            className="flex items-center gap-1 text-[12px] text-slate-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
            title="Limpar todos os itens da venda"
          >
            <RotateCcw size={13} />
            <span>Limpar</span>
          </button>
        )}
      </div>

      {/* Lista Scrollável de Itens */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.length === 0 ? (
          <div
            id="cart-empty-state"
            className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#F9FAFB] border border-[#E2E8F0] flex items-center justify-center mb-3 text-slate-300">
              <PackageOpen size={32} />
            </div>
            <p className="text-[15px] font-medium text-[#1E293B]">
              Nenhum item na venda
            </p>
            <p className="text-[13px] text-[#64748B] max-w-[240px] mt-1">
              Pressione <kbd className="font-semibold text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-[11px]">F3</kbd> para buscar ou clique nos produtos do catálogo ao lado.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {items.map((item, index) => {
              const isKg = item.produto.unidade === 'kg';
              const isRecent = item.adicionadoRecentemente;

              return (
                <div
                  key={item.id}
                  id={`cart-item-${item.id}`}
                  className={`relative py-2.5 px-3 transition-colors duration-150 group rounded-lg ${
                    isRecent
                      ? 'bg-[#EFF6FF] border-l-[3px] border-[#1D4ED8] animate-slide-down'
                      : 'hover:bg-[#F9FAFB]'
                  }`}
                >
                  {/* Linha 1: Nome do produto + Botão de Remoção */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[11px] font-mono text-slate-400 font-bold">
                        #{String(items.length - index).padStart(2, '0')}
                      </span>
                      <h4 className="text-[14px] font-medium text-[#1E293B] truncate">
                        {item.produto.nome}
                      </h4>
                    </div>
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      aria-label={`Remover ${item.produto.nome} do carrinho`}
                      className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Remover item"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* Linha 2 e 3: Controles de quantidade e Preço unitário -> Total */}
                  <div className="flex items-center justify-between mt-2 pt-1">
                    {/* Controles de Quantidade [-] [input] [+] */}
                    <div className="flex items-center border border-[#E2E8F0] rounded-lg overflow-hidden bg-white shadow-2xs">
                      <button
                        onClick={() => onUpdateQuantity(item.id, isKg ? -0.25 : -1)}
                        aria-label="Diminuir quantidade"
                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
                      >
                        <Minus size={13} />
                      </button>

                      <input
                        type="number"
                        step={isKg ? '0.05' : '1'}
                        min={isKg ? '0.05' : '1'}
                        value={item.quantidade}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val > 0) {
                            onSetQuantity(item.id, val);
                          }
                        }}
                        aria-label={`Quantidade de ${item.produto.nome}`}
                        className="w-14 h-7 text-center text-[13px] font-bold text-[#1E293B] outline-none border-x border-[#E2E8F0] bg-transparent"
                      />

                      <button
                        onClick={() => onUpdateQuantity(item.id, isKg ? 0.25 : 1)}
                        aria-label="Aumentar quantidade"
                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    {/* Preço unitário e Total do Item */}
                    <div className="text-right">
                      <div className="text-[12px] text-[#64748B]">
                        {formatUnitQuantity(item.quantidade, item.produto.unidade)} × {formatBRL(item.precoUnitario)}
                      </div>
                      <div className="text-[15px] font-bold text-[#1E293B]">
                        {formatBRL(item.total)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
