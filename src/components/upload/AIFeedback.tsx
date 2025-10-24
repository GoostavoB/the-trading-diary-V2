import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AIFeedbackProps {
  extractedData: any;
  imagePath: string;
}

export function AIFeedback({ extractedData, imagePath }: AIFeedbackProps) {
  const { user } = useAuth();
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'positive' | 'negative' | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleFeedback = async (type: 'positive' | 'negative') => {
    setFeedbackType(type);
    if (type === 'positive') {
      // Quick positive feedback without dialog
      try {
        const { error } = await supabase.from('ai_extraction_feedback').insert({
          user_id: user?.id,
          image_path: imagePath,
          extracted_data: extractedData,
          feedback_type: 'positive',
          feedback_text: null,
        });

        if (error) throw error;
        toast.success('Thanks for your feedback!');
      } catch (error) {
        console.error('Error submitting feedback:', error);
      }
    } else {
      // Show dialog for negative feedback to get details
      setShowFeedback(true);
    }
  };

  const submitNegativeFeedback = async () => {
    if (!feedbackText.trim()) {
      toast.error('Please describe what was incorrect');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('ai_extraction_feedback').insert({
        user_id: user?.id,
        image_path: imagePath,
        extracted_data: extractedData,
        feedback_type: 'negative',
        feedback_text: feedbackText,
      });

      if (error) throw error;
      
      toast.success('Thanks for helping us improve!');
      setShowFeedback(false);
      setFeedbackText('');
      setFeedbackType(null);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 p-4 border-t">
        <p className="text-sm text-muted-foreground flex-1">
          Was this extraction correct?
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleFeedback('positive')}
          className="gap-2"
        >
          <ThumbsUp className="h-4 w-4" />
          Yes
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleFeedback('negative')}
          className="gap-2"
        >
          <ThumbsDown className="h-4 w-4" />
          No
        </Button>
      </div>

      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Help Us Improve</DialogTitle>
            <DialogDescription>
              Please describe what was incorrect in the extraction. This helps our AI learn and improve.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="e.g., 'Entry price was wrong', 'Symbol was incorrectly detected', 'Side was inverted'..."
            rows={4}
            className="resize-none"
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowFeedback(false);
                setFeedbackText('');
                setFeedbackType(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={submitNegativeFeedback}
              disabled={submitting || !feedbackText.trim()}
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
