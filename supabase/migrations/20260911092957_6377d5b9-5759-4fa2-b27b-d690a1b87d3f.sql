CREATE POLICY "own book files" ON storage.objects FOR ALL TO authenticated
USING (bucket_id IN ('books','covers') AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id IN ('books','covers') AND auth.uid()::text = (storage.foldername(name))[1]);