import { useQuery } from '@tanstack/react-query';
import { useServices } from '../app/ServicesContext';

/** Query keys in one place so invalidation and prefetching stay consistent. */
export const queryKeys = {
  content: ['content'] as const,
  packages: ['packages'] as const,
  projects: ['projects'] as const,
  project: (id: string) => ['projects', id] as const,
  journey: ['client-journey'] as const,
  mobileConfig: ['mobile-config'] as const,
};

export function useSiteContent() {
  const { catalog } = useServices();
  return useQuery({
    queryKey: queryKeys.content,
    queryFn: () => catalog.content(),
  });
}

export function usePackages() {
  const { catalog } = useServices();
  return useQuery({
    queryKey: queryKeys.packages,
    queryFn: () => catalog.packages(),
  });
}

export function useProjects() {
  const { catalog } = useServices();
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: () => catalog.projects(),
  });
}

export function useProject(id: string) {
  const { catalog } = useServices();
  return useQuery({
    queryKey: queryKeys.project(id),
    queryFn: () => catalog.project(id),
  });
}

export function useJourney() {
  const { catalog } = useServices();
  return useQuery({
    queryKey: queryKeys.journey,
    queryFn: () => catalog.journey(),
  });
}

export function useMobileConfig() {
  const { catalog } = useServices();
  return useQuery({
    queryKey: queryKeys.mobileConfig,
    queryFn: () => catalog.mobileConfig(),
    staleTime: 60 * 60 * 1000,
    retry: 2,
  });
}
