import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  ELECTRIC_RATE_CONFIG,
  MONTHLY_BILL_CONFIG,
} from '../../domain/calculation/SolarConstants';
import { SolarMath } from '../../domain/calculation/SolarMath';
import { Units } from '../../domain/units/Units';
import type { CalculatorSeed } from '../../navigation/types';
import { AppText, Button, Card, Slider } from '../../ui/components';
import { useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';

/** Home "Calculate Your Savings" card; hands its figures to the full calculator. */
export function SavingsCalculatorCard({
  onGetQuote,
}: {
  onGetQuote: (seed: CalculatorSeed) => void;
}) {
  const styles = useThemedStyles(createStyles);
  const [bill, setBill] = useState(MONTHLY_BILL_CONFIG.defaultValue);
  const [rate, setRate] = useState(ELECTRIC_RATE_CONFIG.defaultValue);
  const estimate = SolarMath.estimateFromBill(bill, rate);
  const size = SolarMath.formatSystemSize(estimate.systemSize);

  return (
    <Card>
      <View style={styles.row}>
        <AppText variant="label">Average Monthly Bill</AppText>
        <AppText variant="heading">{Units.peso(bill, 0)}</AppText>
      </View>
      <Slider
        value={bill}
        {...MONTHLY_BILL_CONFIG}
        onChange={setBill}
        accessibilityLabel="Average monthly bill"
        formatValue={v => Units.peso(v, 0)}
      />
      <View style={styles.row}>
        <AppText variant="label">Electricity Rate</AppText>
        <AppText variant="heading">{`${Units.peso(rate)} / kWh`}</AppText>
      </View>
      <Slider
        value={rate}
        {...ELECTRIC_RATE_CONFIG}
        onChange={setRate}
        accessibilityLabel="Electricity rate per kilowatt hour"
        formatValue={v => `${Units.peso(v)} per kWh`}
      />
      <View style={styles.result}>
        <AppText variant="caption" tone="muted">
          ESTIMATED SYSTEM SIZE
        </AppText>
        <AppText variant="display">
          {size.value} <AppText variant="heading">{size.unit}</AppText>
        </AppText>
      </View>
      <Button
        label="Get This System Quote"
        onPress={() =>
          onGetQuote({
            monthlyBill: bill,
            electricRate: rate,
            estimatedMonthlySavings: estimate.estimatedMonthlySavings,
          })
        }
      />
      <AppText variant="caption" tone="muted" style={styles.note}>
        *Estimates are based on the selected electricity rate and average
        Philippine solar irradiance. Actual results may vary.
      </AppText>
    </Card>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: t.spacing(2),
      gap: t.spacing(2),
      flexWrap: 'wrap',
    },
    result: { alignItems: 'center', marginVertical: t.spacing(5) },
    note: { marginTop: t.spacing(3) },
  });
