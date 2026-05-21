import { Head, useForm } from '@inertiajs/react';
import { Package, Search, Clock, CheckCircle2, Truck, XCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

type OrderItem = {
    id: number;
    product_name: string;
    variant_label: string | null;
    price: string;
    quantity: number;
    total: string;
};

type Order = {
    id: number;
    order_number: string;
    status: string;
    subtotal: string;
    shipping: string;
    discount: string;
    coupon_code: string | null;
    total: string;
    first_name: string;
    phone: string;
    address: string;
    delivery_zone: string;
    payment_method: string;
    created_at: string;
    items: OrderItem[];
    steadfast_consignment_id: string | null;
    steadfast_status: string | null;
    pathao_consignment_id: string | null;
    pathao_order_status: string | null;
    redx_tracking_id: string | null;
    redx_status: string | null;
    carrybee_consignment_id: string | null;
    carrybee_status: string | null;
};

interface Props {
    user: { id: number; name: string; email: string };
    orders: Order[];
    phone?: string;
}

function formatPrice(amount: string | number): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `৳${num.toFixed(0)}`;
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    pending: { label: 'Pending', icon: Clock, color: 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950 dark:border-yellow-800' },
    confirmed: { label: 'Confirmed', icon: CheckCircle2, color: 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-800' },
    processing: { label: 'Processing', icon: Package, color: 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-950 dark:border-indigo-800' },
    shipped: { label: 'Shipped', icon: Truck, color: 'text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-950 dark:border-purple-800' },
    delivered: { label: 'Delivered', icon: CheckCircle2, color: 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-800' },
    cancelled:  { label: 'Cancelled',  icon: XCircle,      color: 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800' },
    returned:  { label: 'Returned',   icon: AlertCircle,  color: 'text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950 dark:border-orange-800' },
    hold:      { label: 'Hold',       icon: Clock,        color: 'text-teal-600 bg-teal-50 border-teal-200 dark:text-teal-400 dark:bg-teal-950 dark:border-teal-800' },
    'pre-order': { label: 'Pre-Order', icon: Package,     color: 'text-pink-600 bg-pink-50 border-pink-200 dark:text-pink-400 dark:bg-pink-950 dark:border-pink-800' },
};

const COURIER_INFO: { name: string; idKey: keyof Order; statusKey: keyof Order; color: string }[] = [
    { name: 'Steadfast', idKey: 'steadfast_consignment_id', statusKey: 'steadfast_status', color: '#3b82f6' },
    { name: 'Pathao',    idKey: 'pathao_consignment_id',    statusKey: 'pathao_order_status', color: '#f59e0b' },
    { name: 'RedX',      idKey: 'redx_tracking_id',         statusKey: 'redx_status', color: '#ef4444' },
    { name: 'Carrybee',  idKey: 'carrybee_consignment_id',  statusKey: 'carrybee_status', color: '#22c55e' },
];

function CourierSection({ order }: { order: Order }) {
    const active = COURIER_INFO.filter((c) => order[c.idKey]);
    return (
        <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Courier Status</p>
            {active.length === 0 ? (
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2.5">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Not yet dispatched to a courier</span>
                </div>
            ) : (
                active.map((c) => {
                    const status = String(order[c.statusKey] ?? 'Pending');
                    return (
                        <div key={c.name} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white" style={{ background: c.color }}>
                                    <Truck className="h-3.5 w-3.5" />
                                </span>
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: c.color }}>{c.name}</p>
                                    <p className="text-[10px] text-muted-foreground font-mono">{String(order[c.idKey])}</p>
                                </div>
                            </div>
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize"
                                style={{ background: c.color + '15', borderColor: c.color + '50', color: c.color }}>
                                {status}
                            </span>
                        </div>
                    );
                })
            )}
        </div>
    );
}

const progressSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'] as const;

function getStatusInfo(status: string) {
    return statusConfig[status] ?? { label: status, icon: Clock, color: 'text-muted-foreground bg-muted border-border' };
}

function OrderProgress({ status }: { status: string }) {
    const isCancelled = status === 'cancelled';
    const isReturned = status === 'returned';
    const currentIndex = progressSteps.indexOf(status as typeof progressSteps[number]);

    if (isCancelled || isReturned) {
        const info = getStatusInfo(status);
        const Icon = info.icon;
        return (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm font-medium">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full border ${info.color}`}>
                    <Icon className="h-4 w-4" />
                </div>
                <span className={isCancelled ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}>
                    Order {info.label}
                </span>
            </div>
        );
    }

    return (
        <div className="py-2">
            <div className="hidden sm:flex items-center justify-between">
                {progressSteps.map((step, i) => {
                    const info = statusConfig[step];
                    const Icon = info.icon;
                    const isDone = i <= currentIndex;
                    const isActive = i === currentIndex;
                    return (
                        <div key={step} className="flex flex-1 items-center">
                            <div className="flex flex-col items-center gap-1.5 relative z-10">
                                <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300 ${isActive ? 'border-primary bg-primary text-primary-foreground scale-110 shadow-md shadow-primary/25' : isDone ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30 bg-background text-muted-foreground/40'}`}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <span className={`text-[10px] font-medium leading-tight ${isActive ? 'text-primary font-semibold' : isDone ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                                    {info.label}
                                </span>
                            </div>
                            {i < progressSteps.length - 1 && (
                                <div className="relative mx-1 h-0.5 flex-1 -mt-4 rounded-full bg-muted-foreground/15 overflow-hidden">
                                    <div className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-500" style={{ width: i < currentIndex ? '100%' : '0%' }} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="flex sm:hidden gap-3">
                <div className="flex flex-col items-center">
                    {progressSteps.map((step, i) => {
                        const info = statusConfig[step];
                        const Icon = info.icon;
                        const isDone = i <= currentIndex;
                        const isActive = i === currentIndex;
                        return (
                            <div key={step} className="flex flex-col items-center">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 ${isActive ? 'border-primary bg-primary text-primary-foreground scale-110 shadow-md shadow-primary/25' : isDone ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30 bg-background text-muted-foreground/40'}`}>
                                    <Icon className="h-3.5 w-3.5" />
                                </div>
                                {i < progressSteps.length - 1 && (
                                    <div className="relative w-0.5 h-6 bg-muted-foreground/15 overflow-hidden">
                                        <div className="absolute inset-x-0 top-0 w-full rounded-full bg-primary transition-all duration-500" style={{ height: i < currentIndex ? '100%' : '0%' }} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="flex flex-col justify-between py-0.5">
                    {progressSteps.map((step, i) => {
                        const info = statusConfig[step];
                        const isDone = i <= currentIndex;
                        const isActive = i === currentIndex;
                        return (
                            <span key={step} className={`text-xs leading-8 ${isActive ? 'text-primary font-semibold' : isDone ? 'text-foreground font-medium' : 'text-muted-foreground/50'}`}>
                                {info.label}
                            </span>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default function TrackOrders({ orders = [], phone: searchedPhone }: Props) {
    const { data, setData, post, processing, errors } = useForm({ phone: searchedPhone || '' });
    const [expandedOrder, setExpandedOrder] = useState<number | null>(orders.length === 1 ? orders[0]?.id : null);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/user/track-orders');
    }

    return (
        <>
            <Head title="Track Orders" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold">Track Orders</h1>
                    <p className="text-sm text-muted-foreground">Search orders by phone number</p>
                </div>

                {/* Search Form */}
                <Card className="p-4">
                    <form onSubmit={handleSubmit} className="flex gap-3">
                        <div className="flex-1">
                            <Input
                                type="tel"
                                value={data.phone}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                                    setData('phone', value);
                                }}
                                placeholder="Enter 11-digit phone number"
                                maxLength={11}
                                inputMode="numeric"
                                className="h-11"
                            />
                            {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone}</p>}
                        </div>
                        <Button type="submit" size="lg" disabled={processing || data.phone.length !== 11}>
                            <Search className="mr-2 h-4 w-4" />
                            {processing ? 'Searching...' : 'Track'}
                        </Button>
                    </form>
                </Card>

                {/* Results */}
                {searchedPhone && orders.length === 0 && (
                    <Card className="p-8 text-center">
                        <XCircle className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                        <p className="mb-1 text-lg font-medium">No orders found</p>
                        <p className="text-sm text-muted-foreground">No orders were found for this phone number.</p>
                    </Card>
                )}

                {orders.length > 0 && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">{orders.length} order{orders.length > 1 ? 's' : ''} found</p>

                        {orders.map((order) => {
                            const statusInfo = getStatusInfo(order.status);
                            const StatusIcon = statusInfo.icon;
                            const isExpanded = expandedOrder === order.id;

                            return (
                                <Card key={order.id} className="overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                                        className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${statusInfo.color}`}>
                                                <StatusIcon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold">{order.order_number}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(order.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                                                    {statusInfo.label}
                                                </span>
                                                <p className="mt-1 text-sm font-bold">{formatPrice(order.total)}</p>
                                            </div>
                                            {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="border-t px-4 pb-4">
                                            <div className="mt-4 mb-2 rounded-lg bg-muted/30 px-4 py-3">
                                                <OrderProgress status={order.status} />
                                            </div>

                                            <div className="mt-3">
                                                <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase">Items</p>
                                                <div className="space-y-2">
                                                    {order.items.map((item) => (
                                                        <div key={item.id} className="flex items-center justify-between text-sm">
                                                            <div>
                                                                <span>{item.product_name}</span>
                                                                {item.variant_label && <span className="text-xs text-muted-foreground"> ({item.variant_label})</span>}
                                                                <span className="text-muted-foreground"> × {item.quantity}</span>
                                                            </div>
                                                            <span className="font-medium">{formatPrice(item.total)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <Separator className="my-3" />

                                            <div className="space-y-1.5 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Subtotal</span>
                                                    <span>{formatPrice(order.subtotal)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Shipping</span>
                                                    <span>{parseFloat(order.shipping) === 0 ? 'Free' : formatPrice(order.shipping)}</span>
                                                </div>
                                                {order.coupon_code && parseFloat(order.discount) > 0 && (
                                                    <div className="flex justify-between text-green-600 dark:text-green-400">
                                                        <span>Discount ({order.coupon_code})</span>
                                                        <span>−{formatPrice(order.discount)}</span>
                                                    </div>
                                                )}
                                                <Separator />
                                                <div className="flex justify-between font-bold">
                                                    <span>Total</span>
                                                    <span className="text-primary">{formatPrice(order.total)}</span>
                                                </div>
                                            </div>

                                            <Separator className="my-3" />

                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Name</p>
                                                    <p className="font-medium">{order.first_name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Phone</p>
                                                    <p className="font-medium">{order.phone}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Delivery Zone</p>
                                                    <p className="font-medium">{order.delivery_zone}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Payment</p>
                                                    <p className="font-medium capitalize">{order.payment_method}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <p className="text-xs text-muted-foreground">Address</p>
                                                    <p className="font-medium">{order.address}</p>
                                                </div>
                                            </div>

                                            <Separator className="my-3" />

                                            <CourierSection order={order} />
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}

TrackOrders.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/user/dashboard',
        },
        {
            title: 'Track Orders',
            href: '/user/track-orders',
        },
    ],
};
