<?php

namespace App\Exports;

use App\Models\Order;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class OrdersExport implements FromQuery, WithHeadings, WithMapping
{
    use Exportable;

    public function __construct(protected array $filters = []) {}

    public function query()
    {
        $query = Order::query()->with('items');

        if (!empty($this->filters['status'])) {
            $query->where('status', $this->filters['status']);
        }

        if (!empty($this->filters['date_range'])) {
            $range = $this->filters['date_range'];
            $now   = now();

            match ($range) {
                'today'      => $query->whereDate('created_at', $now->toDateString()),
                'this_week'  => $query->whereBetween('created_at', [$now->startOfWeek(), $now->copy()->endOfWeek()]),
                'this_month' => $query->whereMonth('created_at', $now->month)->whereYear('created_at', $now->year),
                'this_year'  => $query->whereYear('created_at', $now->year),
                default      => null,
            };
        } elseif (!empty($this->filters['date_from']) || !empty($this->filters['date_to'])) {
            if (!empty($this->filters['date_from'])) {
                $query->whereDate('created_at', '>=', $this->filters['date_from']);
            }
            if (!empty($this->filters['date_to'])) {
                $query->whereDate('created_at', '<=', $this->filters['date_to']);
            }
        }

        if (!empty($this->filters['payment_method'])) {
            $query->where('payment_method', $this->filters['payment_method']);
        }

        return $query->orderBy('created_at', 'desc');
    }

    public function headings(): array
    {
        return [
            'Date',
            'Order #',
            'Customer Name',
            'Phone',
            'Email',
            'District',
            'Address',
            'Products',
            'Order Status',
            'Payment Method',
            'Subtotal',
            'Shipping',
            'Discount',
            'Total',
        ];
    }

    public function map($order): array
    {
        $products = $order->items->map(function ($item) {
            $label = $item->product_name;
            if (!empty($item->variant_label)) {
                $label .= ' (' . $item->variant_label . ')';
            }
            $label .= ' x' . $item->quantity;
            return $label;
        })->implode(', ');

        return [
            $order->created_at->format('Y-m-d H:i'),
            $order->order_number,
            $order->first_name,
            $order->phone,
            $order->email ?? '',
            $order->district ?? '',
            $order->address ?? '',
            $products,
            ucfirst($order->status),
            ucfirst(str_replace('_', ' ', $order->payment_method ?? '')),
            number_format((float) $order->subtotal, 2),
            number_format((float) $order->shipping, 2),
            number_format((float) ($order->discount ?? 0), 2),
            number_format((float) $order->total, 2),
        ];
    }
}
