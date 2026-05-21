export type Product = {
    id: number;
    name: string;
    price: number;
    originalPrice: number;
    rating: number;
    image: string;
    category: string;
    description: string;
    inStock: boolean;
};

export const products: Product[] = [
    { id: 1, name: 'Wireless Headphones', price: 79.99, originalPrice: 129.99, rating: 4.5, image: '🎧', category: 'Electronics', description: 'Premium wireless headphones with active noise cancellation, 30-hour battery life, and crystal-clear sound quality. Perfect for music lovers and professionals.', inStock: true },
    { id: 2, name: 'Smart Watch Pro', price: 199.99, originalPrice: 299.99, rating: 4.8, image: '⌚', category: 'Electronics', description: 'Advanced smartwatch with health monitoring, GPS, water resistance, and a stunning AMOLED display. Track your fitness goals effortlessly.', inStock: true },
    { id: 3, name: 'Running Shoes', price: 59.99, originalPrice: 89.99, rating: 4.3, image: '👟', category: 'Sports & Outdoors', description: 'Lightweight and breathable running shoes with superior cushioning and arch support. Ideal for daily runs and marathon training.', inStock: true },
    { id: 4, name: 'Organic Face Cream', price: 24.99, originalPrice: 39.99, rating: 4.7, image: '🧴', category: 'Beauty & Health', description: 'All-natural organic face cream enriched with vitamins and antioxidants. Hydrates and protects your skin throughout the day.', inStock: true },
    { id: 5, name: 'Laptop Backpack', price: 34.99, originalPrice: 54.99, rating: 4.4, image: '🎒', category: 'Fashion', description: 'Durable and stylish laptop backpack with padded compartments, USB charging port, and water-resistant fabric. Fits up to 15.6" laptops.', inStock: true },
    { id: 6, name: 'Coffee Maker', price: 89.99, originalPrice: 149.99, rating: 4.6, image: '☕', category: 'Home & Living', description: 'Programmable coffee maker with thermal carafe, brew strength control, and auto-shutoff. Brew the perfect cup every morning.', inStock: true },
    { id: 7, name: 'Bluetooth Speaker', price: 49.99, originalPrice: 79.99, rating: 4.5, image: '🔊', category: 'Electronics', description: 'Portable Bluetooth speaker with 360-degree sound, waterproof design, and 12-hour battery life. Take your music anywhere.', inStock: true },
    { id: 8, name: 'Desk Lamp', price: 29.99, originalPrice: 49.99, rating: 4.2, image: '💡', category: 'Home & Living', description: 'LED desk lamp with adjustable brightness, color temperature control, and USB charging port. Perfect for work and study.', inStock: false },
    { id: 9, name: 'Yoga Mat', price: 19.99, originalPrice: 34.99, rating: 4.6, image: '🧘', category: 'Sports & Outdoors', description: 'Non-slip yoga mat with extra thickness for joint protection. Eco-friendly TPE material, easy to clean and carry.', inStock: true },
    { id: 10, name: 'Sunglasses', price: 39.99, originalPrice: 69.99, rating: 4.3, image: '🕶️', category: 'Fashion', description: 'Polarized sunglasses with UV400 protection and lightweight titanium frame. Stylish design for any occasion.', inStock: true },
    { id: 11, name: 'Mechanical Keyboard', price: 69.99, originalPrice: 99.99, rating: 4.7, image: '⌨️', category: 'Electronics', description: 'RGB mechanical keyboard with cherry switches, programmable keys, and detachable wrist rest. Built for gamers and typists.', inStock: true },
    { id: 12, name: 'Water Bottle', price: 12.99, originalPrice: 24.99, rating: 4.4, image: '🍶', category: 'Sports & Outdoors', description: 'Insulated stainless steel water bottle. Keeps drinks cold for 24 hours or hot for 12 hours. BPA-free and leak-proof.', inStock: true },
];

export function getProduct(id: number): Product | undefined {
    return products.find((p) => p.id === id);
}

export function formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
}
