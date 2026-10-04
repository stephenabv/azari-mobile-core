import { z } from 'zod';
import type { FetchLike } from '../core/http/ApiClient';
import { tolerantArray } from './schemas';

export interface LocationSuggestion {
  id: string;
  /** Full place name without the trailing country. */
  label: string;
  city: string | null;
  province: string | null;
}

/** Place search used to fill city and province fields. */
export interface LocationSearch {
  search(query: string, signal?: AbortSignal): Promise<LocationSuggestion[]>;
}

const placeSchema = z.object({
  place_id: z.coerce.string(),
  display_name: z.string(),
  address: z
    .object({
      city: z.string().optional(),
      town: z.string().optional(),
      municipality: z.string().optional(),
      city_district: z.string().optional(),
      county: z.string().optional(),
      state: z.string().optional(),
      province: z.string().optional(),
    })
    .partial()
    .optional()
    .catch(undefined),
});

/**
 * OpenStreetMap Nominatim, limited to the Philippines, as on the website.
 * Only the typed query leaves the device; requests carry the identifying
 * User-Agent the Nominatim usage policy requires.
 */
export class NominatimLocationSearch implements LocationSearch {
  private static readonly ENDPOINT =
    'https://nominatim.openstreetmap.org/search';

  constructor(
    private readonly userAgent: string,
    private readonly fetchImpl: FetchLike = (input, init) => fetch(input, init),
  ) {}

  async search(
    query: string,
    signal?: AbortSignal,
  ): Promise<LocationSuggestion[]> {
    const q = query.trim().slice(0, 120);
    if (q.length < 3) return [];

    const url = `${
      NominatimLocationSearch.ENDPOINT
    }?format=json&countrycodes=ph&limit=5&addressdetails=1&q=${encodeURIComponent(
      q,
    )}`;
    const response = await this.fetchImpl(url, {
      method: 'GET',
      headers: { Accept: 'application/json', 'User-Agent': this.userAgent },
      credentials: 'omit',
      signal,
    });
    if (!response.ok) return [];

    const places = tolerantArray(placeSchema).parse(
      await response.json().catch(() => []),
    );
    return places.map(place => {
      const a = place.address ?? {};
      return {
        id: place.place_id,
        label: place.display_name.replace(/,\s*Philippines$/i, '').trim(),
        city: a.city ?? a.town ?? a.municipality ?? a.city_district ?? null,
        province: a.county ?? a.state ?? a.province ?? null,
      };
    });
  }
}
