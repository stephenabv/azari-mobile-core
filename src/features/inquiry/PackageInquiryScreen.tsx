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
  EmptyView,
  LoadingView,
  LocationField,
  Notice,
  TextField,
} from '../../ui/components';
import { SunRays } from '../../ui/brand';
import { Icon } from '../../ui/icons';
import { FadeIn } from '../../ui/motion';
import { useTheme, useThemedStyles } from '../../ui/theme/ThemeContext';
import { FONTS, type Theme } from '../../ui/theme/theme';
import { FormSheet } from '../forms/FormSheet';
import { useForm } from '../forms/useForm';
import { useSubmission } from '../forms/useSubmission';

export function PackageInquiryScreen({
  navigation,
  route,
}: RootScreenProps<'PackageInquiry'>) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
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

  const specs = [
    `${selection?.solarKwp ?? pkg.solarKwp} kWp`,
    Units.power(selection?.inverterKw ?? pkg.inverterKw),
    (selection?.storageKwh ?? pkg.storageKwh) > 0
      ? Units.energy(selection?.storageKwh ?? pkg.storageKwh)
      : null,
  ].filter((spec): spec is string => spec !== null);

  return (
    <FormSheet
      title="Package Inquiry"
      footer={
        <Button
          label="Submit Inquiry"
          icon="arrowRight"
          loading={isSubmitting}
          onPress={() => void send()}
          testID="inquiry-submit"
        />
      }
      testID="inquiry-screen"
    >
      <FadeIn index={0} style={styles.summary}>
        <View style={styles.rays} pointerEvents="none">
          <SunRays
            size={150}
            color={theme.colors.sun}
            withCore={false}
            rayOpacity={0.2}
          />
        </View>
        <AppText variant="caption" tone="onNightMuted" style={styles.eyebrow}>
          YOUR PACKAGE
        </AppText>
        <AppText variant="title" tone="onNight">
          {name}
        </AppText>
        <View style={styles.specs} accessibilityLabel={specs.join(', ')}>
          {specs.map(spec => (
            <View key={spec} style={styles.spec}>
              <AppText variant="caption" tone="onNight">
                {spec}
              </AppText>
            </View>
          ))}
        </View>
        {price != null ? (
          <AppText variant="display" style={styles.price}>
            {Units.peso(price)}
          </AppText>
        ) : null}
      </FadeIn>
      {formError ? <Notice tone="danger" text={formError} /> : null}
      <FadeIn index={1} style={styles.form}>
        <AppText variant="heading" style={styles.formTitle}>
          Your details
        </AppText>
        <TextField
          label="Full name"
          autoComplete="name"
          textContentType="name"
          maxLength={255}
          {...field('name')}
        />
        <LocationField
          label="Location"
          maxLength={255}
          {...field('location')}
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
          prefix="+63"
          keyboardType="number-pad"
          placeholder="9123456789"
          maxLength={10}
          {...field('phone')}
          onChangeText={v =>
            form.set('phone', v.replace(/\D/g, '').slice(0, 10))
          }
        />
      </FadeIn>
      <View style={styles.reassure}>
        <Icon name="shield" size={14} color={theme.colors.textMuted} />
        <AppText variant="caption" tone="muted" style={styles.reassureText}>
          Our team will contact you about this package shortly.
        </AppText>
      </View>
    </FormSheet>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    summary: {
      marginTop: t.spacing(4),
      marginBottom: t.spacing(5),
      padding: t.spacing(5),
      gap: t.spacing(1.5),
      borderRadius: t.radius.xl,
      backgroundColor: t.colors.night,
      overflow: 'hidden',
    },
    rays: { position: 'absolute', right: -50, top: -50 },
    eyebrow: { letterSpacing: 1, fontFamily: FONTS.semibold },
    specs: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: t.spacing(1.5),
      marginTop: t.spacing(1),
    },
    spec: {
      paddingHorizontal: t.spacing(2.5),
      paddingVertical: t.spacing(1),
      borderRadius: t.radius.pill,
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
    price: { color: t.colors.sun, marginTop: t.spacing(2) },
    form: {
      borderRadius: t.radius.lg,
      backgroundColor: t.colors.surfaceRaised,
      padding: t.spacing(4),
      paddingBottom: 0,
      ...(t.dark
        ? {
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.colors.border,
          }
        : t.elevation),
    },
    formTitle: { marginBottom: t.spacing(3) },
    reassure: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing(2),
      marginTop: t.spacing(4),
      paddingHorizontal: t.spacing(1),
    },
    reassureText: { flex: 1 },
  });
