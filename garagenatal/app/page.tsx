import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { ProductCard } from "@/components/ProductCard";
import { Star, CalendarDays, ShieldCheck, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function Home() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Buscar apenas 4 produtos visíveis para destaque
  let produtos: any[] = [];
  try {
    const { data } = await supabase
      .from("produtos")
      .select("*")
      .eq("visivel", true)
      .order("created_at", { ascending: false })
      .limit(4);
    if (data) produtos = data;
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
  }

  const stats = [
    { icon: CalendarDays, label: "No mercado desde", value: "2013" },
    { icon: Star, label: "Avaliação média", value: "4.9★" },
    { icon: ShieldCheck, label: "Produtos originais", value: "100%" },
  ];

  const feedbacks = [
    { src: "/feedback1.png", alt: "Feedback do cliente - Qualidade top, em breve pegando outro modelo" },
    { src: "/feedback2.png", alt: "Feedback do cliente - Amei meu tênis" },
    { src: "/feedback3.png", alt: "Feedback do cliente - Amei demais, qualidade top, super vou indicar" },
    { src: "/feedback4.png", alt: "Feedback do cliente - Perfeito o tênis, qualidade absurda" },
  ];

  return (
    <main>
      {/* ═══════════════════════════════════════════════════════ */}
      {/* HERO SECTION */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-20 md:py-32 px-4">
        {/* Background glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <p className="text-primary font-bold uppercase tracking-[0.3em] text-sm mb-6 animate-pulse">
            Natal / RN
          </p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-8">
            O seu novo{" "}
            <span className="text-primary">tênis</span>
            <br />
            está aqui
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            A melhor seleção de tênis de Natal. Estoque limitado, preços imbatíveis e pronta entrega
          </p>
          <Link 
            href="/loja"
            className="inline-flex items-center gap-2 bg-primary text-black font-black uppercase tracking-wider py-4 px-10 rounded-full hover:bg-yellow-400 hover:scale-105 transition-all duration-300 text-lg shadow-lg shadow-primary/20"
          >
            Ver Catálogo
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* DESTAQUES — 4 PRODUTOS */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight mb-3">
            Destaques da Semana
          </h2>
          <p className="text-gray-500 text-base">Os mais procurados pelos nossos clientes</p>
        </div>

        {produtos && produtos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {produtos.map((produto: any) => (
              <ProductCard key={produto.id} produto={produto} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-[#121212] rounded-2xl border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-gray-400 mb-2">Novidades em breve</h3>
            <p className="text-gray-500">Estamos preparando uma nova coleção. Volte mais tarde!</p>
          </div>
        )}

        <div className="text-center mt-10">
          <Link 
            href="/loja"
            className="inline-flex items-center gap-2 text-primary font-bold uppercase tracking-wider hover:text-yellow-400 transition-colors group"
          >
            Ver todos os tênis
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* NÚMEROS / STATS */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="border-y border-[#2a2a2a] bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="flex justify-center mb-3">
                  <stat.icon className="w-7 h-7 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-3xl md:text-4xl font-black text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 uppercase tracking-wider font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* FEEDBACKS REAIS */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight mb-3">
            Feedbacks Reais
          </h2>
          <p className="text-gray-500 text-base">Conversas reais com nossos clientes no WhatsApp</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {feedbacks.map((fb, i) => (
            <div 
              key={i} 
              className="bg-[#121212] border border-[#2a2a2a] rounded-2xl overflow-hidden hover:border-primary/30 hover:scale-[1.02] transition-all duration-300"
            >
              <Image
                src={fb.src}
                alt={fb.alt}
                width={400}
                height={600}
                className="w-full h-auto object-cover"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* CTA FINAL */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="border-t border-[#2a2a2a] bg-[#0a0a0a]">
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight mb-4">
            Pronto para garantir o seu?
          </h2>
          <p className="text-gray-400 mb-8 text-lg">
            Estoque limitado. Não perca a oportunidade de ter o tênis dos seus sonhos.
          </p>
          <Link 
            href="/loja"
            className="inline-flex items-center gap-2 bg-primary text-black font-black uppercase tracking-wider py-4 px-10 rounded-full hover:bg-yellow-400 hover:scale-105 transition-all duration-300 text-lg shadow-lg shadow-primary/20"
          >
            Explorar Catálogo
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
