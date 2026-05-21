<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice {{ $order->order_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; color: #333; padding: 30px; }
        .print-bar { margin-bottom: 20px; padding: 10px 14px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; display: flex; align-items: center; gap: 10px; }
        .print-bar button { padding: 7px 18px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; }
        .btn-p { background: #2563eb; color: #fff; }
        .btn-s { background: #16a34a; color: #fff; }
        .print-bar span { font-size: 12px; color: #334155; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
        .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .brand-logo { height: 42px; width: auto; object-fit: contain; }
        .brand-name { font-size: 16px; font-weight: 700; color: #111; }
        h1 { font-size: 26px; font-weight: 800; color: #111; margin-bottom: 4px; }
        .order-num { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
        .header-right { text-align: right; font-size: 12px; color: #555; line-height: 1.8; }
        .status { display: inline-block; padding: 2px 10px; border-radius: 10px; font-size: 11px; font-weight: 600; }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-processing { background: #dbeafe; color: #1e40af; }
        .status-shipped { background: #ede9fe; color: #6b21a8; }
        .status-delivered { background: #d1fae5; color: #065f46; }
        .status-cancelled { background: #fee2e2; color: #991b1b; }
        .info-row { display: flex; gap: 40px; margin-bottom: 25px; }
        .info-block { flex: 1; }
        .info-block h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 8px; font-weight: 600; }
        .info-block p { margin-bottom: 3px; font-size: 12px; line-height: 1.6; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        table thead th { background: #f3f4f6; padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 700; border-bottom: 2px solid #d1d5db; }
        table tbody td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
        table tbody tr:nth-child(even) td { background: #f9fafb; }
        .text-right { text-align: right; }
        .totals { width: 260px; margin-left: auto; margin-top: 10px; }
        .totals table { margin: 0; }
        .totals td { padding: 5px 0; font-size: 13px; border: none; background: none !important; }
        .totals .total-row td { border-top: 2px solid #333; font-size: 15px; font-weight: 700; padding-top: 8px; }
        .divider { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
        .footer { margin-top: 40px; padding-top: 15px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #888; }
        @media print { .print-bar { display: none !important; } }
    </style>
</head>
<body>

    <div class="print-bar">
        <button class="btn-p" onclick="window.print()">&#128424; Print</button>
        <button class="btn-s" onclick="window.print()">&#128190; Save as PDF</button>
        <span>Tip: In print dialog, choose <strong>Save as PDF</strong> for PDF output.</span>
    </div>

    <div class="header">
        <div>
            <div class="brand">
                @if($siteLogo)
                    <img src="{{ asset($siteLogo) }}" alt="{{ $siteTitle }}" class="brand-logo">
                @endif
                @if($siteTitle)
                    <span class="brand-name">{{ $siteTitle }}</span>
                @endif
            </div>
            <h1>INVOICE</h1>
            <div class="order-num">{{ $order->order_number }}</div>
        </div>
        <div class="header-right">
            Date: {{ $order->created_at->format('F j, Y') }}<br>
            Status: <span class="status status-{{ $order->status }}">{{ ucfirst($order->status) }}</span>
        </div>
    </div>

    <div class="info-row">
        <div class="info-block">
            <h3>Bill To</h3>
            <p><strong>{{ $order->first_name }}</strong></p>
            @if($order->email)<p>{{ $order->email }}</p>@endif
            @if($order->phone)<p>{{ $order->phone }}</p>@endif
            @if($order->payment_method)<p style="color:#666">Payment: {{ ucfirst(str_replace('_', ' ', $order->payment_method)) }}</p>@endif
        </div>
        <div class="info-block">
            <h3>Ship To</h3>
            @if($order->address)<p>{{ $order->address }}</p>@endif
            @if($order->district)<p>{{ $order->district }}{{ $order->delivery_zone ? ', ' . $order->delivery_zone : '' }}</p>@endif
            @if($order->note)<p style="color:#666">Note: {{ $order->note }}</p>@endif
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Product</th>
                <th>Variant</th>
                <th class="text-right">Price</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($order->items as $i => $item)
            <tr>
                <td>{{ $i + 1 }}</td>
                <td>{{ $item->product_name }}</td>
                <td>{{ $item->variant_label ?? 'â€”' }}</td>
                <td class="text-right">{{ number_format($item->price, 2) }}</td>
                <td class="text-right">{{ $item->quantity }}</td>
                <td class="text-right">{{ number_format($item->total, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totals">
        <table>
            <tr>
                <td>Subtotal</td>
                <td class="text-right">{{ number_format($order->subtotal, 2) }}</td>
            </tr>
            @if(!empty($order->coupon_code) || $order->discount > 0)
            <tr>
                <td>Discount{{ $order->coupon_code ? ' (' . $order->coupon_code . ')' : '' }}</td>
                <td class="text-right">-{{ number_format($order->discount, 2) }}</td>
            </tr>
            @endif
            <tr>
                <td>Shipping</td>
                <td class="text-right">{{ $order->shipping == 0 ? 'Free' : number_format($order->shipping, 2) }}</td>
            </tr>
            <tr class="total-row">
                <td>Total</td>
                <td class="text-right">{{ number_format($order->total, 2) }}</td>
            </tr>
        </table>
    </div>

    <div class="footer">
        Thank you for your business! &mdash; Generated on {{ now()->format('F j, Y \a\t g:i A') }}
    </div>

</body>
</html>
