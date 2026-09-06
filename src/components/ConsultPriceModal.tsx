/**
 * MODAL DE CONSULTA DE PREÇO (F8)
 * Permite ao operador consultar preço, código e estoque sem adicionar ao carrinho
 */
import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import { formatBRL } from '../utils/formatters';
import { ProductIcon } from './ProductIcon';
import { Search, X, Tag, Package, Barcode } from 'lucide-react';
import { fuzzySearchProducts } from '../utils/fuzzySearch';

interface ConsultPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddFromConsult?: (product: Product) => void;
}

export const ConsultPriceModal: React.FC<ConsultPriceModalProps> = ({
  isOpen,
  onClose,
  products,
  onAddFromConsult,
}) => {
  const [query, setQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedProduct(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const results = query.trim().length >= 2 ? fuzzySearchProducts(query, products) : [];

  return (
    <div
      id="consult-price-overlay"
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-2xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[500px] bg-white rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.12)] border border-[#E2E8F0] overflow-hidden animate-slide-down">
        {/* Header */}
        <div className="px-5 py-4 bg-[#F9FAFB] border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag size={18} className="text-[#1D4ED8]" />
            <h3 className="text-[16px] font-bold text-[#1E293B]">
              Consulta de Preço (F8)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Input de Busca */}
        <div className="p-5 space-y-4">
          <div className="relative flex items-center h-12 w-full rounded-xl bg-white border-2 border-[#1D4ED8] px-3 shadow-xs">
            <Search size={18} className="text-[#1D4ED8] mr-2" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedProduct(null);
              }}
              placeholder="Digite o código ou nome do produto..."
              className="w-full h-full bg-transparent text-[15px] font-semibold text-[#1E293B] outline-none"
            />
          </div>

          {/* Resultado em Destaque */}
          {selectedProduct ? (
            <div className="p-4 rounded-xl bg-[#EFF6FF] border border-blue-200 flex flex-col items-center text-center animate-slide-down">
              <ProductIcon
                name={selectedProduct.icone}
                categoria={selectedProduct.categoria}
                size={32}
                className="mb-2"
              />
              <span className="text-[12px] font-mono text-slate-500">
                Código: {selectedProduct.codigo}
              </span>
              <h4 className="text-[17px] font-bold text-[#1E293B] mt-1">
                {selectedProduct.nome}
              </h4>
              <div className="my-2">
                <span className="text-[32px] font-extrabold text-[#1D4ED8] tracking-tight">
                  {formatBRL(selectedProduct.preco)}
                </span>
                <span className="text-[13px] text-slate-500 ml-1">
                  / {selectedProduct.unidade}
                </span>
              </div>
              <div className="text-[13px] text-[#64748B] flex items-center gap-4">
                <span>Categoria: {selectedProduct.categoria}</span>
                <span>•</span>
                <span>Estoque: {selectedProduct.estoque} {selectedProduct.unidade}</span>
              </div>

              {onAddFromConsult && (
                <button
                  onClick={() => {
                    onAddFromConsult(selectedProduct);
                    onClose();
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#1D4ED8] text-white font-semibold text-[13px] hover:bg-blue-800 transition-colors"
                >
                  Adicionar à Venda Atual
                </button>
              )}
            </div>
          ) : results.length > 0 ? (
            <div className="max-h-[260px] overflow-y-auto divide-y divide-[#E2E8F0] border border-[#E2E8F0] rounded-xl">
              {results.map((r) => (
                <div
                  key={r.product.codigo}
                  onClick={() => setSelectedProduct(r.product)}
                  className="p-3 hover:bg-[#EFF6FF] flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div>
                    <div className="font-semibold text-[14px] text-[#1E293B]">
                      {r.product.nome}
                    </div>
                    <div className="text-[12px] text-slate-500">
                      Cód: {r.product.codigo} • Estoque: {r.product.estoque}
                    </div>
                  </div>
                  <div className="text-[16px] font-bold text-[#1D4ED8]">
                    {formatBRL(r.product.preco)}
                  </div>
                </div>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="text-center py-6 text-slate-400 text-[14px]">
              Nenhum produto localizado para "{query}".
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-[13px]">
              Passe o leitor de código de barras ou digite o nome.
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="px-5 py-3 bg-[#F9FAFB] border-t border-[#E2E8F0] text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-[13px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Fechar (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
