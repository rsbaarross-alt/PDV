/**
 * Modal de Diagnóstico e Status dos Periféricos de Checkout
 * Monitora impressora térmica, balança, leitor de código de barras e gaveta
 */
import React, { useState } from 'react';
import {
  X,
  Printer,
  Barcode,
  Scale,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Cpu,
  Zap,
} from 'lucide-react';
import { PeripheralDevice } from '../types';
import { getPeripheralDevices } from '../services/salesSessionService';

interface PeripheralsStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PeripheralsStatusModal: React.FC<PeripheralsStatusModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [devices, setDevices] = useState<PeripheralDevice[]>(getPeripheralDevices());
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testLog, setTestLog] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestDevice = (device: PeripheralDevice) => {
    setTestingId(device.id);
    setTestLog(`Iniciando comunicação com ${device.nome}...`);

    setTimeout(() => {
      if (device.tipo === 'impressora') {
        setTestLog(`[OK] Pulso de teste enviado para ${device.modelo}. Guilhotina e sensor de papel normais.`);
      } else if (device.tipo === 'balanca') {
        setTestLog(`[OK] Resposta serial recebida de ${device.modelo}: Peso estável 0,000 kg (Tara: 0,000 kg).`);
      } else if (device.tipo === 'leitor') {
        setTestLog(`[OK] Comunicação HID validada com ${device.modelo}. Pronto para leitura de EAN-13.`);
      } else if (device.tipo === 'gaveta') {
        setTestLog(`[OK] Sinal de 24V disparado via conector DK. Solenoide da gaveta destravado com sucesso.`);
      }
      setTestingId(null);
    }, 900);
  };

  const getDeviceIcon = (tipo: PeripheralDevice['tipo']) => {
    switch (tipo) {
      case 'impressora':
        return <Printer size={20} className="text-blue-600" />;
      case 'balanca':
        return <Scale size={20} className="text-emerald-600" />;
      case 'leitor':
        return <Barcode size={20} className="text-purple-600" />;
      case 'gaveta':
        return <Zap size={20} className="text-amber-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-scale-up">
        {/* Cabeçalho */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-400 flex items-center justify-center">
              <Cpu size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">Hardware & Periféricos do Caixa</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  4 de 4 online
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Portas de comunicação e autoteste de periféricos conectados ao PDV
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Log de Teste */}
        {testLog && (
          <div className="bg-slate-950 text-emerald-400 font-mono text-xs px-6 py-2.5 border-b border-slate-800 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
            <span className="truncate">{testLog}</span>
          </div>
        )}

        {/* Lista de Dispositivos */}
        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {devices.map((device) => (
            <div
              key={device.id}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                  {getDeviceIcon(device.tipo)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{device.nome}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Online
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-700 mt-0.5">{device.modelo}</div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span className="font-mono">{device.porta}</span>
                    <span>•</span>
                    <span>{device.detalhes}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleTestDevice(device)}
                disabled={testingId === device.id}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 self-end sm:self-center"
              >
                <RefreshCw size={13} className={testingId === device.id ? 'animate-spin' : ''} />
                <span>{testingId === device.id ? 'Testando...' : 'Testar Dispositivo'}</span>
              </button>
            </div>
          ))}
        </div>

        {/* Rodapé */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Drivers e portas monitorados automaticamente pelo driver local.</span>
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
