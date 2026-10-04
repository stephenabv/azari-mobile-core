import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useServices } from '../../app/ServicesContext';
import { usePackages } from '../../data/queries';
import {
  EMPTY_INQUIRY_FORM,
  inquiryValidator,
  type InquiryField,
  type InquiryForm,
} from '../../domain/inquiry/PackageInquiry';
import { PackageConfigurator } from '../../domain/packages/PackageConfigurator';
import { Units } from '../../domain/units/Units';
import type { RootScreenProps } from '../../navigation/types';
import {
  AppText,
  Button,
  Card,
  EmptyView,
  LoadingView,
  LocationField,
  Notice,
  TextField,
} from '../../ui/components';
import { FormSheet } from '../forms/FormSheet';
import { useForm } from '../forms/useForm';
import { useSubmission } from '../forms/useSubmission';

export function PackageInquiryScreen({
  navigation,
  route,
}: RootScreenProps<'PackageInquiry'>) {
  const { submissions } = useServices();
  const { data: packages, isPending } = usePackages();
  const pkg = packages?.find(p => p.id === route.params.packageId) ?? null;
  const selection = route.params.selection;

  const form = useForm<InquiryField, InquiryForm>(
    inquiryValidator,
    EMPTY_INQUIRY_FORM,
  );
  const { submit, isSubmitting, formError } = useSubmission(
    (values: InquiryForm) => {
      if (!pkg) throw new Error('Package unavailable');
      return submissions.packageInquiry(values, pkg, selection);
    },
    form.applyServerErrors,
  );

  if (!pkg)
    return isPending ? (
      <LoadingView />
    ) : (
      <EmptyView title="This package is no longer available." />
    );

  const send = async () => {
    if (!form.validate()) return;
    try {
      await submit(form.values);
      Alert.alert(
        'Inquiry sent',
        'Thank you. Our team will contact you about this package shortly.',
      );
      navigation.goBack();
    } catch {
      // Shown inline by useSubmission.
    }
  };

  const field = (name: InquiryField) => ({
    value: form.values[name],
    error: form.errors[name],
    onChangeText: (v: string) => form.set(name, v),
    onBlur: () => form.touch(name),
  });

  const name = new PackageConfigurator(pkg).displayName;
  const price = selection?.price ?? pkg.totalPrice;

  return (
    <FormSheet
      title="Package Inquiry"
      footer={
        <Button
          label="Submit Inquiry"
          loading={isSubmitting}
          onPress={() => void send()}
          testID="inquiry-submit"
        />
      }
      testID="inquiry-screen"
    >
      <Card style={styles.summary}>
        <AppText variant="heading">{name}</AppText>
        <AppText tone="muted">
          {`${selection?.solarKwp ?? pkg.solarKwp} kWp · ${Units.power(
            selection?.inverterKw ?? pkg.inverterKw,
          )}`}
          {(selection?.storageKwh ?? pkg.storageKwh) > 0
            ? ` · ${Units.energy(selection?.storageKwh ?? pkg.storageKwh)}`
            : ''}
        </AppText>
        {price != null ? (
          <AppText variant="heading" tone="accent">
            {Units.peso(price)}
          </AppText>
        ) : null}
      </Card>
      {formError ? <Notice tone="danger" text={formError} /> : null}
      <TextField
        label="Full name"
        autoComplete="name"
        textContentType="name"
        maxLength={255}
        {...field('name')}
      />
      <LocationField label="Location" maxLength={255} {...field('location')} />
      <TextField
        label="Email address"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        maxLength={120}
        {...field('email')}
      />
      <View>
        <TextField
          label="Phone number"
          prefix="+63"
          keyboardType="number-pad"
          placeholder="9123456789"
          maxLength={10}
          {...field('phone')}
          onChangeText={v =>
            form.set('phone', v.replace(/\D/g, '').slice(0, 10))
          }
        />
      </View>
    </FormSheet>
  );
}

const styles = StyleSheet.create({
  summary: { marginTop: 16, marginBottom: 20, gap: 4 },
});
