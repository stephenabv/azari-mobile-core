/** A single check on a trimmed string value. Returns an error message or null. */
export interface Rule {
  check(value: string): string | null;
}

export class Required implements Rule {
  constructor(private readonly message: string) {}
  check(value: string): string | null {
    return value.trim() ? null : this.message;
  }
}

export class MinLength implements Rule {
  constructor(private readonly min: number, private readonly message: string) {}
  check(value: string): string | null {
    return value.trim().length >= this.min ? null : this.message;
  }
}

export class MaxLength implements Rule {
  constructor(private readonly max: number, private readonly message: string) {}
  check(value: string): string | null {
    return value.trim().length <= this.max ? null : this.message;
  }
}

export class Pattern implements Rule {
  constructor(
    private readonly pattern: RegExp,
    private readonly message: string,
  ) {}
  check(value: string): string | null {
    return this.pattern.test(value.trim()) ? null : this.message;
  }
}

/** Same blocklist as the server (`schemas/shared.ts`). */
export const BLOCKED_EMAIL_DOMAINS: ReadonlySet<string> = new Set([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'yopmail.com',
  'fakeinbox.com',
]);

export class Email implements Rule {
  private static readonly SHAPE =
    /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

  check(value: string): string | null {
    const email = value.trim().toLowerCase();
    if (email.length > 120) return 'Email must not exceed 120 characters.';
    if (!Email.SHAPE.test(email)) return 'Please enter a valid email address.';
    const domain = email.split('@')[1];
    if (domain && BLOCKED_EMAIL_DOMAINS.has(domain)) {
      return 'Disposable or temporary email domains are not allowed.';
    }
    return null;
  }
}

/** Mobile (+639…/09…) or landline numbers, as accepted by the server. */
export class PhilippinePhone implements Rule {
  static readonly PATTERN = /^((\+63|0)9\d{9}|(\+63|0)?[2-8]\d{6,9})$/;

  constructor(
    private readonly message = 'Enter a valid phone number, e.g. 09123456789 or +639123456789.',
  ) {}

  static normalize(value: string): string {
    return value.trim().replace(/[\s-]/g, '');
  }

  check(value: string): string | null {
    return PhilippinePhone.PATTERN.test(PhilippinePhone.normalize(value))
      ? null
      : this.message;
  }
}

/** Runs rules in order and reports the first failure. */
export class FieldSpec {
  constructor(private readonly rules: readonly Rule[]) {}

  /** Optional fields skip every rule while empty. */
  static optional(rules: readonly Rule[]): FieldSpec {
    return new OptionalFieldSpec(rules);
  }

  validate(value: string): string | null {
    for (const rule of this.rules) {
      const error = rule.check(value);
      if (error) return error;
    }
    return null;
  }
}

class OptionalFieldSpec extends FieldSpec {
  override validate(value: string): string | null {
    return value.trim() ? super.validate(value) : null;
  }
}

export type FieldErrors<F extends string> = Partial<Record<F, string>>;

/** Validates a whole form from a declarative field → spec map. */
export class FormValidator<F extends string> {
  constructor(private readonly specs: Readonly<Record<F, FieldSpec>>) {}

  field(field: F, value: string): string | null {
    return this.specs[field].validate(value);
  }

  all(values: Readonly<Record<F, string>>): FieldErrors<F> {
    const errors: FieldErrors<F> = {};
    (Object.keys(this.specs) as F[]).forEach(field => {
      const error = this.field(field, values[field]);
      if (error) errors[field] = error;
    });
    return errors;
  }

  static isValid<F extends string>(errors: FieldErrors<F>): boolean {
    return Object.keys(errors).length === 0;
  }
}
