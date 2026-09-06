/**
 * ZONA B — CATÁLOGO DE PRODUTOS (60% largura)
 * Filtros-pílula rápidos, Tabs de categorias horizontais e Grid de cards de atalho
 */
import React, { useState, useMemo } from 'react';
import { Product, FilterType } from '../types';
import { CATEGORIAS } from '../data/mockProducts';
import { ProductIcon } from './ProductIcon';
import { formatBRL } from '../utils/formatters';
import { Star, Clock, AlertTriangle, Plus } from 'lucide-react';

interface CatalogProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  lastAddedProductCode?: string | null;
}

export const Catalog: React.FC<CatalogProps> = ({
  products,
  onAddToCart,
  lastAddedProductCode,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('todos');
  const [activeCategory, setActiveCategory] = useState<string>('Todas');
  const [clickedCardCode, setClickedCardCode] = useState<string | null>(null);

  // Filtros em pílula
  const filterPills: Array<{ id: FilterType; label: string; icon?: React.ReactNode }> = [
    { id: 'todos', label: 'Todos' },
    { id: 'nome', label: 'Por Nome' },
    { id: 'codigo', label: 'Por Código' },
    { id: 'favoritos', label: 'Favoritos', icon: <Star size={13} className="fill-amber-400 text-amber-400 inline mr-1" /> },
    { id: 'recentes', label: 'Recentes', icon: <Clock size={13} className="inline mr-1" /> },
  ];

  // Processa filtragem e ordenação
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Categoria
    if (activeCategory !== 'Todas') {
      list = list.filter(p => p.categoria.toLowerCase() === activeCategory.toLowerCase());
    }

    // Filtros de pílula
    if (activeFilter === 'favoritos') {
      list = list.filter(p => p.favorito);
    } else if (activeFilter === 'recentes') {
      list = list.filter(p => p.recente);
    } else if (activeFilter === 'nome') {
      list.sort((a, b) => a.nome.localeCompare(b.nome));
    } else if (activeFilter === 'codigo') {
      list.sort((a, b) => a.codigo.localeCompare(b.codigo));
    }

    return list;
  }, [products, activeCategory, activeFilter]);

  const handleCardClick = (product: Product) => {
    setClickedCardCode(product.codigo);
    onAddToCart(product);
    setTimeout(() => {
      setClickedCardCode(null);
    }, 250);
  };

  return (
    <div
      id="pdv-catalog-zone"
      className="w-full lg:w-[60%] h-full flex flex-col bg-white border-r border-[#E2E8F0] overflow-hidden"
    >
      {/* 1. Barra de Filtros Rápidos (Pílulas) */}
      <div className="px-4 py-2.5 bg-[#F9FAFB] border-b border-[#E2E8F0] flex items-center gap-2 overflow-x-auto no-scrollbar">
        {filterPills.map(pill => {
          const isActive = activeFilter === pill.id;
          return (
            <button
              key={pill.id}
              onClick={() => setActiveFilter(pill.id)}
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-120 whitespace-nowrap cursor-pointer flex items-center shadow-2xs ${
                isActive
                  ? 'bg-[#1D4ED8] text-white font-semibold'
                  : 'bg-white border border-[#E2E8F0] text-[#1E293B] hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {pill.icon}
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* 2. Tabs de Categorias Horizontais */}
      <div className="px-4 border-b border-[#E2E8F0] bg-white flex items-center gap-6 overflow-x-auto no-scrollbar">
        {CATEGORIAS.map(categoria => {
          const isActive = activeCategory === categoria;
          return (
            <button
              key={categoria}
              onClick={() => setActiveCategory(categoria)}
              className={`py-3 text-[14px] font-medium transition-colors relative whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'text-[#1D4ED8] font-semibold'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              {categoria}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1D4ED8] rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Grade de Atalhos Visuais (Cards 120x140px) */}
      <div className="flex-1 p-4 overflow-y-auto bg-[#F9FAFB]/50">
        {filteredProducts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
            <p className="text-[14px]">Nenhum produto encontrado neste filtro.</p>
            <button
              onClick={() => {
                setActiveCategory('Todas');
                setActiveFilter('todos');
              }}
              className="mt-3 px-3 py-1.5 text-[12px] text-[#1D4ED8] font-medium bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {filteredProducts.map(product => {
              const isClicked = clickedCardCode === product.codigo;
              const isJustAdded = lastAddedProductCode === product.codigo;
              const isLowStock = product.estoque <= 10;

              return (
                <button
                  key={product.codigo}
                  id={`product-card-${product.codigo}`}
                  onClick={() => handleCardClick(product)}
                  title={`${product.nome} - ${formatBRL(product.preco)} (Clique para adicionar)`}
                  className={`w-full min-h-[148px] p-3 rounded-[12px] bg-white border flex flex-col items-center justify-between text-center relative cursor-pointer group select-none shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-120 transform active:scale-95 ${
                    isJustAdded
                      ? 'border-[#1D4ED8] bg-[#EFF6FF] ring-2 ring-blue-500/20'
                      : isClicked
                      ? 'scale-95 border-[#1D4ED8] bg-[#EFF6FF]'
                      : 'border-[#E2E8F0] hover:border-[#1D4ED8] hover:bg-[#EFF6FF]'
                  }`}
                >
                  {/* Badge de Código / Estoque */}
                  <div className="w-full flex items-center justify-between text-[11px] text-[#64748B] mb-1">
                    <span className="font-mono text-[10px] text-slate-400 group-hover:text-slate-600">
                      #{product.codigo.slice(-4)}
                    </span>
                    {isLowStock ? (
                      <span className="flex items-center gap-0.5 text-[10px] text-amber-600 font-semibold bg-amber-50 px-1 py-0.2 rounded" title={`Estoque baixo: ${product.estoque}`}>
                        <AlertTriangle size={10} />
                        {product.estoque}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        {product.estoque}{product.unidade}
                      </span>
                    )}
                  </div>

                  {/* Ícone do Produto (48x48px) */}
                  <div className="relative my-1">
                    <ProductIcon
                      name={product.icone}
                      categoria={product.categoria}
                      size={24}
                      className="group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#1D4ED8] text-white opacity-0 group-hover:opacity-100 flex items-center justify-center shadow-sm transition-opacity duration-150">
                      <Plus size={12} className="stroke-[3]" />
                    </div>
                  </div>

                  {/* Nome do Produto (2 linhas máx, ellipsis) */}
                  <div className="w-full my-1">
                    <h3 className="text-[13px] font-medium text-[#1E293B] leading-tight line-clamp-2 min-h-[32px] group-hover:text-[#1D4ED8] transition-colors">
                      {product.nome}
                    </h3>
                  </div>

                  {/* Preço em accent-primary, bold */}
                  <div className="w-full mt-auto pt-1 border-t border-slate-100/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-medium">
                      /{product.unidade}
                    </span>
                    <span className="text-[15px] font-bold text-[#1D4ED8] tracking-tight">
                      {formatBRL(product.preco)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
