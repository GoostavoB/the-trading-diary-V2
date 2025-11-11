import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DensityToggleProps {
  density: 'comfortable' | 'compact';
  onDensityChange: (density: 'comfortable' | 'compact') => void;
}

export const DensityToggle = ({
  density,
  onDensityChange,
}: DensityToggleProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          {density === 'comfortable' ? (
            <Maximize2 className="h-4 w-4" />
          ) : (
            <Minimize2 className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover/95 backdrop-blur-sm">
        <DropdownMenuItem onClick={() => onDensityChange('comfortable')}>
          <Maximize2 className="h-4 w-4 mr-2" />
          Comfortable
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDensityChange('compact')}>
          <Minimize2 className="h-4 w-4 mr-2" />
          Compact
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
