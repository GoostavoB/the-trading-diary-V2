import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Download, ArrowLeft, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { toPng } from 'html-to-image';
import heroBg from '@/assets/bull-bear-realistic.png';
import wallpaperLogo from '@/assets/wallpaper-logo-center.png';
import wallpaperTrading from '@/assets/wallpaper-trading-theme.png';
import wallpaperCreative from '@/assets/wallpaper-creative.png';
import tdLogoBlue from '@/assets/td-logo-official.png';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const LogoDownload = () => {
  const navigate = useNavigate();
  const [selectedBg, setSelectedBg] = useState<'transparent' | 'white' | 'dark'>('transparent');
  const [colorVariant, setColorVariant] = useState<"default" | "vietnam">("default");
  const logoRef = useRef<HTMLDivElement>(null);

  const downloadLogo = async (width: number, height: number, bgColor: 'transparent' | 'white' | 'dark') => {
    if (!logoRef.current) return;

    try {
      const backgroundColor = 
        bgColor === 'white' ? '#FFFFFF' :
        bgColor === 'dark' ? '#0F0F11' :
        'transparent';

      const dataUrl = await toPng(logoRef.current, {
        backgroundColor,
        width,
        height,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          width: `${width}px`,
          height: `${height}px`,
        },
        pixelRatio: 2,
      });

      const link = document.createElement('a');
      link.download = `trading-diary-logo-${width}x${height}-${bgColor}.png`;
      link.href = dataUrl;
      link.click();
      toast.success(`Downloaded ${width}×${height} PNG`);
    } catch (error) {
      console.error('Failed to download logo:', error);
      toast.error('Failed to download logo');
    }
  };

  const downloadThumbnail = (width: number, height: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bgImg = new Image();
    bgImg.crossOrigin = 'anonymous';
    bgImg.onload = () => {
      // Draw dimmed background
      ctx.drawImage(bgImg, 0, 0, width, height);
      ctx.fillStyle = 'rgba(15, 15, 17, 0.7)';
      ctx.fillRect(0, 0, width, height);

      // Apply gradient overlay
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, 'rgba(60, 131, 246, 0.15)');
      gradient.addColorStop(1, 'rgba(60, 131, 246, 0.08)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw logo
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.onload = () => {
        const logoSize = Math.min(width, height) * 0.25;
        const x = (width - logoSize) / 2;
        const y = (height - logoSize) / 2;
        ctx.drawImage(logoImg, x, y, logoSize, logoSize);

        // Add text below logo
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${width * 0.035}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto`;
        ctx.textAlign = 'center';
        ctx.fillText('The Trading Diary', width / 2, y + logoSize + 50);

        canvas.toBlob((blob) => {
          if (blob) {
            const link = document.createElement('a');
            link.download = `trading-diary-thumbnail-${width}x${height}.png`;
            link.href = URL.createObjectURL(blob);
            link.click();
            toast.success(`Downloaded ${width}x${height} thumbnail`);
          }
        });
      };

      logoImg.src = tdLogoBlue;
    };

    bgImg.src = heroBg;
  };

  const downloadIconOnly = (size: number, bgColor: 'transparent' | 'white') => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Set background
      if (bgColor === 'white') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
      }

      // Draw logo (icon only - it's the same as the main logo since your logo is already icon-only)
      ctx.drawImage(img, 0, 0, size, size);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const link = document.createElement('a');
        link.download = `trading-diary-icon-${size}x${size}-${bgColor}.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
        toast.success(`Downloaded ${size}x${size} icon PNG`);
      }, 'image/png');
    };

    img.src = tdLogoBlue;
  };

  const downloadWallpaper = (wallpaperSrc: string, name: string) => {
    const link = document.createElement('a');
    link.download = `trading-diary-wallpaper-${name}.png`;
    link.href = wallpaperSrc;
    link.click();
    toast.success(`Downloaded ${name} wallpaper`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="hover:bg-primary/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <a 
              href="/brand-assets.html" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              Open static page <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent text-center">
            Brand Assets
          </h1>
          <p className="text-muted-foreground text-center">
            Download The Trading Diary logo and branded thumbnails
          </p>
        </div>

        {/* Logo Preview Section */}
        <GlassCard className="p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Logo Preview</h2>
          
          {/* Background Selector */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={selectedBg === 'transparent' ? 'default' : 'outline'}
              onClick={() => setSelectedBg('transparent')}
              size="sm"
            >
              Transparent
            </Button>
            <Button
              variant={selectedBg === 'white' ? 'default' : 'outline'}
              onClick={() => setSelectedBg('white')}
              size="sm"
            >
              White
            </Button>
            <Button
              variant={selectedBg === 'dark' ? 'default' : 'outline'}
              onClick={() => setSelectedBg('dark')}
              size="sm"
            >
              Dark
            </Button>
          </div>

          {/* Color Variant Selector */}
          <div className="mb-6">
            <Label htmlFor="colorVariant" className="text-sm font-medium mb-2 block">
              Logo Color Variant
            </Label>
            <Select value={colorVariant} onValueChange={(value: any) => setColorVariant(value)}>
              <SelectTrigger id="colorVariant" className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default (Blue)</SelectItem>
                <SelectItem value="vietnam">Vietnam (Red with Star)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Logo Display */}
          <div
            className="rounded-xl p-12 flex items-center justify-center transition-colors"
            style={{
              backgroundColor: 
                selectedBg === 'white' ? '#FFFFFF' :
                selectedBg === 'dark' ? '#0F0F11' :
                'transparent',
              border: selectedBg === 'transparent' ? '1px dashed hsl(var(--border))' : 'none'
            }}
          >
            <div 
              ref={logoRef}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '24px 32px',
              }}
            >
              <Logo size="xl" variant="horizontal" colorVariant={colorVariant === "default" ? "default" : "vietnam"} className={selectedBg === 'white' ? 'text-foreground' : 'text-white'} />
            </div>
          </div>

          {/* Download Buttons */}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={() => downloadLogo(800, 200, selectedBg)} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Standard (800×200)
            </Button>
            <Button onClick={() => downloadLogo(1600, 400, selectedBg)} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Large (1600×400)
            </Button>
            <Button onClick={() => downloadLogo(2400, 600, selectedBg)}>
              <Download className="mr-2 h-4 w-4" />
              HD (2400×600)
            </Button>
          </div>
        </GlassCard>

        {/* Branded Thumbnails Section */}
        <GlassCard className="p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Branded Thumbnails</h2>
          <p className="text-muted-foreground mb-6">
            Social media ready thumbnails with your brand design
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* 1200x630 Preview */}
            <div>
              <div 
                className="relative w-full aspect-[1200/630] rounded-lg overflow-hidden mb-4 border border-border/50"
                style={{
                  backgroundImage: `url(${heroBg})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-background/70" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-primary/5" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <img src={tdLogoBlue} alt="TD Logo" className="w-16 h-16" />
                  <span className="mt-4 text-sm font-semibold">The Trading Diary</span>
                </div>
              </div>
              <Button onClick={() => downloadThumbnail(1200, 630)} className="w-full justify-between hover:bg-primary/90">
                <span>1200×630 PNG (Social)</span>
                <Download className="h-4 w-4" />
              </Button>
            </div>

            {/* 1080x1080 Preview */}
            <div>
              <div 
                className="relative w-full aspect-square rounded-lg overflow-hidden mb-4 border border-border/50"
                style={{
                  backgroundImage: `url(${heroBg})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-background/70" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-primary/5" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <img src={tdLogoBlue} alt="TD Logo" className="w-16 h-16" />
                  <span className="mt-4 text-sm font-semibold">The Trading Diary</span>
                </div>
              </div>
              <Button onClick={() => downloadThumbnail(1080, 1080)} className="w-full justify-between hover:bg-primary/90">
                <span>1080×1080 PNG (Square)</span>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Perfect for:</strong> Twitter/X cards, Facebook posts, LinkedIn banners, Instagram posts
            </p>
          </div>
        </GlassCard>

        {/* Additional Sizes Section */}
        <GlassCard className="p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Additional Sizes & Backgrounds</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Download the complete logo in various sizes with different backgrounds
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-3">Transparent</h4>
              <div className="space-y-2">
                {[[600, 150], [1200, 300], [2400, 600]].map(([w, h]) => (
                  <Button
                    key={`transparent-${w}x${h}`}
                    onClick={() => downloadLogo(w, h, 'transparent')}
                    variant="outline"
                    size="sm"
                    className="w-full justify-between"
                  >
                    <span>{w}×{h}</span>
                    <Download className="h-3 w-3" />
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-3">White Background</h4>
              <div className="space-y-2">
                {[[600, 150], [1200, 300], [2400, 600]].map(([w, h]) => (
                  <Button
                    key={`white-${w}x${h}`}
                    onClick={() => downloadLogo(w, h, 'white')}
                    variant="outline"
                    size="sm"
                    className="w-full justify-between"
                  >
                    <span>{w}×{h}</span>
                    <Download className="h-3 w-3" />
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-3">Dark Background</h4>
              <div className="space-y-2">
                {[[600, 150], [1200, 300], [2400, 600]].map(([w, h]) => (
                  <Button
                    key={`dark-${w}x${h}`}
                    onClick={() => downloadLogo(w, h, 'dark')}
                    variant="outline"
                    size="sm"
                    className="w-full justify-between"
                  >
                    <span>{w}×{h}</span>
                    <Download className="h-3 w-3" />
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Icon Only Section */}
        <GlassCard className="p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Icon Only (No Text)</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Just the TD monogram without "The Trading Diary" text - perfect for app icons and compact spaces
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium mb-3">Transparent</h4>
              <div className="space-y-2">
                {[512, 1024, 2048].map((size) => (
                  <Button
                    key={`icon-transparent-${size}`}
                    onClick={() => downloadIconOnly(size, 'transparent')}
                    variant="outline"
                    className="w-full justify-between hover:bg-primary/10"
                  >
                    <span>{size}x{size} PNG</span>
                    <Download className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-3">White Background</h4>
              <div className="space-y-2">
                {[512, 1024, 2048].map((size) => (
                  <Button
                    key={`icon-white-${size}`}
                    onClick={() => downloadIconOnly(size, 'white')}
                    variant="outline"
                    className="w-full justify-between hover:bg-primary/10"
                  >
                    <span>{size}x{size} PNG</span>
                    <Download className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Wallpapers Section */}
        <GlassCard className="p-8 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Desktop Wallpapers</h2>
          <p className="text-muted-foreground mb-6">
            Professional 1920x1080 wallpapers featuring The Trading Diary branding
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Wallpaper 1: Logo Center */}
            <div>
              <div 
                className="relative w-full aspect-video rounded-lg overflow-hidden mb-4 border border-border/50"
                style={{
                  backgroundImage: `url(${wallpaperLogo})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
              <Button 
                onClick={() => downloadWallpaper(wallpaperLogo, 'logo-center')} 
                className="w-full justify-between hover:bg-primary/90"
              >
                <span>Logo Center</span>
                <Download className="h-4 w-4" />
              </Button>
            </div>

            {/* Wallpaper 2: Trading Theme */}
            <div>
              <div 
                className="relative w-full aspect-video rounded-lg overflow-hidden mb-4 border border-border/50"
                style={{
                  backgroundImage: `url(${wallpaperTrading})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
              <Button 
                onClick={() => downloadWallpaper(wallpaperTrading, 'trading-theme')} 
                className="w-full justify-between hover:bg-primary/90"
              >
                <span>Trading Theme</span>
                <Download className="h-4 w-4" />
              </Button>
            </div>

            {/* Wallpaper 3: Creative */}
            <div>
              <div 
                className="relative w-full aspect-video rounded-lg overflow-hidden mb-4 border border-border/50"
                style={{
                  backgroundImage: `url(${wallpaperCreative})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
              <Button 
                onClick={() => downloadWallpaper(wallpaperCreative, 'creative')} 
                className="w-full justify-between hover:bg-primary/90"
              >
                <span>Creative Abstract</span>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Resolution:</strong> 1920×1080 Full HD - Perfect for desktop backgrounds and dual monitors
            </p>
          </div>
        </GlassCard>

        {/* Usage Guidelines */}
        <GlassCard className="p-6 mt-6">
          <h3 className="text-xl font-semibold mb-4">Usage Guidelines</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• <strong>192x192:</strong> Perfect for favicons and small icons</li>
            <li>• <strong>512x512:</strong> Ideal for app icons and social media profiles</li>
            <li>• <strong>1024x1024:</strong> High-resolution for marketing materials and web use</li>
            <li>• <strong>2048x2048:</strong> Professional print materials and large format displays</li>
            <li>• <strong>4096x4096:</strong> Ultra high-resolution for billboards and premium applications</li>
            <li>• <strong>Icon Only:</strong> Use when space is limited - perfect for mobile apps and compact layouts</li>
            <li>• <strong>Wallpapers:</strong> 1920x1080 Full HD for desktop backgrounds and presentations</li>
            <li>• <strong>SVG:</strong> Scalable vector format for web use - always sharp at any size</li>
          </ul>
        </GlassCard>
      </div>
    </div>
  );
};

export default LogoDownload;
