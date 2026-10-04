const round = (n: number, dp: number) => Math.round(n * 10 ** dp) / 10 ** dp;

/** Display formatting for capacities and money, matching the website. */
export const Units = {
  power(kw: number): string {
    return Number.isFinite(kw) ? `${round(kw, 6)} kW` : '';
  },

  energy(kwh: number): string {
    return Number.isFinite(kwh) ? `${round(kwh, 6)} kWh` : '';
  },

  panelWatts(kwp: number): string {
    return `${Math.round(kwp * 1000)}W`;
  },

  /** ₱1,234.00 */
  peso(value: number, fractionDigits = 2): string {
    return `₱${Units.grouped(value, fractionDigits)}`;
  },

  /** 1,234 — locale independent so Hermes builds without Intl data render the same. */
  grouped(value: number, fractionDigits = 0): string {
    const fixed = Math.abs(value).toFixed(fractionDigits);
    const [whole = '0', fraction] = fixed.split('.');
    const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${value < 0 ? '-' : ''}${withCommas}${
      fraction ? `.${fraction}` : ''
    }`;
  },
} as const;
