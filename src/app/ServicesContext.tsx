import React, {
  createContext,
  useContext,
  type PropsWithChildren,
} from 'react';
import type { AppServices } from './AppServices';

const ServicesContext = createContext<AppServices | null>(null);

export function ServicesProvider({
  services,
  children,
}: PropsWithChildren<{ services: AppServices }>) {
  return (
    <ServicesContext.Provider value={services}>
      {children}
    </ServicesContext.Provider>
  );
}

export function useServices(): AppServices {
  const services = useContext(ServicesContext);
  if (!services) throw new Error('useServices must be used inside <AzariApp>');
  return services;
}
