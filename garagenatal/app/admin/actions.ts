"use server";

import fs from "fs";
import path from "path";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

// Detecta se um buffer é HEIC/HEIF pelos magic bytes
function isHeic(buffer: Buffer): boolean {
  // HEIC files have 'ftyp' at byte 4 and 'heic' or 'heix' or 'mif1' after
  if (buffer.length < 12) return false;
  const ftypStr = buffer.subarray(4, 8).toString('ascii');
  const brandStr = buffer.subarray(8, 12).toString('ascii');
  return ftypStr === 'ftyp' && (brandStr === 'heic' || brandStr === 'heix' || brandStr === 'mif1');
}

// Converte HEIC para JPEG
async function convertHeicToJpeg(inputBuffer: Buffer): Promise<Buffer> {
  // @ts-ignore
  const heicConvert = (await import('heic-convert')).default;
  const outputBuffer = await heicConvert({
    buffer: inputBuffer,
    format: 'JPEG',
    quality: 0.85,
  });
  return Buffer.from(outputBuffer);
}

async function verifyAdmin() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) throw new Error("Não autenticado");

  const { data: adminData } = await supabase
    .from("admins")
    .select("email_autorizado")
    .eq("email_autorizado", user.email)
    .single();

  if (!adminData) throw new Error("Não autorizado");

  return supabase;
}

// Limpa todos os produtos importados automaticamente (categoria "Premium")
export async function purgeImportedProducts() {
  const supabase = await verifyAdmin();

  try {
    // 1. Buscar todos os produtos com categoria Premium
    const { data: produtos, error: fetchError } = await supabase
      .from("produtos")
      .select("id, imagens_url")
      .contains("categorias", ["Premium"]);

    if (fetchError) throw new Error(fetchError.message);
    if (!produtos || produtos.length === 0) return { success: true, count: 0 };

    // 2. Deletar imagens do storage
    for (const p of produtos) {
      if (p.imagens_url && p.imagens_url.length > 0) {
        for (const url of p.imagens_url) {
          try {
            const parts = url.split('/');
            const fileName = parts[parts.length - 1];
            await supabase.storage.from("produtos-imagens").remove([fileName]);
          } catch (e) {
            // ignora erros de imagem individual
          }
        }
      }
    }

    // 3. Deletar do banco
    const { error: deleteError } = await supabase
      .from("produtos")
      .delete()
      .contains("categorias", ["Premium"]);

    if (deleteError) throw new Error(deleteError.message);

    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true, count: produtos.length };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

import crypto from "crypto";

export async function importCatalog() {
  const supabase = await verifyAdmin();

  const targetFolder = "C:\\Users\\Eduardo\\Desktop\\Pedro\\GarageNatal\\Garage Natal";

  try {
    const numeracaoFolders = fs.readdirSync(targetFolder, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && dirent.name.startsWith("NUMERAÇÃO"));

    // Mapa para agrupar tênis idênticos (mesmo arquivo)
    const uniqueShoes = new Map<string, any>();

    for (const folder of numeracaoFolders) {
      const tamanho = folder.name.replace("NUMERAÇÃO ", "").trim();
      const folderPath = path.join(targetFolder, folder.name);

      const files = fs.readdirSync(folderPath, { withFileTypes: true })
        .filter(dirent => dirent.isFile());

      for (const file of files) {
        const filePath = path.join(folderPath, file.name);
        const fileBuffer = fs.readFileSync(filePath);
        
        // Usando o MD5 do arquivo como chave para agrupar imagens idênticas
        const fileKey = crypto.createHash("md5").update(fileBuffer).digest("hex");
        
        let rawName = file.name;
        const dotIndex = rawName.lastIndexOf('.');
        if (dotIndex > 0) rawName = rawName.substring(0, dotIndex);
        
        const priceStringRaw = rawName.split('(')[0].trim();
        const preco = parseFloat(priceStringRaw.replace(',', '.'));

        if (isNaN(preco)) {
          console.warn(`Preço inválido para o arquivo: ${file.name}`);
          continue;
        }

        if (!uniqueShoes.has(fileKey)) {
          uniqueShoes.set(fileKey, {
            fileName: file.name,
            preco: preco,
            tamanhos: new Set([tamanho]),
            samplePath: filePath,
          });
        } else {
          uniqueShoes.get(fileKey).tamanhos.add(tamanho);
        }
      }
    }

    let importedCount = 0;

    for (const [key, shoe] of uniqueShoes.entries()) {
      let fileBuffer = fs.readFileSync(shoe.samplePath);
      let contentType = 'image/jpeg';
      let ext = 'jpg';

      // Detectar e converter HEIC → JPEG
      if (isHeic(fileBuffer)) {
        console.log(`Convertendo HEIC → JPEG: ${shoe.fileName}`);
        try {
          fileBuffer = await convertHeicToJpeg(fileBuffer) as any;
        } catch (convErr: any) {
          console.error(`Falha na conversão HEIC de ${shoe.fileName}:`, convErr.message);
          continue;
        }
      } else {
        // Detectar formato real pelos magic bytes
        const hex = fileBuffer.subarray(0, 4).toString('hex');
        if (hex.startsWith('ffd8ff')) { contentType = 'image/jpeg'; ext = 'jpg'; }
        else if (hex.startsWith('89504e47')) { contentType = 'image/png'; ext = 'png'; }
        else if (hex.startsWith('52494646')) { contentType = 'image/webp'; ext = 'webp'; }
        else { contentType = 'image/jpeg'; ext = 'jpg'; } // fallback
      }

      const storageFileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("produtos-imagens")
        .upload(storageFileName, fileBuffer, {
          contentType,
          upsert: false
        });

      if (uploadError) {
        console.error(`Erro no upload da imagem ${shoe.fileName}:`, uploadError.message);
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from("produtos-imagens")
        .getPublicUrl(storageFileName);

      const publicUrl = publicUrlData.publicUrl;

      const tamanhosEstoque = Array.from(shoe.tamanhos).map(t => ({
        tamanho: t,
        estoque: 1
      })).sort((a: any, b: any) => Number(a.tamanho) - Number(b.tamanho));

      const tamanhosStr = Array.from(shoe.tamanhos).sort().join(", ");

      const { error: insertError } = await supabase.from("produtos").insert({
        nome: "",
        descricao: "",
        preco: shoe.preco,
        categorias: ["Premium"],
        visivel: true,
        tamanhos_estoque: tamanhosEstoque,
        imagens_url: [publicUrl],
      });

      if (insertError) {
        console.error(`Erro ao inserir produto no DB ${shoe.fileName}:`, insertError.message);
        continue;
      }

      importedCount++;
    }

    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true, count: importedCount };

  } catch (error: any) {
    console.error("Erro na importação:", error);
    return { success: false, error: error.message };
  }
}




