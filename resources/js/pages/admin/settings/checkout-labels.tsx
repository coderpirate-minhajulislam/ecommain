import { Head, useForm, usePage } from '@inertiajs/react';
import { Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useFlashToast } from '@/hooks/use-flash-toast';

type PageProps = {
    labelAddToCart: string;
    labelBuyNow: string;
    cardBuyNowEnabled: boolean;
    labelFreeShipping: string;
    labelDeliveryPrefix: string;
    labelDeliveryExtra: string;
    labelDeliveryArea: string;
    labelShippingInfo: string;
    labelFullName: string;
    labelPhoneNumber: string;
    labelEmail: string;
    checkoutEmailEnabled: boolean;
    checkoutEmailHelpText: string;
    labelDistrict: string;
    labelAddress: string;
    labelNote: string;
    labelPaymentMethod: string;
    labelOrderSummary: string;
    labelYourProducts: string;
    labelYourOrder: string;
    labelPlaceOrder: string;
    labelProceedToCheckout: string;
    labelContinueShopping: string;
    labelOrderConfirmed: string;
    labelOrderConfirmedSub: string;
    labelYouMayAlsoLike: string;
    orderSuccessRelatedEnabled: boolean;
    labelReviewHeading: string;
    labelReviewSubheading: string;
    labelReviewNote: string;
    labelReviewName: string;
    labelReviewEmail: string;
    labelReviewRating: string;
    labelReviewTitle: string;
    labelReviewBody: string;
    labelReviewSubmit: string;
    labelCustomerReviews: string;
    cartPageEnabled: boolean;
};

export default function CheckoutLabels() {
    useFlashToast();
    const props = usePage<PageProps>().props;

    const { data, setData, post, processing, errors } = useForm({
        label_add_to_cart:          props.labelAddToCart          ?? 'Add to Cart',
        label_buy_now:              props.labelBuyNow              ?? 'Buy Now',
        card_buy_now_enabled:       props.cardBuyNowEnabled        ?? true,
        label_free_shipping:        props.labelFreeShipping        ?? 'Free Shipping',
        label_delivery_prefix:      props.labelDeliveryPrefix      ?? 'Delivery: ',
        label_delivery_extra:       props.labelDeliveryExtra       ?? '',
        label_delivery_area:        props.labelDeliveryArea        ?? 'Delivery Area',
        label_shipping_info:        props.labelShippingInfo        ?? 'Shipping Information',
        label_full_name:            props.labelFullName            ?? 'Full Name',
        label_phone_number:         props.labelPhoneNumber         ?? 'Phone Number',
        label_email:                props.labelEmail               ?? 'Email Address',
        checkout_email_enabled:     props.checkoutEmailEnabled     ?? false,
        checkout_email_help_text:   props.checkoutEmailHelpText    ?? '',
        label_district:             props.labelDistrict            ?? 'District',
        label_address:              props.labelAddress             ?? 'Address',
        label_note:                 props.labelNote                ?? 'Note',
        label_payment_method:       props.labelPaymentMethod       ?? 'Payment Method',
        label_order_summary:        props.labelOrderSummary        ?? 'Order Summary',
        label_your_products:        props.labelYourProducts        ?? 'Your Products',
        label_your_order:           props.labelYourOrder           ?? 'Your Order',
        label_place_order:          props.labelPlaceOrder          ?? 'Place Order',
        label_proceed_to_checkout:  props.labelProceedToCheckout   ?? 'Proceed to Checkout',
        label_continue_shopping:    props.labelContinueShopping    ?? 'Continue Shopping',
        label_order_confirmed:              props.labelOrderConfirmed             ?? 'Order Confirmed!',
        label_order_confirmed_sub:         props.labelOrderConfirmedSub          ?? 'Thank you, {name}! Your order has been placed.',
        label_you_may_also_like:           props.labelYouMayAlsoLike             ?? 'You May Also Like',
        order_success_related_enabled:     props.orderSuccessRelatedEnabled      ?? true,
        label_review_heading:       props.labelReviewHeading       ?? 'Submit a Review',
        label_review_subheading:    props.labelReviewSubheading    ?? 'Share your thoughts about this product.',
        label_review_note:          props.labelReviewNote          ?? 'Anyone can submit a review!',
        label_review_name:          props.labelReviewName          ?? 'Your Name',
        label_review_email:         props.labelReviewEmail         ?? 'Email Address',
        label_review_rating:        props.labelReviewRating        ?? 'Rating',
        label_review_body:          props.labelReviewBody          ?? 'Your Review (Minimum 10 characters)',
        label_review_submit:        props.labelReviewSubmit        ?? 'Submit Review',
        label_customer_reviews:     props.labelCustomerReviews     ?? 'Customer Reviews',
        cart_page_enabled:          props.cartPageEnabled          ?? true,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/settings/checkout-labels');
    }

    return (
        <>
            <Head title="Checkout & Product Labels" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Checkout & Product Labels</h2>
                    <p className="text-muted-foreground">
                        Customize all button texts, section headings, and field labels shown to customers.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 md:grid-cols-2">

                        {/* Product Detail Buttons */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Tag className="h-5 w-5" />
                                    Product Page Buttons
                                </CardTitle>
                                <CardDescription>
                                    Text shown on the Add to Cart and Buy Now buttons on the product detail page.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="label_add_to_cart">Add to Cart Button</Label>
                                    <Input
                                        id="label_add_to_cart"
                                        value={data.label_add_to_cart}
                                        onChange={(e) => setData('label_add_to_cart', e.target.value)}
                                        placeholder="Add to Cart"
                                    />
                                    {errors.label_add_to_cart && (
                                        <p className="text-sm text-destructive">{errors.label_add_to_cart}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="label_buy_now">Buy Now Button (Product Detail Page)</Label>
                                    <Input
                                        id="label_buy_now"
                                        value={data.label_buy_now}
                                        onChange={(e) => setData('label_buy_now', e.target.value)}
                                        placeholder="Buy Now"
                                    />
                                    {errors.label_buy_now && (
                                        <p className="text-sm text-destructive">{errors.label_buy_now}</p>
                                    )}
                                </div>

                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div>
                                        <p className="text-sm font-medium">Enable Cart Page</p>
                                        <p className="text-xs text-muted-foreground">When disabled, cart icon goes directly to checkout</p>
                                    </div>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={data.cart_page_enabled}
                                        onClick={() => setData('cart_page_enabled', !data.cart_page_enabled)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${data.cart_page_enabled ? 'bg-primary' : 'bg-input'}`}
                                    >
                                        <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${data.cart_page_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div>
                                        <p className="text-sm font-medium">Show Buy Now on Product Cards</p>
                                        <p className="text-xs text-muted-foreground">Display a Buy Now button on every product card across the store</p>
                                    </div>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={data.card_buy_now_enabled}
                                        onClick={() => setData('card_buy_now_enabled', !data.card_buy_now_enabled)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${data.card_buy_now_enabled ? 'bg-primary' : 'bg-input'}`}
                                    >
                                        <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${data.card_buy_now_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Shipping Info Text */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Tag className="h-5 w-5" />
                                    Shipping Info Text
                                </CardTitle>
                                <CardDescription>
                                    Text shown in the delivery badge on the product detail page.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="label_free_shipping">Free Shipping Text</Label>
                                    <Input
                                        id="label_free_shipping"
                                        value={data.label_free_shipping}
                                        onChange={(e) => setData('label_free_shipping', e.target.value)}
                                        placeholder="Free Shipping"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Shown when a product has free shipping (e.g. "✓ Free Shipping").
                                    </p>
                                    {errors.label_free_shipping && (
                                        <p className="text-sm text-destructive">{errors.label_free_shipping}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="label_delivery_prefix">Delivery Prefix Text</Label>
                                    <Input
                                        id="label_delivery_prefix"
                                        value={data.label_delivery_prefix}
                                        onChange={(e) => setData('label_delivery_prefix', e.target.value)}
                                        placeholder="Delivery: "
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Shown before the zone charges (e.g. "Delivery: ৳50 (Dhaka Out) / ৳20 (Dhaka)").
                                    </p>
                                    {errors.label_delivery_prefix && (
                                        <p className="text-sm text-destructive">{errors.label_delivery_prefix}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="label_delivery_extra">Extra Delivery Note</Label>
                                    <Input
                                        id="label_delivery_extra"
                                        value={data.label_delivery_extra}
                                        onChange={(e) => setData('label_delivery_extra', e.target.value)}
                                        placeholder="e.g. (3-5 business days)"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Optional text appended after the zone charges. Leave empty to hide.
                                    </p>
                                    {errors.label_delivery_extra && (
                                        <p className="text-sm text-destructive">{errors.label_delivery_extra}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Checkout Section Headings */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Tag className="h-5 w-5" />
                                    Checkout Section Headings
                                </CardTitle>
                                <CardDescription>
                                    Section titles displayed on the checkout page.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="label_delivery_area">Delivery Area Heading</Label>
                                    <Input
                                        id="label_delivery_area"
                                        value={data.label_delivery_area}
                                        onChange={(e) => setData('label_delivery_area', e.target.value)}
                                        placeholder="Delivery Area"
                                    />
                                    {errors.label_delivery_area && (
                                        <p className="text-sm text-destructive">{errors.label_delivery_area}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="label_shipping_info">Shipping Information Heading</Label>
                                    <Input
                                        id="label_shipping_info"
                                        value={data.label_shipping_info}
                                        onChange={(e) => setData('label_shipping_info', e.target.value)}
                                        placeholder="Shipping Information"
                                    />
                                    {errors.label_shipping_info && (
                                        <p className="text-sm text-destructive">{errors.label_shipping_info}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="label_payment_method">Payment Method Heading</Label>
                                    <Input
                                        id="label_payment_method"
                                        value={data.label_payment_method}
                                        onChange={(e) => setData('label_payment_method', e.target.value)}
                                        placeholder="Payment Method"
                                    />
                                    {errors.label_payment_method && (
                                        <p className="text-sm text-destructive">{errors.label_payment_method}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="label_order_summary">Order Summary Heading</Label>
                                    <Input
                                        id="label_order_summary"
                                        value={data.label_order_summary}
                                        onChange={(e) => setData('label_order_summary', e.target.value)}
                                        placeholder="Order Summary"
                                    />
                                    {errors.label_order_summary && (
                                        <p className="text-sm text-destructive">{errors.label_order_summary}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="label_your_products">Your Products Heading</Label>
                                    <Input
                                        id="label_your_products"
                                        value={data.label_your_products}
                                        onChange={(e) => setData('label_your_products', e.target.value)}
                                        placeholder="Your Products"
                                    />
                                    {errors.label_your_products && (
                                        <p className="text-sm text-destructive">{errors.label_your_products}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="label_your_order">Your Order Heading</Label>
                                    <Input
                                        id="label_your_order"
                                        value={data.label_your_order}
                                        onChange={(e) => setData('label_your_order', e.target.value)}
                                        placeholder="Your Order"
                                    />
                                    {errors.label_your_order && (
                                        <p className="text-sm text-destructive">{errors.label_your_order}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Checkout Form Fields */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Tag className="h-5 w-5" />
                                    Checkout Form Labels
                                </CardTitle>
                                <CardDescription>
                                    Field labels and the Place Order button text on the checkout form.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="label_full_name">Full Name Field Label</Label>
                                    <Input
                                        id="label_full_name"
                                        value={data.label_full_name}
                                        onChange={(e) => setData('label_full_name', e.target.value)}
                                        placeholder="Full Name"
                                    />
                                    {errors.label_full_name && (
                                        <p className="text-sm text-destructive">{errors.label_full_name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="label_phone_number">Phone Number Field Label</Label>
                                    <Input
                                        id="label_phone_number"
                                        value={data.label_phone_number}
                                        onChange={(e) => setData('label_phone_number', e.target.value)}
                                        placeholder="Phone Number"
                                    />
                                    {errors.label_phone_number && (
                                        <p className="text-sm text-destructive">{errors.label_phone_number}</p>
                                    )}
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div>
                                        <p className="text-sm font-medium">Enable Email Field</p>
                                        <p className="text-xs text-muted-foreground">Show an optional email field on the checkout form</p>
                                    </div>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={data.checkout_email_enabled}
                                        onClick={() => setData('checkout_email_enabled', !data.checkout_email_enabled)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${data.checkout_email_enabled ? 'bg-primary' : 'bg-input'}`}
                                    >
                                        <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${data.checkout_email_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                {data.checkout_email_enabled && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="label_email">Email Field Label</Label>
                                            <Input
                                                id="label_email"
                                                value={data.label_email}
                                                onChange={(e) => setData('label_email', e.target.value)}
                                                placeholder="Email Address"
                                            />
                                            {errors.label_email && (
                                                <p className="text-sm text-destructive">{errors.label_email}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="checkout_email_help_text">Email Help Text</Label>
                                            <Input
                                                id="checkout_email_help_text"
                                                value={data.checkout_email_help_text}
                                                onChange={(e) => setData('checkout_email_help_text', e.target.value)}
                                                placeholder="e.g. We'll send your order confirmation here"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Optional helper text shown below the email field. Leave empty to hide.
                                            </p>
                                            {errors.checkout_email_help_text && (
                                                <p className="text-sm text-destructive">{errors.checkout_email_help_text}</p>
                                            )}
                                        </div>
                                    </>
                                )}

                                <Separator />

                                <div className="space-y-2">
                                    <Label htmlFor="label_district">District Field Label</Label>
                                    <Input
                                        id="label_district"
                                        value={data.label_district}
                                        onChange={(e) => setData('label_district', e.target.value)}
                                        placeholder="District"
                                    />
                                    {errors.label_district && (
                                        <p className="text-sm text-destructive">{errors.label_district}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="label_address">Address Field Label</Label>
                                    <Input
                                        id="label_address"
                                        value={data.label_address}
                                        onChange={(e) => setData('label_address', e.target.value)}
                                        placeholder="Address"
                                    />
                                    {errors.label_address && (
                                        <p className="text-sm text-destructive">{errors.label_address}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="label_note">Note Field Label</Label>
                                    <Input
                                        id="label_note"
                                        value={data.label_note}
                                        onChange={(e) => setData('label_note', e.target.value)}
                                        placeholder="Note"
                                    />
                                    {errors.label_note && (
                                        <p className="text-sm text-destructive">{errors.label_note}</p>
                                    )}
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <Label htmlFor="label_place_order">Place Order Button Text</Label>
                                    <Input
                                        id="label_place_order"
                                        value={data.label_place_order}
                                        onChange={(e) => setData('label_place_order', e.target.value)}
                                        placeholder="Place Order"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Shown on the submit button (e.g. "Place Order — ৳500").
                                    </p>
                                    {errors.label_place_order && (
                                        <p className="text-sm text-destructive">{errors.label_place_order}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Cart & Order Success */}
                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Tag className="h-5 w-5" />
                                    Cart Page Buttons
                                </CardTitle>
                                <CardDescription>
                                    Button texts shown on the cart summary panel.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="label_proceed_to_checkout">Proceed to Checkout Button</Label>
                                    <Input
                                        id="label_proceed_to_checkout"
                                        value={data.label_proceed_to_checkout}
                                        onChange={(e) => setData('label_proceed_to_checkout', e.target.value)}
                                        placeholder="Proceed to Checkout"
                                    />
                                    {errors.label_proceed_to_checkout && (
                                        <p className="text-sm text-destructive">{errors.label_proceed_to_checkout}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="label_continue_shopping">Continue Shopping Button</Label>
                                    <Input
                                        id="label_continue_shopping"
                                        value={data.label_continue_shopping}
                                        onChange={(e) => setData('label_continue_shopping', e.target.value)}
                                        placeholder="Continue Shopping"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Shown on cart page and after order success.
                                    </p>
                                    {errors.label_continue_shopping && (
                                        <p className="text-sm text-destructive">{errors.label_continue_shopping}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Tag className="h-5 w-5" />
                                    Order Confirmed Page
                                </CardTitle>
                                <CardDescription>
                                    Heading and message shown after a successful order.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="label_order_confirmed">Order Confirmed Heading</Label>
                                    <Input
                                        id="label_order_confirmed"
                                        value={data.label_order_confirmed}
                                        onChange={(e) => setData('label_order_confirmed', e.target.value)}
                                        placeholder="Order Confirmed!"
                                    />
                                    {errors.label_order_confirmed && (
                                        <p className="text-sm text-destructive">{errors.label_order_confirmed}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="label_order_confirmed_sub">Subtitle / Custom Message</Label>
                                    <Input
                                        id="label_order_confirmed_sub"
                                        value={data.label_order_confirmed_sub}
                                        onChange={(e) => setData('label_order_confirmed_sub', e.target.value)}
                                        placeholder="Thank you, {name}! Your order has been placed."
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Use <code className="rounded bg-muted px-1">{'{name}'}</code> to insert the customer's name.
                                    </p>
                                    {errors.label_order_confirmed_sub && (
                                        <p className="text-sm text-destructive">{errors.label_order_confirmed_sub}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="label_you_may_also_like">"You May Also Like" Heading</Label>
                                    <Input
                                        id="label_you_may_also_like"
                                        value={data.label_you_may_also_like}
                                        onChange={(e) => setData('label_you_may_also_like', e.target.value)}
                                        placeholder="You May Also Like"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Heading shown above related products on the order success page.
                                    </p>
                                    {errors.label_you_may_also_like && (
                                        <p className="text-sm text-destructive">{errors.label_you_may_also_like}</p>
                                    )}
                                </div>

                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div>
                                        <p className="text-sm font-medium">Show Related Products</p>
                                        <p className="text-xs text-muted-foreground">Display "You May Also Like" products below the order confirmation</p>
                                    </div>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={data.order_success_related_enabled}
                                        onClick={() => setData('order_success_related_enabled', !data.order_success_related_enabled)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${data.order_success_related_enabled ? 'bg-primary' : 'bg-input'}`}
                                    >
                                        <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${data.order_success_related_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Review Form Labels */}
                    <div className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Tag className="h-5 w-5" />
                                    Review Form Labels
                                </CardTitle>
                                <CardDescription>
                                    Text shown in the review submission form and reviews list on the product page.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="label_review_heading">Form Heading</Label>
                                        <Input
                                            id="label_review_heading"
                                            value={data.label_review_heading}
                                            onChange={(e) => setData('label_review_heading', e.target.value)}
                                            placeholder="Submit a Review"
                                        />
                                        {errors.label_review_heading && (
                                            <p className="text-sm text-destructive">{errors.label_review_heading}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="label_customer_reviews">Reviews List Heading</Label>
                                        <Input
                                            id="label_customer_reviews"
                                            value={data.label_customer_reviews}
                                            onChange={(e) => setData('label_customer_reviews', e.target.value)}
                                            placeholder="Customer Reviews"
                                        />
                                        {errors.label_customer_reviews && (
                                            <p className="text-sm text-destructive">{errors.label_customer_reviews}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="label_review_subheading">Form Subheading</Label>
                                        <Input
                                            id="label_review_subheading"
                                            value={data.label_review_subheading}
                                            onChange={(e) => setData('label_review_subheading', e.target.value)}
                                            placeholder="Share your thoughts about this product."
                                        />
                                        {errors.label_review_subheading && (
                                            <p className="text-sm text-destructive">{errors.label_review_subheading}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="label_review_note">Anyone Can Submit Note</Label>
                                        <Input
                                            id="label_review_note"
                                            value={data.label_review_note}
                                            onChange={(e) => setData('label_review_note', e.target.value)}
                                            placeholder="Anyone can submit a review!"
                                        />
                                        {errors.label_review_note && (
                                            <p className="text-sm text-destructive">{errors.label_review_note}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="label_review_name">Name Field Label</Label>
                                        <Input
                                            id="label_review_name"
                                            value={data.label_review_name}
                                            onChange={(e) => setData('label_review_name', e.target.value)}
                                            placeholder="Your Name"
                                        />
                                        {errors.label_review_name && (
                                            <p className="text-sm text-destructive">{errors.label_review_name}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="label_review_email">Email Field Label</Label>
                                        <Input
                                            id="label_review_email"
                                            value={data.label_review_email}
                                            onChange={(e) => setData('label_review_email', e.target.value)}
                                            placeholder="Email Address"
                                        />
                                        {errors.label_review_email && (
                                            <p className="text-sm text-destructive">{errors.label_review_email}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="label_review_rating">Rating Field Label</Label>
                                        <Input
                                            id="label_review_rating"
                                            value={data.label_review_rating}
                                            onChange={(e) => setData('label_review_rating', e.target.value)}
                                            placeholder="Rating"
                                        />
                                        {errors.label_review_rating && (
                                            <p className="text-sm text-destructive">{errors.label_review_rating}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="label_review_body">Review Body Field Label</Label>
                                        <Input
                                            id="label_review_body"
                                            value={data.label_review_body}
                                            onChange={(e) => setData('label_review_body', e.target.value)}
                                            placeholder="Your Review (Minimum 10 characters)"
                                        />
                                        {errors.label_review_body && (
                                            <p className="text-sm text-destructive">{errors.label_review_body}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="label_review_submit">Submit Button Text</Label>
                                        <Input
                                            id="label_review_submit"
                                            value={data.label_review_submit}
                                            onChange={(e) => setData('label_review_submit', e.target.value)}
                                            placeholder="Submit Review"
                                        />
                                        {errors.label_review_submit && (
                                            <p className="text-sm text-destructive">{errors.label_review_submit}</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Save Labels'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
