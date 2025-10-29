import { motion } from "framer-motion";
import { 
  Palette, 
  Layers, 
  LayoutGrid, 
  Droplets, 
  BarChart3, 
  Download 
} from "lucide-react";

const CUSTOMIZATION_FEATURES = [
  {
    id: 'themes',
    icon: Palette,
    title: 'Unlimited Themes',
    description: 'Choose from presets or create your own with full RGB control',
    color: '270 67% 62%'
  },
  {
    id: 'widgets',
    icon: Layers,
    title: 'Flexible Widgets',
    description: 'Add, remove, and arrange widgets to match your workflow',
    color: '189 94% 43%'
  },
  {
    id: 'layouts',
    icon: LayoutGrid,
    title: 'Custom Layouts',
    description: 'Save multiple dashboard configurations for different strategies',
    color: '24 95% 53%'
  },
  {
    id: 'colors',
    icon: Droplets,
    title: 'Color Control',
    description: 'Fine-tune every color element from charts to backgrounds',
    color: '160 84% 39%'
  },
  {
    id: 'charts',
    icon: BarChart3,
    title: 'Chart Timeframes',
    description: 'Customize timeframes to analyze your trading performance over any period',
    color: '217 91% 60%'
  },
  {
    id: 'export',
    icon: Download,
    title: 'Export Settings',
    description: 'Save and share your custom themes and layouts with others',
    color: '330 81% 60%'
  }
];

export const CustomizationGrid = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {CUSTOMIZATION_FEATURES.map((feature, index) => {
        const Icon = feature.icon;
        return (
          <motion.div
            key={feature.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            viewport={{ once: true }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="group relative p-6 rounded-2xl border border-border/20 bg-background/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
            style={{
              boxShadow: `0 0 0 1px hsl(${feature.color} / 0.1)`
            }}
          >
            <div className="space-y-4">
              <motion.div
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 3,
                  ease: "easeInOut"
                }}
                className="relative"
              >
                <div 
                  className="p-3 rounded-xl inline-flex"
                  style={{
                    backgroundColor: `hsl(${feature.color} / 0.1)`,
                    border: `1px solid hsl(${feature.color} / 0.2)`
                  }}
                >
                  <Icon 
                    className="h-8 w-8"
                    style={{ color: `hsl(${feature.color})` }}
                  />
                </div>
              </motion.div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>

            {/* Hover glow effect */}
            <div 
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"
              style={{
                boxShadow: `0 0 40px -10px hsl(${feature.color} / 0.3)`
              }}
            />
          </motion.div>
        );
      })}
    </div>
  );
};
