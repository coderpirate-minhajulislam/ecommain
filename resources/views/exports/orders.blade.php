<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Orders Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; color: #333; padding: 30px; }
        .print-bar { margin-bottom: 20px; padding: 10px 14px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; display: flex; align-items: center; gap: 10px; }
        .print-bar button { padding: 7px 18px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; }
        .btn-p { background: #2563eb; color: #fff; }
        .btn-s { background: #16a34a; color: #fff; }
        .print-bar span { font-size: 12px; color: #334155; }
        .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .brand-logo { height: 38px; width: auto; object-fit: contain; }
        .brand-name { font-size: 15px; font-weight: 700; color: #111; }
        h1 { font-size: 22px; font-weight: 800; color: #111; margin-bottom: 6px; }
        .meta { font-size: 11px; color: #666; margin-bottom: 18px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th { background: #f3f4f6; padding: 7px 8px; text-align: left; font-size: 11px; font-weight: 700; border-bottom: 2px solid #d1d5db; white-space: nowrap; }
        td { padding: 7px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px; vertical-align: top; }
        tr:nth-child(even) td { background: #f9fafb; }
        .order-link { color: #2563eb; text-decoration: none; font-weight: 600; }
        .item-count { font-weight: 600; color: #111; }
        .item-detail { color: #555; font-size: 10px; margin-top: 2px; line-height: 1.4; }
        .s-pending    { color: #92400e; }
        .s-processing { color: #1e40af; }
        .s-shipped    { color: #5b21b6; }
        .s-delivered  { color: #065f46; }
        .s-cancelled  { color: #991b1b; }
        .s-hold       { color: #b45309; }
        .s-pre-order  { color: #0369a1; }
        .footer { margin-top: 16px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; display: flex; justify-content: space-between; }
        @media print { .print-bar { display: none !important; } }
    </style>
</head>
<body>

    <div class="print-bar">
        <button class="btn-p" onclick="window.print()">&#128424; Print</button>
        <button class="btn-s" onclick="window.print()">&#128190; Save as PDF</button>
        <span>Tip: In print dialog, choose <strong>Save as PDF</strong> for PDF output.</span>
    </div>

    @if(!empty($siteLogo) || !empty($siteTitle))
    <div class="brand">
        @if(!empty($siteLogo))<img src="{{ asset($siteLogo) }}" alt="{{ $siteTitle }}" class="brand-logo">@endif
        @if(!empty($siteTitle))<span class="brand-name">{{ $siteTitle }}</span>@endif
    </div>
    @endif

    <h1>Orders Report</h1>
    <div class="meta">
        Generated on {{ now()->format('F j, Y') }}
        &mdash; Period: {{ !empty($filters['date_range']) ? ucfirst(str_replace('_', ' ', $filters['date_range'])) : 'All time' }}
        &mdash; {{ !empty($filters['status']) ? ucfirst($filters['status']) : 'All statuses' }}
        &mdash; Total: {{ $orders->count() }} orders
    </div>

    <table>
        <thead>
            <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Items</th>
                <th>Subtotal</th>
                <th>Shipping</th>
                <th>Total</th>
                <th>Date</th>
            </tr>
        </thead>
        <tbody>
            @foreach($orders as $order)
            @php $qty = $order->items->sum('quantity'); @endphp
            <tr>
                <td>
                    <a class="order-link" href="{{ url('/admin/orders/' . $order->id . '/invoice') }}" target="_blank">{{ $order->order_number }}</a>
                    <a class="order-link" href="{{ url('/admin/orders/' . $order->id . '/label') }}" target="_blank" style="margin-left:6px; font-size:10px; color:#16a34a;">[Label]</a>
                </td>
                <td>{{ $order->first_name }}</td>
                <td>{{ $order->phone }}</td>
                <td class="s-{{ $order->status }}">{{ $order->status }}</td>
                <td>{{ $order->payment_method ?? '' }}</td>
                <td>
                    <div class="item-count">{{ $qty }} {{ $qty == 1 ? 'item' : 'items' }}</div>
                    @foreach($order->items as $item)
                    <div class="item-detail">{{ $item->product_name }}{{ $item->variant_label ? ' — ' . $item->variant_label : '' }}</div>
                    @endforeach
                </td>
                <td>&#2547;{{ number_format((float)$order->subtotal, 2) }}</td>
                <td>&#2547;{{ number_format((float)$order->shipping, 2) }}</td>
                <td>&#2547;{{ number_format((float)$order->total, 2) }}</td>
                <td style="white-space:nowrap">{{ $order->created_at->format('M j, Y') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <span>Total Orders: {{ $orders->count() }}</span>
        <span>Total Revenue: &#2547;{{ number_format((float)$total, 2) }}</span>
    </div>

</body>
</html>
