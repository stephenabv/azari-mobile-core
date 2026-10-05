import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApplianceEditorScreen } from '../features/calculator/ApplianceEditorScreen';
import { CalculatorScreen } from '../features/calculator/CalculatorScreen';
import { ProposalRequestScreen } from '../features/calculator/ProposalRequestScreen';
import { ProposalSubmittedScreen } from '../features/calculator/ProposalSubmittedScreen';
import { HomeScreen } from '../features/home/HomeScreen';
import { PackageInquiryScreen } from '../features/inquiry/PackageInquiryScreen';
import { ConnectScreen } from '../features/connect/ConnectScreen';
import { ClientJourneyScreen } from '../features/journey/ClientJourneyScreen';
import {
  PrivacyPolicyScreen,
  TermsConditionsScreen,
} from '../features/legal/LegalScreen';
import { MoreScreen } from '../features/more/MoreScreen';
import { PackagesScreen } from '../features/packages/PackagesScreen';
import { PhotoViewerScreen } from '../features/projects/PhotoViewerScreen';
import { ProjectDetailScreen } from '../features/projects/ProjectDetailScreen';
import { ProjectsScreen } from '../features/projects/ProjectsScreen';
import { TalkToExpertScreen } from '../features/talk/TalkToExpertScreen';
import { Icon } from '../ui/icons';
import { TabBarInsetProvider } from '../ui/layout/TabBarInset';
import { useResponsive } from '../ui/responsive/useResponsive';
import { useTheme } from '../ui/theme/ThemeContext';
import { FONTS } from '../ui/theme/theme';
import {
  FloatingTabBar,
  TAB_ICONS,
  floatingTabBarClearance,
} from './FloatingTabBar';
import type { RootStackParamList, TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

/** Rail tabs (expanded widths) reuse the floating bar's icon set. */
const railIcon =
  (name: keyof TabParamList) =>
  ({ color, focused }: { color: string; focused: boolean }) =>
    (
      <Icon
        name={TAB_ICONS[name]}
        size={22}
        strokeWidth={focused ? 2.2 : 1.9}
        color={color}
      />
    );

const tabOptions = (name: keyof TabParamList) => ({
  title: name,
  tabBarAccessibilityLabel: name,
  tabBarIcon: railIcon(name),
});

const renderFloatingTabBar = (props: BottomTabBarProps) => (
  <FloatingTabBar {...props} />
);

function Tabs() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { size } = useResponsive();
  // Tablets in landscape get an icon rail; phones get the floating bar.
  const rail = size === 'expanded';
  return (
    <TabBarInsetProvider
      value={rail ? 0 : floatingTabBarClearance(insets.bottom)}
    >
      <Tab.Navigator
        tabBar={rail ? undefined : renderFloatingTabBar}
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarPosition: rail ? 'left' : 'bottom',
          tabBarVariant: 'material',
          tabBarActiveTintColor: theme.colors.onNight,
          tabBarInactiveTintColor: theme.colors.onNightMuted,
          tabBarActiveBackgroundColor: theme.colors.tabHighlight,
          tabBarStyle: {
            backgroundColor: theme.colors.night,
            borderColor: theme.colors.night,
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={tabOptions('Home')}
        />
        <Tab.Screen
          name="Packages"
          component={PackagesScreen}
          options={tabOptions('Packages')}
        />
        <Tab.Screen
          name="Calculator"
          component={CalculatorScreen}
          options={tabOptions('Calculator')}
        />
        <Tab.Screen
          name="Projects"
          component={ProjectsScreen}
          options={tabOptions('Projects')}
        />
        <Tab.Screen
          name="More"
          component={MoreScreen}
          options={tabOptions('More')}
        />
      </Tab.Navigator>
    </TabBarInsetProvider>
  );
}

export function RootNavigator() {
  const theme = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: theme.colors.accent,
        headerStyle: { backgroundColor: theme.colors.background },
        headerTitleStyle: {
          color: theme.colors.text,
          fontFamily: FONTS.display,
          fontSize: 16,
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.colors.background },
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen
        name="Tabs"
        component={Tabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProjectDetail"
        component={ProjectDetailScreen}
        options={{ title: 'Project' }}
      />
      <Stack.Screen
        name="ClientJourney"
        component={ClientJourneyScreen}
        options={{ title: 'Client Journey' }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ title: 'Privacy Policy' }}
      />
      <Stack.Screen
        name="TermsConditions"
        component={TermsConditionsScreen}
        options={{ title: 'Terms and Conditions' }}
      />
      <Stack.Screen
        name="ConnectWithUs"
        component={ConnectScreen}
        options={{ title: 'Connect with Us' }}
      />
      <Stack.Screen
        name="PhotoViewer"
        component={PhotoViewerScreen}
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'fade',
        }}
      />
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen
          name="TalkToExpert"
          component={TalkToExpertScreen}
          options={{ title: 'Talk to an Expert' }}
        />
        <Stack.Screen
          name="PackageInquiry"
          component={PackageInquiryScreen}
          options={{ title: 'Package Inquiry' }}
        />
        <Stack.Screen
          name="ApplianceEditor"
          component={ApplianceEditorScreen}
          options={{ title: 'Appliance' }}
        />
        <Stack.Screen
          name="ProposalRequest"
          component={ProposalRequestScreen}
          options={{ title: 'Request Proposal' }}
        />
        <Stack.Screen
          name="ProposalSubmitted"
          component={ProposalSubmittedScreen}
          options={{
            title: 'Request Submitted',
            headerBackVisible: false,
            gestureEnabled: false,
          }}
        />
      </Stack.Group>
    </Stack.Navigator>
  );
}
