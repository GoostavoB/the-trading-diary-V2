import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

const CheckoutCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-destructive/5 to-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="max-w-md w-full p-8 text-center glass-strong">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mx-auto w-20 h-20 mb-6 rounded-full bg-destructive/10 flex items-center justify-center"
          >
            <XCircle className="w-12 h-12 text-destructive" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h1 className="text-3xl font-bold mb-3">
              Checkout Cancelled
            </h1>
            <p className="text-muted-foreground mb-6">
              No worries! Your subscription wasn't processed. You can try again anytime.
            </p>

            <div className="space-y-3">
              <Button
                onClick={() => (window.location.href = '/#pricing-section')}
                size="lg"
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Pricing
              </Button>

              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                size="lg"
                className="w-full"
              >
                Go to Dashboard
              </Button>

              <Button
                onClick={() => navigate('/support')}
                variant="ghost"
                size="sm"
                className="w-full"
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                Need Help?
              </Button>
            </div>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
};

export default CheckoutCancel;
