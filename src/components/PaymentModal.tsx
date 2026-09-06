/**
 * MODAL DE PAGAMENTO (F12)
 * Grid 2x2 de formas de pagamento (Dinheiro, Crédito, Débito, Pix),
 * cálculo automático de troco em tempo real, QR Code Pix dinâmico,
 * e tela de sucesso pós-confirmação com timer de 3s.
 */
import React, { useState, useEffect, useRef } from 'react';
import { PaymentMethodType, CartItem } from '../types';
import { formatBRL } from '../utils/formatters';
import {
  Banknote,
  CreditCard,
  QrCode,
  CheckCircle2,
  X,
  Printer,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  subtotal: number;
  discount: number;
  items: CartItem[];
  onConfirmSale: (method: PaymentMethodType, received: number, change: number) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  total,
  subtotal,
  discount,
  items,
  onConfirmSale,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('dinheiro');
  const [valorRecebidoStr, setValorRecebidoStr] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(3);
  const [copiedPix, setCopiedPix] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Inicializa quando abre
  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setCountdown(3);
      setErrorMsg('');
      setSelectedMethod('dinheiro');
      setValorRecebidoStr(total.toFixed(2));
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, total]);

  // Contagem regressiva no sucesso (3s)
  useEffect(() => {
    if (isSuccess) {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isSuccess, onClose]);

  // Teclado no modal (Esc, 1, 2, 3, 4, Enter)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!isSuccess) {
          onClose();
        }
      } else if (e.key === '1' && (document.activeElement !== inputRef.current)) {
        setSelectedMethod('dinheiro');
      } else if (e.key === '2' && (document.activeElement !== inputRef.current)) {
        setSelectedMethod('credito');
      } else if (e.key === '3' && (document.activeElement !== inputRef.current)) {
        setSelectedMethod('debito');
      } else if (e.key === '4' && (document.activeElement !== inputRef.current)) {
        setSelectedMethod('pix');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSuccess, onClose]);

  if (!isOpen) return null;

  const valorRecebidoNum = parseFloat(valorRecebidoStr.replace(',', '.')) || 0;
  const troco = Math.max(0, valorRecebidoNum - total);
  const isDinheiroInsuficiente = selectedMethod === 'dinheiro' && valorRecebidoNum < total;

  const handleConfirm = () => {
    if (selectedMethod === 'dinheiro' && isDinheiroInsuficiente) {
      setErrorMsg(`Valor recebido insuficiente. Faltam ${formatBRL(total - valorRecebidoNum)}.`);
      inputRef.current?.focus();
      return;
    }

    setIsSuccess(true);
    onConfirmSale(selectedMethod, selectedMethod === 'dinheiro' ? valorRecebidoNum : total, troco);
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(
      `00020126580014BR.GOV.BCB.PIX0136pdv-inteligente-${Date.now()}5204000053039865405${total.toFixed(
        2
      )}5802BR5915PDV INTELIGENTE6009SAO PAULO62070503***6304`
    );
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  return (
    <div
      id="payment-modal-overlay"
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-2xs"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSuccess) {
          onClose();
        }
      }}
    >
      <div
        id="payment-modal-container"
        className="w-full max-w-[520px] bg-white rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.12)] border border-[#E2E8F0] overflow-hidden animate-slide-down flex flex-col"
      >
        {/* Tela de Sucesso */}
        {isSuccess ? (
          <div className="p-8 flex flex-col items-center text-center bg-white">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 animate-bounce">
              <CheckCircle2 size={48} className="stroke-[2.5]" />
            </div>

            <span className="text-[12px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full mb-2">
              Pagamento Aprovado
            </span>

            <h3 className="text-[24px] font-bold text-[#1E293B]">
              Venda Concluída com Sucesso!
            </h3>

            <div className="w-full my-6 p-4 rounded-xl bg-[#F9FAFB] border border-[#E2E8F0] text-left space-y-2 text-[14px]">
              <div className="flex justify-between text-[#64748B]">
                <span>Total da Venda:</span>
                <span className="font-bold text-[#1E293B]">{formatBRL(total)}</span>
              </div>
              <div className="flex justify-between text-[#64748B]">
                <span>Método Utilizado:</span>
                <span className="font-semibold text-[#1E293B] capitalize">
                  {selectedMethod}
                </span>
              </div>
              {selectedMethod === 'dinheiro' && (
                <>
                  <div className="flex justify-between text-[#64748B]">
                    <span>Valor Recebido:</span>
                    <span className="font-semibold text-[#1E293B]">
                      {formatBRL(valorRecebidoNum)}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-slate-200">
                    <span>Troco:</span>
                    <span className="text-[16px]">{formatBRL(troco)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="w-full flex items-center gap-3">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 h-12 rounded-xl border border-slate-300 text-slate-700 font-semibold text-[14px] flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
              >
                <Printer size={16} />
                Imprimir Cupom
              </button>
              <button
                onClick={onClose}
                className="flex-1 h-12 rounded-xl bg-[#1D4ED8] text-white font-semibold text-[14px] flex items-center justify-center gap-1 hover:bg-blue-800 transition-colors"
              >
                <span>Nova Venda</span>
                <span className="text-blue-200 text-[12px]">({countdown}s)</span>
              </button>
            </div>
          </div>
        ) : (
          /* Formulário de Pagamento */
          <>
            {/* Header do Modal */}
            <div className="p-5 pb-4 border-b border-[#E2E8F0] flex items-start justify-between bg-[#F9FAFB]">
              <div>
                <span className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider">
                  Finalização de Caixa
                </span>
                <h2 className="text-[20px] font-bold text-[#1E293B] leading-tight">
                  Finalizar Venda
                </h2>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
                  Total da Venda
                </span>
                <span className="text-[26px] font-black text-[#1D4ED8] tracking-tight leading-none">
                  {formatBRL(total)}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Métodos de Pagamento em Grid 2x2 */}
              <div>
                <label className="text-[13px] font-semibold text-[#1E293B] block mb-2">
                  Selecione a Forma de Pagamento:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* 1. Dinheiro */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMethod('dinheiro');
                      setTimeout(() => inputRef.current?.focus(), 50);
                    }}
                    className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      selectedMethod === 'dinheiro'
                        ? 'border-[#1D4ED8] bg-[#EFF6FF] ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-[#E2E8F0] hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        selectedMethod === 'dinheiro'
                          ? 'bg-[#1D4ED8] text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Banknote size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[14px] font-bold text-[#1E293B]">
                          Dinheiro
                        </span>
                        <kbd className="text-[10px] bg-slate-200 px-1 rounded text-slate-600 font-mono font-bold">
                          1
                        </kbd>
                      </div>
                      <span className="text-[12px] text-[#64748B]">Com troco</span>
                    </div>
                  </button>

                  {/* 2. Cartão Crédito */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('credito')}
                    className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      selectedMethod === 'credito'
                        ? 'border-[#1D4ED8] bg-[#EFF6FF] ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-[#E2E8F0] hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        selectedMethod === 'credito'
                          ? 'bg-[#1D4ED8] text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[14px] font-bold text-[#1E293B]">
                          Crédito
                        </span>
                        <kbd className="text-[10px] bg-slate-200 px-1 rounded text-slate-600 font-mono font-bold">
                          2
                        </kbd>
                      </div>
                      <span className="text-[12px] text-[#64748B]">À vista ou parcelado</span>
                    </div>
                  </button>

                  {/* 3. Cartão Débito */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('debito')}
                    className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      selectedMethod === 'debito'
                        ? 'border-[#1D4ED8] bg-[#EFF6FF] ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-[#E2E8F0] hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        selectedMethod === 'debito'
                          ? 'bg-[#1D4ED8] text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[14px] font-bold text-[#1E293B]">
                          Débito
                        </span>
                        <kbd className="text-[10px] bg-slate-200 px-1 rounded text-slate-600 font-mono font-bold">
                          3
                        </kbd>
                      </div>
                      <span className="text-[12px] text-[#64748B]">Cartão de débito</span>
                    </div>
                  </button>

                  {/* 4. Pix */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('pix')}
                    className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      selectedMethod === 'pix'
                        ? 'border-[#1D4ED8] bg-[#EFF6FF] ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-[#E2E8F0] hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        selectedMethod === 'pix'
                          ? 'bg-[#1D4ED8] text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <QrCode size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[14px] font-bold text-[#1E293B]">
                          Pix Instantâneo
                        </span>
                        <kbd className="text-[10px] bg-slate-200 px-1 rounded text-slate-600 font-mono font-bold">
                          4
                        </kbd>
                      </div>
                      <span className="text-[12px] text-[#64748B]">QR Code na tela</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Detalhe do Método Selecionado */}
              {selectedMethod === 'dinheiro' && (
                <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E2E8F0] space-y-3">
                  <div>
                    <label className="text-[13px] font-semibold text-[#1E293B] block mb-1">
                      Valor Recebido do Cliente:
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-[18px] font-bold text-slate-400">
                        R$
                      </span>
                      <input
                        ref={inputRef}
                        type="number"
                        step="0.01"
                        min="0"
                        value={valorRecebidoStr}
                        onChange={(e) => {
                          setValorRecebidoStr(e.target.value);
                          setErrorMsg('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleConfirm();
                        }}
                        placeholder="0,00"
                        className="w-full h-12 pl-11 pr-4 bg-white border border-[#1D4ED8] rounded-xl text-[20px] font-bold text-[#1E293B] outline-none shadow-xs"
                      />
                    </div>

                    {/* Botões Rápidos de Valor Frequente */}
                    <div className="flex items-center gap-2 mt-2">
                      {[total, Math.ceil(total / 10) * 10, Math.ceil(total / 50) * 50, 100].map(
                        (presetVal, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setValorRecebidoStr(presetVal.toFixed(2));
                              setErrorMsg('');
                            }}
                            className="px-2.5 py-1 text-[12px] font-semibold bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 text-slate-700 transition-colors"
                          >
                            {formatBRL(presetVal)}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Exibição de Troco em Tempo Real */}
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[14px] font-semibold text-[#1E293B]">
                      Troco a Devolver:
                    </span>
                    <span
                      className={`text-[24px] font-extrabold ${
                        isDinheiroInsuficiente ? 'text-slate-400' : 'text-[#16A34A]'
                      }`}
                    >
                      {formatBRL(troco)}
                    </span>
                  </div>

                  {isDinheiroInsuficiente && (
                    <div className="flex items-center gap-1 text-[12px] text-red-600 font-medium">
                      <AlertCircle size={14} />
                      <span>Valor menor que o total da venda.</span>
                    </div>
                  )}
                </div>
              )}

              {selectedMethod === 'pix' && (
                <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E2E8F0] flex items-center gap-4">
                  {/* QR Code Simulado com SVG SVG real */}
                  <div className="w-24 h-24 bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-center shadow-xs shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900">
                      <path
                        fill="currentColor"
                        d="M0 0h36v36H0V0zm6 6v24h24V6H6zm64-6h36v36H70V0zm6 6v24h24V6H76zM0 70h36v36H0V70zm6 6v24h24V76H6zm46-70h8v8h-8V6zm14 0h8v8h-8V6zm-14 14h8v8h-8v-8zm14 14h8v8h-8v-8zm-28 0h8v8h-8v-8zm0 14h8v8h-8v-8zm14 0h8v8h-8v-8zm14 0h8v8h-8v-8zm14 0h8v8h-8v-8zm0 14h8v8h-8v-8zm-14 14h8v8h-8v-8zm14 14h8v8h-8v-8z"
                      />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-bold text-[#1E293B] block">
                      Aponte a câmera do aplicativo do banco
                    </span>
                    <span className="text-[12px] text-[#64748B] block mt-0.5">
                      Chave vinculada ao Caixa 04 • Aprovação instantânea
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyPix}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      {copiedPix ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      <span>{copiedPix ? 'Chave Copiada!' : 'Copiar Chave Pix'}</span>
                    </button>
                  </div>
                </div>
              )}

              {(selectedMethod === 'credito' || selectedMethod === 'debito') && (
                <div className="p-4 rounded-xl bg-[#EFF6FF] border border-blue-200 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-[#1D4ED8] flex items-center justify-center shrink-0">
                    <CreditCard size={20} />
                  </div>
                  <div className="text-[13px] text-[#1E293B]">
                    <span className="font-bold block">
                      Maquininha TEF Conectada
                    </span>
                    <span className="text-slate-600">
                      Insira ou aproxime o cartão do cliente para aprovação automática de {formatBRL(total)}.
                    </span>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-[13px] font-medium animate-shake">
                  {errorMsg}
                </div>
              )}
            </div>

            {/* Rodapé de Ações do Modal */}
            <div className="p-5 border-t border-[#E2E8F0] bg-[#F9FAFB] flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 h-14 rounded-xl border border-slate-300 text-slate-700 font-semibold text-[15px] hover:bg-slate-100 active:scale-98 transition-all cursor-pointer"
              >
                Voltar (Esc)
              </button>

              <button
                type="button"
                id="btn-confirmar-pagamento"
                onClick={handleConfirm}
                disabled={isDinheiroInsuficiente}
                className={`flex-1 h-14 rounded-xl text-white font-semibold text-[15px] uppercase tracking-wide flex items-center justify-center gap-2 shadow-md shadow-blue-700/20 transition-all cursor-pointer ${
                  isDinheiroInsuficiente
                    ? 'bg-slate-300 cursor-not-allowed shadow-none'
                    : 'bg-[#1D4ED8] hover:bg-blue-800 active:scale-98'
                }`}
              >
                <span>Confirmar Pagamento</span>
                <CheckCircle2 size={18} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
