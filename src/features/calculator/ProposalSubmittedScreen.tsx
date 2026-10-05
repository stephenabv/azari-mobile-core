import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { usePackages } from '../../data/queries';
import { PackageMatcher } from '../../domain/packages/PackageMatcher';
import { Units } from '../../domain/units/Units';
import type { RootScreenProps } from '../../navigation/types';
import {
  AppText,
  Badge,
  Button,
  Card,
  Grid,
  Screen,
} from '../../ui/components';
import { Icon, type IconName } from '../../ui/icons';
import { FadeIn, Pulse } from '../../ui/motion';
import { useTheme, useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';

const matcher = new PackageMatcher();

export function ProposalSubmittedScreen({
  navigation,
  route,
}: RootScreenProps<'ProposalSubmitted'>) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const { result, property } = route.params;
  const { data: catalog } = usePackages();
  const matches = useMemo(
    () => matcher.match(result, property, catalog ?? []),
    [result, property, catalog],
  );
  const systemLabel = `${result.solarKwp.toFixed(2)} kWp ${
    result.systemType === 'grid-tied' ? 'Grid-Tied' : 'Hybrid'
  }`;

  const requirement: ReadonlyArray<{
    icon: IconName;
    label: string;
    value: string;
  }> = [
    { icon: 'sun', label: 'Solar', value: `${result.solarKwp.toFixed(2)} kWp` },
    { icon: 'bolt', label: 'Inverter', value: `${result.inverterKw} kW` },
    {
      icon: 'battery',
      label: 'Battery',
      value:
        result.storageKwh > 0
          ? `${result.storageKwh} kWh`
          : 'No Battery (Grid-Tied)',
    },
  ];

  return (
    <Screen
      footer={<Button label="Close" onPress={() => navigation.goBack()} />}
      testID="proposal-submitted"
    >
      <View style={styles.header}>
        <View style={styles.badgeWrap}>
          <Pulse style={styles.halo} maxScale={1.25}>
            <View style={styles.haloFill} />
          </Pulse>
          <FadeIn direction="none" fromScale={0.4} style={styles.check}>
            <View accessible accessibilityLabel="Success">
              <Icon name="check" size={30} color={colors.onAccent} />
            </View>
          </FadeIn>
        </View>
        <FadeIn index={1}>
          <AppText variant="display" align="center" accessibilityRole="header">
            Request Submitted
          </AppText>
        </FadeIn>
        <FadeIn index={2}>
          <AppText tone="muted" align="center">
            Our renewable energy advisor will review your profile and reach out
            shortly with a tailored proposal.
          </AppText>
        </FadeIn>
      </View>

      <FadeIn index={3}>
        <Card tone="night" style={styles.requirement}>
          <AppText variant="caption" tone="onNightMuted">
            Your estimated system requirement
          </AppText>
          <AppText variant="title" tone="onNight">
            {systemLabel}
          </AppText>
          <View style={styles.reqRow}>
            {requirement.map(item => (
              <View
                key={item.label}
                style={styles.reqTile}
                accessible
                accessibilityLabel={`${item.label}: ${item.value}`}
              >
                <Icon name={item.icon} size={16} color={colors.sun} />
                <AppText variant="caption" tone="onNightMuted">
                  {item.label}
                </AppText>
                <AppText variant="label" tone="onNight">
                  {item.value}
                </AppText>
              </View>
            ))}
          </View>
        </Card>
      </FadeIn>

      {matches.length ? (
        <>
          <AppText
            variant="heading"
            style={styles.groupLabel}
          >{`Matching packages for your ${systemLabel}`}</AppText>
          <Grid maxColumns={3} minItemWidth={220}>
            {matches.map((pkg, i) => (
              <FadeIn key={pkg.id} index={i + 4}>
                <Card highlighted={i === 0} style={styles.pkg}>
                  <View style={styles.pkgTop}>
                    <View style={styles.pkgIcon}>
                      <Icon
                        name="sun"
                        size={18}
                        color={i === 0 ? colors.onAccent : colors.accentText}
                      />
                    </View>
                    {i === 0 ? <Badge label="Best Match" /> : null}
                  </View>
                  <AppText variant="heading">{pkg.name}</AppText>
                  <AppText variant="caption" tone="muted">
                    {`${pkg.solarKwp} kWp · ${pkg.inverterKw} kW · ${pkg.storageKwh} kWh`}
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    {`${
                      pkg.phase === 'single' ? 'Single Phase' : 'Three Phase'
                    } · ${pkg.storageKwh > 0 ? 'Hybrid' : 'Grid-Tied'}`}
                  </AppText>
                  {pkg.totalPrice != null ? (
                    <AppText
                      variant="label"
                      tone="accent"
                    >{`Starting at ${Units.peso(pkg.totalPrice, 0)}`}</AppText>
                  ) : null}
                  <AppText variant="caption" tone="muted">
                    {`For bills ${Units.peso(pkg.billRangeMin, 0)}–${Units.peso(
                      pkg.billRangeMax,
                      0,
                    )}/mo`}
                  </AppText>
                </Card>
              </FadeIn>
            ))}
          </Grid>
          <AppText variant="caption" tone="muted" style={styles.disclaimer}>
            Prices are indicative and based on standard configurations. Final
            pricing is subject to site survey and specific requirements.
          </AppText>
        </>
      ) : (
        <FadeIn index={4}>
          <Card style={styles.custom}>
            <View style={styles.pkgIcon}>
              <Icon name="factory" size={18} color={colors.accentText} />
            </View>
            <AppText>
              {`Your system requirement (${systemLabel}) exceeds our standard catalog. Our engineers will design a custom solution for you.`}
            </AppText>
          </Card>
        </FadeIn>
      )}
    </Screen>
  );
}

const BADGE = 64;

const createStyles = (t: Theme) =>
  StyleSheet.create({
    header: {
      alignItems: 'center',
      gap: t.spacing(2),
      marginTop: t.spacing(4),
      marginBottom: t.spacing(6),
    },
    badgeWrap: {
      width: BADGE + 24,
      height: BADGE + 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: t.spacing(2),
    },
    halo: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
    haloFill: {
      flex: 1,
      borderRadius: (BADGE + 24) / 2,
      backgroundColor: t.colors.accentSoft,
    },
    check: {
      width: BADGE,
      height: BADGE,
      borderRadius: BADGE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.accent,
    },
    requirement: {
      gap: t.spacing(1),
      padding: t.spacing(5),
      marginBottom: t.spacing(6),
      borderRadius: t.radius.xl,
    },
    reqRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: t.spacing(2),
      marginTop: t.spacing(3),
    },
    reqTile: {
      flexGrow: 1,
      flexBasis: 90,
      gap: 2,
      padding: t.spacing(3),
      borderRadius: t.radius.md,
      backgroundColor: 'rgba(255,255,255,0.08)',
    },
    groupLabel: { marginBottom: t.spacing(3) },
    pkg: { gap: t.spacing(1), flexGrow: 1 },
    pkgTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: t.spacing(1),
    },
    pkgIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.accentSoft,
    },
    custom: { flexDirection: 'row', alignItems: 'center', gap: t.spacing(3) },
    disclaimer: { marginTop: t.spacing(4) },
  });
