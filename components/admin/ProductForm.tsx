"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { X, Upload, Plus, Package } from "lucide-react";

const productSchema = z.object({
  nome: z.string().optional().or(z.literal("")),
  descricao: z.string().optional(),
  preco: z.number().min(0.01, "Preço inválido"),
  categorias: z.string(),
  visivel: z.boolean(),
  tamanhos: z.array(
    z.object({
      tamanho: z.string().min(1, "Obrigatório"),
      estoque: z.number().min(0, "Estoque inválido"),
    })
  ).min(1, "Adicione pelo menos um tamanho/estoque"),
});

type ProductFormValues = z.infer<typeof productSchema>;

export function ProductForm({ initialData, onSaveSuccess }: { initialData?: any, onSaveSuccess?: () => void }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Imagens novas para upload
  const [imagesFiles, setImagesFiles] = useState<File[]>([]);
  // Imagens antigas (URLs que já existem)
  const [existingImages, setExistingImages] = useState<string[]>(initialData?.imagens_url || []);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      nome: initialData?.nome || "",
      descricao: initialData?.descricao || "",
      preco: initialData?.preco || 0,
      categorias: initialData?.categorias ? initialData.categorias.join(", ") : "",
      visivel: initialData?.visivel ?? true,
      tamanhos: initialData?.tamanhos_estoque && initialData.tamanhos_estoque.length > 0 
                ? initialData.tamanhos_estoque 
                : [{ tamanho: "", estoque: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: "tamanhos",
    control,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImagesFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeNewFile = (index: number) => {
    setImagesFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (urlToRemove: string) => {
    // Apenas remove da UI temporariamente. Será salvo no final ou se quiser pode deletar fisicamente
    // Como optamos por segurança, vamos apenas tirar do payload. As imagens não referenciadas ficam "órfãs", 
    // mas não quebra o sistema. Se quiser excluir fisicamente do Storage:
    try {
      // Tentar extrair o nome do arquivo da URL (ex: .../public/produtos-imagens/nome-do-arquivo.png)
      const parts = urlToRemove.split('/');
      const fileName = parts[parts.length - 1];
      
      // Deleta do storage (opcional, bom para economizar espaço)
      await supabase.storage.from("produtos-imagens").remove([fileName]);
    } catch (e) {
      console.error("Erro ao deletar arquivo do storage", e);
    }

    setExistingImages((prev) => prev.filter(url => url !== urlToRemove));
  };

  const onSubmit = async (data: ProductFormValues) => {
    setLoading(true);
    setErrorMsg(null);

    try {
      // Inicia com as imagens que o usuário NÃO apagou
      let finalUrls: string[] = [...existingImages];

      // 1. Upload Novas Imagens to Supabase Storage
      if (imagesFiles.length > 0) {
        for (const file of imagesFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("produtos-imagens")
            .upload(filePath, file);

          if (uploadError) throw new Error(`Erro no upload da imagem: ${uploadError.message}`);

          const { data: publicUrlData } = supabase.storage
            .from("produtos-imagens")
            .getPublicUrl(filePath);

          finalUrls.push(publicUrlData.publicUrl);
        }
      }

      // 2. Format Categories
      const categoriasArray = data.categorias.split(',').map((s) => s.trim()).filter(Boolean);
      
      const payload = {
        nome: data.nome,
        descricao: data.descricao,
        preco: data.preco,
        categorias: categoriasArray,
        visivel: data.visivel,
        tamanhos_estoque: data.tamanhos,
        imagens_url: finalUrls,
      };

      // 3. Update or Insert
      if (initialData) {
        const { error: updateError } = await supabase
          .from("produtos")
          .update(payload)
          .eq("id", initialData.id);
        if (updateError) throw new Error(`Erro ao atualizar: ${updateError.message}`);
        alert("Produto atualizado com sucesso!");
      } else {
        const { error: insertError } = await supabase.from("produtos").insert(payload);
        if (insertError) throw new Error(`Erro ao salvar: ${insertError.message}`);
        alert("Produto cadastrado com sucesso!");
      }

      reset();
      setImagesFiles([]);
      setExistingImages([]);
      if (onSaveSuccess) onSaveSuccess();
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Erro desconhecido ao salvar o produto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded text-sm">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lado Esquerdo: Info Básica */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Nome do Produto *</label>
            <input
              {...register("nome")}
              className="w-full p-2 bg-[#1a1a1a] border border-[#333] rounded text-white focus:outline-none focus:border-primary"
              placeholder="Ex: Nike Dunk Low"
            />
            {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Preço (R$) *</label>
            <input
              type="number"
              step="0.01"
              {...register("preco", { valueAsNumber: true })}
              className="w-full p-2 bg-[#1a1a1a] border border-[#333] rounded text-white focus:outline-none focus:border-primary"
            />
            {errors.preco && <p className="text-red-500 text-xs mt-1">{errors.preco.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Descrição</label>
            <textarea
              {...register("descricao")}
              className="w-full p-2 bg-[#1a1a1a] border border-[#333] rounded text-white focus:outline-none focus:border-primary min-h-[100px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Categorias (separadas por vírgula)</label>
            <input
              {...register("categorias")}
              className="w-full p-2 bg-[#1a1a1a] border border-[#333] rounded text-white focus:outline-none focus:border-primary"
              placeholder="Ex: Masculino, Premium"
            />
          </div>

          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              id="visivel"
              {...register("visivel")}
              className="w-4 h-4 text-primary bg-[#1a1a1a] border-[#333] rounded focus:ring-primary focus:ring-2"
            />
            <label htmlFor="visivel" className="text-sm font-medium text-gray-400">
              Produto visível na loja
            </label>
          </div>
        </div>

        {/* Lado Direito: Imagens e Grade */}
        <div className="space-y-6">
          {/* Imagens */}
          <div className="bg-[#1a1a1a] p-4 rounded border border-[#333]">
            <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Imagens do Produto
            </h3>
            
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex items-center justify-center w-full py-2 border-2 border-dashed border-[#444] rounded text-gray-400 hover:text-primary hover:border-primary transition-colors"
            >
              Clique para selecionar imagens
            </label>

            {existingImages.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2 uppercase">Imagens Atuais:</p>
                <ul className="space-y-2">
                  {existingImages.map((url, i) => (
                    <li key={`old-${i}`} className="flex items-center justify-between text-xs text-gray-300 bg-[#222] px-2 py-2 rounded">
                      <div className="flex items-center gap-2 truncate max-w-[200px]">
                        {/* Thumbnail miniatura opcional, ou apenas o link */}
                        <div className="w-8 h-8 relative rounded overflow-hidden bg-black flex-shrink-0">
                           <img src={url} alt="Min" className="object-cover w-full h-full" />
                        </div>
                        <span className="truncate">Imagem {i + 1}</span>
                      </div>
                      <button type="button" onClick={() => removeExistingImage(url)} className="text-red-500 hover:text-red-400 p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {imagesFiles.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2 uppercase">Novas Imagens (a fazer upload):</p>
                <ul className="space-y-2">
                  {imagesFiles.map((f, i) => (
                    <li key={`new-${i}`} className="flex items-center justify-between text-xs text-gray-300 bg-[#222] px-2 py-2 rounded border border-primary/20">
                      <span className="truncate max-w-[200px]">{f.name}</span>
                      <button type="button" onClick={() => removeNewFile(i)} className="text-red-500 hover:text-red-400 p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Grade de Tamanhos/Estoque */}
          <div className="bg-[#1a1a1a] p-4 rounded border border-[#333]">
            <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Grade de Tamanhos & Estoque
            </h3>
            
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2">
                  <div className="flex-1">
                    <input
                      {...register(`tamanhos.${index}.tamanho`)}
                      placeholder="Tamanho (Ex: 40)"
                      className="w-full p-2 bg-[#121212] border border-[#444] rounded text-white focus:outline-none focus:border-primary text-sm"
                    />
                    {errors.tamanhos?.[index]?.tamanho && <p className="text-red-500 text-xs mt-1">{errors.tamanhos[index].tamanho.message}</p>}
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      {...register(`tamanhos.${index}.estoque`, { valueAsNumber: true })}
                      placeholder="Qtd (Ex: 5)"
                      className="w-full p-2 bg-[#121212] border border-[#444] rounded text-white focus:outline-none focus:border-primary text-sm"
                    />
                    {errors.tamanhos?.[index]?.estoque && <p className="text-red-500 text-xs mt-1">{errors.tamanhos[index].estoque.message}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => append({ tamanho: "", estoque: 0 })}
              className="mt-4 flex items-center gap-1 text-sm font-medium text-primary hover:text-yellow-400"
            >
              <Plus className="w-4 h-4" /> Adicionar Tamanho
            </button>
            {errors.tamanhos && !Array.isArray(errors.tamanhos) && (
              <p className="text-red-500 text-xs mt-2">{errors.tamanhos.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-[#333]">
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-black font-bold py-2 px-8 rounded hover:bg-yellow-400 transition-colors disabled:opacity-50"
        >
          {loading ? "Salvando..." : "Salvar Produto"}
        </button>
      </div>
    </form>
  );
}
