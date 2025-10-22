import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Download, Copy, ArrowLeft, ExternalLink, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { useState } from "react";
import { toast } from "sonner";
import heroBg from '@/assets/bull-bear-realistic.png';
import wallpaperLogo from '@/assets/wallpaper-logo-center.png';
import wallpaperTrading from '@/assets/wallpaper-trading-theme.png';
import wallpaperCreative from '@/assets/wallpaper-creative.png';

const LogoDownload = () => {
  const navigate = useNavigate();
  const [selectedBg, setSelectedBg] = useState<'transparent' | 'white' | 'dark'>('transparent');
  const [copied, setCopied] = useState(false);

  const downloadLogo = (size: number, bgColor: 'transparent' | 'white') => {
    const svg = document.getElementById('logo-svg-source');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set background
    if (bgColor === 'white') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);
    }

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const link = document.createElement('a');
        link.download = `trading-diary-logo-${size}x${size}-${bgColor}.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
        toast.success(`Downloaded ${size}x${size} PNG`);
      }, 'image/png');
    };

    img.src = url;
  };

  const copySVG = () => {
    const svg = document.getElementById('logo-svg-source');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    navigator.clipboard.writeText(svgData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('SVG code copied to clipboard!');
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
      gradient.addColorStop(0, 'rgba(155, 135, 245, 0.15)');
      gradient.addColorStop(1, 'rgba(126, 105, 171, 0.15)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw logo SVG
      const svgData = `
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="200" height="200">
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color: hsl(250, 80%, 75%); stop-opacity: 1" />
              <stop offset="100%" style="stop-color: hsl(250, 80%, 75%); stop-opacity: 0.85" />
            </linearGradient>
          </defs>
          <rect x="8" y="10" width="24" height="5" fill="url(#logoGradient)" />
          <rect x="17" y="10" width="6" height="28" fill="url(#logoGradient)" />
          <rect x="25" y="15" width="6" height="23" fill="url(#logoGradient)" />
          <path d="M 31 15 L 38 15 Q 42 15 42 19 L 42 34 Q 42 38 38 38 L 31 38 Z
                   M 31 20 L 35 20 Q 37 20 37 22 L 37 31 Q 37 33 35 33 L 31 33 Z"
                fill-rule="evenodd"
                clip-rule="evenodd"
                fill="url(#logoGradient)" />
          <rect x="7" y="9" width="36" height="30" rx="2" stroke="hsl(250, 80%, 75%)" stroke-width="0.5" fill="none" opacity="0.2" />
        </svg>
      `;

      const logoImg = new Image();
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);

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
            URL.revokeObjectURL(url);
            toast.success(`Downloaded ${width}x${height} thumbnail`);
          }
        });
      };

      logoImg.src = url;
    };

    bgImg.src = heroBg;
  };

  const downloadIconOnly = (size: number, bgColor: 'transparent' | 'white') => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set background
    if (bgColor === 'white') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);
    }

    // Icon-only SVG (no text)
    const svgData = `
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color: hsl(250, 80%, 75%); stop-opacity: 1" />
            <stop offset="100%" style="stop-color: hsl(250, 80%, 75%); stop-opacity: 0.85" />
          </linearGradient>
        </defs>
        <rect x="8" y="10" width="24" height="5" fill="url(#logoGradient)" />
        <rect x="17" y="10" width="6" height="28" fill="url(#logoGradient)" />
        <rect x="25" y="15" width="6" height="23" fill="url(#logoGradient)" />
        <path d="M 31 15 L 38 15 Q 42 15 42 19 L 42 34 Q 42 38 38 38 L 31 38 Z
                 M 31 20 L 35 20 Q 37 20 37 22 L 37 31 Q 37 33 35 33 L 31 33 Z"
              fill-rule="evenodd"
              clip-rule="evenodd"
              fill="url(#logoGradient)" />
        <rect x="7" y="9" width="36" height="30" rx="2" stroke="hsl(250, 80%, 75%)" stroke-width="0.5" fill="none" opacity="0.2" />
      </svg>
    `;

    const img = new Image();
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);

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

    img.src = url;
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

          {/* Logo Display */}
          <div
            className="rounded-xl p-12 flex items-center justify-center transition-colors"
            style={{
              backgroundColor: 
                selectedBg === 'white' ? '#FFFFFF' :
                selectedBg === 'dark' ? '#0A0A0A' :
                'transparent',
              border: selectedBg === 'transparent' ? '1px dashed hsl(var(--border))' : 'none'
            }}
          >
            <Logo size="xl" variant="horizontal" showText={true} />
          </div>

          {/* Copy SVG Button */}
          <div className="mt-6 flex justify-center">
            <Button onClick={copySVG} variant={copied ? "default" : "outline"}>
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? "Copied!" : "Copy SVG Code"}
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
                  <Logo size="lg" variant="icon" />
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
                  <Logo size="lg" variant="icon" />
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

        {/* Download Options */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Transparent Background */}
          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <div className="h-4 w-4 rounded border-2 border-dashed border-muted-foreground" />
              Transparent Background
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Best for overlaying on any background
            </p>
            <div className="space-y-3">
              {[192, 512, 1024].map((size) => (
                <Button
                  key={`transparent-${size}`}
                  onClick={() => downloadLogo(size, 'transparent')}
                  variant="outline"
                  className="w-full justify-between hover:bg-primary/10"
                >
                  <span>{size}x{size} PNG</span>
                  <Download className="h-4 w-4" />
                </Button>
              ))}
            </div>
          </GlassCard>

          {/* White Background */}
          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-white border border-border" />
              White Background
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Best for dark themed websites or apps
            </p>
            <div className="space-y-3">
              {[192, 512, 1024].map((size) => (
                <Button
                  key={`white-${size}`}
                  onClick={() => downloadLogo(size, 'white')}
                  variant="outline"
                  className="w-full justify-between hover:bg-primary/10"
                >
                  <span>{size}x{size} PNG</span>
                  <Download className="h-4 w-4" />
                </Button>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Larger Sizes Section */}
        <GlassCard className="p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">High Resolution Logos</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Ultra high-resolution versions for professional use, billboards, and large format printing
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {[2048, 4096].map((size) => (
              <div key={size} className="space-y-2">
                <Button
                  onClick={() => downloadLogo(size, 'transparent')}
                  variant="outline"
                  className="w-full justify-between hover:bg-primary/10"
                >
                  <span>{size}x{size} PNG (Transparent)</span>
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => downloadLogo(size, 'white')}
                  variant="outline"
                  className="w-full justify-between hover:bg-primary/10"
                >
                  <span>{size}x{size} PNG (White BG)</span>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
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

      {/* Hidden SVG Source */}
      <svg
        id="logo-svg-source"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="hidden"
        style={{ width: '48px', height: '48px' }}
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'hsl(217, 91%, 60%)', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: 'hsl(217, 91%, 60%)', stopOpacity: 0.85 }} />
          </linearGradient>
        </defs>
        
        <rect x="8" y="10" width="24" height="5" fill="url(#logoGradient)" />
        <rect x="17" y="10" width="6" height="28" fill="url(#logoGradient)" />
        <rect x="25" y="15" width="6" height="23" fill="url(#logoGradient)" />
        <path
          d="M 31 15 L 38 15 Q 42 15 42 19 L 42 34 Q 42 38 38 38 L 31 38 Z
             M 31 20 L 35 20 Q 37 20 37 22 L 37 31 Q 37 33 35 33 L 31 33 Z"
          fillRule="evenodd"
          clipRule="evenodd"
          fill="url(#logoGradient)"
        />
        <rect x="7" y="9" width="36" height="30" rx="2" stroke="hsl(217, 91%, 60%)" strokeWidth="0.5" fill="none" opacity="0.2" />
      </svg>
    </div>
  );
};

export default LogoDownload;
