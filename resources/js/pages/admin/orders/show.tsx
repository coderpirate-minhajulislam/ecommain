import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, AlertTriangle, Ban, CheckCircle2, FileText, Loader2, Pencil, RefreshCw, Send, ShieldX, X, Save } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useFlashToast } from '@/hooks/use-flash-toast';

type OrderItem = {
    id: number;
    product_name: string;
    variant_label: string | null;
    price: string;
    quantity: number;
    total: string;
    product: {
        id: number;
        images?: { id: number; image_path: string; sort_order: number }[];
    } | null;
};

type Order = {
    id: number;
    order_number: string;
    status: string;
    payment_method: string;
    payment_phone: string | null;
    payment_amount: string | null;
    payment_screenshot: string | null;
    subtotal: string;
    shipping: string;
    discount: string;
    coupon_code: string | null;
    total: string;
    first_name: string;
    phone: string | null;
    email: string | null;
    district: string | null;
    address: string;
    pathao_consignment_id: string | null;
    pathao_order_status: string | null;
    steadfast_consignment_id: string | null;
    steadfast_tracking_code: string | null;
    steadfast_status: string | null;
    redx_tracking_id: string | null;
    redx_status: string | null;
    carrybee_consignment_id: string | null;
    carrybee_status: string | null;
    ip_address: string | null;
    delivery_zone: string | null;
    note: string | null;
    order_source: string | null;
    created_at: string;
    updated_at: string;
    user: { id: number; name: string; email: string } | null;
    items: OrderItem[];
};

type PathaoStore = {
    store_id: number;
    store_name: string;
    store_address: string;
    is_active: number;
};

type CourierEntry = {
    name: string;
    logo: string;
    total_parcel: number;
    success_parcel: number;
    cancelled_parcel: number;
    success_ratio: number;
};

type CourierReport = {
    id: string;
    name: string;
    details: string;
    created_at: string;
    courierLogo: string;
    courierName: string;
};

type CourierData = Record<string, CourierEntry>;

type Props = {
    order: Order;
    isBlocked: boolean;
    statuses: string[];
    paymentMethods: Record<string, string>;
    pathaoConnected: boolean;
    bdcourierConnected: boolean;
    orderratiocheckConnected: boolean;
    steadfastConnected: boolean;
    redxConnected: boolean;
    carrybeeConnected: boolean;
};

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    shipped: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    cancelled:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    hold:       'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    'pre-order':'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
};

function formatPrice(price: string | null): string {
    if (!price) return '';
    return `৳${parseFloat(price).toFixed(0)}`;
}

// ---------- Order Note Card ----------
function OrderNoteCard({ orderId, initialNote }: { orderId: number; initialNote: string | null }) {
    const [editing, setEditing] = useState(false);
    const [note, setNote] = useState(initialNote ?? '');
    const [saving, setSaving] = useState(false);

    function handleSave() {
        setSaving(true);
        router.patch(
            `/admin/orders/${orderId}/note`,
            { note },
            {
                preserveScroll: true,
                onSuccess: () => setEditing(false),
                onFinish: () => setSaving(false),
            },
        );
    }

    return (
        <div className="rounded-xl border border-sidebar-border/70 p-3 sm:p-4 dark:border-sidebar-border">
            <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold sm:text-sm">Order Note</h3>
                {!editing && (
                    <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground">
                        <Pencil className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
            {editing ? (
                <div className="space-y-2">
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                        className="w-full rounded-md border bg-transparent px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring sm:text-sm"
                        placeholder="Add a note..."
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                            Save
                        </button>
                        <button
                            onClick={() => { setNote(initialNote ?? ''); setEditing(false); }}
                            className="rounded-md border px-3 py-1 text-xs hover:bg-accent"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <p className="text-xs text-muted-foreground sm:text-sm">
                    {initialNote || <span className="italic">No note added</span>}
                </p>
            )}
        </div>
    );
}

// ---------- Courier Ratio Card ----------
function CourierRatioCard({ orderId, defaultPhone }: { orderId: number; defaultPhone: string }) {
    const [phone, setPhone] = useState(defaultPhone);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<CourierData | null>(null);
    const [reports, setReports] = useState<CourierReport[]>([]);
    const [error, setError] = useState('');
    const [checked, setChecked] = useState(false);
    const [checkedPhone, setCheckedPhone] = useState('');

    function handleCheck() {
        const trimmed = phone.trim();
        if (!trimmed) return;
        setLoading(true);
        setError('');
        setData(null);
        setReports([]);

        fetch(`/admin/orders/${orderId}/courier-check?phone=${encodeURIComponent(trimmed)}`, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then((r) => r.json())
            .then((res) => {
                if (res.error) {
                    setError(res.error);
                } else {
                    setData(res.data ?? null);
                    setReports(res.reports ?? []);
                    setChecked(true);
                    setCheckedPhone(trimmed);
                }
            })
            .catch(() => setError('Network error. Please try again.'))
            .finally(() => setLoading(false));
    }

    const couriers = data
        ? Object.entries(data).filter(([key]) => key !== 'summary')
        : [];
    const summary = data?.summary ?? null;

    function ratioColor(ratio: number) {
        if (ratio >= 80) return 'text-green-600 dark:text-green-400';
        if (ratio >= 60) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    }

    return (
        <div className="rounded-xl border border-sidebar-border/70 p-3 sm:p-4 dark:border-sidebar-border">
            <h3 className="mb-3 text-xs font-semibold sm:text-sm">Courier Order Ratio</h3>

            {/* Phone search */}
            <div className="mb-3 flex gap-2">
                <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                    placeholder="01xxxxxxxxx"
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                    onClick={handleCheck}
                    disabled={loading || !phone.trim()}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                    {loading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                        <RefreshCw className="h-3 w-3" />
                    )}
                    {checked ? 'Recheck' : 'Check'}
                </button>
            </div>

            {error && (
                <p className="rounded-md bg-destructive/10 px-2.5 py-2 text-xs text-destructive">{error}</p>
            )}

            {!checked && !loading && !error && (
                <p className="text-xs text-muted-foreground">Enter a phone number and click "Check" to fetch courier order ratio.</p>
            )}

            {checked && data && (
                <div className="space-y-3">
                    {checkedPhone !== defaultPhone && (
                        <p className="rounded-md bg-muted/60 px-2.5 py-1.5 text-xs text-muted-foreground">
                            Showing results for: <span className="font-medium text-foreground">{checkedPhone}</span>
                        </p>
                    )}
                    {/* Summary */}
                    {summary && (
                        <div className="rounded-lg bg-muted/50 px-3 py-2">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Overall Summary</p>
                            <div className="flex items-center justify-between">
                                <div className="text-xs">
                                    <span className="text-muted-foreground">Total: </span>
                                    <span className="font-medium">{summary.total_parcel}</span>
                                    <span className="mx-1.5 text-muted-foreground">·</span>
                                    <span className="text-green-600 dark:text-green-400">{summary.success_parcel} ✓</span>
                                    <span className="mx-1.5 text-muted-foreground">·</span>
                                    <span className="text-red-500">{summary.cancelled_parcel} ✗</span>
                                </div>
                                <span className={`text-sm font-bold ${ratioColor(summary.success_ratio)}`}>
                                    {summary.success_ratio}%
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Per-courier breakdown */}
                    <div className="space-y-2">
                        {couriers.map(([key, c]) => (
                            c.total_parcel > 0 && (
                                <div key={key} className="flex items-center gap-2">
                                    <img
                                        src={c.logo}
                                        alt={c.name}
                                        className="h-5 w-5 shrink-0 rounded object-contain"
                                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium truncate">{c.name}</span>
                                            <span className={`text-xs font-semibold ${ratioColor(c.success_ratio)}`}>
                                                {c.success_ratio}%
                                            </span>
                                        </div>
                                        <div className="mt-0.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${
                                                    c.success_ratio >= 80
                                                        ? 'bg-green-500'
                                                        : c.success_ratio >= 60
                                                        ? 'bg-yellow-500'
                                                        : 'bg-red-500'
                                                }`}
                                                style={{ width: `${Math.min(100, c.success_ratio)}%` }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                            {c.total_parcel} parcels · {c.success_parcel} success
                                        </p>
                                    </div>
                                </div>
                            )
                        ))}
                        {couriers.every(([, c]) => c.total_parcel === 0) && (
                            <p className="text-xs text-muted-foreground">No parcel history found for this phone number.</p>
                        )}
                    </div>

                    {/* Fraud reports */}
                    {reports.length > 0 && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 dark:border-red-800 dark:bg-red-950/30">
                            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-400">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                {reports.length} Fraud Report{reports.length > 1 ? 's' : ''}
                            </div>
                            {reports.map((r) => (
                                <div key={r.id} className="text-xs text-red-600 dark:text-red-400">
                                    <span className="font-medium">{r.courierName}:</span> {r.details}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ---------- Pathao Send Modal ----------
function PathaoModal({
    orderId,
    onClose,
    onSuccess,
}: {
    orderId: number;
    onClose: () => void;
    onSuccess: (consignmentId: string, orderStatus: string, deliveryFee: number | null) => void;
}) {
    const [stores, setStores] = useState<PathaoStore[]>([]);
    const [loadingStores, setLoadingStores] = useState(true);
    const [storeError, setStoreError] = useState('');

    const [storeId, setStoreId] = useState('');
    const [itemWeight, setItemWeight] = useState('0.5');
    const [deliveryType, setDeliveryType] = useState('48');
    const [itemType, setItemType] = useState('2');
    const [specialInstruction, setSpecialInstruction] = useState('');

    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState('');

    const dialogRef = useRef<HTMLDivElement>(null);

    // Load stores on mount
    useEffect(() => {
        fetch(`/admin/orders/${orderId}/pathao/stores`, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then((r) => r.json())
            .then((data) => {
                if (data.error) {
                    setStoreError(data.error);
                } else {
                    const active = (data.stores as PathaoStore[]).filter((s) => s.is_active === 1);
                    setStores(active);
                    if (active.length > 0) setStoreId(String(active[0].store_id));
                }
            })
            .catch(() => setStoreError('Failed to load stores. Check your Pathao connection.'))
            .finally(() => setLoadingStores(false));
    }, [orderId]);

    function handleSend() {
        if (!storeId) return;
        setSending(true);
        setSendError('');

        const csrfMeta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
        const csrfToken = csrfMeta?.content ?? '';

        fetch(`/admin/orders/${orderId}/pathao/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify({
                store_id: parseInt(storeId, 10),
                item_weight: parseFloat(itemWeight),
                delivery_type: parseInt(deliveryType, 10),
                item_type: parseInt(itemType, 10),
                special_instruction: specialInstruction.trim() || null,
            }),
        })
            .then((r) => r.json())
            .then((data) => {
                if (data.error) {
                    setSendError(data.error);
                } else {
                    onSuccess(data.consignment_id, data.order_status, data.delivery_fee);
                }
            })
            .catch(() => setSendError('Network error. Please try again.'))
            .finally(() => setSending(false));
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                ref={dialogRef}
                className="w-full max-w-md rounded-xl border bg-background shadow-xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="pathao-modal-title"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b px-5 py-4">
                    <div className="flex items-center gap-2">
                        <Send className="h-4 w-4 text-primary" />
                        <h2 id="pathao-modal-title" className="text-sm font-semibold">Send to Pathao Courier</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body - scrollable */}
                <div className="max-h-[70vh] overflow-y-auto">
                    <div className="space-y-4 px-5 py-4">
                        {/* Store selection */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">Pickup Store</label>
                            {loadingStores ? (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Loading stores…
                                </div>
                            ) : storeError ? (
                                <p className="text-xs text-destructive">{storeError}</p>
                            ) : stores.length === 0 ? (
                                <p className="text-xs text-muted-foreground">No active stores found. Create a store in your Pathao merchant portal.</p>
                            ) : (
                                <select
                                    value={storeId}
                                    onChange={(e) => setStoreId(e.target.value)}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    {stores.map((s) => (
                                        <option key={s.store_id} value={s.store_id}>
                                            {s.store_name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Item weight */}
                        <div className="space-y-1.5">
                            <label htmlFor="item_weight" className="text-xs font-medium">Parcel Weight (kg)</label>
                            <input
                                id="item_weight"
                                type="number"
                                min="0.5"
                                max="10"
                                step="0.5"
                                value={itemWeight}
                                onChange={(e) => setItemWeight(e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            <p className="text-xs text-muted-foreground">Min 0.5 kg, max 10 kg</p>
                        </div>

                        {/* Delivery type */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">Delivery Type</label>
                            <select
                                value={deliveryType}
                                onChange={(e) => setDeliveryType(e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="48">Normal Delivery</option>
                                <option value="12">On Demand Delivery</option>
                            </select>
                        </div>

                        {/* Item type */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">Item Type</label>
                            <select
                                value={itemType}
                                onChange={(e) => setItemType(e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="2">Parcel</option>
                                <option value="1">Document</option>
                            </select>
                        </div>

                        {/* Special instruction */}
                        <div className="space-y-1.5">
                            <label htmlFor="special_instruction" className="text-xs font-medium">
                                Special Instruction <span className="text-muted-foreground">(optional)</span>
                            </label>
                            <input
                                id="special_instruction"
                                type="text"
                                maxLength={255}
                                placeholder="e.g. Call before delivery"
                                value={specialInstruction}
                                onChange={(e) => setSpecialInstruction(e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        {sendError && (
                            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{sendError}</p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t px-5 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-input px-4 py-2 text-sm hover:bg-accent"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={sending || loadingStores || !storeId || !!storeError}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                        {sending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {sending ? 'Sending…' : 'Send to Courier'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ---------- Steadfast Send Modal ----------
function SteadfastModal({
    orderId,
    defaultCodAmount,
    onClose,
    onSuccess,
}: {
    orderId: number;
    defaultCodAmount: number;
    onClose: () => void;
    onSuccess: (consignmentId: string, trackingCode: string, status: string) => void;
}) {
    const [codAmount, setCodAmount] = useState(String(defaultCodAmount));
    const [weight, setWeight] = useState('');
    const [note, setNote] = useState('');
    const [deliveryType, setDeliveryType] = useState('0');
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState('');

    function handleSend() {
        setSending(true);
        setSendError('');

        const csrfMeta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
        const csrfToken = csrfMeta?.content ?? '';

        fetch(`/admin/orders/${orderId}/steadfast/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify({
                cod_amount: parseFloat(codAmount),
                note: note.trim() || null,
                delivery_type: parseInt(deliveryType, 10),
                weight: weight.trim() ? parseFloat(weight) : undefined,
            }),
        })
            .then((r) => r.json())
            .then((data) => {
                if (data.error) {
                    setSendError(data.error);
                } else {
                    onSuccess(
                        String(data.consignment_id ?? ''),
                        String(data.tracking_code ?? ''),
                        String(data.status ?? 'in_review'),
                    );
                }
            })
            .catch(() => setSendError('Network error. Please try again.'))
            .finally(() => setSending(false));
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="w-full max-w-sm rounded-xl border bg-background shadow-xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="steadfast-modal-title"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b px-5 py-4">
                    <div className="flex items-center gap-2">
                        <Send className="h-4 w-4 text-primary" />
                        <h2 id="steadfast-modal-title" className="text-sm font-semibold">Send to Steadfast Courier</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="space-y-4 px-5 py-4">
                    {/* COD Amount */}
                    <div className="space-y-1.5">
                        <label htmlFor="sf_cod_amount" className="text-xs font-medium">COD Amount (BDT)</label>
                        <input
                            id="sf_cod_amount"
                            type="number"
                            min="0"
                            step="1"
                            value={codAmount}
                            onChange={(e) => setCodAmount(e.target.value)}
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <p className="text-xs text-muted-foreground">Cash on delivery amount including all charges.</p>
                    </div>

                    {/* Weight */}
                    <div className="space-y-1.5">
                        <label htmlFor="sf_weight" className="text-xs font-medium">
                            Weight (kg) <span className="text-muted-foreground">(optional)</span>
                        </label>
                        <input
                            id="sf_weight"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="e.g. 0.5"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    {/* Delivery Type */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium">Delivery Type</label>
                        <select
                            value={deliveryType}
                            onChange={(e) => setDeliveryType(e.target.value)}
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <option value="0">Home Delivery</option>
                            <option value="1">Point Delivery / Steadfast Hub Pick Up</option>
                        </select>
                    </div>

                    {/* Note */}
                    <div className="space-y-1.5">
                        <label htmlFor="sf_note" className="text-xs font-medium">
                            Delivery Note <span className="text-muted-foreground">(optional)</span>
                        </label>
                        <input
                            id="sf_note"
                            type="text"
                            maxLength={255}
                            placeholder="e.g. Deliver before 3 PM"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    {sendError && (
                        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{sendError}</p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t px-5 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-input px-4 py-2 text-sm hover:bg-accent"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={sending}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {sending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {sending ? 'Sending…' : 'Send to Courier'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ---------- RedX Send Modal ----------
type RedxArea = { id: number; name: string; post_code: number; division_name: string; zone_id: number };
type RedxPickupStore = { id: number; name: string; address: string; area_name: string; area_id: number; phone: string };

function RedxModal({
    orderId,
    defaultCodAmount,
    onClose,
    onSuccess,
}: {
    orderId: number;
    defaultCodAmount: number;
    onClose: () => void;
    onSuccess: (trackingId: string) => void;
}) {
    const [pickupStores, setPickupStores] = useState<RedxPickupStore[]>([]);
    const [loadingStores, setLoadingStores] = useState(true);
    const [storeError, setStoreError] = useState('');

    const [areas, setAreas] = useState<RedxArea[]>([]);
    const [loadingAreas, setLoadingAreas] = useState(false);
    const [areaSearch, setAreaSearch] = useState('');
    const [areaError, setAreaError] = useState('');

    const [pickupStoreId, setPickupStoreId] = useState('');
    const [deliveryAreaId, setDeliveryAreaId] = useState('');
    const [deliveryArea, setDeliveryArea] = useState('');
    const [parcelWeight, setParcelWeight] = useState('500');
    const [cashCollection, setCashCollection] = useState(String(defaultCodAmount));
    const [instruction, setInstruction] = useState('');

    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState('');

    const dialogRef = useRef<HTMLDivElement>(null);

    // Load pickup stores on mount
    useEffect(() => {
        fetch(`/admin/orders/${orderId}/redx/pickup-stores`, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then((r) => r.json())
            .then((data) => {
                if (data.error) {
                    setStoreError(data.error);
                } else {
                    const stores = data.pickup_stores as RedxPickupStore[];
                    setPickupStores(stores);
                    if (stores.length > 0) setPickupStoreId(String(stores[0].id));
                }
            })
            .catch(() => setStoreError('Failed to load pickup stores.'))
            .finally(() => setLoadingStores(false));
    }, [orderId]);

    function searchAreas() {
        if (!areaSearch.trim()) return;
        setLoadingAreas(true);
        setAreas([]);
        setDeliveryAreaId('');
        setDeliveryArea('');
        setAreaError('');
        const param = /^\d+$/.test(areaSearch.trim())
            ? `post_code=${areaSearch.trim()}`
            : `district_name=${encodeURIComponent(areaSearch.trim())}`;
        fetch(`/admin/orders/${orderId}/redx/areas?${param}`, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then((r) => r.json())
            .then((data) => {
                if (data.error) setAreaError(data.error);
                else {
                    const list = data.areas as RedxArea[];
                    setAreas(list);
                    if (list.length === 0) setAreaError('No areas found for that search.');
                }
            })
            .catch(() => setAreaError('Failed to search areas.'))
            .finally(() => setLoadingAreas(false));
    }

    function handleSend() {
        if (!pickupStoreId || !deliveryAreaId || !deliveryArea) return;
        setSending(true);
        setSendError('');
        const csrfMeta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
        fetch(`/admin/orders/${orderId}/redx/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfMeta?.content ?? '',
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify({
                pickup_store_id: parseInt(pickupStoreId, 10),
                delivery_area_id: parseInt(deliveryAreaId, 10),
                delivery_area: deliveryArea,
                parcel_weight: parseInt(parcelWeight, 10),
                cash_collection: parseFloat(cashCollection),
                instruction: instruction.trim() || null,
            }),
        })
            .then((r) => r.json())
            .then((data) => {
                if (data.error) setSendError(data.error);
                else onSuccess(data.tracking_id);
            })
            .catch(() => setSendError('Network error. Please try again.'))
            .finally(() => setSending(false));
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                ref={dialogRef}
                className="w-full max-w-md rounded-xl border bg-background shadow-xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="redx-modal-title"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b px-5 py-4">
                    <div className="flex items-center gap-2">
                        <Send className="h-4 w-4 text-primary" />
                        <h2 id="redx-modal-title" className="text-sm font-semibold">Send to RedX Courier</h2>
                    </div>
                    <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Close">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="max-h-[70vh] overflow-y-auto">
                    <div className="space-y-4 px-5 py-4">
                        {/* Pickup Store */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">Pickup Store</label>
                            {loadingStores ? (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading stores…
                                </div>
                            ) : storeError ? (
                                <p className="text-xs text-destructive">{storeError}</p>
                            ) : pickupStores.length === 0 ? (
                                <p className="text-xs text-muted-foreground">No pickup stores found. Create one in your RedX merchant portal.</p>
                            ) : (
                                <select
                                    value={pickupStoreId}
                                    onChange={(e) => setPickupStoreId(e.target.value)}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    {pickupStores.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name} — {s.area_name}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Delivery Area Search */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">Delivery Area</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="District name or postal code"
                                    value={areaSearch}
                                    onChange={(e) => setAreaSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && searchAreas()}
                                    className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                                <button
                                    onClick={searchAreas}
                                    disabled={loadingAreas || !areaSearch.trim()}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
                                >
                                    {loadingAreas ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Search'}
                                </button>
                            </div>
                            {areaError && <p className="text-xs text-destructive">{areaError}</p>}
                            {areas.length > 0 && (
                                <select
                                    value={deliveryAreaId}
                                    onChange={(e) => {
                                        const selected = areas.find((a) => String(a.id) === e.target.value);
                                        setDeliveryAreaId(e.target.value);
                                        setDeliveryArea(selected?.name ?? '');
                                    }}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="">-- Select Area --</option>
                                    {areas.map((a) => (
                                        <option key={a.id} value={a.id}>{a.name} — {a.division_name} ({a.post_code})</option>
                                    ))}
                                </select>
                            )}
                            {deliveryArea && (
                                <p className="text-xs text-green-600 font-medium">Selected: {deliveryArea}</p>
                            )}
                        </div>

                        {/* Parcel Weight */}
                        <div className="space-y-1.5">
                            <label htmlFor="redx_weight" className="text-xs font-medium">Parcel Weight (grams)</label>
                            <input
                                id="redx_weight"
                                type="number"
                                min="1"
                                step="50"
                                value={parcelWeight}
                                onChange={(e) => setParcelWeight(e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            <p className="text-xs text-muted-foreground">Weight in grams (e.g., 500 = 0.5 kg)</p>
                        </div>

                        {/* Cash Collection */}
                        <div className="space-y-1.5">
                            <label htmlFor="redx_cash" className="text-xs font-medium">Cash Collection Amount</label>
                            <input
                                id="redx_cash"
                                type="number"
                                min="0"
                                step="1"
                                value={cashCollection}
                                onChange={(e) => setCashCollection(e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        {/* Instruction */}
                        <div className="space-y-1.5">
                            <label htmlFor="redx_instruction" className="text-xs font-medium">
                                Instruction <span className="text-muted-foreground">(optional)</span>
                            </label>
                            <input
                                id="redx_instruction"
                                type="text"
                                maxLength={500}
                                placeholder="e.g. Call before delivery"
                                value={instruction}
                                onChange={(e) => setInstruction(e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        {sendError && (
                            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{sendError}</p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t px-5 py-4">
                    <button onClick={onClose} className="rounded-lg border border-input px-4 py-2 text-sm hover:bg-accent">
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={sending || loadingStores || !pickupStoreId || !deliveryAreaId || !!storeError}
                        className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
                    >
                        {sending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {sending ? 'Sending…' : 'Send to Courier'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ---------- Carrybee Send Modal ----------
type CarrybeeStore = {
    id: string;
    name: string;
    address: string;
};

function CarrybeeModal({
    orderId,
    defaultCodAmount,
    onClose,
    onSuccess,
}: {
    orderId: number;
    defaultCodAmount: number;
    onClose: () => void;
    onSuccess: (consignmentId: string) => void;
}) {
    const [stores, setStores] = useState<CarrybeeStore[]>([]);
    const [loadingStores, setLoadingStores] = useState(true);
    const [storeError, setStoreError] = useState('');

    const [storeId, setStoreId] = useState('');
    const [deliveryType, setDeliveryType] = useState('1');
    const [productType, setProductType] = useState('1');
    const [itemWeight, setItemWeight] = useState('500');
    const [itemQuantity, setItemQuantity] = useState('1');
    const [collectableAmount, setCollectableAmount] = useState(String(Math.round(defaultCodAmount)));
    const [specialInstruction, setSpecialInstruction] = useState('');

    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState('');

    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch(`/admin/orders/${orderId}/carrybee/stores`, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then((r) => r.json())
            .then((data) => {
                if (data.error) {
                    setStoreError(data.error);
                } else {
                    const activeStores = (data.stores as CarrybeeStore[]);
                    setStores(activeStores);
                    if (activeStores.length > 0) setStoreId(activeStores[0].id);
                }
            })
            .catch(() => setStoreError('Failed to load stores.'))
            .finally(() => setLoadingStores(false));
    }, [orderId]);

    function handleSend() {
        if (!storeId) return;
        setSending(true);
        setSendError('');
        const csrfMeta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
        fetch(`/admin/orders/${orderId}/carrybee/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfMeta?.content ?? '',
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify({
                store_id: storeId,
                delivery_type: parseInt(deliveryType, 10),
                product_type: parseInt(productType, 10),
                item_weight: parseInt(itemWeight, 10),
                item_quantity: parseInt(itemQuantity, 10),
                collectable_amount: parseInt(collectableAmount, 10),
                special_instruction: specialInstruction.trim() || null,
            }),
        })
            .then(async (r) => {
                const data = await r.json();
                if (!r.ok || data.error) {
                    setSendError(data.error || data.message || 'Failed to send order.');
                } else {
                    onSuccess(data.consignment_id);
                }
            })
            .catch(() => setSendError('Network error. Please try again.'))
            .finally(() => setSending(false));
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                ref={dialogRef}
                className="w-full max-w-md rounded-xl border bg-background shadow-xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="carrybee-modal-title"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b px-5 py-4">
                    <div className="flex items-center gap-2">
                        <Send className="h-4 w-4 text-primary" />
                        <h2 id="carrybee-modal-title" className="text-sm font-semibold">Send to Carrybee Courier</h2>
                    </div>
                    <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Close">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="max-h-[70vh] overflow-y-auto">
                    <div className="space-y-4 px-5 py-4">
                        {/* Store */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">Pickup Store</label>
                            {loadingStores ? (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading stores…
                                </div>
                            ) : storeError ? (
                                <p className="text-xs text-destructive">{storeError}</p>
                            ) : stores.length === 0 ? (
                                <p className="text-xs text-muted-foreground">No stores found. Create a store in your Carrybee merchant portal.</p>
                            ) : (
                                <select
                                    value={storeId}
                                    onChange={(e) => setStoreId(e.target.value)}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    {stores.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Delivery Type */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">Delivery Type</label>
                            <select
                                value={deliveryType}
                                onChange={(e) => setDeliveryType(e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="1">Normal Delivery</option>
                                <option value="2">Express Delivery</option>
                            </select>
                        </div>

                        {/* Product Type */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">Product Type</label>
                            <select
                                value={productType}
                                onChange={(e) => setProductType(e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="1">Parcel</option>
                                <option value="2">Book</option>
                                <option value="3">Document</option>
                            </select>
                        </div>

                        {/* Item weight */}
                        <div className="space-y-1.5">
                            <label htmlFor="cb_weight" className="text-xs font-medium">Item Weight (grams)</label>
                            <input
                                id="cb_weight"
                                type="number"
                                min="1"
                                max="25000"
                                step="50"
                                value={itemWeight}
                                onChange={(e) => setItemWeight(e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            <p className="text-xs text-muted-foreground">Weight in grams (e.g., 500 = 0.5 kg)</p>
                        </div>

                        {/* Quantity */}
                        <div className="space-y-1.5">
                            <label htmlFor="cb_qty" className="text-xs font-medium">Item Quantity</label>
                            <input
                                id="cb_qty"
                                type="number"
                                min="1"
                                max="200"
                                step="1"
                                value={itemQuantity}
                                onChange={(e) => setItemQuantity(e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        {/* Collectable amount */}
                        <div className="space-y-1.5">
                            <label htmlFor="cb_cod" className="text-xs font-medium">Collectable Amount (COD)</label>
                            <input
                                id="cb_cod"
                                type="number"
                                min="0"
                                max="100000"
                                step="1"
                                value={collectableAmount}
                                onChange={(e) => setCollectableAmount(e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        {/* Special instruction */}
                        <div className="space-y-1.5">
                            <label htmlFor="cb_instruction" className="text-xs font-medium">
                                Special Instruction <span className="text-muted-foreground">(optional)</span>
                            </label>
                            <input
                                id="cb_instruction"
                                type="text"
                                maxLength={255}
                                placeholder="e.g. Call before delivery"
                                value={specialInstruction}
                                onChange={(e) => setSpecialInstruction(e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        {sendError && (
                            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{sendError}</p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t px-5 py-4">
                    <button onClick={onClose} className="rounded-lg border border-input px-4 py-2 text-sm hover:bg-accent">
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={sending || loadingStores || !storeId || !!storeError}
                        className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
                    >
                        {sending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {sending ? 'Sending…' : 'Send to Courier'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ---------- Main Page ----------
export default function OrderShow() {
    const { order, isBlocked, statuses, paymentMethods, pathaoConnected, bdcourierConnected, orderratiocheckConnected, steadfastConnected, redxConnected, carrybeeConnected } = usePage<Props>().props;
    const [status, setStatus] = useState(order.status);
    const [saving, setSaving] = useState(false);
    const [blocked, setBlocked] = useState(isBlocked);
    const [blockConfirm, setBlockConfirm] = useState(false);
    const [blocking, setBlocking] = useState(false);

    const [showPathaoModal, setShowPathaoModal] = useState(false);
    const [consignmentId, setConsignmentId] = useState(order.pathao_consignment_id ?? '');
    const [pathaoStatus, setPathaoStatus] = useState(order.pathao_order_status ?? '');
    const [pathaoSuccess, setPathaoSuccess] = useState(false);

    const [showSteadfastModal, setShowSteadfastModal] = useState(false);
    const [sfConsignmentId, setSfConsignmentId] = useState(order.steadfast_consignment_id ?? '');
    const [sfTrackingCode, setSfTrackingCode] = useState(order.steadfast_tracking_code ?? '');
    const [sfStatus, setSfStatus] = useState(order.steadfast_status ?? '');
    const [sfSuccess, setSfSuccess] = useState(false);

    const [showRedxModal, setShowRedxModal] = useState(false);
    const [redxTrackingId, setRedxTrackingId] = useState(order.redx_tracking_id ?? '');
    const [redxSuccess, setRedxSuccess] = useState(false);

    const [showCarrybeeModal, setShowCarrybeeModal] = useState(false);
    const [carrybeeConsignmentId, setCarrybeeConsignmentId] = useState(order.carrybee_consignment_id ?? '');
    const [carrybeeSuccess, setCarrybeeSuccess] = useState(false);

    const [redxStatus, setRedxStatus] = useState(order.redx_status ?? '');
    const [carrybeeStatus, setCarrybeeStatus] = useState(order.carrybee_status ?? '');
    const [syncing, setSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useFlashToast();

    function handleBlockCustomer() {
        setBlocking(true);
        router.post('/admin/blocked-ips/from-order', {
            ip_address: order.ip_address ?? '',
            phone: order.phone ?? '',
            reason: 'Blocked from order #' + order.order_number,
            order_id: order.id,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setBlocked(true);
                setBlockConfirm(false);
            },
            onFinish: () => setBlocking(false),
        });
    }

    function handleStatusChange(newStatus: string) {
        setStatus(newStatus);
        setSaving(true);
        router.patch(`/admin/orders/${order.id}/status`, { status: newStatus }, {
            preserveScroll: true,
            onFinish: () => setSaving(false),
        });
    }

    function handlePathaoSuccess(cid: string, orderStatus: string, _deliveryFee: number | null) {
        setConsignmentId(cid);
        setPathaoStatus(orderStatus);
        setPathaoSuccess(true);
        setShowPathaoModal(false);
    }

    function handleSteadfastSuccess(cid: string, trackingCode: string, status: string) {
        setSfConsignmentId(cid);
        setSfTrackingCode(trackingCode);
        setSfStatus(status);
        setSfSuccess(true);
        setShowSteadfastModal(false);
    }

    function handleRedxSuccess(trackingId: string) {
        setRedxTrackingId(trackingId);
        setRedxSuccess(true);
        setShowRedxModal(false);
    }

    function handleCarrybeeSuccess(consignmentId: string) {
        setCarrybeeConsignmentId(consignmentId);
        setCarrybeeSuccess(true);
        setShowCarrybeeModal(false);
    }

    function handleSyncCourierStatus() {
        setSyncing(true);
        setSyncMessage(null);
        fetch(`/admin/orders/${order.id}/courier/sync-status`, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
            },
        })
            .then((r) => r.json())
            .then((res) => {
                if (res.error) {
                    setSyncMessage({ type: 'error', text: res.error });
                    return;
                }
                if (res.pathao_order_status) setPathaoStatus(res.pathao_order_status);
                if (res.steadfast_status) setSfStatus(res.steadfast_status);
                if (res.redx_status) setRedxStatus(res.redx_status);
                if (res.carrybee_status) setCarrybeeStatus(res.carrybee_status);
                if (res.order_status) setStatus(res.order_status);
                setSyncMessage({
                    type: 'success',
                    text: res.status_updated_to_delivered
                        ? 'Courier status synced — order marked as Delivered!'
                        : 'Courier status synced successfully.',
                });
            })
            .catch(() => setSyncMessage({ type: 'error', text: 'Network error. Please try again.' }))
            .finally(() => setSyncing(false));
    }

    const alreadySent = Boolean(consignmentId);

    return (
        <>
            <Head title={`Order ${order.order_number}`} />
            {showPathaoModal && (
                <PathaoModal
                    orderId={order.id}
                    onClose={() => setShowPathaoModal(false)}
                    onSuccess={handlePathaoSuccess}
                />
            )}
            {showSteadfastModal && (
                <SteadfastModal
                    orderId={order.id}
                    defaultCodAmount={parseFloat(order.total)}
                    onClose={() => setShowSteadfastModal(false)}
                    onSuccess={handleSteadfastSuccess}
                />
            )}
            {showRedxModal && (
                <RedxModal
                    orderId={order.id}
                    defaultCodAmount={parseFloat(order.total)}
                    onClose={() => setShowRedxModal(false)}
                    onSuccess={handleRedxSuccess}
                />
            )}
            {showCarrybeeModal && (
                <CarrybeeModal
                    orderId={order.id}
                    defaultCodAmount={parseFloat(order.total)}
                    onClose={() => setShowCarrybeeModal(false)}
                    onSuccess={handleCarrybeeSuccess}
                />
            )}
            <div className="flex h-full flex-1 flex-col gap-4 p-3 sm:gap-6 sm:p-4">
                {/* Header Section */}
                <div className="space-y-3 sm:space-y-0">
                    {/* Top row: Back button and Order number */}
                    <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                        <a
                            href="/admin/orders"
                            className="inline-flex shrink-0 items-center rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </a>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{order.order_number}</h2>
                            <p className="truncate text-xs text-muted-foreground sm:text-sm">
                                Placed on {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}{' '}
                                at {new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </p>
                        </div>
                        <span className={`ml-auto inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize sm:px-3 sm:py-1 sm:text-sm ${statusColors[order.status] || ''}`}>
                            {order.status}
                        </span>
                    </div>

                    {/* Bottom row: Action buttons (stacks on mobile) */}
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                        <Link
                            href={`/admin/orders/${order.id}/edit`}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium hover:bg-accent sm:flex-none sm:text-sm"
                        >
                            <Pencil className="h-4 w-4" />
                            <span>Edit</span>
                        </Link>
                        <a
                            href={`/admin/orders/${order.id}/invoice`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 sm:flex-none sm:text-sm"
                        >
                            <FileText className="h-4 w-4" />
                            <span>Invoice</span>
                        </a>
                        {pathaoConnected && (
                            <button
                                onClick={() => setShowPathaoModal(true)}
                                disabled={alreadySent}
                                title={alreadySent ? `Sent: ${consignmentId}` : 'Send to Pathao Courier'}
                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60 sm:flex-none sm:text-sm"
                            >
                                {alreadySent ? (
                                    <>
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span>Pathao Sent</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4" />
                                        <span>Send (Pathao)</span>
                                    </>
                                )}
                            </button>
                        )}
                        {steadfastConnected && (
                            <button
                                onClick={() => setShowSteadfastModal(true)}
                                disabled={Boolean(sfConsignmentId)}
                                title={sfConsignmentId ? `Sent: ${sfConsignmentId}` : 'Send to Steadfast Courier'}
                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60 sm:flex-none sm:text-sm"
                            >
                                {sfConsignmentId ? (
                                    <>
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span>Steadfast Sent</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4" />
                                        <span>Send (Steadfast)</span>
                                    </>
                                )}
                            </button>
                        )}
                        {redxConnected && (
                            <button
                                onClick={() => setShowRedxModal(true)}
                                disabled={Boolean(redxTrackingId)}
                                title={redxTrackingId ? `Sent: ${redxTrackingId}` : 'Send to RedX Courier'}
                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-60 sm:flex-none sm:text-sm"
                            >
                                {redxTrackingId ? (
                                    <>
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span>RedX Sent</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4" />
                                        <span>Send (RedX)</span>
                                    </>
                                )}
                            </button>
                        )}
                        {carrybeeConnected && (
                            <button
                                onClick={() => setShowCarrybeeModal(true)}
                                disabled={Boolean(carrybeeConsignmentId)}
                                title={carrybeeConsignmentId ? `Sent: ${carrybeeConsignmentId}` : 'Send to Carrybee Courier'}
                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-60 sm:flex-none sm:text-sm"
                            >
                                {carrybeeConsignmentId ? (
                                    <>
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span>Carrybee Sent</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4" />
                                        <span>Send (Carrybee)</span>
                                    </>
                                )}
                            </button>
                        )}
                        {(consignmentId || sfConsignmentId || redxTrackingId || carrybeeConsignmentId) && (
                            <button
                                onClick={handleSyncCourierStatus}
                                disabled={syncing}
                                title="Fetch latest courier status and auto-mark delivered if confirmed"
                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium hover:bg-accent disabled:opacity-50 sm:flex-none sm:text-sm"
                            >
                                {syncing ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="h-4 w-4" />
                                )}
                                <span>Sync Courier</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Pathao success banner */}
                {pathaoSuccess && consignmentId && (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>Order sent to Pathao successfully! Consignment ID: <strong>{consignmentId}</strong></span>
                    </div>
                )}

                {/* Steadfast success banner */}
                {sfSuccess && sfConsignmentId && (
                    <div className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-300">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>Order sent to Steadfast successfully! Consignment ID: <strong>{sfConsignmentId}</strong>{sfTrackingCode && <> | Tracking: <strong>{sfTrackingCode}</strong></>}</span>
                    </div>
                )}

                {/* RedX success banner */}
                {redxSuccess && redxTrackingId && (
                    <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>Order sent to RedX successfully! Tracking ID: <strong>{redxTrackingId}</strong></span>
                    </div>
                )}

                {/* Courier sync message */}
                {syncMessage && (
                    <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
                        syncMessage.type === 'success'
                            ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300'
                            : 'border-destructive/30 bg-destructive/5 text-destructive'
                    }`}>
                        {syncMessage.type === 'success' ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                        ) : (
                            <X className="h-4 w-4 shrink-0" />
                        )}
                        <span>{syncMessage.text}</span>
                        <button onClick={() => setSyncMessage(null)} className="ml-auto opacity-60 hover:opacity-100">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )}

                {/* Carrybee success banner */}
                {carrybeeSuccess && (
                    <div className="flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800 dark:border-teal-800 dark:bg-teal-950/30 dark:text-teal-300">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>Order sent to Carrybee successfully!{carrybeeConsignmentId && <> Consignment ID: <strong>{carrybeeConsignmentId}</strong></>}</span>
                    </div>
                )}

                <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
                    {/* Order items */}
                    <div className="md:col-span-2">
                        <div className="overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                            <div className="border-b bg-muted/50 px-3 py-3 sm:px-4">
                                <h3 className="text-xs font-semibold sm:text-sm">Order Items</h3>
                            </div>
                            {/* Mobile: Card layout, Desktop: Table layout */}
                            <div className="sm:hidden">
                                {order.items.map((item) => (
                                    <div key={item.id} className="space-y-2 border-b px-3 py-3 last:border-b-0">
                                        <div className="flex items-start gap-2">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/30">
                                                {item.product?.images?.[0] ? (
                                                    <img src={`/${item.product.images[0].image_path}`} alt={item.product_name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <span className="text-lg">📦</span>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm font-medium">{item.product_name}</div>
                                                {item.variant_label && (
                                                    <div className="text-xs text-muted-foreground">{item.variant_label}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Qty: {item.quantity}</span>
                                            <span className="text-muted-foreground">{formatPrice(item.price)}</span>
                                        </div>
                                        <div className="flex items-center justify-between border-t pt-2">
                                            <span className="text-xs text-muted-foreground">Total</span>
                                            <span className="font-medium">{formatPrice(item.total)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Table - hidden on mobile */}
                            <table className="hidden w-full text-sm sm:table">
                                <thead className="sticky top-0 border-b bg-muted/30">
                                    <tr>
                                        <th className="whitespace-nowrap px-4 py-2.5 text-left font-medium">Product</th>
                                        <th className="whitespace-nowrap px-4 py-2.5 text-left font-medium">Price</th>
                                        <th className="whitespace-nowrap px-4 py-2.5 text-left font-medium">Qty</th>
                                        <th className="sticky right-0 whitespace-nowrap bg-muted/30 px-4 py-2.5 text-right font-medium">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {order.items.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/30">
                                                        {item.product?.images?.[0] ? (
                                                            <img src={`/${item.product.images[0].image_path}`} alt={item.product_name} className="h-full w-full object-cover" />
                                                        ) : (
                                                            <span className="text-lg">📦</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{item.product_name}</div>
                                                        {item.variant_label && (
                                                            <div className="text-xs text-muted-foreground">{item.variant_label}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">{formatPrice(item.price)}</td>
                                            <td className="whitespace-nowrap px-4 py-3">{item.quantity}</td>
                                            <td className="sticky right-0 whitespace-nowrap border-l bg-background px-4 py-3 text-right font-medium">{formatPrice(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Totals */}
                            <div className="border-t bg-muted/20 px-3 py-3 sm:px-4">
                                <div className="space-y-1 text-xs sm:text-sm">
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
                                    <div className="mt-2 flex justify-between border-t pt-2 text-base font-bold">
                                        <span>Total</span>
                                        <span className="text-primary">{formatPrice(order.total)}</span>
                                    </div>
                                    {order.payment_amount && parseFloat(order.payment_amount) > 0 && (
                                        <>
                                            <div className="flex justify-between text-green-600 dark:text-green-400">
                                                <span>Advance Paid</span>
                                                <span>−{formatPrice(order.payment_amount)}</span>
                                            </div>
                                            <div className="mt-1 flex justify-between border-t pt-1 text-base font-bold">
                                                <span>Due</span>
                                                <span className={parseFloat(order.total) - parseFloat(order.payment_amount) <= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}>
                                                    {parseFloat(order.total) - parseFloat(order.payment_amount) <= 0 ? '৳0' : formatPrice(String(parseFloat(order.total) - parseFloat(order.payment_amount)))}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Status */}
                        <div className="rounded-xl border border-sidebar-border/70 p-3 sm:p-4 dark:border-sidebar-border">
                            <h3 className="mb-3 text-xs font-semibold sm:text-sm">Update Status</h3>
                            <select
                                value={status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                disabled={saving}
                                className="w-full rounded-lg border border-input bg-background px-2.5 py-2 text-xs sm:px-3 sm:text-sm capitalize focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                {statuses.map((s) => (
                                    <option key={s} value={s} className="capitalize">
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Pathao Courier info */}
                        {(consignmentId || pathaoConnected) && (
                            <div className="rounded-xl border border-sidebar-border/70 p-3 sm:p-4 dark:border-sidebar-border">
                                <h3 className="mb-3 text-xs font-semibold sm:text-sm">Pathao Courier</h3>
                                {consignmentId ? (
                                    <div className="space-y-2 text-xs sm:text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Consignment ID: </span>
                                            <span className="font-mono font-medium">{consignmentId}</span>
                                        </div>
                                        {pathaoStatus && (
                                            <div>
                                                <span className="text-muted-foreground">Status: </span>
                                                <span className="font-medium">{pathaoStatus}</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground">Not sent yet. Use the "Send to Courier" button above.</p>
                                )}
                            </div>
                        )}

                        {/* Steadfast Courier info */}
                        {(sfConsignmentId || steadfastConnected) && (
                            <div className="rounded-xl border border-sidebar-border/70 p-3 sm:p-4 dark:border-sidebar-border">
                                <h3 className="mb-3 text-xs font-semibold sm:text-sm">Steadfast Courier</h3>
                                {sfConsignmentId ? (
                                    <div className="space-y-2 text-xs sm:text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Consignment ID: </span>
                                            <span className="font-mono font-medium">{sfConsignmentId}</span>
                                        </div>
                                        {sfTrackingCode && (
                                            <div>
                                                <span className="text-muted-foreground">Tracking Code: </span>
                                                <span className="font-mono font-medium">{sfTrackingCode}</span>
                                            </div>
                                        )}
                                        {sfStatus && (
                                            <div>
                                                <span className="text-muted-foreground">Status: </span>
                                                <span className="font-medium capitalize">{sfStatus.replace(/_/g, ' ')}</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground">Not sent yet. Use the "Send (Steadfast)" button above.</p>
                                )}
                            </div>
                        )}

                        {/* RedX Courier info */}
                        {(redxTrackingId || redxConnected) && (
                            <div className="rounded-xl border border-sidebar-border/70 p-3 sm:p-4 dark:border-sidebar-border">
                                <h3 className="mb-3 text-xs font-semibold sm:text-sm">RedX Courier</h3>
                                {redxTrackingId ? (
                                    <div className="space-y-2 text-xs sm:text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Tracking ID: </span>
                                            <span className="font-mono font-medium">{redxTrackingId}</span>
                                        </div>
                                        {redxStatus && (
                                            <div>
                                                <span className="text-muted-foreground">Status: </span>
                                                <span className="font-medium capitalize">{redxStatus.replace(/-/g, ' ')}</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground">Not sent yet. Use the "Send (RedX)" button above.</p>
                                )}
                            </div>
                        )}

                        {/* Carrybee Courier info */}
                        {(carrybeeConsignmentId || carrybeeConnected) && (
                            <div className="rounded-xl border border-sidebar-border/70 p-3 sm:p-4 dark:border-sidebar-border">
                                <h3 className="mb-3 text-xs font-semibold sm:text-sm">Carrybee Courier</h3>
                                {carrybeeConsignmentId ? (
                                    <div className="space-y-2 text-xs sm:text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Consignment ID: </span>
                                            <span className="font-mono font-medium">{carrybeeConsignmentId}</span>
                                        </div>
                                        {carrybeeStatus && (
                                            <div>
                                                <span className="text-muted-foreground">Status: </span>
                                                <span className="font-medium capitalize">{carrybeeStatus}</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground">Not sent yet. Use the "Send (Carrybee)" button above.</p>
                                )}
                            </div>
                        )}

                        {/* Customer */}
                        <div className="rounded-xl border border-sidebar-border/70 p-3 sm:p-4 dark:border-sidebar-border">
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="text-xs font-semibold sm:text-sm">Customer</h3>
                                {blocked && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                                        <ShieldX className="h-3 w-3" /> Blocked
                                    </span>
                                )}
                            </div>
                            <div className="space-y-2 text-xs sm:text-sm">
                                <div>
                                    <span className="text-muted-foreground">Name: </span>
                                    <span className="font-medium">{order.first_name}</span>
                                </div>
                                {order.phone && (
                                    <div>
                                        <span className="text-muted-foreground">Phone: </span>
                                        <span className="font-medium">{order.phone}</span>
                                    </div>
                                )}
                                {order.email && (
                                    <div>
                                        <span className="text-muted-foreground">Email: </span>
                                        <span className="font-medium">{order.email}</span>
                                    </div>
                                )}
                                {order.ip_address && (
                                    <div>
                                        <span className="text-muted-foreground">IP: </span>
                                        <span className="font-mono font-medium">{order.ip_address}</span>
                                    </div>
                                )}
                                {order.user && (
                                    <div>
                                        <span className="text-muted-foreground">Account: </span>
                                        <span className="font-medium">{order.user.name}</span>
                                    </div>
                                )}
                                {order.order_source && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">Source: </span>
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${{ fb: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', tiktok: 'bg-black/10 text-gray-800 dark:bg-white/10 dark:text-gray-200', google_ads: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', direct: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' }[order.order_source] ?? 'bg-gray-100 text-gray-600'}`}>
                                            {{ fb: 'Facebook', tiktok: 'TikTok', google_ads: 'Google Ads', direct: 'Direct', admin: 'Admin' }[order.order_source] ?? order.order_source}
                                        </span>
                                    </div>
                                )}
                                {!blocked && (order.ip_address || order.phone) && (
                                    <div className="pt-2">
                                        {!blockConfirm ? (
                                            <button
                                                onClick={() => setBlockConfirm(true)}
                                                className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                                            >
                                                <Ban className="h-3.5 w-3.5" />
                                                Block Customer
                                            </button>
                                        ) : (
                                            <div className="space-y-2 rounded-md bg-destructive/5 p-2">
                                                <p className="text-xs text-destructive">Block this customer&apos;s IP{order.phone ? ' & phone' : ''}? They won&apos;t be able to place orders.</p>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleBlockCustomer}
                                                        disabled={blocking}
                                                        className="rounded-md bg-destructive px-3 py-1 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                                                    >
                                                        {blocking ? 'Blocking…' : 'Confirm Block'}
                                                    </button>
                                                    <button
                                                        onClick={() => setBlockConfirm(false)}
                                                        className="rounded-md border px-3 py-1 text-xs hover:bg-accent"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Shipping address */}
                        <div className="rounded-xl border border-sidebar-border/70 p-3 sm:p-4 dark:border-sidebar-border">
                            <h3 className="mb-3 text-xs font-semibold sm:text-sm">Shipping Address</h3>
                            <div className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                                {order.district && <p className="font-medium">{order.district}</p>}
                                <p>{order.address}</p>
                            </div>
                        </div>

                        {/* Order Note */}
                        <OrderNoteCard orderId={order.id} initialNote={order.note} />

                        {/* Courier Order Ratio */}
                        {(bdcourierConnected || orderratiocheckConnected) && (
                            <CourierRatioCard orderId={order.id} defaultPhone={order.phone ?? ''} />
                        )}

                        {/* Payment Method */}
                        <div className="rounded-xl border border-sidebar-border/70 p-3 sm:p-4 dark:border-sidebar-border">
                            <h3 className="mb-3 text-xs font-semibold sm:text-sm">Payment Method</h3>
                            <p className="text-xs font-medium sm:text-sm">{paymentMethods[order.payment_method] || order.payment_method}</p>
                            {order.payment_phone && (
                                <div className="mt-2 text-xs sm:text-sm">
                                    <span className="text-muted-foreground">Number: </span>
                                    <span className="font-medium">{order.payment_phone}</span>
                                </div>
                            )}
                            {order.payment_amount && parseFloat(order.payment_amount) > 0 && (
                                <>
                                    <div className="mt-2 text-xs sm:text-sm">
                                        <span className="text-muted-foreground">Paid: </span>
                                        <span className="font-medium text-green-600 dark:text-green-400">{formatPrice(order.payment_amount)}</span>
                                    </div>
                                    <div className="mt-1 text-xs sm:text-sm">
                                        <span className="text-muted-foreground">Due: </span>
                                        <span className={`font-medium ${parseFloat(order.total) - parseFloat(order.payment_amount) <= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                                            {parseFloat(order.total) - parseFloat(order.payment_amount) <= 0 ? '৳0 (Fully Paid)' : formatPrice(String(parseFloat(order.total) - parseFloat(order.payment_amount)))}
                                        </span>
                                    </div>
                                </>
                            )}
                            {order.payment_screenshot && (
                                <div className="mt-3">
                                    <p className="mb-1 text-xs text-muted-foreground">Payment Screenshot:</p>
                                    <a href={order.payment_screenshot} target="_blank" rel="noopener noreferrer">
                                        <img
                                            src={order.payment_screenshot}
                                            alt="Payment screenshot"
                                            className="max-h-48 w-auto rounded-lg border hover:opacity-90 transition-opacity cursor-pointer"
                                        />
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

OrderShow.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Orders', href: '/admin/orders' },
        { title: 'Order Details', href: '#' },
    ],
};
