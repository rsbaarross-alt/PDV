/**
 * Modal de Calculadora Rápida & Simulador de Troco do Caixa
 */
import React, { useState, useEffect } from 'react';
import { X, Calculator, Delete, ArrowRight, RotateCcw, Banknote } from 'lucide-react';
import { formatBRL } from '../utils/formatters';

interface QuickCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickCalculatorModal: React.FC<QuickCalculatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [display, setDisplay] = useState('0');
  const [previousVal, setPreviousVal] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [resetNext, setResetNext] = useState(false);

  // Modo Troco Rápido
  const [tab, setTab] = useState<'calc' | 'troco'>('calc');
  const [valorCompra, setValorCompra] = useState('');
  const [valorRecebido, setValorRecebido] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDisplay('0');
      setPreviousVal(null);
      setOperation(null);
      setResetNext(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (resetNext) {
      setDisplay(digit);
      setResetNext(false);
      return;
    }
    if (display === '0' && digit !== '.') {
      setDisplay(digit);
    } else if (digit === '.' && display.includes('.')) {
      // Evita dois pontos
      return;
    } else {
      setDisplay(display + digit);
    }
  };

  const handleOp = (op: string) => {
    const current = parseFloat(display);
    if (previousVal !== null && operation) {
      const res = calculate(previousVal, current, operation);
      setPreviousVal(res);
      setDisplay(String(res));
    } else {
      setPreviousVal(current);
    }
    setOperation(op);
    setResetNext(true);
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '×':
        return a * b;
      case '÷':
        return b !== 0 ? a / b : 0;
      default:
        return b;
    }
  };

  const handleEqual = () => {
    if (previousVal !== null && operation) {
      const current = parseFloat(display);
      const res = calculate(previousVal, current, operation);
      setDisplay(String(Number(res.toFixed(4))));
      setPreviousVal(null);
      setOperation(null);
      setResetNext(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPreviousVal(null);
    setOperation(null);
    setResetNext(false);
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const addNote = (val: number) => {
    if (tab === 'troco') {
      const current = parseFloat(valorRecebido.replace(',', '.')) || 0;
      setValorRecebido((current + val).toFixed(2));
    } else {
      const current = parseFloat(display) || 0;
      setDisplay(String(current + val));
      setResetNext(false);
    }
  };

  const numCompra = parseFloat(valorCompra.replace(',', '.')) || 0;
  const numRecebido = parseFloat(valorRecebido.replace(',', '.')) || 0;
  const trocoCalculado = Math.max(0, numRecebido - numCompra);
  const faltam = Math.max(0, numCompra - numRecebido);

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-scale-up">
        {/* Cabeçalho */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center">
              <Calculator size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold">Calculadora de Caixa</h3>
              <p className="text-[11px] text-slate-400">Operações e troco instantâneo</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Abas */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200">
          <button
            onClick={() => setTab('calc')}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tab === 'calc' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Calculadora
          </button>
          <button
            onClick={() => setTab('troco')}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tab === 'troco' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Conferência de Troco
          </button>
        </div>

        {/* Cédulas Rápidas */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Banknote size={12} />
            Notas:
          </span>
          {[2, 5, 10, 20, 50, 100, 200].map((note) => (
            <button
              key={note}
              type="button"
              onClick={() => addNote(note)}
              className="px-2 py-1 text-[11px] font-bold rounded-md bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 text-slate-700 transition-all cursor-pointer shrink-0"
            >
              +R${note}
            </button>
          ))}
        </div>

        {/* Conteúdo da Aba 1: Calculadora */}
        {tab === 'calc' && (
          <div className="p-4 space-y-3">
            {/* Display */}
            <div className="p-3 bg-slate-950 text-white rounded-xl border border-slate-800 text-right">
              <div className="text-[11px] text-slate-400 h-4 font-mono">
                {previousVal !== null ? `${previousVal} ${operation}` : ''}
              </div>
              <div className="text-2xl font-black font-mono tracking-wider overflow-x-auto">
                {display}
              </div>
            </div>

            {/* Teclado */}
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={handleClear}
                className="p-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-sm transition-colors cursor-pointer"
              >
                C
              </button>
              <button
                onClick={handleBackspace}
                className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center transition-colors cursor-pointer"
              >
                <Delete size={16} />
              </button>
              <button
                onClick={() => {
                  const num = parseFloat(display) || 0;
                  setDisplay(String(num / 100));
                }}
                className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors cursor-pointer"
              >
                %
              </button>
              <button
                onClick={() => handleOp('÷')}
                className="p-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-base transition-colors cursor-pointer"
              >
                ÷
              </button>

              {['7', '8', '9'].map((d) => (
                <button
                  key={d}
                  onClick={() => handleDigit(d)}
                  className="p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-bold text-base shadow-2xs transition-colors cursor-pointer"
                >
                  {d}
                </button>
              ))}
              <button
                onClick={() => handleOp('×')}
                className="p-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-base transition-colors cursor-pointer"
              >
                ×
              </button>

              {['4', '5', '6'].map((d) => (
                <button
                  key={d}
                  onClick={() => handleDigit(d)}
                  className="p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-bold text-base shadow-2xs transition-colors cursor-pointer"
                >
                  {d}
                </button>
              ))}
              <button
                onClick={() => handleOp('-')}
                className="p-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-base transition-colors cursor-pointer"
              >
                -
              </button>

              {['1', '2', '3'].map((d) => (
                <button
                  key={d}
                  onClick={() => handleDigit(d)}
                  className="p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-bold text-base shadow-2xs transition-colors cursor-pointer"
                >
                  {d}
                </button>
              ))}
              <button
                onClick={() => handleOp('+')}
                className="p-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-base transition-colors cursor-pointer"
              >
                +
              </button>

              <button
                onClick={() => handleDigit('0')}
                className="p-3 col-span-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-bold text-base shadow-2xs transition-colors cursor-pointer"
              >
                0
              </button>
              <button
                onClick={() => handleDigit('.')}
                className="p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-bold text-base shadow-2xs transition-colors cursor-pointer"
              >
                ,
              </button>
              <button
                onClick={handleEqual}
                className="p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-xs transition-colors cursor-pointer"
              >
                =
              </button>
            </div>
          </div>
        )}

        {/* Conteúdo da Aba 2: Conferência de Troco */}
        {tab === 'troco' && (
          <div className="p-5 space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Valor Total da Compra (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={valorCompra}
                  onChange={(e) => setValorCompra(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-base font-bold text-slate-900 focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Valor Recebido do Cliente (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={valorRecebido}
                  onChange={(e) => setValorRecebido(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-base font-bold text-slate-900 focus:border-blue-600 outline-none"
                />
              </div>
            </div>

            {/* Resultado do Troco */}
            <div
              className={`p-4 rounded-xl border text-center ${
                numRecebido >= numCompra && numCompra > 0
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : numRecebido > 0
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <span className="text-xs uppercase font-bold text-slate-500 tracking-wider block">
                {numRecebido >= numCompra ? 'Troco a Devolver:' : 'Faltam para completar:'}
              </span>
              <div className="text-3xl font-black font-mono mt-1">
                {formatBRL(numRecebido >= numCompra ? trocoCalculado : faltam)}
              </div>
            </div>

            <button
              onClick={() => {
                setValorCompra('');
                setValorRecebido('');
              }}
              className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Limpar Valores</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
