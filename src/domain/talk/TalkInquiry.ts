import {
  Email,
  FieldSpec,
  FormValidator,
  MaxLength,
  MinLength,
  PhilippinePhone,
  Required,
} from '../validation/rules';

export type TalkInquiryType = 'general' | 'quote' | 'consultation';

export const TALK_INQUIRY_TYPES: ReadonlyArray<{
  id: TalkInquiryType;
  label: string;
}> = [
  { id: 'general', label: 'General inquiry' },
  { id: 'quote', label: 'Request quotation' },
  { id: 'consultation', label: 'Consultation' },
];

export type TalkField =
  | 'name'
  | 'email'
  | 'phone'
  | 'province'
  | 'city'
  | 'message';
export type TalkForm = Record<TalkField, string> & {
  inquiryType: TalkInquiryType;
};

export const EMPTY_TALK_FORM: TalkForm = {
  name: '',
  email: '',
  phone: '',
  province: '',
  city: '',
  message: '',
  inquiryType: 'general',
};

/** Mirrors the server's `talkInquirySchema`. */
export const talkValidator = new FormValidator<TalkField>({
  name: new FieldSpec([
    new Required('Please enter your name.'),
    new MaxLength(80, 'Name must not exceed 80 characters.'),
  ]),
  email: new FieldSpec([
    new Required('Please enter your email address.'),
    new Email(),
  ]),
  phone: new FieldSpec([
    new Required('Please enter your phone number.'),
    new PhilippinePhone('Please enter a valid Philippine phone number.'),
  ]),
  province: new FieldSpec([
    new Required('Please enter your province.'),
    new MaxLength(80, 'Province is too long.'),
  ]),
  city: new FieldSpec([
    new Required('Please enter your city.'),
    new MaxLength(80, 'City is too long.'),
  ]),
  message: new FieldSpec([
    new Required('Please enter your message.'),
    new MinLength(10, 'Message must be at least 10 characters.'),
    new MaxLength(1000, 'Message must not exceed 1000 characters.'),
  ]),
});

export function buildTalkPayload(form: TalkForm) {
  return {
    name: form.name.trim(),
    email: form.email.trim().toLowerCase(),
    phone: PhilippinePhone.normalize(form.phone),
    province: form.province.trim(),
    city: form.city.trim(),
    inquiryType: form.inquiryType,
    message: form.message.trim(),
  };
}
