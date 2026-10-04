import { QueryClient } from '@tanstack/react-query';
import type { AppConfig } from '../config/AppConfig';
import { ApiClient, type FetchLike } from '../core/http/ApiClient';
import { RateLimitMonitor } from '../core/http/RateLimitMonitor';
import { ConsoleLogger, type Logger } from '../core/logging/Logger';
import { MediaUrlResolver } from '../core/media/MediaUrlResolver';
import type { AttachmentSource } from '../core/platform/AttachmentSource';
import type { PlatformAdapter } from '../core/platform/PlatformAdapter';
import type { DeviceSecurityBridge } from '../core/security/bridges';
import { MobileIntegrityApi } from '../core/security/MobileIntegrityApi';
import { ProtectedApiClient } from '../core/security/ProtectedApiClient';
import {
  MemoryKeyValueStore,
  MmkvKeyValueStore,
  type KeyValueStore,
} from '../core/storage/KeyValueStore';
import {
  KeychainSecureStore,
  type SecureStore,
} from '../core/storage/SecureStore';
import { CatalogRepository } from '../data/CatalogRepository';
import {
  NominatimLocationSearch,
  type LocationSearch,
} from '../data/LocationSearch';
import { OfflineCache } from '../data/OfflineCache';
import { SubmissionService } from '../data/SubmissionService';

/** Everything screens depend on, created once per app launch. */
export interface AppServices {
  config: AppConfig;
  logger: Logger;
  catalog: CatalogRepository;
  submissions: SubmissionService;
  locations: LocationSearch;
  media: MediaUrlResolver;
  rateLimits: RateLimitMonitor;
  deviceSecurity: DeviceSecurityBridge;
  attachments: AttachmentSource | null;
  queryClient: QueryClient;
}

/** Test seams; production builds pass none of these. */
export interface ServiceOverrides {
  fetch?: FetchLike;
  keyValueStore?: KeyValueStore;
  secureStore?: SecureStore;
  logger?: Logger;
  queryClient?: QueryClient;
}

const REQUEST_TIMEOUT_MS = 20_000;

function openKeyValueStore(logger: Logger): KeyValueStore {
  try {
    return new MmkvKeyValueStore();
  } catch (error) {
    logger.warn('Persistent cache unavailable; using memory', {
      error: String(error),
    });
    return new MemoryKeyValueStore();
  }
}

/** Composition root: wires the platform adapter into the shared services. */
export function createAppServices(
  config: AppConfig,
  adapter: PlatformAdapter,
  overrides: ServiceOverrides = {},
): AppServices {
  if (adapter.platform !== config.platform) {
    throw new Error(
      `Platform mismatch: adapter ${adapter.platform}, config ${config.platform}`,
    );
  }

  const logger =
    overrides.logger ?? new ConsoleLogger(config.environment === 'development');
  const rateLimits = new RateLimitMonitor();
  const userAgent = `AzariSolar/${config.appVersion} (${config.platform}; +https://azari.solar)`;

  const api = new ApiClient({
    baseUrl: config.apiBaseUrl,
    timeoutMs: REQUEST_TIMEOUT_MS,
    logger,
    rateLimits,
    userAgent,
    fetch: overrides.fetch,
  });
  const integrityApi = new MobileIntegrityApi(api);
  const integrityProvider = adapter.createIntegrityProvider({
    config,
    secureStore: overrides.secureStore ?? new KeychainSecureStore(),
    integrityApi,
    logger,
  });

  return {
    config,
    logger,
    rateLimits,
    catalog: new CatalogRepository(
      api,
      new OfflineCache(
        overrides.keyValueStore ?? openKeyValueStore(logger),
        logger,
      ),
    ),
    submissions: new SubmissionService(
      new ProtectedApiClient(api, integrityProvider, integrityApi, logger),
    ),
    locations: new NominatimLocationSearch(userAgent, overrides.fetch),
    media: new MediaUrlResolver(config.apiBaseUrl),
    deviceSecurity: adapter.deviceSecurity,
    attachments: adapter.attachmentSource ?? null,
    queryClient:
      overrides.queryClient ??
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 30 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: { retry: false },
        },
      }),
  };
}
