import React from 'react';
import { useServices } from '../../app/ServicesContext';
import {
  EMPTY_PROPOSAL_FORM,
  proposalValidator,
  type ProposalField,
  type ProposalForm,
} from '../../domain/quotation/ProposalRequest';
import type { RootScreenProps } from '../../navigation/types';
import { Button, LocationField, Notice, TextField } from '../../ui/components';
import { FormSheet } from '../forms/FormSheet';
import { useForm } from '../forms/useForm';
import { useSubmission } from '../forms/useSubmission';
import { useCalculatorDraft } from './CalculatorDraft';

export function ProposalRequestScreen({
  navigation,
}: RootScreenProps<'ProposalRequest'>) {
  const { submissions } = useServices();
  const draft = useCalculatorDraft();
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
          loading={isSubmitting}
          onPress={() => void send()}
          testID="proposal-submit"
        />
      }
      testID="proposal-screen"
    >
      {formError ? <Notice tone="danger" text={formError} /> : null}
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
    </FormSheet>
  );
}
