export type ShippingZoneClassDefinition = {
    name: string;
    districts?: string[] | null;
};

function normalizeDistrict(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .replace(/['’]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function filterShippingZoneNamesForDistrict(
    district: string,
    zoneNames: string[],
    zoneClasses: ShippingZoneClassDefinition[] = [],
): string[] {
    const normalizedDistrict = normalizeDistrict(district);

    if (!normalizedDistrict) {
        return zoneNames;
    }

    const matchingZoneNames = zoneClasses
        .filter((zone) => (zone.districts ?? []).some((districtName) => normalizeDistrict(districtName) === normalizedDistrict))
        .map((zone) => zone.name)
        .filter(Boolean);

    if (matchingZoneNames.length > 0) {
        return matchingZoneNames.filter((name) => zoneNames.includes(name));
    }

    if (normalizedDistrict === 'dhaka') {
        return zoneNames.filter((zone) => zone.toLowerCase().includes('inside'));
    }

    const outsideZones = zoneNames.filter((zone) => zone.toLowerCase().includes('outside'));

    if (outsideZones.length > 0) {
        return outsideZones;
    }

    return zoneNames;
}

export function buildDistrictOptions(
    defaultDistricts: string[],
    zoneClasses: ShippingZoneClassDefinition[] = [],
): string[] {
    const options: string[] = [];
    const seen = new Set<string>();

    const addOption = (value: string) => {
        const trimmed = value.trim();
        if (!trimmed) {
            return;
        }

        const key = normalizeDistrict(trimmed);
        if (!key || seen.has(key)) {
            return;
        }

        seen.add(key);
        options.push(trimmed);
    };

    defaultDistricts.forEach(addOption);

    zoneClasses.forEach((zoneClass) => {
        (zoneClass.districts ?? []).forEach(addOption);
    });

    return options;
}
