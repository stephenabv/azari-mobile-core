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
import { useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';

const matcher = new PackageMatcher();

export function ProposalSubmittedScreen({
  navigation,
  route,
}: RootScreenProps<'ProposalSubmitted'>) {
  const styles = useThemedStyles(createStyles);
  const { result, property } = route.params;
  const { data: catalog } = usePackages();
  const matches = useMemo(
    () => matcher.match(result, property, catalog ?? []),
    [result, property, catalog],
  );
  const systemLabel = `${result.solarKwp.toFixed(2)} kWp ${
    result.systemType === 'grid-tied' ? 'Grid-Tied' : 'Hybrid'
  }`;

  return (
    <Screen
      footer={<Button label="Close" onPress={() => navigation.goBack()} />}
      testID="proposal-submitted"
    >
      <View style={styles.header}>
        <AppText variant="display" tone="success" accessibilityLabel="Success">
          ✓
        </AppText>
        <AppText variant="title" align="center" accessibilityRole="header">
          Request Submitted
        </AppText>
        <AppText tone="muted" align="center">
          Our renewable energy advisor will review your profile and reach out
          shortly with a tailored proposal.
        </AppText>
      </View>

      <Card style={styles.requirement}>
        <AppText variant="caption" tone="muted">
          Your estimated system requirement
        </AppText>
        <AppText variant="heading">{`${result.solarKwp.toFixed(
          2,
        )} kWp Solar · ${result.inverterKw} kW Inverter`}</AppText>
        <AppText variant="label">
          {result.storageKwh > 0
            ? `${result.storageKwh} kWh Battery`
            : 'No Battery (Grid-Tied)'}
        </AppText>
      </Card>

      {matches.length ? (
        <>
          <AppText
            variant="label"
            style={styles.groupLabel}
          >{`Matching packages for your ${systemLabel}`}</AppText>
          <Grid maxColumns={3} minItemWidth={220}>
            {matches.map((pkg, i) => (
              <Card key={pkg.id} highlighted={i === 0} style={styles.pkg}>
                {i === 0 ? <Badge label="Best Match" /> : null}
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
            ))}
          </Grid>
          <AppText variant="caption" tone="muted" style={styles.disclaimer}>
            Prices are indicative and based on standard configurations. Final
            pricing is subject to site survey and specific requirements.
          </AppText>
        </>
      ) : (
        <Card>
          <AppText>
            {`Your system requirement (${systemLabel}) exceeds our standard catalog. Our engineers will design a custom solution for you.`}
          </AppText>
        </Card>
      )}
    </Screen>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    header: {
      alignItems: 'center',
      gap: t.spacing(2),
      marginBottom: t.spacing(6),
    },
    requirement: { gap: t.spacing(1), marginBottom: t.spacing(6) },
    groupLabel: { marginBottom: t.spacing(3) },
    pkg: { gap: t.spacing(1) },
    disclaimer: { marginTop: t.spacing(4) },
  });
