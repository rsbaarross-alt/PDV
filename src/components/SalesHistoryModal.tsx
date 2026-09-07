/**
 * Modal de Histórico de Vendas da Sessão / Turno Atual
 * Permite buscar vendas realizadas, filtrar por método e visualizar cupom fiscal/recibo
 */
import React, { useState, useEffect } from 'react';
import {
  X,
  Receipt,
  Search,
  Printer,
  Calendar,
  Clock,
  User,
  CreditCard,
  Banknote,
  QrCode,
  ArrowRight,
  ShoppingBag,
  CheckCircle2,
} from 'lucide-react';
import { SaleSummary, PaymentMethodType } from '../types';
import { getRecordedSales, subscribeSessionSales } from '../services/salesSessionService';
import { formatBRL, formatLiveTime } from '../utils/formatters';

interface SalesHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SalesHistoryModal: React.FC<SalesHistoryModalProps> = ({ isOpen, onClose }) => {
  const [sales, setSales] = useState<SaleSummary[]>([]);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<'todos' | PaymentMethodType>('todos');
  const [selectedSale, setSelectedSale] = useState<SaleSummary | null>(null);
  const [printNotice, setPrintNotice] = useState(false);

  const refreshSales = () => {
    setSales(getRecordedSales());
  };

  useEffect(() => {
    if (isOpen) {
      refreshSales();
    }
  }, [isOpen]);

  useEffect(() => {
    const unsub = subscribeSessionSales(refreshSales);
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const filteredSales = sales.filter((s) => {
    const matchesSearch =
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.operador.toLowerCase().includes(search.toLowerCase()) ||
      s.itens.some((i) => i.produto.nome.toLowerCase().includes(search.toLowerCase()));

    const matchesMethod = methodFilter === 'todos' || s.metodoPagamento === methodFilter;

    return matchesSearch && matchesMethod;
  });

  const totalFiltered = filteredSales.reduce((sum, s) => sum + s.total, 0);

  const handlePrintReceipt = () => {
    setPrintNotice(true);
    setTimeout(() => setPrintNotice(false), 2500);
  };

  const getMethodBadge = (m: PaymentMethodType) => {
    switch (m) {
      case 'pix':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <QrCode size={12} />
            PIX
          </span>
        );
      case 'dinheiro':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Banknote size={12} />
            Dinheiro
          </span>
        );
      case 'credito':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <CreditCard size={12} />
            Crédito
          </span>
        );
      case 'debito':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
            <CreditCard size={12} />
            Débito
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-5xl h-[88vh] rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-scale-up">
        {/* Cabeçalho */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center">
              <Receipt size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Histórico de Vendas da Sessão</h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {sales.length} vendas registradas
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Auditoria de cupons, consultas e comprovantes emitidos no turno atual
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Notificação de Impressão */}
        {printNotice && (
          <div className="bg-emerald-600 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 animate-slide-down">
            <CheckCircle2 size={16} />
            <span>Comprovante enviado com sucesso para a Impressora Térmica Epson 80mm!</span>
          </div>
        )}

        {/* Corpo: Duas colunas (Lista de Vendas + Detalhe do Cupom) */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Lado Esquerdo: Filtros e Lista */}
          <div className="flex-1 flex flex-col border-r border-slate-200 bg-slate-50/50 min-h-0">
            {/* Barra de Filtros */}
            <div className="p-4 border-b border-slate-200 bg-white space-y-3 shrink-0">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por código (ex: VD-84), operador ou produto..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-600 outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
                <div className="flex items-center gap-1.5">
                  {(['todos', 'dinheiro', 'pix', 'credito', 'debito'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMethodFilter(m)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                        methodFilter === m
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">
                  Total: <strong className="text-slate-900">{formatBRL(totalFiltered)}</strong>
                </span>
              </div>
            </div>

            {/* Lista de Vendas com Scroll */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5">
              {filteredSales.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Nenhuma venda encontrada com os filtros atuais.
                </div>
              ) : (
                filteredSales.map((s) => {
                  const isSelected = selectedSale?.id === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSale(s)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/80 border-blue-300 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-800">{s.id}</span>
                          {getMethodBadge(s.metodoPagamento)}
                        </div>
                        <span className="text-xs font-extrabold text-slate-900">{formatBRL(s.total)}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatLiveTime(s.dataHora)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User size={12} />
                          {s.operador} • {s.caixa}
                        </span>
                        <span>{s.itens.length} {s.itens.length === 1 ? 'item' : 'itens'}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Lado Direito: Visualizador de Cupom Térmico */}
          <div className="w-full md:w-[380px] bg-slate-100 flex flex-col p-4 overflow-y-auto shrink-0 border-t md:border-t-0">
            {selectedSale ? (
              <div className="bg-white rounded-xl border border-slate-300 shadow-md p-5 flex flex-col font-mono text-xs text-slate-800 space-y-3.5">
                {/* Cabeçalho do Cupom */}
                <div className="text-center border-b border-dashed border-slate-300 pb-3 space-y-1">
                  <p className="font-bold text-sm">SUPERMERCADO INTELIGENTE</p>
                  <p className="text-[10px] text-slate-500">CNPJ: 12.345.678/0001-90</p>
                  <p className="text-[10px] text-slate-500">Av. Brasil, 1500 — Centro</p>
                  <p className="text-[11px] font-semibold mt-2 text-slate-900">
                    CUPOM FISCAL / NFC-e PDV
                  </p>
                </div>

                {/* Dados da Venda */}
                <div className="text-[11px] space-y-0.5 border-b border-dashed border-slate-300 pb-2.5">
                  <div className="flex justify-between">
                    <span>Cupom:</span>
                    <span className="font-bold">{selectedSale.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Horário:</span>
                    <span>{formatLiveTime(selectedSale.dataHora)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Terminal:</span>
                    <span>{selectedSale.caixa}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Operador:</span>
                    <span>{selectedSale.operador}</span>
                  </div>
                </div>

                {/* Itens */}
                <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 pb-1">
                    <span>DESCRIÇÃO</span>
                    <span>TOTAL</span>
                  </div>
                  {selectedSale.itens.map((item, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="truncate max-w-[200px]">{item.produto.nome}</span>
                        <span className="font-semibold">{formatBRL(item.total)}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {item.quantidade} {item.produto.unidade} x {formatBRL(item.precoUnitario)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totais */}
                <div className="space-y-1 text-xs border-b border-dashed border-slate-300 pb-3">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>{formatBRL(selectedSale.subtotal)}</span>
                  </div>
                  {selectedSale.desconto > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Desconto:</span>
                      <span>-{formatBRL(selectedSale.desconto)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-slate-950 pt-1">
                    <span>TOTAL PAGO:</span>
                    <span>{formatBRL(selectedSale.total)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-600 pt-1">
                    <span>Forma de Pagto:</span>
                    <span className="uppercase font-bold">{selectedSale.metodoPagamento}</span>
                  </div>
                  {selectedSale.valorRecebido && selectedSale.valorRecebido > 0 && (
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>Valor Recebido:</span>
                      <span>{formatBRL(selectedSale.valorRecebido)}</span>
                    </div>
                  )}
                  {selectedSale.troco && selectedSale.troco > 0 ? (
                    <div className="flex justify-between text-[11px] text-slate-600 font-bold">
                      <span>Troco:</span>
                      <span>{formatBRL(selectedSale.troco)}</span>
                    </div>
                  ) : null}
                </div>

                {/* QR Code Simulado & Reimpressão */}
                <div className="pt-2 flex flex-col items-center text-center space-y-2.5">
                  <div className="w-20 h-20 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                    <QrCode size={48} />
                  </div>
                  <p className="text-[9px] text-slate-500">
                    Consulte pela Chave de Acesso no portal da SEFAZ
                  </p>

                  <button
                    onClick={handlePrintReceipt}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-sans text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Printer size={15} />
                    <span>Reimprimir Comprovante</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs p-6 space-y-2">
                <Receipt size={36} className="text-slate-300" />
                <p className="font-semibold text-slate-600">Nenhum cupom selecionado</p>
                <p className="text-[11px]">
                  Clique em qualquer venda da lista ao lado para inspecionar os detalhes e reimprimir o comprovante.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <span>
            Exibindo <strong>{filteredSales.length}</strong> de <strong>{sales.length}</strong> vendas no turno
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-slate-700 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
