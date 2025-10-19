-- Create custom menu items table
CREATE TABLE public.custom_menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  icon TEXT DEFAULT 'Circle',
  route TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  parent_id UUID REFERENCES public.custom_menu_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create custom dashboard widgets table
CREATE TABLE public.custom_dashboard_widgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  widget_type TEXT NOT NULL, -- 'metric', 'chart', 'table', 'heatmap'
  query_config JSONB NOT NULL DEFAULT '{}', -- stores the data query configuration
  display_config JSONB NOT NULL DEFAULT '{}', -- stores display settings (colors, format, etc)
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  width INTEGER NOT NULL DEFAULT 4,
  height INTEGER NOT NULL DEFAULT 2,
  menu_item_id UUID REFERENCES public.custom_menu_items(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_dashboard_widgets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_menu_items
CREATE POLICY "Users can view own menu items"
  ON public.custom_menu_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own menu items"
  ON public.custom_menu_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own menu items"
  ON public.custom_menu_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own menu items"
  ON public.custom_menu_items FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for custom_dashboard_widgets
CREATE POLICY "Users can view own widgets"
  ON public.custom_dashboard_widgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own widgets"
  ON public.custom_dashboard_widgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own widgets"
  ON public.custom_dashboard_widgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own widgets"
  ON public.custom_dashboard_widgets FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_custom_menu_items_user_id ON public.custom_menu_items(user_id);
CREATE INDEX idx_custom_menu_items_order ON public.custom_menu_items(user_id, order_index);
CREATE INDEX idx_custom_dashboard_widgets_user_id ON public.custom_dashboard_widgets(user_id);
CREATE INDEX idx_custom_dashboard_widgets_menu_item ON public.custom_dashboard_widgets(menu_item_id);

-- Trigger for updated_at
CREATE TRIGGER update_custom_menu_items_updated_at
  BEFORE UPDATE ON public.custom_menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_dashboard_widgets_updated_at
  BEFORE UPDATE ON public.custom_dashboard_widgets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();