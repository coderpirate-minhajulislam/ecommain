<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Label {{ $order->order_number }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 11px; color: #1a1a2e; background: #f1f5f9; padding: 20px; }

        .print-bar { margin-bottom: 16px; padding: 10px 16px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; display: flex; align-items: center; gap: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
        .print-bar button { padding: 7px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; }
        .btn-p { background: #2563eb; color: #fff; }
        .btn-s { background: #16a34a; color: #fff; }
        .print-bar span { font-size: 11px; color: #64748b; margin-left: auto; }

        @media print {
            .print-bar { display: none !important; }
            html { margin: 0; padding: 0; }
            body { width: 76.2mm; height: 76.2mm; padding: 0; margin: 0; background: #fff; overflow: hidden; display: flex; align-items: center; justify-content: center; }
            @page { size: 76.2mm 76.2mm; margin: 0; }
        }

        .label {
            width: 76.2mm;
            height: 76.2mm;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            background: #fff;
            padding: 2mm 3mm;
        }
        @media print {
            .label { width: 76.2mm; height: 76.2mm; padding: 4mm 4mm; box-shadow: none; border: none; }
        }

        /* Header */
        .label-header { text-align: center; padding-bottom: 1.5mm; border-bottom: 1px solid #d1d5db; }
        .header-brand { display: flex; align-items: center; justify-content: center; gap: 1.5mm; }
        .label-logo { height: 4mm; width: 4mm; object-fit: contain; }
        .label-brand-name { font-size: 9pt; font-weight: 800; color: #1e293b; }
        .label-contact { font-size: 5.5pt; color: #64748b; margin-top: 0.5mm; }

        /* Customer */
        .customer-section { padding: 1.5mm 0; text-align: left; }
        .customer-grid { display: grid; grid-template-columns: auto auto; gap: 0 2mm; justify-items: start; text-align: left; }
        .cust-label { font-size: 5pt; font-weight: 700; color: #94a3b8; text-transform: uppercase; line-height: 1.6; }
        .cust-value { font-size: 6pt; font-weight: 600; color: #1e293b; line-height: 1.6; word-break: break-word; }
        .cust-value.name { font-size: 6.5pt; font-weight: 700; }

        /* Products */
        .products-section { padding: 1mm 0; text-align: center; border-top: 1px solid #d1d5db; }
        .product-row { display: inline-flex; align-items: center; gap: 2mm; }
        .product-name { font-size: 6pt; font-weight: 600; color: #1e293b; }
        .product-qty { font-size: 5.5pt; font-weight: 700; color: #6366f1; }

        /* QR */
        .qr-section { text-align: center; padding: 1mm 0; border-top: 1px solid #d1d5db; }
        .qr-section img { width: 9mm; height: 9mm; }
        .qr-invoice { font-size: 4.5pt; font-weight: 600; color: #94a3b8; text-transform: uppercase; }
        .qr-invoice-number { font-size: 5.5pt; font-weight: 700; color: #1e293b; }
        .courier-info { font-size: 4.5pt; font-weight: 600; color: #94a3b8; text-transform: uppercase; }
        .courier-value { font-size: 4.5pt; font-weight: 700; color: #1e293b; }

        /* COD */
        .cod-section { display: flex; align-items: center; justify-content: center; gap: 3mm; border: 1px solid #333; border-radius: 1mm; padding: 1.5mm 3mm; margin-top: auto; }
        .cod-label { font-size: 6pt; font-weight: 800; color: #1e293b; text-transform: uppercase; }
        .cod-amount { font-size: 9pt; font-weight: 800; color: #1e293b; }
        .cod-currency { font-size: 7pt; font-weight: 700; }

        /* Footer */
        .label-footer { text-align: center; padding-top: 1mm; }
        .footer-site, .footer-dev { font-size: 4.5pt; color: #94a3b8; line-height: 1.2; }
        .footer-dev strong { color: #64748b; }
    </style>
</head>
<body>

    <div class="print-bar">
        <button class="btn-p" onclick="window.print()">&#128424; Print Label</button>
        <button class="btn-s" onclick="window.print()">&#128190; Save as PDF</button>
        <span>3&#8243; &times; 3&#8243; Label</span>
    </div>

    <div class="label">

        <div class="label-header">
            <div class="header-brand">
                @if($siteLogo)
                    <img src="{{ asset($siteLogo) }}" alt="{{ $siteTitle }}" class="label-logo">
                @endif
                <span class="label-brand-name">{{ $siteTitle }}</span>
            </div>
            @if($sitePhone)
                <div class="label-contact">Phone Number: {{ $sitePhone }}@if($siteWhatsapp) | WhatsApp Number: {{ $siteWhatsapp }}@endif</div>
            @endif
        </div>

        <div class="customer-section">
            <div class="customer-grid">
                <span class="cust-label">CUSTOMER NAME:</span>
                <span class="cust-value name">{{ $order->first_name }}</span>
                <span class="cust-label">CUSTOMER PHONE:</span>
                <span class="cust-value">{{ $order->phone ?? 'N/A' }}</span>
                <span class="cust-label">CUSTOMER ADDRESS:</span>
                <span class="cust-value">{{ $order->address }}{{ $order->district ? ', ' . $order->district : '' }}</span>
            </div>
        </div>

        <div class="products-section">
            @foreach($order->items as $item)
            <div class="product-row">
                <span class="product-name">{{ $item->product_name }}</span>
                <span class="product-qty">&times;{{ $item->quantity }}</span>
            </div>
            @endforeach
        </div>

        @if($siteUrl)
        <div class="qr-section">
            <div class="qr-invoice">INVOICE ID</div>
            <div class="qr-invoice-number">{{ $order->order_number }}</div>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data={{ urlencode($order->order_number) }}" alt="QR">
            @if($consignmentId)
            <div>
                <span class="courier-info">{{ $courierName }}:</span>
                <span class="courier-value">{{ $consignmentId }}</span>
            </div>
            @endif
        </div>
        @endif

        <div class="cod-section">
            <span class="cod-label">CASH ON DELIVERY:</span>
            <span class="cod-amount">{{ number_format($order->total, 0) }}</span>
            <span class="cod-currency">&#2547;</span>
        </div>

        <div class="label-footer">
            <span class="footer-site">&copy; {{ now()->year }} {{ $siteTitle }}. All rights reserved.</span>
            <span class="footer-dev">Develop & Maintain by <strong>Grow Ever</strong></span>
        </div>

    </div>

</body>
</html>
