import { SolarMath } from '../calculation/SolarMath';
import type { PackageSelection } from '../packages/PackageConfigurator';
import type { SolarPackage } from '../packages/types';
import {
  Email,
  FieldSpec,
  FormValidator,
  MaxLength,
  Pattern,
  Required,
} from '../validation/rules';

export type InquiryField = 'name' | 'location' | 'email' | 'phone';
export type InquiryForm = Record<InquiryField, string>;

export const EMPTY_INQUIRY_FORM: InquiryForm = {
  name: '',
  location: '',
  email: '',
  phone: '',
};

/** The phone field holds the 10 digits after the fixed +63 prefix, as on the website. */
export const inquiryValidator = new FormValidator<InquiryField>({
  name: new FieldSpec([
    new Required('Name is required.'),
    new MaxLength(255, 'Name is too long.'),
  ]),
  location: new FieldSpec([
    new Required('Location is required.'),
    new MaxLength(255, 'Location is too long.'),
  ]),
  email: new FieldSpec([new Required('Email is required.'), new Email()]),
  phone: new FieldSpec([
    new Required('Phone number is required.'),
    new Pattern(/^9\d{9}$/, 'Enter a valid 10-digit number starting with 9.'),
  ]),
});

export function buildInquiryPayload(
  form: InquiryForm,
  pkg: SolarPackage,
  selection: PackageSelection | null,
) {
  const savings = selection?.savings ?? SolarMath.packageSavings(pkg.solarKwp);
  return {
    name: form.name.trim(),
    email: form.email.trim().toLowerCase(),
    phone: `+63${form.phone.trim()}`,
    location: form.location.trim(),
    packageId: pkg.id,
    packageName: pkg.name,
    packageDetails: {
      solarKwp: selection?.solarKwp ?? pkg.solarKwp,
      inverterKw: selection?.inverterKw ?? pkg.inverterKw,
      storageKwh: selection?.storageKwh ?? pkg.storageKwh,
      phase: pkg.phase,
      billRangeMin: savings.min,
      billRangeMax: savings.max,
      totalPrice: selection ? selection.price : pkg.totalPrice,
      ...(selection
        ? { qty: selection.qty, components: selection.components }
        : {}),
    },
  };
}
