<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->create([
            'name' => 'Super Admin',
            'email' => 'superadmin@example.com',
            'password' => bcrypt('@Minhaz_1332!SA'),
            'role' => 'super_admin',
            'is_active' => true,
        ]);

        User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => bcrypt('@Minhaz_1332!AA'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        User::factory()->create([
            'name' => 'Manager User',
            'email' => 'manager@example.com',
            'password' => bcrypt('@Minhaz_1332!MM'),
            'role' => 'manager',
            'is_active' => true,
        ]);

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('@Minhaz_1332!UU'),
            'role' => 'user',
            'is_active' => true,
        ]);

        User::factory(10)->create();

        // Seed categories
        $electronics = Category::create(['name' => 'Electronics', 'slug' => 'electronics', 'icon' => 'Laptop']);
        $fashion = Category::create(['name' => 'Fashion', 'slug' => 'fashion', 'icon' => 'Shirt']);
        $sports = Category::create(['name' => 'Sports & Outdoors', 'slug' => 'sports-outdoors', 'icon' => 'Dumbbell']);
        $beauty = Category::create(['name' => 'Beauty & Health', 'slug' => 'beauty-health', 'icon' => 'Heart']);
        $home = Category::create(['name' => 'Home & Living', 'slug' => 'home-living', 'icon' => 'Sofa']);

        // Seed products
        $products = [
            // Featured + New Arrivals
            ['category_id' => $electronics->id, 'name' => 'Wireless Headphones', 'slug' => 'wireless-headphones', 'price' => 79.99, 'original_price' => 129.99, 'description' => 'Premium wireless headphones with active noise cancellation, 30-hour battery life, and crystal-clear sound quality.', 'in_stock' => true, 'free_shipping' => true, 'is_featured' => true, 'is_new_arrival' => false],
            ['category_id' => $electronics->id, 'name' => 'Smart Watch Pro', 'slug' => 'smart-watch-pro', 'price' => 199.99, 'original_price' => 299.99, 'description' => 'Advanced smartwatch with health monitoring, GPS, water resistance, and a stunning AMOLED display.', 'in_stock' => true, 'free_shipping' => true, 'is_featured' => true, 'is_new_arrival' => true],
            ['category_id' => $sports->id, 'name' => 'Running Shoes', 'slug' => 'running-shoes', 'price' => 59.99, 'original_price' => 89.99, 'description' => 'Lightweight and breathable running shoes with superior cushioning and arch support.', 'in_stock' => true, 'free_shipping' => true, 'is_featured' => true, 'is_new_arrival' => false],
            ['category_id' => $beauty->id, 'name' => 'Organic Face Cream', 'slug' => 'organic-face-cream', 'price' => 24.99, 'original_price' => 39.99, 'description' => 'All-natural organic face cream enriched with vitamins and antioxidants.', 'in_stock' => true, 'free_shipping' => true, 'is_featured' => false, 'is_new_arrival' => true],
            ['category_id' => $fashion->id, 'name' => 'Laptop Backpack', 'slug' => 'laptop-backpack', 'price' => 34.99, 'original_price' => 54.99, 'description' => 'Durable and stylish laptop backpack with padded compartments and USB charging port.', 'in_stock' => true, 'free_shipping' => true, 'is_featured' => true, 'is_new_arrival' => false],
            ['category_id' => $home->id, 'name' => 'Coffee Maker', 'slug' => 'coffee-maker', 'price' => 89.99, 'original_price' => 149.99, 'description' => 'Programmable coffee maker with thermal carafe, brew strength control, and auto-shutoff.', 'in_stock' => true, 'free_shipping' => true, 'is_featured' => true, 'is_new_arrival' => false],
            ['category_id' => $electronics->id, 'name' => 'Bluetooth Speaker', 'slug' => 'bluetooth-speaker', 'price' => 49.99, 'original_price' => 79.99, 'description' => 'Portable Bluetooth speaker with 360-degree sound, waterproof design, and 12-hour battery life.', 'in_stock' => true, 'free_shipping' => true, 'is_featured' => true, 'is_new_arrival' => true],
            ['category_id' => $home->id, 'name' => 'Desk Lamp', 'slug' => 'desk-lamp', 'price' => 29.99, 'original_price' => 49.99, 'description' => 'LED desk lamp with adjustable brightness, color temperature control, and USB charging port.', 'in_stock' => false, 'free_shipping' => true, 'is_featured' => false, 'is_new_arrival' => false],
            ['category_id' => $sports->id, 'name' => 'Yoga Mat', 'slug' => 'yoga-mat', 'price' => 19.99, 'original_price' => 34.99, 'description' => 'Non-slip yoga mat with extra thickness for joint protection. Eco-friendly TPE material.', 'in_stock' => true, 'free_shipping' => true, 'is_featured' => false, 'is_new_arrival' => true],
            ['category_id' => $fashion->id, 'name' => 'Sunglasses', 'slug' => 'sunglasses', 'price' => 39.99, 'original_price' => 69.99, 'description' => 'Polarized sunglasses with UV400 protection and lightweight titanium frame.', 'in_stock' => true, 'free_shipping' => true, 'is_featured' => true, 'is_new_arrival' => true],
            ['category_id' => $electronics->id, 'name' => 'Mechanical Keyboard', 'slug' => 'mechanical-keyboard', 'price' => 69.99, 'original_price' => 99.99, 'description' => 'RGB mechanical keyboard with cherry switches, programmable keys, and detachable wrist rest.', 'in_stock' => true, 'free_shipping' => true, 'is_featured' => true, 'is_new_arrival' => false],
            ['category_id' => $sports->id, 'name' => 'Water Bottle', 'slug' => 'water-bottle', 'price' => 12.99, 'original_price' => 24.99, 'description' => 'Insulated stainless steel water bottle. Keeps drinks cold for 24 hours or hot for 12 hours.', 'in_stock' => true, 'free_shipping' => true, 'is_featured' => false, 'is_new_arrival' => false],

            // New products
            ['category_id' => $electronics->id, 'name' => 'USB-C Hub 7-in-1', 'slug' => 'usb-c-hub', 'price' => 39.99, 'original_price' => 59.99, 'description' => 'Multi-port USB-C hub with 4K HDMI, 100W PD charging, 3x USB-A, SD & MicroSD card readers.', 'in_stock' => true, 'free_shipping' => true, 'is_featured' => false, 'is_new_arrival' => true],
            ['category_id' => $electronics->id, 'name' => 'Wireless Charging Pad', 'slug' => 'wireless-charging-pad', 'price' => 24.99, 'original_price' => 39.99, 'description' => '15W fast wireless charging pad compatible with all Qi-enabled devices.', 'in_stock' => true, 'free_shipping' => true, 'is_featured' => true, 'is_new_arrival' => true],
            ['category_id' => $electronics->id, 'name' => 'Noise Cancelling Earbuds', 'slug' => 'noise-cancelling-earbuds', 'price' => 99.99, 'original_price' => 159.99, 'description' => 'True wireless earbuds with active noise cancellation, 8-hour battery, and IPX5 water resistance.', 'in_stock' => true, 'free_shipping' => true, 'is_featured' => true, 'is_new_arrival' => true],
            ['category_id' => $electronics->id, 'name' => 'Portable Power Bank', 'slug' => 'portable-power-bank', 'price' => 34.99, 'original_price' => 54.99, 'description' => '20000mAh power bank with 65W PD fast charging and dual USB-A ports.', 'in_stock' => true, 'free_shipping' => true, 'is_featured' => false, 'is_new_arrival' => true],
            ['category_id' => $electronics->id, 'name' => 'Smart Security Camera', 'slug' => 'smart-security-camera', 'price' => 59.99, 'original_price' => 89.99, 'description' => '1080p HD smart security camera with night vision, motion detection, and two-way audio.', 'in_stock' => true, 'free_shipping' => true, 'is_featured' => true, 'is_new_arrival' => false],
            ['category_id' => $fashion->id, 'name' => 'Leather Wallet', 'slug' => 'leather-wallet', 'price' => 29.99, 'original_price' => 49.99, 'description' => 'Slim genuine leather bifold wallet with RFID blocking and 8 card slots.', 'in_stock' => true, 'free_shipping' => true, 'is_featured' => false, 'is_new_arrival' => true],
            ['category_id' => $fashion->id, 'name' => 'Canvas Sneakers', 'slug' => 'canvas-sneakers', 'price' => 44.99, 'original_price' => 69.99, 'description' => 'Classic canvas sneakers with memory foam insole and durable rubber outsole.', 'in_stock' => true, 'free_shipping' => true, 'is_featured' => true, 'is_new_arrival' => true],
            ['category_id' => $fashion->id, 'name' => 'Casual Hoodie', 'slug' => 'casual-hoodie', 'price' => 49.99, 'original_price' => 79.99, 'description' => 'Soft cotton-blend hoodie with kangaroo pocket and adjustable drawstring hood.', 'in_stock' => true, 'free_shipping' => true, 'is_featured' => true, 'is_new_arrival' => true],
            ['category_id' => $fashion->id, 'name' => 'Travel Duffle Bag', 'slug' => 'travel-duffle-bag', 'price' => 54.99, 'original_price' => 84.99, 'description' => 'Spacious 40L travel duffle bag with shoe compartment, water-resistant exterior, and shoulder strap.', 'in_stock' => true, 'free_shipping' => true, 'is_featured' => false, 'is_new_arrival' => true],
            ['category_id' => $sports->id, 'name' => 'Resistance Band Set', 'slug' => 'resistance-band-set', 'price' => 22.99, 'original_price' => 39.99, 'description' => 'Set of 5 resistance bands in different strengths for full-body workout and physical therapy.', 'in_stock' => true, 'free_shipping' => true, 'is_featured' => false, 'is_new_arrival' => true],
            ['category_id' => $sports->id, 'name' => 'Jump Rope', 'slug' => 'jump-rope', 'price' => 14.99, 'original_price' => 24.99, 'description' => 'Speed jump rope with ball-bearing handles and adjustable cable for all fitness levels.', 'in_stock' => true, 'free_shipping' => true, 'is_featured' => false, 'is_new_arrival' => false],
            ['category_id' => $sports->id, 'name' => 'Foam Roller', 'slug' => 'foam-roller', 'price' => 24.99, 'original_price' => 39.99, 'description' => 'High-density foam roller for deep tissue massage, muscle recovery, and flexibility training.', 'in_stock' => true, 'free_shipping' => true, 'is_featured' => true, 'is_new_arrival' => false],
            ['category_id' => $sports->id, 'name' => 'Gym Gloves', 'slug' => 'gym-gloves', 'price' => 18.99, 'original_price' => 29.99, 'description' => 'Padded weight lifting gloves with wrist support and breathable mesh back.', 'in_stock' => true, 'free_shipping' => true, 'is_featured' => false, 'is_new_arrival' => true],
            ['category_id' => $beauty->id, 'name' => 'Vitamin C Serum', 'slug' => 'vitamin-c-serum', 'price' => 19.99, 'original_price' => 34.99, 'description' => 'Brightening vitamin C serum with hyaluronic acid and niacinamide for radiant skin.', 'in_stock' => true, 'free_shipping' => true, 'is_featured' => true, 'is_new_arrival' => true],
            ['category_id' => $beauty->id, 'name' => 'Hair Dryer Pro', 'slug' => 'hair-dryer-pro', 'price' => 49.99, 'original_price' => 79.99, 'description' => '2000W professional hair dryer with ionic technology, 3 heat settings, and concentrator nozzle.', 'in_stock' => true, 'free_shipping' => true, 'is_featured' => true, 'is_new_arrival' => false],
            ['category_id' => $beauty->id, 'name' => 'Sunscreen SPF 50', 'slug' => 'sunscreen-spf50', 'price' => 14.99, 'original_price' => 24.99, 'description' => 'Lightweight SPF 50 PA+++ sunscreen with mineral filters, suitable for all skin types.', 'in_stock' => true, 'free_shipping' => true, 'is_featured' => false, 'is_new_arrival' => true],
            ['category_id' => $beauty->id, 'name' => 'Electric Toothbrush', 'slug' => 'electric-toothbrush', 'price' => 44.99, 'original_price' => 69.99, 'description' => 'Rechargeable electric toothbrush with 3 brushing modes, pressure sensor, and 2-minute timer.', 'in_stock' => true, 'free_shipping' => true, 'is_featured' => true, 'is_new_arrival' => true],
            ['category_id' => $home->id, 'name' => 'Air Purifier', 'slug' => 'air-purifier', 'price' => 129.99, 'original_price' => 199.99, 'description' => 'HEPA air purifier covering 500 sq ft, removes 99.97% of pollutants, ultra-quiet operation.', 'in_stock' => true, 'free_shipping' => true, 'is_featured' => true, 'is_new_arrival' => true],
            ['category_id' => $home->id, 'name' => 'Scented Candle Set', 'slug' => 'scented-candle-set', 'price' => 29.99, 'original_price' => 44.99, 'description' => 'Set of 3 soy wax scented candles in lavender, vanilla, and eucalyptus fragrances.', 'in_stock' => true, 'free_shipping' => true, 'is_featured' => false, 'is_new_arrival' => true],
            ['category_id' => $home->id, 'name' => 'Non-Stick Cookware Set', 'slug' => 'non-stick-cookware-set', 'price' => 79.99, 'original_price' => 129.99, 'description' => '5-piece non-stick cookware set compatible with all stovetops including induction.', 'in_stock' => true, 'free_shipping' => true, 'is_featured' => true, 'is_new_arrival' => false],
            ['category_id' => $home->id, 'name' => 'Smart LED Bulb', 'slug' => 'smart-led-bulb', 'price' => 16.99, 'original_price' => 27.99, 'description' => 'Wi-Fi smart LED bulb with 16 million colors, voice control via Alexa & Google, and app control.', 'in_stock' => true, 'free_shipping' => true, 'is_featured' => false, 'is_new_arrival' => true],
            ['category_id' => $home->id, 'name' => 'Bamboo Cutting Board', 'slug' => 'bamboo-cutting-board', 'price' => 21.99, 'original_price' => 34.99, 'description' => 'Extra-large bamboo cutting board with juice groove and built-in handles.', 'in_stock' => true, 'free_shipping' => true, 'is_featured' => false, 'is_new_arrival' => false],
        ];

        foreach ($products as $product) {
            Product::create($product);
        }

        // Seed payment methods
        $methods = [
            ['name' => 'Cash on Delivery', 'slug' => 'cod', 'description' => 'Pay when you receive', 'account_number' => null, 'requires_payment_details' => false, 'is_active' => true, 'sort_order' => 0],
            ['name' => 'bKash', 'slug' => 'bkash', 'description' => 'Mobile banking', 'account_number' => '01XXXXXXXXX', 'requires_payment_details' => true, 'is_active' => true, 'sort_order' => 1],
            ['name' => 'Nagad', 'slug' => 'nagod', 'description' => 'Mobile banking', 'account_number' => '01XXXXXXXXX', 'requires_payment_details' => true, 'is_active' => true, 'sort_order' => 2],
        ];

        foreach ($methods as $method) {
            PaymentMethod::firstOrCreate(['slug' => $method['slug']], $method);
        }
    }
}
