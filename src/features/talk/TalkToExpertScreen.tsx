import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useServices } from '../../app/ServicesContext';
import {
  EMPTY_TALK_FORM,
  TALK_INQUIRY_TYPES,
  talkValidator,
  type TalkField,
  type TalkForm,
} from '../../domain/talk/TalkInquiry';
import type { RootScreenProps } from '../../navigation/types';
import {
  AppText,
  Button,
  Chip,
  LocationField,
  Notice,
  TextField,
} from '../../ui/components';
import { FormSheet } from '../forms/FormSheet';
import { useForm } from '../forms/useForm';
import { useSubmission } from '../forms/useSubmission';

export function TalkToExpertScreen({
  navigation,
  route,
}: RootScreenProps<'TalkToExpert'>) {
  const { submissions } = useServices();
  const [initial] = useState<TalkForm>(() => ({
    ...EMPTY_TALK_FORM,
    inquiryType: route.params?.inquiryType ?? 'general',
  }));
  const form = useForm<TalkField, TalkForm>(talkValidator, initial);
  const { submit, isSubmitting, formError } = useSubmission(
    (values: TalkForm) => submissions.talkToExpert(values),
    form.applyServerErrors,
  );

  const send = async () => {
    if (!form.validate()) return;
    try {
      await submit(form.values);
      Alert.alert(
        'Message sent',
        'Thank you. One of our solar experts will get back to you shortly.',
      );
      navigation.goBack();
    } catch {
      // Shown inline by useSubmission.
    }
  };

  const field = (name: TalkField) => ({
    value: form.values[name],
    error: form.errors[name],
    onChangeText: (v: string) => form.set(name, v),
    onBlur: () => form.touch(name),
  });

  return (
    <FormSheet
      title="Talk to an Expert"
      subtitle="Tell us about your energy needs and we will reach out."
      footer={
        <Button
          label="Send Message"
          loading={isSubmitting}
          onPress={() => void send()}
          testID="talk-submit"
        />
      }
      testID="talk-screen"
    >
      {formError ? <Notice tone="danger" text={formError} /> : null}
      <AppText variant="label">Inquiry type</AppText>
      <View style={styles.types}>
        {TALK_INQUIRY_TYPES.map(t => (
          <Chip
            key={t.id}
            label={t.label}
            selected={form.values.inquiryType === t.id}
            onPress={() => form.replace({ ...form.values, inquiryType: t.id })}
          />
        ))}
      </View>
      <TextField
        label="Full name"
        autoComplete="name"
        textContentType="name"
        maxLength={80}
        {...field('name')}
      />
      <TextField
        label="Email address"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        maxLength={120}
        {...field('email')}
      />
      <TextField
        label="Phone number"
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        placeholder="09123456789"
        maxLength={16}
        {...field('phone')}
      />
      <LocationField
        label="City"
        maxLength={80}
        {...field('city')}
        onSelect={s => {
          form.set('city', (s.city ?? s.label).slice(0, 80));
          if (s.province) form.set('province', s.province.slice(0, 80));
        }}
      />
      <TextField label="Province" maxLength={80} {...field('province')} />
      <TextField
        label="Message"
        multiline
        maxLength={1000}
        helper={`${form.values.message.trim().length}/1000`}
        {...field('message')}
      />
    </FormSheet>
  );
}

const styles = StyleSheet.create({
  types: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
});
