import { useState } from 'react';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PlanEditorProps {
    plan?: any;
    onSave: () => void;
    onCancel: () => void;
}

export const PlanEditor = ({ plan, onSave, onCancel }: PlanEditorProps) => {
    const { user } = useAuth();
    const [title, setTitle] = useState(plan?.title || '');
    const [description, setDescription] = useState(plan?.description || '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            if (plan?.id) {
                // Update existing plan
                const { error } = await supabase
                    .from('trading_plans')
                    .update({ title, description })
                    .eq('id', plan.id)
                    .eq('user_id', user.id);

                if (error) throw error;
                toast.success('Trading plan updated');
            } else {
                // Create new plan
                const { error } = await supabase
                    .from('trading_plans')
                    .insert({ user_id: user.id, title, description });

                if (error) throw error;
                toast.success('Trading plan created');
            }
            onSave();
        } catch (error: any) {
            toast.error(error.message || 'Failed to save trading plan');
        } finally {
            setLoading(false);
        }
    };

    return (
        <PremiumCard className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{plan ? 'Edit Plan' : 'Create New Plan'}</h2>
                <Button variant="ghost" size="icon" onClick={onCancel}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="title">Plan Title</Label>
                    <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Trend Following Strategy"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your trading strategy..."
                        className="min-h-[150px]"
                    />
                </div>

                <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                        Cancel
                    </Button>
                    <Button type="submit" className="gap-2" disabled={loading}>
                        <Save className="h-4 w-4" />
                        {loading ? 'Saving...' : 'Save Plan'}
                    </Button>
                </div>
            </form>
        </PremiumCard>
    );
};
