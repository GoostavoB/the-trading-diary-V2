import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AppLayout from '@/components/layout/AppLayout';
import tdLogoOfficial from '@/assets/td-logo-official.png';

interface LogoVariation {
  id: string;
  name: string;
  description: string;
}

const variations: LogoVariation[] = [
  { id: 'all-white', name: 'All White', description: 'Pure white logo on transparent background' },
  { id: 'all-black', name: 'All Black', description: 'Pure black logo on transparent background' },
  { id: 'blue-white', name: 'Blue Icon + White Text', description: 'Blue TD icon with white text' },
  { id: 'blue-black', name: 'Blue Icon + Black Text', description: 'Blue TD icon with black text' },
  { id: 'blue-gray', name: 'Blue Icon + Gray Text', description: 'Blue TD icon with dark gray text' },
  { id: 'vietnam', name: 'Vietnam Colors', description: 'Red and golden yellow patriotic design' },
  { id: 'usa', name: 'USA Colors', description: 'Red, white, and blue patriotic design' },
  { id: 'uae', name: 'UAE Colors', description: 'Emirates flag colors - elegant design' },
  { id: 'brazil', name: 'Brazil Colors', description: 'Green, yellow, and blue tropical design' },
];

const getBase64FromImage = async (imagePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imagePath;
  });
};

export default function LogoGenerator() {
  const navigate = useNavigate();
  const [generating, setGenerating] = useState<string | null>(null);
  const [generatedLogos, setGeneratedLogos] = useState<Record<string, string>>({});

  const generateLogo = async (variation: LogoVariation) => {
    setGenerating(variation.id);
    try {
      // Convert logo to base64
      const base64Image = await getBase64FromImage('/original-logo.png');
      
      const { data, error } = await supabase.functions.invoke('generate-logo-variations', {
        body: { 
          variation: variation.id,
          imageUrl: base64Image
        }
      });

      if (error) throw error;

      if (data.success && data.imageUrl) {
        setGeneratedLogos(prev => ({
          ...prev,
          [variation.id]: data.imageUrl
        }));
        toast.success(`${variation.name} logo generated!`);
      } else {
        throw new Error('Failed to generate logo');
      }
    } catch (error: any) {
      console.error('Error generating logo:', error);
      toast.error(`Failed to generate ${variation.name}: ${error.message}`);
    } finally {
      setGenerating(null);
    }
  };

  const downloadLogo = (variation: LogoVariation, imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `trading-diary-logo-${variation.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Logo downloaded!');
  };

  const generateAll = async () => {
    toast.info('Generating all logo variations... This may take a minute.');
    for (const variation of variations) {
      if (!generatedLogos[variation.id]) {
        await generateLogo(variation);
        // Small delay between generations
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    toast.success('All logos generated!');
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-7xl space-y-6">
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <Card className="mb-8 border-primary/20 bg-primary/5 p-6">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h2 className="mb-2 text-xl font-semibold">Looking for the Official Logo?</h2>
              <p className="mb-4 text-muted-foreground">
                Download the standard Trading Diary logo in various sizes and formats from the Logo Download page.
              </p>
              <Button onClick={() => navigate('/logo-download')} className="gap-2">
                <Download className="h-4 w-4" />
                Go to Logo Download
              </Button>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Experimental: Logo Color Variations</h1>
            <p className="text-muted-foreground mt-1">
              AI-generated color variations (experimental feature)
            </p>
          </div>
          <Button onClick={generateAll} disabled={generating !== null} size="lg">
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate All'
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {variations.map((variation) => {
            const imageUrl = generatedLogos[variation.id];
            const isGenerating = generating === variation.id;

            return (
              <Card key={variation.id} className="p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{variation.name}</h3>
                  <p className="text-sm text-muted-foreground">{variation.description}</p>
                </div>

                <div className="aspect-[4/1] bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt={variation.name}
                      className="w-full h-full object-contain p-4"
                    />
                  ) : (
                    <div className="text-muted-foreground text-sm">
                      {isGenerating ? 'Generating...' : 'Not generated yet'}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => generateLogo(variation)}
                    disabled={isGenerating || generating !== null}
                    className="flex-1"
                    variant={imageUrl ? 'outline' : 'default'}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : imageUrl ? (
                      'Regenerate'
                    ) : (
                      'Generate'
                    )}
                  </Button>
                  {imageUrl && (
                    <Button
                      onClick={() => downloadLogo(variation, imageUrl)}
                      variant="secondary"
                      size="icon"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="p-6 bg-muted">
          <h3 className="font-semibold mb-2">Instructions</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Your original logo design is preserved - only colors are changed</li>
            <li>• Click "Generate All" to create all logo variations at once</li>
            <li>• Or generate individual variations by clicking "Generate" on each card</li>
            <li>• All logos maintain the same design with different color schemes</li>
            <li>• Download individual logos using the download button</li>
            <li>• All logos have transparent backgrounds (PNG format)</li>
          </ul>
        </Card>
      </div>
    </AppLayout>
  );
}
