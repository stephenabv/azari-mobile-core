import { z } from 'zod';
import { HttpUrl, LOOPBACK_HOSTS } from '../core/http/HttpUrl';

const semver = z
  .string()
  .regex(/^\d+\.\d+\.\d+$/, 'appVersion must be MAJOR.MINOR.PATCH');

const appConfigSchema = z
  .object({
    platform: z.enum(['ios', 'android']),
    environment: z.enum(['development', 'production']),
    apiBaseUrl: z.string().min(1),
    appVersion: semver,
    storeUrl: z.string().refine(HttpUrl.isHttps, 'storeUrl must be https'),
    playIntegrityCloudProjectNumber: z
      .string()
      .regex(/^\d+$/, 'playIntegrityCloudProjectNumber must be numeric')
      .optional(),
  })
  .strict()
  .superRefine((config, ctx) => {
    const url = HttpUrl.parse(config.apiBaseUrl);
    if (!url || url.query || (url.path && url.path !== '/')) {
      ctx.addIssue({
        code: 'custom',
        path: ['apiBaseUrl'],
        message: 'apiBaseUrl must be an origin',
      });
      return;
    }
    const isLocalDev =
      config.environment === 'development' && LOOPBACK_HOSTS.has(url.host);
    if (url.scheme !== 'https' && !isLocalDev) {
      ctx.addIssue({
        code: 'custom',
        path: ['apiBaseUrl'],
        message:
          'Cleartext HTTP is only allowed against a loopback host in development',
      });
    }
    if (
      config.platform === 'android' &&
      !config.playIntegrityCloudProjectNumber
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['playIntegrityCloudProjectNumber'],
        message: 'playIntegrityCloudProjectNumber is required on Android',
      });
    }
  });

export type AppConfigInput = z.input<typeof appConfigSchema>;
export type AppConfig = Readonly<z.output<typeof appConfigSchema>>;

/**
 * Validates and freezes the shell's public build config. Throws at startup on
 * an unsafe config (cleartext in production, missing Play project) rather than
 * shipping a misconfigured app.
 */
export function createAppConfig(input: AppConfigInput): AppConfig {
  const parsed = appConfigSchema.parse(input);
  return Object.freeze({
    ...parsed,
    apiBaseUrl: parsed.apiBaseUrl.replace(/\/+$/, ''),
  });
}
