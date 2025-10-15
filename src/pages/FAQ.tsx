import { Card } from '@/components/ui/card';
import AppLayout from '@/components/layout/AppLayout';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'What is a trading journal and why do I need one?',
    answer: 'A trading journal is a record of all your trades, including entry/exit prices, profit/loss, emotions, and strategies used. It helps you identify patterns, improve decision-making, and track your progress over time.'
  },
  {
    question: 'How does The Trade Diary help me become a better trader?',
    answer: 'The Trade Diary provides analytics, performance tracking, and insights from your trading history. By analyzing your wins and losses, emotional patterns, and strategy effectiveness, you can make data-driven improvements to your trading approach.'
  },
  {
    question: 'Can I track both crypto and stock trades?',
    answer: 'Yes! The Trade Diary supports all asset types including cryptocurrencies, stocks, forex, commodities, and more. Simply enter the asset name when logging your trade.'
  },
  {
    question: 'Is my trading data secure?',
    answer: 'Absolutely. We use bank-level encryption to protect your data. Your trading information is private and only accessible to you.'
  },
  {
    question: 'What metrics does the dashboard show?',
    answer: 'The dashboard displays key metrics including total P&L, win rate, average trade duration, ROI, and more. You can also see charts showing your performance over time and by different strategies.'
  }
];

const FAQ = () => {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Frequently Asked Questions</h1>
          <p className="text-muted-foreground">Find answers to common questions about The Trade Diary</p>
        </div>

        <Card className="p-6 bg-card border-border">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      </div>
    </AppLayout>
  );
};

export default FAQ;
