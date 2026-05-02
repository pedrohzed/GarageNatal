# Gemini Memory & Data Schema

## Supabase Data Schema

### Table: `produtos`
- `id` (uuid, primary key)
- `nome` (text)
- `descricao` (text)
- `preco` (numeric)
- `imagens_url` (text array)
- `tamanhos_estoque` (jsonb)
- `categorias` (text array)
- `visivel` (boolean)

### Table: `admins`
- `email_autorizado` (text, primary key)
