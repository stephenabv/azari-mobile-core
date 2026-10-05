import { homeRows, type HomeSectionDefinition } from '../sections';

const section = (
  visibilityKey: string,
  span?: 'half',
): HomeSectionDefinition => ({ visibilityKey, Component: () => null, span });

const keys = (rows: HomeSectionDefinition[][]) =>
  rows.map(row => row.map(s => s.visibilityKey));

describe('homeRows', () => {
  const sections = [
    section('stories'),
    section('hero', 'half'),
    section('quick', 'half'),
    section('packages'),
  ];

  it('pairs adjacent half sections on tablets', () => {
    expect(keys(homeRows(sections, true))).toEqual([
      ['stories'],
      ['hero', 'quick'],
      ['packages'],
    ]);
  });

  it('stacks every section on phones', () => {
    expect(keys(homeRows(sections, false))).toEqual([
      ['stories'],
      ['hero'],
      ['quick'],
      ['packages'],
    ]);
  });

  it('leaves a half section alone when its partner is hidden', () => {
    expect(
      keys(homeRows([section('hero', 'half'), section('packages')], true)),
    ).toEqual([['hero'], ['packages']]);
  });
});
