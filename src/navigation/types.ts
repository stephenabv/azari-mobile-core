import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { EngineResult } from '../domain/calculation/SolarMath';
import type { PropertyClass } from '../domain/calculation/SizingStrategy';
import type { PackageSelection } from '../domain/packages/PackageConfigurator';
import type { TalkInquiryType } from '../domain/talk/TalkInquiry';

/** Values carried from the home savings calculator, as the website does. */
export interface CalculatorSeed {
  monthlyBill?: number;
  electricRate?: number;
  estimatedMonthlySavings?: number;
}

export type TabParamList = {
  Home: undefined;
  Packages: { brand?: string } | undefined;
  Calculator: CalculatorSeed | undefined;
  Projects: undefined;
  More: undefined;
};

export type LegalKind = 'privacy' | 'terms';

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  ProjectDetail: { id: string };
  PhotoViewer: { images: string[]; index: number; title?: string };
  ClientJourney: undefined;
  PrivacyPolicy: undefined;
  TermsConditions: undefined;
  TalkToExpert: { inquiryType?: TalkInquiryType } | undefined;
  PackageInquiry: { packageId: string; selection: PackageSelection | null };
  ApplianceEditor: { applianceId?: string } | undefined;
  ProposalRequest: undefined;
  ProposalSubmitted: { result: EngineResult; property: PropertyClass };
};

export type RootScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
