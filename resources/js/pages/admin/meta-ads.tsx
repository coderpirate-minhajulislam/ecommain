import { Head, Link, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import {
    AlertCircle,
    ArrowUpDown,
    Calendar,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Loader2,
    RefreshCw,
    TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ─── Types ───────────────────────────────────────────────────────────────────

type MetaAction = { action_type: string; value: string };
type CostPerAction = { action_type: string; value: string };

type CampaignInsight = {
    spend: string;
    impressions: string;
    clicks: string;
    reach: string;
    ctr: string;
    cpc: string;
    actions?: MetaAction[];
    action_values?: MetaAction[];
    cost_per_action_type?: CostPerAction[];
    objective?: string;
};

type Campaign = {
    id: string;
    name: string;
    status: string;
    effective_status: string;
    daily_budget?: string;
    lifetime_budget?: string;
    bid_strategy?: string;
    objective?: string;
    stop_time?: string;
    insights?: { data: CampaignInsight[] };
};

type AccountInsight = {
    spend?: string;
    impressions?: string;
    clicks?: string;
    reach?: string;
    ctr?: string;
    cpc?: string;
    actions?: MetaAction[];
    action_values?: MetaAction[];
};

const PERIODS = [
    { key: 'today',      label: 'Today' },
    { key: 'yesterday',  label: 'Yesterday' },
    { key: 'last_7d',    label: 'Last 7 Days' },
    { key: 'last_30d',   label: 'Last 30 Days' },
    { key: 'this_month', label: 'This Month' },
    { key: 'last_month', label: 'Last Month' },
    { key: 'custom',     label: 'Custom' },
] as const;

type Period = (typeof PERIODS)[number]['key'];

const PAGE_SIZE = 10;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtNum(v?: string | number): string {
    const n = parseFloat(String(v ?? '0'));
    if (isNaN(n) || n === 0) return '—';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toLocaleString();
}

function fmtMoney(v?: string | number): string {
    const n = parseFloat(String(v ?? '0'));
    if (isNaN(n)) return '—';
    return '$' + n.toFixed(2);
}

function fmtCtr(v?: string): string {
    const n = parseFloat(v ?? '0');
    if (isNaN(n) || n === 0) return '—';
    return n.toFixed(2) + '%';
}

function fmtBudget(c: Campaign): string {
    if (c.daily_budget) return '$' + (parseInt(c.daily_budget) / 100).toFixed(2) + '\nDaily';
    if (c.lifetime_budget) return '$' + (parseInt(c.lifetime_budget) / 100).toFixed(2) + '\nLifetime';
    return '—';
}

function getResult(insight?: CampaignInsight): { count: string; type: string } {
    if (!insight) return { count: '—', type: '' };
    const purchases = insight.actions?.find((a) => a.action_type === 'purchase');
    if (purchases) return { count: fmtNum(purchases.value), type: 'Website purchases' };
    const leads = insight.actions?.find((a) => a.action_type === 'lead');
    if (leads) return { count: fmtNum(leads.value), type: 'Leads' };
    const messages = insight.actions?.find((a) =>
        a.action_type === 'onsite_conversion.messaging_conversation_started_7d' ||
        a.action_type === 'onsite_conversion.messaging_first_reply',
    );
    if (messages) return { count: fmtNum(messages.value), type: 'Messaging conversations' };
    const clicks = insight.actions?.find((a) => a.action_type === 'link_click');
    if (clicks) return { count: fmtNum(clicks.value), type: 'Link clicks' };
    return { count: '—', type: '' };
}

function getCostPerResult(insight?: CampaignInsight): string {
    if (!insight?.cost_per_action_type) return '—';
    const order = insight.cost_per_action_type.find((a) => a.action_type === 'purchase');
    if (order) return '$' + parseFloat(order.value).toFixed(2);
    const lead = insight.cost_per_action_type.find((a) => a.action_type === 'lead');
    if (lead) return '$' + parseFloat(lead.value).toFixed(2);
    return '—';
}

const STATUS_STYLE: Record<string, { dot: string; text: string; label: string }> = {
    ACTIVE:          { dot: 'bg-green-500',  text: 'text-green-700 dark:text-green-400',  label: 'Active' },
    PAUSED:          { dot: 'bg-gray-400',   text: 'text-gray-500 dark:text-gray-400',    label: 'Off' },
    CAMPAIGN_PAUSED: { dot: 'bg-gray-400',   text: 'text-gray-500 dark:text-gray-400',    label: 'Off' },
    IN_PROCESS:      { dot: 'bg-blue-500',   text: 'text-blue-600 dark:text-blue-400',    label: 'In draft' },
    ARCHIVED:        { dot: 'bg-gray-300',   text: 'text-gray-400',                        label: 'Archived' },
    DELETED:         { dot: 'bg-red-400',    text: 'text-red-600',                         label: 'Deleted' },
    WITH_ISSUES:     { dot: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400', label: 'With issues' },
};

// ─── Sortable column header ───────────────────────────────────────────────────

type SortKey = 'id' | 'name' | 'effective_status' | 'spend' | 'impressions' | 'clicks' | 'reach' | 'ctr' | 'cpc' | 'results' | 'budget' | 'roas' | 'roi';

function Th({
    label, sortKey, current, dir, onClick,
}: {
    label: string; sortKey: SortKey; current: SortKey; dir: 'asc' | 'desc'; onClick: (k: SortKey) => void;
}) {
    const active = current === sortKey;
    return (
        <th
            className="cursor-pointer select-none whitespace-nowrap px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
            onClick={() => onClick(sortKey)}
        >
            <span className="inline-flex items-center gap-1">
                {label}
                <ArrowUpDown className={`h-3 w-3 ${active ? 'text-primary' : 'opacity-40'}`} />
                {active && <span className="text-[10px] text-primary">{dir === 'asc' ? '↑' : '↓'}</span>}
            </span>
        </th>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type OrderStatEntry = { count: number; revenue: number };
type OrderStats = Record<string, OrderStatEntry>;
type CampaignOrderStats = Record<string, OrderStats>;

export default function MetaAdsPage() {
    const { connected, adAccountId } = usePage<{ connected: boolean; adAccountId: string }>().props;

    const [period, setPeriod] = useState<Period>('last_7d');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [account, setAccount] = useState<AccountInsight | null>(null);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [campaignOrderStats, setCampaignOrderStats] = useState<CampaignOrderStats>({});

    const [sortKey, setSortKey] = useState<SortKey>('id');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [page, setPage] = useState(1);
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    // null = loading, '' = not set, non-empty string = current template
    const fetchData = useCallback(async (p: string, since?: string, until?: string) => {
        if (!connected) return;
        setLoading(true);
        setError(null);
        try {
            const url = since && until
                ? `/admin/meta-ads/data?start_date=${since}&end_date=${until}`
                : `/admin/meta-ads/data?period=${p}`;
            const res = await fetch(url, {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            const json = await res.json();
            if (!res.ok) {
                setError(json.error ?? 'Failed to load Meta Ads data.');
                return;
            }
            setAccount(json.insights ?? {});
            setCampaigns(json.campaigns ?? []);
            setCampaignOrderStats(json.campaignOrderStats ?? {});

        } catch {
            setError('Network error — could not load Meta Ads data.');
        } finally {
            setLoading(false);
        }
    }, [connected]);

    useEffect(() => {
        if (period !== 'custom') fetchData(period);
    }, [period, fetchData]);

    function toggleSort(key: SortKey) {
        if (sortKey === key) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir('desc');
        }
        setPage(1);
    }

    function getCampaignSortValue(c: Campaign): number | string {
        const insight = c.insights?.data?.[0];
        switch (sortKey) {
            case 'id':          return parseFloat(c.id ?? '0');
            case 'spend':       return parseFloat(insight?.spend ?? '0');
            case 'impressions': return parseFloat(insight?.impressions ?? '0');
            case 'clicks':      return parseFloat(insight?.clicks ?? '0');
            case 'reach':       return parseFloat(insight?.reach ?? '0');
            case 'ctr':         return parseFloat(insight?.ctr ?? '0');
            case 'cpc':         return parseFloat(insight?.cpc ?? '0');
            case 'results':     return parseFloat(getResult(insight).count.replace(/[^0-9.]/g, '') || '0');
            case 'budget':      return parseInt(c.daily_budget ?? c.lifetime_budget ?? '0');
            case 'effective_status': return c.effective_status;
            case 'name':        return c.name.toLowerCase();
            case 'roas': {
                const spend = parseFloat(insight?.spend ?? '0');
                const rev   = parseFloat(insight?.action_values?.find((a) => a.action_type === 'purchase')?.value ?? '0');
                return spend > 0 ? rev / spend : 0;
            }
            case 'roi': {
                const spend = parseFloat(insight?.spend ?? '0');
                const rev   = parseFloat(insight?.action_values?.find((a) => a.action_type === 'purchase')?.value ?? '0');
                return spend > 0 ? ((rev - spend) / spend) * 100 : 0;
            }
            default:            return 0;
        }
    }

    const totalPages = Math.ceil(campaigns.length / PAGE_SIZE);

    const sorted = [...campaigns].sort((a, b) => {
        const av = getCampaignSortValue(a);
        const bv = getCampaignSortValue(b);
        if (typeof av === 'string' && typeof bv === 'string') {
            return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        }
        return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });

    const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const purchases = account?.actions?.find((a) => a.action_type === 'purchase')?.value;
    const purchaseRevenue = parseFloat(account?.action_values?.find((a) => a.action_type === 'purchase')?.value ?? '0');
    const acctSpend = parseFloat(account?.spend ?? '0');
    const roas = acctSpend > 0 && purchaseRevenue > 0 ? purchaseRevenue / acctSpend : null;
    const roi  = roas !== null ? (roas - 1) * 100 : null;

    const summaryCards = [
        { label: 'Total Spend',    value: fmtMoney(account?.spend),        color: 'text-blue-600 dark:text-blue-400' },
        { label: 'Impressions',    value: fmtNum(account?.impressions),     color: 'text-indigo-600 dark:text-indigo-400' },
        { label: 'Clicks',         value: fmtNum(account?.clicks),          color: 'text-purple-600 dark:text-purple-400' },
        { label: 'Reach',          value: fmtNum(account?.reach),           color: 'text-teal-600 dark:text-teal-400' },
        { label: 'CTR',            value: fmtCtr(account?.ctr),             color: 'text-amber-600 dark:text-amber-400' },
        { label: 'CPC',            value: fmtMoney(account?.cpc),           color: 'text-green-600 dark:text-green-400' },
        { label: 'Purchases',      value: purchases ? fmtNum(purchases) : '—', color: 'text-rose-600 dark:text-rose-400' },
        { label: 'ROAS',           value: roas !== null ? roas.toFixed(2) + '×' : '—',           color: roas !== null && roas >= 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-500' },
        { label: 'ROI',            value: roi !== null ? (roi >= 0 ? '+' : '') + roi.toFixed(1) + '%' : '—', color: roi !== null && roi >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500' },
    ];

    return (
        <>
            <Head title="Meta Ads Performance" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">

                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Meta Ads Performance</h2>
                        <p className="text-sm text-muted-foreground">
                            {adAccountId ? (
                                <>Account ID: <span className="font-mono">{adAccountId}</span></>
                            ) : (
                                'Live campaign data from your Meta Ads account'
                            )}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {connected && (
                            <button
                                onClick={() => period === 'custom' ? fetchData('custom', customStart, customEnd) : fetchData(period)}
                                disabled={loading || (period === 'custom' && (!customStart || !customEnd))}
                                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent disabled:opacity-60"
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        )}
                        <a
                            href="https://adsmanager.facebook.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                        >
                            <ExternalLink className="h-4 w-4" />
                            Open Ads Manager
                        </a>
                    </div>
                </div>

                {/* Not connected state */}
                {!connected && (
                    <div className="rounded-xl border border-dashed border-blue-300 bg-blue-50/50 p-10 text-center dark:border-blue-800 dark:bg-blue-950/20">
                        <TrendingUp className="mx-auto mb-3 h-10 w-10 text-blue-400" />
                        <p className="text-base font-semibold text-blue-800 dark:text-blue-300">Meta Ads not connected</p>
                        <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
                            Go to{' '}
                            <Link href="/admin/settings/tracking" className="underline font-medium">
                                Tracking Settings
                            </Link>{' '}
                            and add your Ad Account ID and a Marketing API token with{' '}
                            <code className="font-mono text-xs">ads_read</code> permission.
                        </p>
                    </div>
                )}

                {connected && (
                    <>
                        {/* Period selector */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-muted/40 p-1 w-fit">
                            {PERIODS.map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => { setPeriod(key); setPage(1); }}
                                    className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                                        period === key
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {key === 'custom' ? (
                                        <span className="inline-flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {label}
                                        </span>
                                    ) : label}
                                </button>
                            ))}
                            </div>

                            {/* Custom date inputs */}
                            {period === 'custom' && (
                                <div className="flex flex-wrap items-center gap-2">
                                    <input
                                        type="date"
                                        value={customStart}
                                        onChange={(e) => setCustomStart(e.target.value)}
                                        max={customEnd || undefined}
                                        className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                    <span className="text-sm text-muted-foreground">→</span>
                                    <input
                                        type="date"
                                        value={customEnd}
                                        onChange={(e) => setCustomEnd(e.target.value)}
                                        min={customStart || undefined}
                                        className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                    <button
                                        onClick={() => { setPage(1); fetchData('custom', customStart, customEnd); }}
                                        disabled={!customStart || !customEnd || loading}
                                        className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
                                    >
                                        Apply
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Loading */}
                        {loading && (
                            <div className="flex items-center justify-center py-20 text-muted-foreground">
                                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                <span>Loading Meta Ads data…</span>
                            </div>
                        )}

                        {/* Error */}
                        {!loading && error && (
                            <div className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-800 dark:bg-red-950/20">
                                {error.includes('#200') || error.toLowerCase().includes('ads_read') ? (
                                    <div className="space-y-3">
                                        <p className="flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-400">
                                            <AlertCircle className="h-4 w-4 shrink-0" />
                                            Token missing <code className="rounded bg-red-100 px-1 font-mono text-xs dark:bg-red-900/40">ads_read</code> permission
                                        </p>
                                        <p className="text-sm text-red-700 dark:text-red-400">
                                            The CAPI token is for sending events only. You need a separate Marketing API token.
                                        </p>
                                        <div className="rounded-lg bg-white/70 p-3 text-xs text-red-800 dark:bg-red-900/20 dark:text-red-300">
                                            <p className="mb-1 font-semibold">How to fix — System User token (never expires):</p>
                                            <ol className="ml-4 list-decimal space-y-1">
                                                <li>Go to <a href="https://business.facebook.com/settings/system-users" target="_blank" rel="noopener noreferrer" className="underline">Business Settings → System Users</a></li>
                                                <li>Select a System User → click <strong>Generate New Token</strong></li>
                                                <li>Enable <strong>ads_read</strong> permission</li>
                                                <li>Paste the token in <Link href="/admin/settings/tracking" className="underline">Tracking Settings → Ads API Access Token</Link></li>
                                            </ol>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-red-700 dark:text-red-400">
                                        <strong>Error:</strong> {error}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Summary cards */}
                        {!loading && !error && account && (
                            <>
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-9">
                                    {summaryCards.map(({ label, value, color }) => (
                                        <Card key={label}>
                                            <CardContent className="p-4">
                                                <p className="text-xs text-muted-foreground">{label}</p>
                                                <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                {/* Campaigns table */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <TrendingUp className="h-4 w-4 text-blue-600" />
                                            Campaigns
                                            <span className="ml-auto text-xs font-normal text-muted-foreground">
                                                {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}
                                                {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
                                            </span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {campaigns.length === 0 ? (
                                            <p className="py-12 text-center text-sm text-muted-foreground">No campaigns found for this period.</p>
                                        ) : (
                                            <>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="border-b border-border bg-muted/30">
                                                        <tr>
                                                            <Th label="Campaign" sortKey="name" current={sortKey} dir={sortDir} onClick={toggleSort} />
                                                            <Th label="Delivery" sortKey="effective_status" current={sortKey} dir={sortDir} onClick={toggleSort} />
                                                            <Th label="Results" sortKey="results" current={sortKey} dir={sortDir} onClick={toggleSort} />
                                                            <Th label="Cost / Result" sortKey="cpc" current={sortKey} dir={sortDir} onClick={toggleSort} />
                                                            <Th label="Budget" sortKey="budget" current={sortKey} dir={sortDir} onClick={toggleSort} />
                                                            <Th label="Amount Spent" sortKey="spend" current={sortKey} dir={sortDir} onClick={toggleSort} />
                                                            <Th label="ROAS" sortKey="roas" current={sortKey} dir={sortDir} onClick={toggleSort} />
                                                            <Th label="ROI" sortKey="roi" current={sortKey} dir={sortDir} onClick={toggleSort} />
                                                            <Th label="Impressions" sortKey="impressions" current={sortKey} dir={sortDir} onClick={toggleSort} />
                                                            <Th label="Reach" sortKey="reach" current={sortKey} dir={sortDir} onClick={toggleSort} />
                                                            <Th label="CTR" sortKey="ctr" current={sortKey} dir={sortDir} onClick={toggleSort} />
                                                            <Th label="CPC" sortKey="cpc" current={sortKey} dir={sortDir} onClick={toggleSort} />
                                                            <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ends</th>
                                                            <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bid Strategy</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border">
                                                        {paginated.map((c) => {
                                                            const insight = c.insights?.data?.[0];
                                                            const statusStyle = STATUS_STYLE[c.effective_status] ?? {
                                                                dot: 'bg-gray-400', text: 'text-gray-500', label: c.effective_status,
                                                            };
                                                            const result = getResult(insight);
                                                            const costPerResult = getCostPerResult(insight);
                                                            const budgetRaw = c.daily_budget
                                                                ? { amount: (parseInt(c.daily_budget) / 100).toFixed(2), type: 'Daily' }
                                                                : c.lifetime_budget
                                                                    ? { amount: (parseInt(c.lifetime_budget) / 100).toFixed(2), type: 'Lifetime' }
                                                                    : null;
                                                            const ends = c.stop_time
                                                                ? new Date(c.stop_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
                                                                : 'Ongoing';
                                                            const bidStrategy = c.bid_strategy
                                                                ? c.bid_strategy.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())
                                                                : '—';

                                                            return (
                                                                <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                                                                    {/* Campaign name */}
                                                                    <td className="max-w-50 px-3 py-3">
                                                                        <a
                                                                            href={`https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${adAccountId}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="block truncate font-medium text-blue-600 hover:underline dark:text-blue-400"
                                                                            title={c.name}
                                                                        >
                                                                            {c.name}
                                                                        </a>
                                                                    </td>

                                                                    {/* Delivery */}
                                                                    <td className="px-3 py-3">
                                                                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${statusStyle.text}`}>
                                                                            <span className={`h-2 w-2 shrink-0 rounded-full ${statusStyle.dot}`} />
                                                                            {statusStyle.label}
                                                                        </span>
                                                                    </td>

                                                                    {/* Results */}
                                                                    <td className="px-3 py-3">
                                                                        {result.count !== '—' ? (
                                                                            <div>
                                                                                <p className="font-semibold">{result.count}</p>
                                                                                <p className="text-[11px] text-muted-foreground">{result.type}</p>
                                                                                {(() => {
                                                                                    const delivered = campaignOrderStats[c.id]?.['delivered']?.count;
                                                                                    return delivered ? (
                                                                                        <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">{delivered} delivered</p>
                                                                                    ) : null;
                                                                                })()}
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-muted-foreground">—</span>
                                                                        )}
                                                                    </td>

                                                                    {/* Cost per result */}
                                                                    <td className="px-3 py-3">
                                                                        {costPerResult !== '—' ? (
                                                                            <div>
                                                                                <p className="font-semibold">{costPerResult}</p>
                                                                                <p className="text-[11px] text-muted-foreground">Per {result.type.toLowerCase() || 'result'}</p>
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-muted-foreground">—</span>
                                                                        )}
                                                                    </td>

                                                                    {/* Budget */}
                                                                    <td className="px-3 py-3">
                                                                        {budgetRaw ? (
                                                                            <div>
                                                                                <p className="font-semibold">${budgetRaw.amount}</p>
                                                                                <p className="text-[11px] text-muted-foreground">{budgetRaw.type}</p>
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-muted-foreground">—</span>
                                                                        )}
                                                                    </td>

                                                                    {/* Amount spent */}
                                                                    <td className="px-3 py-3 font-semibold">
                                                                        {insight?.spend ? fmtMoney(insight.spend) : <span className="text-muted-foreground">—</span>}
                                                                    </td>

                                                                    {/* ROAS */}
                                                                    <td className="px-3 py-3">
                                                                        {(() => {
                                                                            const sp  = parseFloat(insight?.spend ?? '0');
                                                                            const rev = parseFloat(insight?.action_values?.find((a) => a.action_type === 'purchase')?.value ?? '0');
                                                                            if (sp <= 0 || rev <= 0) return <span className="text-muted-foreground">—</span>;
                                                                            const r = rev / sp;
                                                                            return <span className={r >= 1 ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'font-semibold text-orange-500'}>{r.toFixed(2)}×</span>;
                                                                        })()}
                                                                    </td>

                                                                    {/* ROI */}
                                                                    <td className="px-3 py-3">
                                                                        {(() => {
                                                                            const sp  = parseFloat(insight?.spend ?? '0');
                                                                            const rev = parseFloat(insight?.action_values?.find((a) => a.action_type === 'purchase')?.value ?? '0');
                                                                            if (sp <= 0 || rev <= 0) return <span className="text-muted-foreground">—</span>;
                                                                            const r = ((rev - sp) / sp) * 100;
                                                                            return <span className={r >= 0 ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'font-semibold text-red-500'}>{r >= 0 ? '+' : ''}{r.toFixed(1)}%</span>;
                                                                        })()}
                                                                    </td>

                                                                    {/* Impressions */}
                                                                    <td className="px-3 py-3">
                                                                        {insight?.impressions ? fmtNum(insight.impressions) : <span className="text-muted-foreground">—</span>}
                                                                    </td>

                                                                    {/* Reach */}
                                                                    <td className="px-3 py-3">
                                                                        {insight?.reach ? fmtNum(insight.reach) : <span className="text-muted-foreground">—</span>}
                                                                    </td>

                                                                    {/* CTR */}
                                                                    <td className="px-3 py-3">
                                                                        {insight?.ctr ? fmtCtr(insight.ctr) : <span className="text-muted-foreground">—</span>}
                                                                    </td>

                                                                    {/* CPC */}
                                                                    <td className="px-3 py-3">
                                                                        {insight?.cpc ? fmtMoney(insight.cpc) : <span className="text-muted-foreground">—</span>}
                                                                    </td>

                                                                    {/* Ends */}
                                                                    <td className="px-3 py-3 text-xs text-muted-foreground">{ends}</td>

                                                                    {/* Bid strategy */}
                                                                    <td className="px-3 py-3 text-xs text-muted-foreground">{bidStrategy}</td>

                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>

                                                    {/* Totals row */}
                                                    {campaigns.length > 1 && (() => {
                                                        const totalSpend  = campaigns.reduce((s, c) => s + parseFloat(c.insights?.data?.[0]?.spend ?? '0'), 0);
                                                        const totalImpr   = campaigns.reduce((s, c) => s + parseFloat(c.insights?.data?.[0]?.impressions ?? '0'), 0);
                                                        const totalClicks = campaigns.reduce((s, c) => s + parseFloat(c.insights?.data?.[0]?.clicks ?? '0'), 0);
                                                        const totalReach  = campaigns.reduce((s, c) => s + parseFloat(c.insights?.data?.[0]?.reach ?? '0'), 0);
                                                        const totalRev    = campaigns.reduce((s, c) => s + parseFloat(c.insights?.data?.[0]?.action_values?.find((a) => a.action_type === 'purchase')?.value ?? '0'), 0);
                                                        const avgCtr  = totalImpr > 0 ? (totalClicks / totalImpr) * 100 : 0;
                                                        const avgCpc  = totalClicks > 0 ? totalSpend / totalClicks : 0;
                                                        const totRoas = totalSpend > 0 && totalRev > 0 ? totalRev / totalSpend : null;
                                                        const totRoi  = totRoas !== null ? (totRoas - 1) * 100 : null;
                                                        return (
                                                            <tfoot>
                                                                <tr className="border-t-2 border-border bg-muted/40 text-sm font-semibold">
                                                                    <td className="px-3 py-3" colSpan={2}>Totals / Averages</td>
                                                                    <td className="px-3 py-3" colSpan={3} />
                                                                    <td className="px-3 py-3">{fmtMoney(totalSpend)}</td>
                                                                    <td className="px-3 py-3">{totRoas !== null ? <span className={totRoas >= 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-500'}>{totRoas.toFixed(2)}×</span> : '—'}</td>
                                                                    <td className="px-3 py-3">{totRoi !== null ? <span className={totRoi >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}>{totRoi >= 0 ? '+' : ''}{totRoi.toFixed(1)}%</span> : '—'}</td>
                                                                    <td className="px-3 py-3">{fmtNum(totalImpr)}</td>
                                                                    <td className="px-3 py-3">{fmtNum(totalReach)}</td>
                                                                    <td className="px-3 py-3">{avgCtr.toFixed(2)}%</td>
                                                                    <td className="px-3 py-3">{fmtMoney(avgCpc)}</td>
                                                                    <td className="px-3 py-3" colSpan={2} />
                                                                </tr>
                                                            </tfoot>
                                                        );
                                                    })()}
                                                </table>
                                            </div>

                                            {/* Pagination controls */}
                                            {totalPages > 1 && (
                                                <div className="flex items-center justify-between border-t border-border px-4 py-3">
                                                    <p className="text-xs text-muted-foreground">
                                                        Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
                                                    </p>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                                            disabled={page === 1}
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-sm hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
                                                        >
                                                            <ChevronLeft className="h-4 w-4" />
                                                        </button>
                                                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                                                            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                                            .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                                                                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('…');
                                                                acc.push(p);
                                                                return acc;
                                                            }, [])
                                                            .map((p, i) =>
                                                                p === '…' ? (
                                                                    <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted-foreground">…</span>
                                                                ) : (
                                                                    <button
                                                                        key={p}
                                                                        onClick={() => setPage(p as number)}
                                                                        className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-xs font-medium transition-colors ${
                                                                            page === p
                                                                                ? 'border-primary bg-primary text-primary-foreground'
                                                                                : 'border-border bg-background hover:bg-accent'
                                                                        }`}
                                                                    >
                                                                        {p}
                                                                    </button>
                                                                ),
                                                            )}
                                                        <button
                                                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                                            disabled={page === totalPages}
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-sm hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
                                                        >
                                                            <ChevronRight className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            </>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Connected badge */}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                    Connected to Meta Marketing API · Data cached for 5 minutes ·{' '}
                                    <Link href="/admin/settings/tracking" className="underline hover:text-foreground">
                                        Edit settings
                                    </Link>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </>
    );
}

MetaAdsPage.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Meta Ads Performance', href: '/admin/meta-ads' },
    ],
};
