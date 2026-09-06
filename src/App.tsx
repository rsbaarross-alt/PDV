/**
 * PDV INTELIGENTE v2.0
 * Ponto de Venda (PDV/POS) de Alta Performance para Varejo
 * Layout Master: Zona A (Header), Zona B (Catálogo 60%), Zona C (Carrinho 40%), Zona D (Total 80px)
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Product, CartItem, PaymentMethodType, SessionInfo } from './types';
import { MOCK_PRODUTOS } from './data/mockProducts';
import { Header } from './components/Header';
import { Catalog } from './components/Catalog';
import { Cart } from './components/Cart';
import { TotalFooter } from './components/TotalFooter';
import { PaymentModal } from './components/PaymentModal';
import { ConsultPriceModal } from './components/ConsultPriceModal';
import { CancelSaleModal } from './components/CancelSaleModal';
import { ShortcutsHelpModal } from './components/ShortcutsHelpModal';
import { SupabaseInfoModal } from './components/SupabaseInfoModal';
import { LoginScreen } from './components/LoginScreen';
import { UsersManagementModal } from './components/UsersManagementModal';
import { checkSupabaseStatus, fetchProducts, registerSale, SupabaseStatus } from './services/api';
import { registerUserLogout } from './services/userService';
import { CheckCircle } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<SessionInfo | null>(() => {
    try {
      const saved = localStorage.getItem('pdv_last_session');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignora erro de parse
    }
    return null;
  });

  const [products, setProducts] = useState<Product[]>(MOCK_PRODUTOS);
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseStatus>({
    configured: false,
    connected: false,
    message: 'Verificando conexão...',
  });
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);
  const [isTestingSupabase, setIsTestingSupabase] = useState<boolean>(false);

  // Estado do Carrinho (começa com exemplo funcional para visualização imediata)
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: 'item-1',
      produto: MOCK_PRODUTOS[0], // Coca-Cola 2 Litros
      quantidade: 2,
      precoUnitario: 9.49,
      total: 18.98,
      adicionadoRecentemente: false,
    },
    {
      id: 'item-2',
      produto: MOCK_PRODUTOS[4], // Pão Francês (kg)
      quantidade: 0.75,
      precoUnitario: 14.90,
      total: 11.18,
      adicionadoRecentemente: false,
    },
  ]);

  // Desconto
  const [discount, setDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'reais' | 'porcentagem'>('reais');

  // Modais
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [isConsultOpen, setIsConsultOpen] = useState<boolean>(false);
  const [isCancelOpen, setIsCancelOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState<boolean>(false);

  // Busca e feedback
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lastAddedProductCode, setLastAddedProductCode] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Toast temporário (<1.5s)
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 1800);
  }, []);

  // Carregar produtos e status do Supabase
  const loadInitialData = useCallback(async () => {
    setIsTestingSupabase(true);
    try {
      const status = await checkSupabaseStatus();
      setSupabaseStatus(status);

      const { products: loadedProducts, source } = await fetchProducts();
      if (loadedProducts && loadedProducts.length > 0) {
        setProducts(loadedProducts);
      }
      if (source === 'supabase') {
        console.log(`📡 ${loadedProducts.length} produtos carregados do Supabase.`);
      }
    } catch (err) {
      console.warn('Operando com catálogo local:', err);
    } finally {
      setIsTestingSupabase(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Cálculo de Subtotal e Total
  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);

  const discountAmount = discountType === 'reais'
    ? Math.min(discount, subtotal)
    : (subtotal * Math.min(discount, 100)) / 100;

  const total = Math.max(0, subtotal - discountAmount);

  // Adicionar produto ao carrinho com feedback imediato (<100ms)
  const handleAddToCart = useCallback((product: Product, quantity = 1) => {
    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) => item.produto.codigo === product.codigo
      );

      // Marca todos anteriores como não recentes
      const unflagged = prevItems.map((item) => ({
        ...item,
        adicionadoRecentemente: false,
      }));

      if (existingIndex >= 0) {
        // Incrementa quantidade existente
        const updated = [...unflagged];
        const existing = updated[existingIndex];
        const newQty = existing.quantidade + quantity;
        const newTotal = Number((newQty * existing.precoUnitario).toFixed(2));

        const updatedItem: CartItem = {
          ...existing,
          quantidade: newQty,
          total: newTotal,
          adicionadoRecentemente: true,
        };

        // Move item atualizado para o topo da lista
        updated.splice(existingIndex, 1);
        return [updatedItem, ...updated];
      } else {
        // Adiciona novo item no topo
        const newItem: CartItem = {
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          produto: product,
          quantidade: quantity,
          precoUnitario: product.preco,
          total: Number((quantity * product.preco).toFixed(2)),
          adicionadoRecentemente: true,
        };
        return [newItem, ...unflagged];
      }
    });

    setLastAddedProductCode(product.codigo);
    showToast(`+ ${product.nome} adicionado`);

    // Remove destaque do card após 600ms
    setTimeout(() => {
      setLastAddedProductCode(null);
    }, 600);
  }, [showToast]);

  // Atualizar quantidade com delta (+1, -1 ou fracionado)
  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = Math.max(
              item.produto.unidade === 'kg' ? 0.05 : 1,
              Number((item.quantidade + delta).toFixed(3))
            );
            return {
              ...item,
              quantidade: newQty,
              total: Number((newQty * item.precoUnitario).toFixed(2)),
              adicionadoRecentemente: false,
            };
          }
          return item;
        })
        .filter((item) => item.quantidade > 0)
    );
  };

  // Definir quantidade exata
  const handleSetQuantity = (id: string, newQty: number) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const validQty = Math.max(item.produto.unidade === 'kg' ? 0.05 : 1, newQty);
          return {
            ...item,
            quantidade: validQty,
            total: Number((validQty * item.precoUnitario).toFixed(2)),
            adicionadoRecentemente: false,
          };
        }
        return item;
      })
    );
  };

  // Remover item único
  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => {
      const itemToRemove = prev.find((i) => i.id === id);
      if (itemToRemove) {
        showToast(`Removido: ${itemToRemove.produto.nome}`);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  // Limpar todo o carrinho
  const handleClearCart = () => {
    if (cartItems.length > 0) {
      setIsCancelOpen(true);
    }
  };

  const handleConfirmCancel = () => {
    setCartItems([]);
    setDiscount(0);
    setIsCancelOpen(false);
    showToast('Venda cancelada.');
  };

  const handleLoginSuccess = (newSession: SessionInfo) => {
    setSession(newSession);
    showToast(`Caixa aberto com sucesso! Operador: ${newSession.operador.nome}`);
  };

  const handleLogout = () => {
    if (session?.operador.email) {
      registerUserLogout(session.operador.email);
    }
    setSession(null);
    setIsUsersModalOpen(false);
    try {
      localStorage.removeItem('pdv_last_session');
    } catch {
      // Ignora erro de storage
    }
    showToast('Sessão encerrada.');
  };

  // Finalizar venda com sucesso
  const handleConfirmSale = async (method: PaymentMethodType, received: number, change: number) => {
    const salePayload = {
      itens: cartItems,
      subtotal,
      desconto: discountAmount,
      descontoTipo: discountType,
      total,
      metodoPagamento: method,
      valorRecebido: received,
      troco: change,
      operador: session?.operador.nome || 'Carlos Silva',
      caixa: session?.caixa || 'Caixa 04',
    };

    // Limpa a venda após pagamento
    setCartItems([]);
    setDiscount(0);

    try {
      const result = await registerSale(salePayload);
      if (result.source === 'supabase' && result.success) {
        showToast(`Venda registrada no Supabase! (${result.codigoVenda || 'OK'})`);
        // Atualiza estoque no catálogo local
        const { products: updatedProducts } = await fetchProducts();
        if (updatedProducts && updatedProducts.length > 0) {
          setProducts(updatedProducts);
        }
      } else {
        showToast('Pagamento registrado localmente com sucesso!');
      }
    } catch {
      showToast('Pagamento registrado com sucesso!');
    }
  };

  // ATALHOS DE TECLADO GLOBAIS
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // F3: Focar na busca e limpar campo atual
      if (e.key === 'F3') {
        e.preventDefault();
        setSearchQuery('');
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      // F12: Finalizar venda (abre modal de pagamento)
      if (e.key === 'F12') {
        e.preventDefault();
        if (cartItems.length > 0) {
          setIsPaymentOpen(true);
        } else {
          showToast('Adicione produtos para finalizar a venda.');
        }
        return;
      }

      // F5: Cancelar venda atual (evita recarregar página e pede confirmação)
      if (e.key === 'F5') {
        e.preventDefault();
        if (cartItems.length > 0) {
          setIsCancelOpen(true);
        }
        return;
      }

      // F8: Consultar preço
      if (e.key === 'F8') {
        e.preventDefault();
        setIsConsultOpen(true);
        return;
      }

      // F7: Gestão de Usuários
      if (e.key === 'F7') {
        e.preventDefault();
        setIsUsersModalOpen(true);
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [cartItems, showToast]);

  if (!session) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        supabaseStatus={supabaseStatus}
        initialTerminal="Caixa 04"
      />
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-white overflow-hidden select-none font-['Inter',sans-serif]">
      {/* Notificação / Toast de Acessibilidade */}
      <div aria-live="polite" role="alert" className="sr-only">
        {toastMessage}
      </div>

      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#1E293B] text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-[13px] font-medium animate-slide-down">
          <CheckCircle size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ZONA A — HEADER (64px altura fixa) */}
      <Header
        products={products}
        onSelectProduct={(p) => handleAddToCart(p, 1)}
        searchInputRef={searchInputRef}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenConsultPrice={() => setIsConsultOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        supabaseStatus={supabaseStatus}
        onOpenSupabaseInfo={() => setIsSupabaseModalOpen(true)}
        session={session}
        onLogout={handleLogout}
        onOpenUsersManagement={() => setIsUsersModalOpen(true)}
      />

      {/* ÁREA CENTRAL: ZONA B (CATÁLOGO 60%) + ZONA C (CARRINHO 40%) */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* ZONA B: CATÁLOGO */}
        <Catalog
          products={products}
          onAddToCart={(p) => handleAddToCart(p, 1)}
          lastAddedProductCode={lastAddedProductCode}
        />

        {/* ZONA C: CARRINHO */}
        <Cart
          items={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onSetQuantity={handleSetQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
        />
      </main>

      {/* ZONA D — BARRA DE TOTALIZAÇÃO (80px altura fixa) */}
      <TotalFooter
        itemCount={cartItems.reduce((acc, curr) => acc + (curr.produto.unidade === 'un' ? curr.quantidade : 1), 0)}
        subtotal={subtotal}
        discount={discount}
        discountType={discountType}
        onDiscountChange={(val, type) => {
          setDiscount(val);
          setDiscountType(type);
        }}
        total={total}
        onOpenPayment={() => setIsPaymentOpen(true)}
        disabled={cartItems.length === 0}
      />

      {/* MODAL DE PAGAMENTO (F12) */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        total={total}
        subtotal={subtotal}
        discount={discountAmount}
        items={cartItems}
        onConfirmSale={handleConfirmSale}
      />

      {/* MODAL DE CONSULTA DE PREÇO (F8) */}
      <ConsultPriceModal
        isOpen={isConsultOpen}
        onClose={() => setIsConsultOpen(false)}
        products={products}
        onAddFromConsult={(p) => handleAddToCart(p, 1)}
      />

      {/* MODAL DE CANCELAMENTO (F5) */}
      <CancelSaleModal
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onConfirmCancel={handleConfirmCancel}
        itemCount={cartItems.length}
      />

      {/* MODAL DE AJUDA / ATALHOS */}
      <ShortcutsHelpModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* MODAL DE INTEGRAÇÃO SUPABASE */}
      <SupabaseInfoModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        status={supabaseStatus}
        onRefresh={loadInitialData}
        isRefreshing={isTestingSupabase}
      />

      {/* MODAL DE GESTÃO DE USUÁRIOS & CONTROLE DE ACESSO (CRUD) */}
      <UsersManagementModal
        isOpen={isUsersModalOpen}
        onClose={() => setIsUsersModalOpen(false)}
        currentSession={session}
        onSessionTerminated={handleLogout}
      />
    </div>
  );
}
