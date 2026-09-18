-- Documentos passam a ter arquivo real (Supabase Storage), não só metadado.
-- Convenção de path no bucket: "<workspace_id>/<client_id>/<arquivo>" — o
-- isolamento é garantido pelas policies de storage.objects abaixo lendo os
-- dois primeiros segmentos do path via storage.foldername(), nunca por
-- convenção de aplicação sozinha.

ALTER TABLE public.documents ADD COLUMN storage_path text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Staff: lê/escreve qualquer arquivo do seu workspace.
CREATE POLICY documents_bucket_staff_read ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND public.is_staff_member(((storage.foldername(name))[1])::uuid));
CREATE POLICY documents_bucket_staff_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND public.is_staff_member(((storage.foldername(name))[1])::uuid));
CREATE POLICY documents_bucket_staff_update ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND public.is_staff_member(((storage.foldername(name))[1])::uuid));
CREATE POLICY documents_bucket_staff_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND public.is_staff_member(((storage.foldername(name))[1])::uuid));

-- Client: só dentro da própria pasta <workspace_id>/<meu client_id>/...
CREATE POLICY documents_bucket_client_read ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[2] = public.my_client_id(((storage.foldername(name))[1])::uuid)
  );
CREATE POLICY documents_bucket_client_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[2] = public.my_client_id(((storage.foldername(name))[1])::uuid)
  );
