/** Public package catalog as served by GET /api/packages. */

export interface SolarComponent {
  id: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  unitPrice: number | null;
  pricingEnabled: boolean;
  productionCapacityKwp: number;
  loadCapacityKw: number;
  storageCapacityKwh: number;
  parallelMax: number;
  pvMinPower: number | null;
  pvMaxPower: number | null;
  batteryMaxCapacity: number | null;
  dataSheetUrl: string | null;
}

export interface PackageComponentLine {
  componentId: string;
  quantity: number;
  baseComponentId: string | null;
  multiplier: number | null;
  component: SolarComponent;
}

export interface IpRating {
  code: string;
  description: string;
}

export type Phase = 'single' | 'three';

export interface SolarPackage {
  id: string;
  name: string;
  solarKwp: number;
  inverterKw: number;
  storageKwh: number;
  phase: Phase;
  totalPrice: number | null;
  billRangeMin: number;
  billRangeMax: number;
  isActive: boolean;
  isRecommended: boolean;
  sortOrder: number | null;
  ipRating: IpRating | null;
  imageUrl: string | null;
  mainFeatures: string[];
  components: PackageComponentLine[];
  createdAt: string;
}

export const COMPONENT_CATEGORY = Object.freeze({
  inverter: 'Inverter',
  battery: 'Battery',
  panel: 'Solar Panel',
});
