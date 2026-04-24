import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import AppLayout from '@/components/layout/AppLayout';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Mail } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { pageMeta } from '@/utils/seoHelpers';

const supportSchema = z.object({
  category: z.string().min(1, { message: "Please select a category" }),
  subject: z.string().trim().min(3, { message: "Subject must be at least 3 characters" }).max(200, { message: "Subject must be less than 200 characters" }),
  message: z.string().trim().min(10, { message: "Message must be at least 10 characters" }).max(2000, { message: "Message must be less than 2000 characters" }),
});

export default function Support() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const validated = supportSchema.parse(formData);

      const { error } = await supabase.functions.invoke('send-support-email', {
        body: {
          email: user?.email,
          category: validated.category,
          subject: validated.subject,
          message: validated.message,
        },
      });

      if (error) throw error;

      toast.success(t('support.form.successMessage'));
      setFormData({ category: '', subject: '', message: '' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          toast.error(err.message);
        });
      } else {
        toast.error(t('support.form.errorMessage'));
        console.error('Support form error:', error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEO
        title={pageMeta.support.title}
        description={pageMeta.support.description}
        keywords={pageMeta.support.keywords}
        canonical={pageMeta.support.canonical}
      />
      <AppLayout>
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <PremiumCard className="shadow-lg">
          <div className="p-6 pb-3 text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-3xl font-bold">{t('support.title')}</h3>
            <p className="text-lg">{t('support.description')}</p>
          </div>

          <div className="p-6 pt-0 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">{t('support.form.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">{t('support.form.category')}</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder={t('support.form.categoryPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">{t('support.categories.technical')}</SelectItem>
                    <SelectItem value="billing">{t('support.categories.billing')}</SelectItem>
                    <SelectItem value="feature">{t('support.categories.feature')}</SelectItem>
                    <SelectItem value="bug">{t('support.categories.bug')}</SelectItem>
                    <SelectItem value="other">{t('support.categories.other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">{t('support.form.subject')}</Label>
                <Input
                  id="subject"
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder={t('support.form.subjectPlaceholder')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">{t('support.form.message')}</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={t('support.form.messagePlaceholder')}
                  rows={6}
                  required
                  className="resize-none"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('support.form.sending') : t('support.form.submit')}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border text-center text-sm text-muted-foreground">
              <p>{t('support.form.responseTime')}</p>
            </div>
          </div>
        </PremiumCard>
      </div>
    </AppLayout>
    </>
  );
}
