-- Create shopping_lists table
CREATE TABLE IF NOT EXISTS public.shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create shopping_list_items table
CREATE TABLE IF NOT EXISTS public.shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity TEXT,
  recipe TEXT,
  recipe_id TEXT,
  checked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS shopping_lists_user_id_idx ON public.shopping_lists(user_id);
CREATE INDEX IF NOT EXISTS shopping_lists_status_idx ON public.shopping_lists(status);
CREATE INDEX IF NOT EXISTS shopping_list_items_shopping_list_id_idx ON public.shopping_list_items(shopping_list_id);

-- Set up Row Level Security (RLS)
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

-- Create policies for shopping_lists
CREATE POLICY "Users can view their own shopping lists"
  ON public.shopping_lists
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shopping lists"
  ON public.shopping_lists
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shopping lists"
  ON public.shopping_lists
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shopping lists"
  ON public.shopping_lists
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for shopping_list_items
CREATE POLICY "Users can view items in their shopping lists"
  ON public.shopping_list_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shopping_lists
      WHERE id = shopping_list_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert items into their shopping lists"
  ON public.shopping_list_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shopping_lists
      WHERE id = shopping_list_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items in their shopping lists"
  ON public.shopping_list_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.shopping_lists
      WHERE id = shopping_list_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items from their shopping lists"
  ON public.shopping_list_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.shopping_lists
      WHERE id = shopping_list_id AND user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update updated_at timestamp
CREATE TRIGGER update_shopping_lists_updated_at
BEFORE UPDATE ON public.shopping_lists
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_list_items_updated_at
BEFORE UPDATE ON public.shopping_list_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
