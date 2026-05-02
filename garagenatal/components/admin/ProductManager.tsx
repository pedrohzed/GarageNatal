"use client";

import { useState } from "react";
import { ProductForm } from "./ProductForm";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { importCatalog, purgeImportedProducts } from "@/app/admin/actions";

export function ProductManager({ initialProducts }: { initialProducts: any[] }) {
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleEdit = (produto: any) => {
    setEditingProduct(produto);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
  };

  const handlePurge = async () => {
    const confirmPurge = window.confirm("Isso vai EXCLUIR TODOS os produtos importados automaticamente (cujo nome começa com 'Tênis Premium' ou 'Sneaker Premium') e suas imagens do Storage.\n\nDeseja continuar?");
    if (!confirmPurge) return;

    setIsPurging(true);
    try {
      const result = await purgeImportedProducts();
      if (result.success) {
        alert(`Limpeza concluída! ${result.count} produtos foram removidos.`);
        router.refresh();
      } else {
        alert(`Erro na limpeza: ${result.error}`);
      }
    } catch (e: any) {
      alert("Falha: " + e.message);
    } finally {
      setIsPurging(false);
    }
  };

  const handleImport = async () => {
    const confirmImport = window.confirm("Isso vai ler a pasta local 'Garage Natal' na sua área de trabalho e cadastrar tudo de uma vez. Pode demorar vários minutos dependendo da quantidade de fotos. Deseja iniciar?");
    if (!confirmImport) return;

    setIsImporting(true);
    try {
      const result = await importCatalog();
      if (result.success) {
        alert(`Importação concluída! ${result.count} produtos foram cadastrados com sucesso.`);
        router.refresh();
      } else {
        alert(`Ocorreu um erro durante a importação: ${result.error}`);
      }
    } catch (e: any) {
      alert("Falha ao comunicar com o servidor: " + e.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = async (produto: any) => {
    const confirmDelete = window.confirm(`Tem certeza que deseja EXCLUIR definitivamente o produto "${produto.nome}"?\n\nEsta ação não pode ser desfeita e todas as imagens serão apagadas do servidor.`);
    
    if (!confirmDelete) return;

    try {
      // 1. Opcional: Tentar apagar as imagens físicas do Storage para liberar espaço
      if (produto.imagens_url && produto.imagens_url.length > 0) {
        for (const url of produto.imagens_url) {
          try {
            const parts = url.split('/');
            const fileName = parts[parts.length - 1];
            await supabase.storage.from("produtos-imagens").remove([fileName]);
          } catch (e) {
            console.error("Erro ao remover imagem do storage", e);
          }
        }
      }

      // 2. Apagar do Banco de Dados
      const { error } = await supabase.from("produtos").delete().eq("id", produto.id);
      
      if (error) throw new Error(`Erro ao deletar: ${error.message}`);
      
      alert("Produto excluído com sucesso!");
      
      // Se estivesse editando o produto excluído, cancela a edição
      if (editingProduct?.id === produto.id) {
        handleCancelEdit();
      }
      
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Ocorreu um erro ao excluir o produto.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Formulário para Adicionar/Editar Produto */}
      <section className="bg-[#121212] border border-[#2a2a2a] p-6 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-primary">
            {editingProduct ? `Editando: ${editingProduct.nome}` : "Adicionar Novo Produto"}
          </h2>
          {editingProduct && (
            <button 
              onClick={handleCancelEdit}
              className="text-sm text-gray-400 hover:text-white"
            >
              Cancelar Edição
            </button>
          )}
        </div>
        
        {/* Passa uma key diferente para resetar o form quando mudar o produto */}
        <ProductForm key={editingProduct ? editingProduct.id : "new"} initialData={editingProduct} onSaveSuccess={handleCancelEdit} />
      </section>

      {/* Tabela de Produtos Cadastrados */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">Produtos Cadastrados</h2>
          <div className="flex gap-2">
             <button 
              onClick={handlePurge}
              disabled={isPurging}
              className="bg-red-600 text-white font-bold py-2 px-4 rounded hover:bg-red-500 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              {isPurging ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Limpando...
                </>
              ) : (
                "Limpar Importados"
              )}
            </button>
             <button 
              onClick={handleImport}
              disabled={isImporting}
              className="bg-primary text-black font-bold py-2 px-4 rounded hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isImporting ? (
                <>
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                  Importando...
                </>
              ) : (
                "Importar Catálogo (Pasta Local)"
              )}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border border-[#2a2a2a]">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs uppercase bg-[#222] text-gray-400">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Preço</th>
                <th className="px-4 py-3">Visível</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {!initialProducts || initialProducts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    Nenhum produto cadastrado ainda.
                  </td>
                </tr>
              ) : (
                initialProducts.map((p: any) => (
                  <tr key={p.id} className="border-b border-[#2a2a2a] bg-[#1a1a1a] hover:bg-[#222]">
                    <td className="px-4 py-3 font-medium text-white">{p.nome}</td>
                    <td className="px-4 py-3">R$ {Number(p.preco).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${p.visivel ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {p.visivel ? 'SIM' : 'NÃO'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-4">
                      <button 
                        onClick={() => handleEdit(p)}
                        className="text-primary hover:text-yellow-400 font-medium transition-colors"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDelete(p)}
                        className="text-red-500 hover:text-red-400 font-medium transition-colors"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
