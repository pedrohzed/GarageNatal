"use client";

import Image from "next/image";
import { useCart } from "./CartContext";
import { ShoppingCart } from "lucide-react";
import { useState } from "react";

export function ProductCard({ produto }: { produto: any }) {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [showError, setShowError] = useState(false);

  const availableSizes = produto.tamanhos_estoque?.filter((t: any) => t.estoque > 0) || [];

  const handleAddToCart = () => {
    if (availableSizes.length > 0 && !selectedSize) {
      setShowError(true);
      return;
    }

    addToCart({
      produto_id: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      tamanho: selectedSize || "Único",
      quantidade: 1,
      imagem_url: produto.imagens_url?.[0] || "",
    });
    
    setShowError(false);
  };

  return (
    <div className="bg-[#121212] border border-[#2a2a2a] rounded-lg overflow-hidden group hover:border-primary transition-all duration-300 flex flex-col h-full">
      {/* Imagem */}
      <div className="relative w-full aspect-square bg-[#0a0a0a] overflow-hidden">
        {produto.imagens_url && produto.imagens_url[0] ? (
          <Image
            src={produto.imagens_url[0]}
            alt={produto.nome}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            Sem imagem
          </div>
        )}
        
        {produto.categorias && produto.categorias.includes("Promos") && (
          <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 uppercase rounded">
            Promo
          </span>
        )}
      </div>

      {/* Informações */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex gap-2 mb-2">
          {produto.categorias?.map((cat: string) => (
            <span key={cat} className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {cat}
            </span>
          ))}
        </div>
        
        {produto.nome && produto.nome.trim() !== "" && (
          <h2 className="text-lg font-bold text-white mb-2 line-clamp-2 leading-tight flex-grow">
            {produto.nome}
          </h2>
        )}
        
        {/* Seletor de Tamanhos */}
        {availableSizes.length > 0 ? (
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-2 uppercase font-medium">Selecione o Tamanho:</p>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((t: any) => (
                <button
                  key={t.tamanho}
                  onClick={() => {
                    setSelectedSize(t.tamanho);
                    setShowError(false);
                  }}
                  className={`w-10 h-10 rounded font-bold text-sm transition-colors border ${
                    selectedSize === t.tamanho
                      ? "bg-primary border-primary text-black"
                      : "bg-[#1a1a1a] border-[#333] text-gray-400 hover:border-primary hover:text-primary"
                  }`}
                >
                  {t.tamanho}
                </button>
              ))}
            </div>
            {showError && <p className="text-red-500 text-xs mt-1">Por favor, selecione um tamanho</p>}
          </div>
        ) : (
          <div className="mb-4">
            <span className="text-red-500 text-sm font-bold bg-red-500/10 px-2 py-1 rounded">
              Esgotado
            </span>
          </div>
        )}

        <div className="flex items-end justify-between mt-auto pt-4 border-t border-[#2a2a2a]">
          <div className="flex flex-col">
            <span className="text-xl font-black text-primary">
              R$ {Number(produto.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          <button 
            onClick={handleAddToCart}
            disabled={availableSizes.length === 0}
            className="bg-white text-black p-3 rounded-full hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed group-hover:scale-110 duration-200"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
