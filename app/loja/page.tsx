import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { ProductCard } from "@/components/ProductCard";
import Link from "next/link";
import { ChevronLeft, SearchX } from "lucide-react";

export const metadata = {
  title: "Catálogo | GarageNatal",
  description: "Veja todos os tênis disponíveis na GarageNatal. Estoque limitado, preços imbatíveis.",
};

export default async function LojaPage({ searchParams }: { searchParams: Promise<{ tamanho?: string }> }) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { tamanho } = await searchParams;
  const searchQuery = tamanho?.trim() || "";

  let produtos: any[] = [];
  try {
    const { data, error } = await supabase
      .from("produtos")
      .select("*")
      .eq("visivel", true)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    if (data) {
      if (searchQuery) {
        // Filtra em memória para evitar problemas de tipagem (string vs number) no JSONB do Supabase
        produtos = data.filter((p: any) => 
          p.tamanhos_estoque && 
          Array.isArray(p.tamanhos_estoque) &&
          p.tamanhos_estoque.some((t: any) => String(t.tamanho).trim() === searchQuery)
        );
      } else {
        produtos = data;
      }
    }
  } catch (error) {
    console.error("Erro ao buscar produtos na loja:", error);
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10">
        <Link 
          href="/"
          className="inline-flex items-center gap-1 text-gray-400 hover:text-primary transition-colors text-sm font-medium mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar ao início
        </Link>
        <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">
          {searchQuery ? (
            <>Tamanho <span className="text-primary">{searchQuery}</span></>
          ) : (
            <>Nosso <span className="text-primary">Catálogo</span></>
          )}
        </h1>
        <p className="text-gray-400 mt-2">
          {produtos?.length || 0} {(produtos?.length || 0) === 1 ? "tênis encontrado" : "tênis encontrados"}
        </p>
      </div>

      {/* Grid de Produtos */}
      {produtos && produtos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {produtos.map((produto: any) => (
            <ProductCard key={produto.id} produto={produto} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-[#121212] rounded-lg border border-[#2a2a2a]">
          {searchQuery ? (
            <>
              <SearchX className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-400 mb-2">
                Tamanho não encontrado
              </h3>
              <p className="text-gray-500 mb-4">Nenhum tênis disponível no tamanho {searchQuery}.</p>
              <Link href="/loja" className="text-primary hover:text-yellow-400 font-medium">
                Ver todos os tamanhos
              </Link>
            </>
          ) : (
            <>
              <h3 className="text-xl font-bold text-gray-400 mb-2">Nenhum tênis disponível no momento</h3>
              <p className="text-gray-500">Estamos preparando novidades. Volte mais tarde!</p>
            </>
          )}
        </div>
      )}
    </main>
  );
}
