/**
 * Modal de Movimentação de Caixa (Sangria & Suprimento)
 * Permite registrar retiradas para cofre (Sangria) e adições de troco (Suprimento)
 */
import React, { useState, useEffect } from 'react';
import {
  X,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  Printer,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { CashMovement, CashMovementType, SessionInfo } from '../types';
import {
  getCashDrawerSummary,
  getCashMovements,
  addCashMovement,
  subscribeSessionSales,
} from '../services/salesSessionService';
import { formatBRL, formatLiveTime } from '../utils/formatters';

interface CashMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: SessionInfo | null;
}

export const CashMovementModal: React.FC<CashMovementModalProps> = ({
  isOpen,
  onClose,
  session,
}) => {
  const [tipo, setTipo] = useState<CashMovementType>('sangria');
  const [valor, setValor] = useState<string>('');
  const [motivo, setMotivo] = useState<string>('');
  const [autorizadoPor, setAutorizadoPor] = useState<string>('');
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [feedbackNotice, setFeedbackNotice] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [summary, setSummary] = useState(() =>
    getCashDrawerSummary(session?.fundoTrocoInicial || 200)
  );

  const refreshData = () => {
    setMovements(getCashMovements());
    setSummary(getCashDrawerSummary(session?.fundoTrocoInicial || 200));
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      setValor('');
      setMotivo('');
      setFeedbackNotice(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const unsub = subscribeSessionSales(refreshData);
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const numValor = parseFloat(valor.replace(',', '.')) || 0;
  const saldoPrevisto =
    tipo === 'sangria'
      ? summary.saldoGavetaAtual - numValor
      : summary.saldoGavetaAtual + numValor;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (numValor <= 0) {
      setFeedbackNotice({ msg: 'Informe um valor válido maior que zero.', type: 'error' });
      return;
    }

    if (tipo === 'sangria' && numValor > summary.saldoGavetaAtual) {
      setFeedbackNotice({
        msg: `Valor de sangria excede o saldo físico atual em gaveta (${formatBRL(summary.saldoGavetaAtual)}).`,
        type: 'error',
      });
      return;
    }

    if (!motivo.trim()) {
      setFeedbackNotice({ msg: 'Por favor, informe a justificativa/motivo da movimentação.', type: 'error' });
      return;
    }

    // Registra a movimentação
    const created = addCashMovement({
      tipo,
      valor: numValor,
      motivo: motivo.trim(),
      operador: session?.operador.nome || 'Operador',
      caixa: session?.caixa || 'Caixa 04',
      autorizadoPor: autorizadoPor.trim() || undefined,
    });

    setFeedbackNotice({
      msg: `${tipo === 'sangria' ? 'Sangria' : 'Suprimento'} de ${formatBRL(numValor)} registrado com sucesso! Comprovante enviado para impressão.`,
      type: 'success',
    });

    setValor('');
    setMotivo('');
    setAutorizadoPor('');
    refreshData();
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-3xl rounded-2xl border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Wallet size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Movimentação de Caixa & Gaveta</h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {session?.caixa || 'Caixa 04'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Lançamento seguro de Sangria (retirada) e Suprimento (reforço de troco)
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

        {/* Banner de Saldo Físico em Gaveta */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Saldo Físico em Gaveta (Dinheiro)
            </span>
            <div className="text-2xl font-black text-slate-900">
              {formatBRL(summary.saldoGavetaAtual)}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-600">
            <div>
              <span className="text-slate-400 block text-[10px]">Fundo Abertura:</span>
              <strong className="text-slate-800">{formatBRL(summary.fundoTrocoInicial)}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Vendas Dinheiro:</span>
              <strong className="text-emerald-700">+{formatBRL(summary.totalVendasDinheiro)}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Total Sangrias:</span>
              <strong className="text-rose-700">-{formatBRL(summary.totalSangria)}</strong>
            </div>
          </div>
        </div>

        {/* Notificação / Feedback */}
        {feedbackNotice && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center gap-2 animate-slide-down ${
              feedbackNotice.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-b border-rose-200'
            }`}
          >
            {feedbackNotice.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-600" />
            ) : (
              <AlertTriangle size={16} className="text-rose-600" />
            )}
            <span>{feedbackNotice.msg}</span>
          </div>
        )}

        {/* Corpo com Formulário e Histórico Recente */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Seletor de Tipo (Sangria vs Suprimento) */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTipo('sangria')}
              className={`p-4 rounded-xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
                tipo === 'sangria'
                  ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-300/40 text-rose-950 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <ArrowDownRight size={22} />
              </div>
              <div>
                <div className="font-bold text-sm">Sangria (Retirada)</div>
                <div className="text-[11px] text-slate-500">Recolhimento para cofre / excesso de cédulas</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTipo('suprimento')}
              className={`p-4 rounded-xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
                tipo === 'suprimento'
                  ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300/40 text-emerald-950 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <ArrowUpRight size={22} />
              </div>
              <div>
                <div className="font-bold text-sm">Suprimento (Entrada)</div>
                <div className="text-[11px] text-slate-500">Reforço de moedas e cédulas para troco</div>
              </div>
            </button>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Valor da Operação (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0,00"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    required
                    className="w-full pl-10 pr-3 py-2.5 text-base font-extrabold text-slate-900 rounded-xl border border-slate-300 bg-white focus:border-blue-600 outline-none"
                  />
                </div>

                {/* Atalhos rápidos de valores */}
                <div className="flex items-center gap-1.5 mt-2">
                  {[50, 100, 200, 500].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setValor(v.toFixed(2))}
                      className="px-2 py-1 text-[11px] font-semibold bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 transition-colors cursor-pointer"
                    >
                      +R$ {v}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Saldo Estimado após a Operação
                </label>
                <div
                  className={`p-3 rounded-xl border font-mono text-sm font-bold flex items-center justify-between ${
                    saldoPrevisto < 0
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-white text-slate-900 border-slate-200'
                  }`}
                >
                  <span>Novo Saldo em Gaveta:</span>
                  <span className="text-base">{formatBRL(Math.max(0, saldoPrevisto))}</span>
                </div>
                {saldoPrevisto < 0 && (
                  <p className="text-[11px] text-rose-600 mt-1 font-semibold flex items-center gap-1">
                    <AlertTriangle size={12} />
                    Saldo insuficiente em dinheiro na gaveta
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motivo / Justificativa *
                </label>
                <input
                  type="text"
                  placeholder={
                    tipo === 'sangria'
                      ? 'Ex: Recolhimento de excesso para cofre central'
                      : 'Ex: Troco adicional de cédulas de R$ 5 e R$ 10'
                  }
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <ShieldCheck size={14} className="text-slate-500" />
                  Autorizado por (Gerente / Supervisor)
                </label>
                <input
                  type="text"
                  placeholder="Nome ou matrícula de quem autorizou"
                  value={autorizadoPor}
                  onChange={(e) => setAutorizadoPor(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:border-blue-600 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className={`px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-xs flex items-center gap-2 transition-all cursor-pointer ${
                  tipo === 'sangria'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <Printer size={15} />
                <span>Confirmar & Imprimir Comprovante</span>
              </button>
            </div>
          </form>

          {/* Histórico das Últimas Movimentações */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={14} className="text-slate-500" />
              Movimentações Registradas no Turno ({movements.length})
            </h3>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              {movements.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  Nenhuma movimentação registrada até o momento.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                  {movements.map((m) => (
                    <div key={m.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] ${
                            m.tipo === 'sangria'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {m.tipo === 'sangria' ? '↓' : '↑'}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-800 capitalize flex items-center gap-2">
                            <span>{m.tipo}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{m.id}</span>
                          </div>
                          <div className="text-[11px] text-slate-500">{m.motivo}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`font-mono font-bold ${
                            m.tipo === 'sangria' ? 'text-rose-700' : 'text-emerald-700'
                          }`}
                        >
                          {m.tipo === 'sangria' ? '-' : '+'}
                          {formatBRL(m.valor)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {formatLiveTime(new Date(m.dataHora))} • {m.operador}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-slate-700 text-xs transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
