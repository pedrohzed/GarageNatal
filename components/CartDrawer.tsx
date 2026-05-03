"use client";

import { useCart } from "./CartContext";
import { X, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import Image from "next/image";

export function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    // Número do WhatsApp da loja (substitua pelo seu com DDI e DDD, ex: 5584999999999)
    const phoneNumber = "5584999999999"; 
    
    let message = "Olá *GarageNatal*! 👟\nGostaria de finalizar o meu pedido:\n\n";
    
    items.forEach((item, index) => {
      message += `${index + 1}. *${item.nome}*\n`;
      message += `   Tamanho: ${item.tamanho} | Qtd: ${item.quantidade}\n`;
      message += `   Preço: R$ ${(item.preco * item.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`;
    });
    
    message += `*Total do Pedido: R$ ${cartTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*\n\n`;
    message += "Aguardando confirmação de disponibilidade e instruções de pagamento (PIX).";

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, "_blank");
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-[#121212] shadow-2xl z-[70] flex flex-col border-l border-[#2a2a2a] transform transition-transform duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a] bg-[#1a1a1a]">
          <h2 className="text-xl font-black text-white uppercase flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Seu Carrinho ({cartCount})
          </h2>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-[#333] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Itens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
              <ShoppingBag className="w-16 h-16 opacity-20" />
              <p>Seu carrinho está vazio.</p>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="text-primary hover:underline font-medium"
              >
                Continuar comprando
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 bg-[#1a1a1a] p-3 rounded-lg border border-[#333]">
                <div className="relative w-20 h-20 bg-[#0a0a0a] rounded overflow-hidden flex-shrink-0">
                  {item.imagem_url ? (
                    <Image src={item.imagem_url} alt={item.nome} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">Sem Imagem</div>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white line-clamp-1">{item.nome}</h3>
                    <p className="text-xs text-gray-400 mt-1">Tamanho: <span className="text-white font-medium">{item.tamanho}</span></p>
                    <p className="text-sm font-black text-primary mt-1">
                      R$ {Number(item.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center bg-[#222] rounded border border-[#444]">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantidade - 1)}
                        className="px-2 py-1 text-gray-400 hover:text-white"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-sm font-medium text-white">{item.quantidade}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantidade + 1)}
                        className="px-2 py-1 text-gray-400 hover:text-white"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-[#2a2a2a] bg-[#1a1a1a]">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-400 font-medium">Subtotal</span>
              <span className="text-2xl font-black text-white">
                R$ {cartTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <button 
              onClick={handleCheckout}
              className="w-full bg-primary text-black font-black uppercase tracking-wider py-4 rounded hover:bg-yellow-400 transition-colors cursor-pointer"
            >
              Finalizar Compra via WhatsApp
            </button>
          </div>
        )}
      </div>
    </>
  );
}
