// Public API of @azari/mobile-core. App shells import only from here.

export { AzariApp, type AzariAppProps } from './app/AzariApp';
export type { AppServices, ServiceOverrides } from './app/AppServices';
export {
  createAppConfig,
  type AppConfig,
  type AppConfigInput,
} from './config/AppConfig';

export type {
  PlatformAdapter,
  IntegrityProviderContext,
} from './core/platform/PlatformAdapter';
export type {
  AttachmentRules,
  AttachmentResult,
  AttachmentSource,
} from './core/platform/AttachmentSource';
export { checkAttachment } from './core/platform/AttachmentSource';
export {
  DocumentPickerAttachmentSource,
  type DocumentPickerModule,
} from './core/platform/DocumentPickerAttachmentSource';

export type {
  AppAttestBridge,
  DeviceSecurityBridge,
  PlayIntegrityBridge,
  RiskSignals,
} from './core/security/bridges';
export {
  IntegrityProvider,
  IntegrityUnavailableError,
  type ChallengePurpose,
  type IntegrityApi,
  type IntegrityEvidence,
  type MobilePlatform,
} from './core/security/IntegrityProvider';
export { PlayIntegrityProvider } from './core/security/PlayIntegrityProvider';
export { AppAttestIntegrityProvider } from './core/security/AppAttestIntegrityProvider';
export { IntegrityProtocol } from './core/security/IntegrityProtocol';
export type { SecureStore } from './core/storage/SecureStore';
export type { Logger } from './core/logging/Logger';
