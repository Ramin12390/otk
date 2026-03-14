-- Supabase SQL: results cədvəlinin yaradılması
-- İmtahan nəticələrini və istifadəçi məlumatlarını saxlamaq üçün

CREATE TABLE IF NOT EXISTS public.results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    score INT NOT NULL,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    image_urls TEXT[] DEFAULT array[]::text[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) quraşdırması
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

-- İstifadəçilərin nəticələri oxumasına (Liderlik cədvəli üçün) və yeni nəticə əlavə etməsinə icazə vermək:
CREATE POLICY "Allow public read access" ON public.results FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.results FOR INSERT WITH CHECK (true);
