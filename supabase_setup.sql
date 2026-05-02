-- ==============================================================================
-- SETUP SCRIPT: GARAGENATAL E-COMMERCE
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Criação das Tabelas Principais (se não existirem)
CREATE TABLE IF NOT EXISTS public.produtos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    preco NUMERIC(10, 2) NOT NULL,
    imagens_url TEXT[] DEFAULT '{}',
    tamanhos_estoque JSONB DEFAULT '[]'::JSONB,
    categorias TEXT[] DEFAULT '{}',
    visivel BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.admins (
    email_autorizado TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Conceder permissões para os perfis da API (anon e authenticated)
-- Isso é OBRIGATÓRIO para que o banco libere a consulta antes de avaliar as RLS
GRANT ALL ON TABLE public.produtos TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.admins TO anon, authenticated, service_role;

-- 3. Habilitar RLS (Row Level Security) nas Tabelas
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 4. Políticas para a tabela `produtos`
DROP POLICY IF EXISTS "Permitir leitura pública de produtos visíveis" ON public.produtos;
CREATE POLICY "Permitir leitura pública de produtos visíveis" 
ON public.produtos FOR SELECT 
USING (visivel = true);

DROP POLICY IF EXISTS "Permitir gerenciamento total para admins logados" ON public.produtos;
CREATE POLICY "Permitir gerenciamento total para admins logados" 
ON public.produtos 
USING (auth.jwt() ->> 'email' IN (SELECT email_autorizado FROM public.admins));

-- 5. Políticas para a tabela `admins`
DROP POLICY IF EXISTS "Admins podem ler tabela de admins" ON public.admins;
CREATE POLICY "Admins podem ler tabela de admins" 
ON public.admins FOR SELECT 
USING (auth.jwt() ->> 'email' = email_autorizado);

-- 6. Inserir o e-mail do Admin Inicial
INSERT INTO public.admins (email_autorizado) 
VALUES ('pedro.phma.1801@gmail.com')
ON CONFLICT (email_autorizado) DO NOTHING;

-- ==============================================================================
-- BUCKET DE IMAGENS (Supabase Storage)
-- ==============================================================================
-- Criar bucket `produtos-imagens` se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('produtos-imagens', 'produtos-imagens', true, 5242880, '{"image/jpeg","image/png","image/webp","image/avif"}')
ON CONFLICT (id) DO UPDATE 
SET allowed_mime_types = '{"image/jpeg","image/png","image/webp","image/avif"}';

-- Políticas de Storage para o bucket `produtos-imagens`
DROP POLICY IF EXISTS "Leitura publica de imagens" ON storage.objects;
CREATE POLICY "Leitura publica de imagens"
ON storage.objects FOR SELECT
USING ( bucket_id = 'produtos-imagens' );

DROP POLICY IF EXISTS "Admins podem fazer upload de imagens" ON storage.objects;
CREATE POLICY "Admins podem fazer upload de imagens"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'produtos-imagens' AND
    auth.jwt() ->> 'email' IN (SELECT email_autorizado FROM public.admins)
);

DROP POLICY IF EXISTS "Admins podem deletar imagens" ON storage.objects;
CREATE POLICY "Admins podem deletar imagens"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'produtos-imagens' AND
    auth.jwt() ->> 'email' IN (SELECT email_autorizado FROM public.admins)
);

-- FIM DO SCRIPT
