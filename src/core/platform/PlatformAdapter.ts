import type { AppConfig } from '../../config/AppConfig';
import type { Logger } from '../logging/Logger';
import type { DeviceSecurityBridge } from '../security/bridges';
import type {
  IntegrityApi,
  IntegrityProvider,
  MobilePlatform,
} from '../security/IntegrityProvider';
import type { SecureStore } from '../storage/SecureStore';
import type { AttachmentSource } from './AttachmentSource';

export interface IntegrityProviderContext {
  config: AppConfig;
  secureStore: SecureStore;
  integrityApi: IntegrityApi;
  logger: Logger;
}

/**
 * Everything platform specific the shared core needs, supplied by each app
 * shell. The core depends only on these abstractions.
 */
export interface PlatformAdapter {
  platform: MobilePlatform;
  deviceSecurity: DeviceSecurityBridge;
  createIntegrityProvider(context: IntegrityProviderContext): IntegrityProvider;
  /** File picker for bill uploads. When absent, the upload option is hidden. */
  attachmentSource?: AttachmentSource;
}
