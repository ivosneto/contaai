-- Artigo da base de conhecimento sem corpo de texto não é um artigo real —
-- knowledge_articles só tinha título/categoria/resumo. Coluna aditiva para
-- suportar "Abrir artigo" de verdade (CRUD desta fase).
ALTER TABLE public.knowledge_articles ADD COLUMN content text NOT NULL DEFAULT '';
