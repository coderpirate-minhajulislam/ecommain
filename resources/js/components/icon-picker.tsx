import { ChevronDown, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import * as Icons from 'lucide-react';

const AVAILABLE_ICONS = [
    'Package', 'Box', 'Zap', 'Gift', 'Shield', 'Truck', 'Heart', 'Battery', 'Wifi', 'Award', 'CheckCircle', 'Star',
    'Smartphone', 'Laptop', 'Headphones', 'Gamepad2', 'Camera', 'Music', 'Home', 'Building2', 'MapPin', 'Navigation',
    'Clock', 'Calendar', 'Bell', 'MessageSquare', 'Mail', 'Phone', 'Copy', 'Download', 'Upload', 'Share2',
    'Settings', 'Sliders', 'Filter', 'Search', 'Eye', 'EyeOff', 'Lock', 'Unlock', 'Key', 'Fingerprint',
    'ThumbsUp', 'ThumbsDown', 'Heart', 'Smile', 'AlertCircle', 'CheckCircle', 'XCircle', 'HelpCircle', 'Info', 'AlertTriangle',
    'Zap', 'Flame', 'Droplet', 'Wind', 'Sun', 'Moon', 'Cloud', 'CloudRain', 'CloudSnow', 'Umbrella',
    'Leaf', 'Tree', 'Flower2', 'Sprout', 'Cactus', 'Apple', 'Coffee', 'Beer', 'Wine2', 'Utensils',
    'ShoppingCart', 'ShoppingBag', 'DollarSign', 'CreditCard', 'Wallet', 'Coins', 'TrendingUp', 'TrendingDown', 'BarChart', 'PieChart',
    'Users', 'User', 'UserPlus', 'UserMinus', 'UserCheck', 'UserX', 'Briefcase', 'BookOpen', 'BookMarked', 'PenTool',
    'Palette', 'Layers', 'Grid', 'Layout', 'List', 'AlignLeft', 'AlignCenter', 'AlignRight', 'Volume2', 'VolumeX',
];

const getIconComponent = (iconName: string) => {
    const iconComponent = (Icons as Record<string, any>)[iconName];
    return iconComponent || null;
};

interface IconPickerProps {
    value: string | undefined;
    onChange: (iconName: string) => void;
    triggerClass?: string;
}

export function IconPicker({ value, onChange, triggerClass = '' }: IconPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

    const filteredIcons = useMemo(() => {
        if (!search) return AVAILABLE_ICONS;
        return AVAILABLE_ICONS.filter(icon =>
            icon.toLowerCase().includes(search.toLowerCase())
        );
    }, [search]);

    const selectedIcon = value ? getIconComponent(value) : null;
    const SelectedIconComponent = selectedIcon;

    return (
        <div className="relative w-full">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${triggerClass}`}
            >
                <div className="flex items-center gap-2">
                    {SelectedIconComponent ? (
                        <SelectedIconComponent className="h-4 w-4 text-primary" />
                    ) : (
                        <span className="text-xs text-muted-foreground">Select icon</span>
                    )}
                    <span className="text-xs text-muted-foreground">{value || 'None'}</span>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50" />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/20"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full left-0 right-0 z-50 mt-2 w-screen sm:w-auto sm:min-w-96 rounded-lg border border-input bg-white shadow-2xl" style={{ maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}>
                        <div className="sticky top-0 border-b border-input bg-white p-4 z-10">
                            <input
                                type="text"
                                placeholder="Search icons..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-lg border-2 border-input bg-white px-4 py-2.5 text-sm placeholder-muted-foreground transition-colors focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        <div className="p-4">
                            <button
                                type="button"
                                onClick={() => {
                                    onChange('');
                                    setIsOpen(false);
                                    setSearch('');
                                }}
                                className={`mb-3 w-full rounded-lg border-2 p-3 text-center text-sm font-medium transition-all ${
                                    value === ''
                                        ? 'border-primary bg-primary/15 text-primary'
                                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-primary/50 hover:bg-primary/5'
                                }`}
                            >
                                None
                            </button>

                            <div className="grid grid-cols-8 gap-2">
                                {filteredIcons.map((iconName) => {
                                    const IconComponent = getIconComponent(iconName);
                                    if (!IconComponent) return null;

                                    return (
                                        <button
                                            key={iconName}
                                            type="button"
                                            onClick={() => {
                                                onChange(iconName);
                                                setIsOpen(false);
                                                setSearch('');
                                            }}
                                            title={iconName}
                                            className={`flex h-11 items-center justify-center rounded-lg border-2 transition-all ${
                                                value === iconName
                                                    ? 'border-primary bg-primary/15 text-primary shadow-md'
                                                    : 'border-gray-200 bg-white text-gray-600 hover:border-primary hover:bg-primary/5 hover:text-primary'
                                            }`}
                                        >
                                            <IconComponent className="h-5 w-5" />
                                        </button>
                                    );
                                })}
                            </div>

                            {filteredIcons.length === 0 && (
                                <div className="py-8 text-center text-sm text-muted-foreground">
                                    No icons found
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
