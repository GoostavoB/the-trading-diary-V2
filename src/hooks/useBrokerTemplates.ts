import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BrokerTemplate {
  id: string;
  user_id: string;
  broker_name: string;
  column_mappings: Record<string, string>;
  sample_headers: string[];
  created_at: string;
  last_used_at: string;
  usage_count: number;
  is_global: boolean;
}

export const useBrokerTemplates = () => {
  const queryClient = useQueryClient();

  // Fetch all templates (user's + global)
  const { data: templates, isLoading } = useQuery({
    queryKey: ['broker-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('broker_csv_templates')
        .select('*')
        .order('last_used_at', { ascending: false });

      if (error) throw error;
      return data as BrokerTemplate[];
    }
  });

  // Save new template
  const saveTemplateMutation = useMutation({
    mutationFn: async ({
      brokerName,
      columnMappings,
      sampleHeaders
    }: {
      brokerName: string;
      columnMappings: Record<string, string>;
      sampleHeaders: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('broker_csv_templates')
        .insert({
          user_id: user.id,
          broker_name: brokerName,
          column_mappings: columnMappings,
          sample_headers: sampleHeaders
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['broker-templates'] });
      toast.success(`Template saved for ${variables.brokerName}`);
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('Template already exists for this broker. Use update instead.');
      } else {
        toast.error('Failed to save template');
        console.error(error);
      }
    }
  });

  // Update existing template
  const updateTemplateMutation = useMutation({
    mutationFn: async ({
      templateId,
      columnMappings,
      sampleHeaders
    }: {
      templateId: string;
      columnMappings: Record<string, string>;
      sampleHeaders: string[];
    }) => {
      const { data, error } = await supabase
        .from('broker_csv_templates')
        .update({
          column_mappings: columnMappings,
          sample_headers: sampleHeaders,
          last_used_at: new Date().toISOString()
        })
        .eq('id', templateId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker-templates'] });
      toast.success('Template updated successfully');
    },
    onError: () => {
      toast.error('Failed to update template');
    }
  });

  // Delete template
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('broker_csv_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker-templates'] });
      toast.success('Template deleted');
    },
    onError: () => {
      toast.error('Failed to delete template');
    }
  });

  // Increment usage count
  const incrementUsageMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase.rpc('increment_template_usage', {
        p_template_id: templateId
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker-templates'] });
    }
  });

  return {
    templates: templates || [],
    isLoading,
    saveTemplate: saveTemplateMutation.mutateAsync,
    updateTemplate: updateTemplateMutation.mutateAsync,
    deleteTemplate: deleteTemplateMutation.mutateAsync,
    incrementUsage: incrementUsageMutation.mutateAsync
  };
};
