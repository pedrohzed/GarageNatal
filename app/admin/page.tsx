import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { ProductManager } from "@/components/admin/ProductManager";
import { cookies } from "next/headers";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Validar se há usuário autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user || !user.email) {
    notFound(); // Retorna 404 silencioso
  }

  // 2. Validar se o usuário é admin
  const { data: adminData, error: adminError } = await supabase
    .from("admins")
    .select("email_autorizado")
    .eq("email_autorizado", user.email)
    .single();

  if (adminError || !adminData) {
    notFound(); // Retorna 404 silencioso
  }

  // 3. Buscar produtos existentes para exibir na tabela
  let { data: produtos } = await supabase
    .from("produtos")
    .select("*")
    .order("created_at", { ascending: false });

  // Se houver produtos com nome preenchido, limpa-os imediatamente usando a permissão do Admin logado
  if (produtos && produtos.length > 0) {
    const hasNomes = produtos.some(p => p.nome && p.nome.trim() !== "");
    if (hasNomes) {
      for (const p of produtos) {
        if (p.nome && p.nome.trim() !== "") {
          await supabase.from("produtos").update({ nome: "", descricao: "" }).eq("id", p.id);
        }
      }
      // Re-busca os produtos atualizados
      const { data: updatedProdutos } = await supabase
        .from("produtos")
        .select("*")
        .order("created_at", { ascending: false });
      produtos = updatedProdutos;
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center border-b border-[#333] pb-4">
        <h1 className="text-2xl font-bold text-white">Gerenciamento de Produtos</h1>
      </div>

      <ProductManager initialProducts={produtos || []} />
    </div>
  );
}
