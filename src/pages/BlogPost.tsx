import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import AppLayout from '@/components/layout/AppLayout';

const BlogPost = () => {
  const { slug } = useParams();

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="p-8 bg-card border-border">
          <h1 className="text-4xl font-bold mb-4">Blog Post: {slug}</h1>
          <p className="text-muted-foreground mb-6">Article content coming soon...</p>
          <div className="prose prose-invert max-w-none">
            <p>
              This is a placeholder for the full blog post content. In a complete implementation, 
              this would contain the full article with rich content, images, and formatting.
            </p>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};

export default BlogPost;
