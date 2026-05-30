import { Head, usePage } from '@inertiajs/react';

type Props = {
    seoMetaTags?: string[];
};

function parseMetaString(raw: string): Record<string, string> | null {
    const tag = raw.trim();

    if (!tag.toLowerCase().startsWith('<meta')) {
        return null;
    }

    const inner = tag.replace(/^<meta\b/i, '').replace(/\/?>\s*$/, '');
    const attrs: Record<string, string> = {};
    const attributePattern = /([a-zA-Z0-9:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
    let match: RegExpExecArray | null;

    while ((match = attributePattern.exec(inner)) !== null) {
        const attrName = match[1];
        const attrValue = match[2] ?? match[3] ?? match[4] ?? '';

        let normalizedName = attrName;

        if (attrName.toLowerCase() === 'http-equiv') {
            normalizedName = 'httpEquiv';
        } else if (attrName === 'charset') {
            normalizedName = 'charSet';
        } else if (attrName === 'itemprop') {
            normalizedName = 'itemProp';
        }

        attrs[normalizedName] = attrValue;
    }

    if (!attrs.name && !attrs.property && !attrs.charSet && !attrs.httpEquiv && !attrs.itemProp) {
        return null;
    }

    return attrs;
}

export default function SeoMetaTags() {
    const { seoMetaTags } = usePage<Props>().props;

    if (!Array.isArray(seoMetaTags) || seoMetaTags.length === 0) {
        return null;
    }

    const nodes = seoMetaTags.map((tag, index) => {
        const parsed = parseMetaString(tag);

        if (!parsed) {
            return null;
        }

        return (
            <meta
                key={`seo-meta-${index}`}
                {...parsed}
                head-key={`seo-meta-${index}`}
            />
        );
    });

    return <Head>{nodes}</Head>;
}
