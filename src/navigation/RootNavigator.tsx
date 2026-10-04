import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet } from 'react-native';
import { ApplianceEditorScreen } from '../features/calculator/ApplianceEditorScreen';
import { CalculatorScreen } from '../features/calculator/CalculatorScreen';
import { ProposalRequestScreen } from '../features/calculator/ProposalRequestScreen';
import { ProposalSubmittedScreen } from '../features/calculator/ProposalSubmittedScreen';
import { HomeScreen } from '../features/home/HomeScreen';
import { PackageInquiryScreen } from '../features/inquiry/PackageInquiryScreen';
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
import { AppText } from '../ui/components';
import { useResponsive } from '../ui/responsive/useResponsive';
import { useTheme } from '../ui/theme/ThemeContext';
import type { RootStackParamList, TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TAB_GLYPHS: Record<keyof TabParamList, string> = {
  Home: '⌂',
  Packages: '▦',
  Calculator: '∑',
  Projects: '◧',
  More: '≡',
};

/** Text glyph icons keep the app free of an icon font dependency. */
const tabOptions = (name: keyof TabParamList) => ({
  title: name,
  tabBarAccessibilityLabel: name,
  tabBarIcon: ({ color }: { color: string }) => (
    <AppText style={[styles.glyph, { color }]} accessible={false}>
      {TAB_GLYPHS[name]}
    </AppText>
  ),
});

function Tabs() {
  const theme = useTheme();
  const { size } = useResponsive();
  // Tablets in landscape get a side rail; phones keep the bottom bar.
  const rail = size === 'expanded';
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarPosition: rail ? 'left' : 'bottom',
        tabBarVariant: rail ? 'material' : 'uikit',
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
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
  );
}

export function RootNavigator() {
  const theme = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: theme.colors.accent,
        headerStyle: { backgroundColor: theme.colors.background },
        headerTitleStyle: { color: theme.colors.text },
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

const styles = StyleSheet.create({ glyph: { fontSize: 20, lineHeight: 24 } });
