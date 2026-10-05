import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useServices } from '../../app/ServicesContext';
import {
  EMPTY_PROPOSAL_FORM,
  proposalValidator,
  type ProposalField,
  type ProposalForm,
} from '../../domain/quotation/ProposalRequest';
import type { RootScreenProps } from '../../navigation/types';
import {
  AppText,
  Button,
  Card,
  LocationField,
  Notice,
  TextField,
} from '../../ui/components';
import { Icon } from '../../ui/icons';
import { FadeIn } from '../../ui/motion';
import { useTheme, useThemedStyles } from '../../ui/theme/ThemeContext';
import type { Theme } from '../../ui/theme/theme';
import { FormSheet } from '../forms/FormSheet';
import { useForm } from '../forms/useForm';
import { useSubmission } from '../forms/useSubmission';
import { useCalculatorDraft } from './CalculatorDraft';
import { formatResult } from './SystemResult';

export function ProposalRequestScreen({
  navigation,
}: RootScreenProps<'ProposalRequest'>) {
  const { submissions } = useServices();
  const draft = useCalculatorDraft();
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const summary = formatResult(draft.result);
  const form = useForm<ProposalField, ProposalForm>(
    proposalValidator,
    EMPTY_PROPOSAL_FORM,
  );
  const { submit, isSubmitting, formError, setFormError } = useSubmission(
    async (customer: ProposalForm) => {
      const { strategy, input, result, values, billApplies } = draft;
      if (!result) throw new Error('No computed system');
      await submissions.proposal(
        {
          strategy,
          property: values.property,
          input,
          result,
          appliances: values.appliances,
          customer,
        },
        billApplies ? values.bill : null,
      );
    },
    form.applyServerErrors,
  );

  const send = async () => {
    const notReady = draft.readinessError();
    if (notReady) {
      setFormError(notReady);
      return;
    }
    if (!form.validate() || !draft.result) return;
    const result = draft.result;
    const property = draft.values.property;
    try {
      await submit(form.values);
      draft.reset();
      navigation.replace('ProposalSubmitted', { result, property });
    } catch {
      // Shown inline by useSubmission.
    }
  };

  const field = (name: ProposalField) => ({
    value: form.values[name],
    error: form.errors[name],
    onChangeText: (v: string) => form.set(name, v),
    onBlur: () => form.touch(name),
  });

  return (
    <FormSheet
      title="Request Proposal"
      subtitle="You're almost there! Provide your details below so our team can finalize your custom solar proposal and reach out to schedule your free site assessment."
      footer={
        <Button
          label="Submit Request"
          icon="arrowRight"
          loading={isSubmitting}
          onPress={() => void send()}
          testID="proposal-submit"
        />
      }
      testID="proposal-screen"
    >
      <FadeIn style={styles.summary}>
        <View style={styles.summaryIcon}>
          <Icon name="sun" size={20} color={colors.onAccent} />
        </View>
        <View
          style={styles.summaryText}
          accessible
          accessibilityLabel={`Your system: ${summary.solar}, ${summary.inverter}, ${summary.storage}`}
        >
          <AppText variant="caption" tone="onNightMuted">
            {`Your system · ${draft.values.property}`}
          </AppText>
          <AppText variant="heading" tone="onNight">
            {summary.solar}
          </AppText>
          <AppText variant="caption" tone="onNightMuted">
            {`${summary.inverter} · ${summary.storage}`}
          </AppText>
        </View>
      </FadeIn>
      {formError ? <Notice tone="danger" text={formError} /> : null}
      <FadeIn index={1}>
        <Card style={styles.fields}>
          <View style={styles.fieldsHeader}>
            <Icon name="document" size={18} color={colors.accentText} />
            <AppText variant="heading">Your details</AppText>
          </View>
          <TextField
            label="Name"
            placeholder="Juan Dela Cruz"
            autoComplete="name"
            textContentType="name"
            maxLength={80}
            {...field('fullName')}
          />
          <LocationField
            label="Location"
            placeholder="Search location or enter your address"
            maxLength={160}
            {...field('location')}
          />
          <TextField
            label="Email"
            placeholder="name@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            maxLength={120}
            {...field('email')}
          />
          <TextField
            label="Phone"
            placeholder="+63 912 345 6789"
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            maxLength={20}
            {...field('phone')}
          />
          <TextField
            label="Additional notes"
            optional
            multiline
            maxLength={500}
            placeholder="Tell us more about your property or energy requirements."
            {...field('message')}
          />
        </Card>
      </FadeIn>
    </FormSheet>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    summary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing(3),
      padding: t.spacing(4),
      marginBottom: t.spacing(4),
      borderRadius: t.radius.lg,
      backgroundColor: t.colors.night,
    },
    summaryIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.accent,
    },
    summaryText: { flex: 1, gap: 2 },
    fields: { padding: t.spacing(4) },
    fieldsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing(2),
      marginBottom: t.spacing(3),
    },
  });
