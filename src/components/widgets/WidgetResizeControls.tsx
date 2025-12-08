import { Maximize2, Minimize2, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WidgetSize, WidgetHeight } from '@/types/widget';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

interface WidgetResizeControlsProps {
  currentSize: WidgetSize;
  currentHeight: WidgetHeight;
  onResize: (newSize?: WidgetSize, newHeight?: WidgetHeight) => void;
}

export const WidgetResizeControls = ({
  currentSize,
  currentHeight,
  onResize,
}: WidgetResizeControlsProps) => {
  // Small widgets cannot be resized
  if (currentSize === 'small') return null;

  const widthOptions: WidgetSize[] = ['small', 'medium', 'large'];
  const heightOptions: WidgetHeight[] = [2, 4, 6];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Largura</DropdownMenuLabel>
        {widthOptions.map((size) => (
          <DropdownMenuItem
            key={`width-${size}`}
            onClick={() => onResize(size, undefined)}
            className={currentSize === size ? 'bg-accent' : ''}
          >
            {size === 'small' && <Minimize2 className="h-4 w-4 mr-2" />}
            {size === 'medium' && <Maximize2 className="h-4 w-4 mr-2" />}
            {size === 'large' && <Maximize2 className="h-4 w-4 mr-2" />}
            {size === 'small' ? 'Pequeno (1/3)' : size === 'medium' ? 'Médio (2/3)' : 'Grande (Full)'}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Altura</DropdownMenuLabel>
        {heightOptions.map((height) => (
          <DropdownMenuItem
            key={`height-${height}`}
            onClick={() => onResize(undefined, height)}
            className={currentHeight === height ? 'bg-accent' : ''}
          >
            <ArrowUpDown className="h-4 w-4 mr-2" />
            {height === 2 ? 'Pequena' : height === 4 ? 'Média' : 'Grande'}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
