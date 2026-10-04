import type { ApiClient } from '../core/http/ApiClient';
import {
  parseContent,
  type ContentKey,
  type ContentOf,
} from '../domain/content/SiteContent';
import { orderedSteps, type JourneyStep } from '../domain/journey/JourneyStep';
import type { SolarPackage } from '../domain/packages/types';
import type { Project } from '../domain/projects/Project';
import type { OfflineCache } from './OfflineCache';
import {
  contentResponse,
  journeyResponse,
  mobileConfigResponse,
  packagesResponse,
  projectResponse,
  projectsResponse,
} from './schemas';

const PROJECT_ID = /^[A-Za-z0-9_-]{1,64}$/;

/** Typed view over GET /api/content: every key parsed with its fallback. */
export class SiteContentBundle {
  constructor(private readonly raw: Readonly<Record<string, unknown>>) {}

  get<K extends ContentKey>(key: K): ContentOf<K> {
    return parseContent(key, this.raw[key]);
  }

  /** Home sections default to visible unless the admin switched them off. */
  isVisible(section: string): boolean {
    return (
      (this.get('section-visibility') as Record<string, boolean>)[section] !==
      false
    );
  }

  static empty(): SiteContentBundle {
    return new SiteContentBundle({});
  }
}

export interface MobileRuntimeConfig {
  minimumVersion: { ios: string; android: string };
  integrityPlatforms: string[];
}

/** Read-only public catalog: content, packages, projects and the client journey. */
export class CatalogRepository {
  constructor(
    private readonly client: ApiClient,
    private readonly cache: OfflineCache,
  ) {}

  async content(): Promise<SiteContentBundle> {
    const raw = await this.cache.load('content', async () => {
      const { data } = await this.client.request(
        { method: 'GET', path: '/api/content' },
        contentResponse,
      );
      return (data && typeof data === 'object' ? data : {}) as Record<
        string,
        unknown
      >;
    });
    return new SiteContentBundle(raw);
  }

  async packages(): Promise<SolarPackage[]> {
    return this.cache.load('packages', async () => {
      const { data } = await this.client.request(
        { method: 'GET', path: '/api/packages' },
        packagesResponse,
      );
      return data;
    });
  }

  async projects(): Promise<Project[]> {
    return this.cache.load('projects', async () => {
      const { data } = await this.client.request(
        { method: 'GET', path: '/api/projects' },
        projectsResponse,
      );
      return [...data].sort((a, b) => a.sortOrder - b.sortOrder);
    });
  }

  async project(id: string): Promise<Project> {
    if (!PROJECT_ID.test(id)) throw new Error('Invalid project id');
    return this.cache.load(`project:${id}`, async () => {
      const { data } = await this.client.request(
        { method: 'GET', path: `/api/projects/${id}` },
        projectResponse,
      );
      return data;
    });
  }

  async journey(): Promise<JourneyStep[]> {
    return this.cache.load('journey', async () => {
      const { data } = await this.client.request(
        { method: 'GET', path: '/api/client-journey' },
        journeyResponse,
      );
      return orderedSteps(data);
    });
  }

  /** Not cached: a stale minimum version must never block or unblock the app. */
  async mobileConfig(): Promise<MobileRuntimeConfig> {
    return this.client.request(
      { method: 'GET', path: '/api/mobile/config' },
      mobileConfigResponse,
    );
  }
}
