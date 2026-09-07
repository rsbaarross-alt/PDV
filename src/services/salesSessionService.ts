/**
 * Serviço de Gerenciamento da Sessão de Vendas, Caixa e Periféricos do PDV
 */
import { SaleSummary, CashMovement, PeripheralDevice, PaymentMethodType } from '../types';

const SALES_STORAGE_KEY = 'pdv_session_sales_v2';
const MOVEMENTS_STORAGE_KEY = 'pdv_cash_movements_v2';

const listeners: Array<() => void> = [];

const notifyChange = () => {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch {
      // Ignora erro de callback
    }
  });
};

export const subscribeSessionSales = (cb: () => void) => {
  listeners.push(cb);
  return () => {
    const idx = listeners.indexOf(cb);
    if (idx !== -1) listeners.splice(idx, 1);
  };
};

/**
 * Vendas iniciais de exemplo para o operador ter contexto imediato
 */
const DEFAULT_SALES: SaleSummary[] = [
  {
    id: 'VD-847291',
    dataHora: new Date(Date.now() - 38 * 60 * 1000), // 38 min atrás
    itens: [
      {
        id: 'mock-1',
        produto: {
          codigo: '7891000',
          nome: 'Refrigerante Coca-Cola 2L',
          preco: 9.49,
          categoria: 'Bebidas',
          estoque: 46,
          unidade: 'un',
          icone: 'CupSoda',
        },
        quantidade: 2,
        precoUnitario: 9.49,
        total: 18.98,
      },
      {
        id: 'mock-2',
        produto: {
          codigo: '7891010',
          nome: 'Pão Francês (kg)',
          preco: 14.90,
          categoria: 'Padaria',
          estoque: 14.2,
          unidade: 'kg',
          icone: 'Croissant',
        },
        quantidade: 0.85,
        precoUnitario: 14.90,
        total: 12.67,
      },
    ],
    subtotal: 31.65,
    desconto: 0,
    descontoTipo: 'reais',
    total: 31.65,
    metodoPagamento: 'pix',
    valorRecebido: 31.65,
    troco: 0,
    operador: 'Carlos Silva',
    caixa: 'Caixa 04',
  },
  {
    id: 'VD-847180',
    dataHora: new Date(Date.now() - 75 * 60 * 1000), // 1h15 atrás
    itens: [
      {
        id: 'mock-3',
        produto: {
          codigo: '7891020',
          nome: 'Queijo Mussarela (kg)',
          preco: 39.90,
          categoria: 'Frios',
          estoque: 11.5,
          unidade: 'kg',
          icone: 'Beef',
        },
        quantidade: 0.45,
        precoUnitario: 39.90,
        total: 17.96,
      },
      {
        id: 'mock-4',
        produto: {
          codigo: '7891001',
          nome: 'Cerveja Heineken Lata 350ml',
          preco: 5.49,
          categoria: 'Bebidas',
          estoque: 92,
          unidade: 'un',
          icone: 'Beer',
        },
        quantidade: 6,
        precoUnitario: 5.49,
        total: 32.94,
      },
    ],
    subtotal: 50.90,
    desconto: 2.90,
    descontoTipo: 'reais',
    total: 48.00,
    metodoPagamento: 'dinheiro',
    valorRecebido: 50.00,
    troco: 2.00,
    operador: 'Carlos Silva',
    caixa: 'Caixa 04',
  },
];

const DEFAULT_MOVEMENTS: CashMovement[] = [
  {
    id: 'MOV-101',
    tipo: 'suprimento',
    valor: 200.0,
    motivo: 'Fundo de troco inicial da abertura de caixa',
    dataHora: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    operador: 'Carlos Silva',
    caixa: 'Caixa 04',
    autorizadoPor: 'Mariana Souza (Gerente)',
  },
];

/**
 * Obtém vendas registradas na sessão
 */
export const getRecordedSales = (): SaleSummary[] => {
  try {
    const data = localStorage.getItem(SALES_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return parsed.map((item: any) => ({
        ...item,
        dataHora: new Date(item.dataHora),
      }));
    }
  } catch {
    // Ignora
  }
  return DEFAULT_SALES;
};

/**
 * Adiciona uma venda recém-finalizada ao histórico da sessão
 */
export const recordCompletedSale = (sale: SaleSummary) => {
  const current = getRecordedSales();
  const updated = [sale, ...current];
  try {
    localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignora
  }
  notifyChange();
};

/**
 * Obtém movimentações de caixa (Sangria e Suprimento)
 */
export const getCashMovements = (): CashMovement[] => {
  try {
    const data = localStorage.getItem(MOVEMENTS_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // Ignora
  }
  return DEFAULT_MOVEMENTS;
};

/**
 * Adiciona uma movimentação de caixa
 */
export const addCashMovement = (
  movement: Omit<CashMovement, 'id' | 'dataHora'>
): CashMovement => {
  const current = getCashMovements();
  const newMovement: CashMovement = {
    ...movement,
    id: `MOV-${Date.now().toString().slice(-6)}`,
    dataHora: new Date().toISOString(),
  };
  const updated = [newMovement, ...current];
  try {
    localStorage.setItem(MOVEMENTS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignora
  }
  notifyChange();
  return newMovement;
};

/**
 * Calcula resumo do caixa e métricas do turno
 */
export const getCashDrawerSummary = (fundoTrocoInicial = 200) => {
  const sales = getRecordedSales();
  const movements = getCashMovements();

  let totalVendasDinheiro = 0;
  let totalVendasPix = 0;
  let totalVendasCartao = 0;
  let totalVendasGeral = 0;

  sales.forEach((s) => {
    totalVendasGeral += s.total;
    if (s.metodoPagamento === 'dinheiro') {
      totalVendasDinheiro += s.total;
    } else if (s.metodoPagamento === 'pix') {
      totalVendasPix += s.total;
    } else if (s.metodoPagamento === 'credito' || s.metodoPagamento === 'debito') {
      totalVendasCartao += s.total;
    }
  });

  let totalSuprimento = 0;
  let totalSangria = 0;

  movements.forEach((m) => {
    if (m.tipo === 'suprimento') {
      // Ignora o primeiro se for o fundo inicial para não duplicar
      if (!m.motivo.toLowerCase().includes('abertura')) {
        totalSuprimento += m.valor;
      }
    } else if (m.tipo === 'sangria') {
      totalSangria += m.valor;
    }
  });

  const saldoGavetaAtual =
    fundoTrocoInicial + totalVendasDinheiro + totalSuprimento - totalSangria;

  const qtdVendas = sales.length;
  const ticketMedio = qtdVendas > 0 ? totalVendasGeral / qtdVendas : 0;

  return {
    fundoTrocoInicial,
    totalVendasGeral,
    totalVendasDinheiro,
    totalVendasPix,
    totalVendasCartao,
    totalSuprimento,
    totalSangria,
    saldoGavetaAtual,
    qtdVendas,
    ticketMedio,
  };
};

/**
 * Lista de periféricos conectados ao terminal PDV
 */
export const getPeripheralDevices = (): PeripheralDevice[] => [
  {
    id: 'printer-1',
    nome: 'Impressora Térmica Não-Fiscal',
    tipo: 'impressora',
    modelo: 'Epson TM-T20X / 80mm ESC/POS',
    porta: 'USB001 (9600 bps)',
    status: 'conectado',
    detalhes: 'Papel bobina 80mm pronto • Guilhotina ativa',
  },
  {
    id: 'scanner-1',
    nome: 'Leitor de Código de Barras',
    tipo: 'leitor',
    modelo: 'Honeywell Voyager 1250g Laser 1D/2D',
    porta: 'USB HID Keyboard Emulation',
    status: 'conectado',
    detalhes: 'Leitura ultrarrápida EAN-13, QR Code e GS1',
  },
  {
    id: 'scale-1',
    nome: 'Balança Checkout Computadora',
    tipo: 'balanca',
    modelo: 'Toledo Prix 3 Fit / Protocolo Prt3',
    porta: 'COM3 (Serial RS-232)',
    status: 'conectado',
    detalhes: 'Tara automática ativa • Capacidade 15kg/5g',
  },
  {
    id: 'drawer-1',
    nome: 'Gaveta Automática de Dinheiro',
    tipo: 'gaveta',
    modelo: 'Menno Metal RJ-11 / 24V',
    porta: 'Conectada via Impressora Térmica (DK port)',
    status: 'conectado',
    detalhes: 'Abertura por pulso elétrico no F12 / Sangria',
  },
];
