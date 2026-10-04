import type { Project } from './Project';

/** A tab on the projects screen. New categories appear automatically from data. */
export abstract class ProjectFilter {
  abstract readonly id: string;
  abstract readonly label: string;
  abstract matches(project: Project): boolean;

  apply(projects: readonly Project[]): Project[] {
    return projects.filter(p => this.matches(p));
  }
}

export class AllProjectsFilter extends ProjectFilter {
  readonly id = 'all';
  readonly label = 'All Projects';
  matches(): boolean {
    return true;
  }
}

export class RecentProjectsFilter extends ProjectFilter {
  readonly id = 'recent';
  readonly label = 'Recent Projects';
  matches(project: Project): boolean {
    return project.isRecent;
  }
}

export class CategoryProjectsFilter extends ProjectFilter {
  readonly id: string;
  readonly label: string;

  constructor(private readonly category: string) {
    super();
    this.id = `category:${category.toLowerCase()}`;
    this.label = `${category} Projects`;
  }

  matches(project: Project): boolean {
    return project.category.toLowerCase() === this.category.toLowerCase();
  }
}

const KNOWN_ORDER = ['Residential', 'Commercial', 'Industrial'];

/** All, Recent, then the website's categories followed by any new ones in the data. */
export function projectFilters(projects: readonly Project[]): ProjectFilter[] {
  const found = new Map<string, string>();
  for (const p of projects) {
    const name = p.category.trim();
    if (name && !found.has(name.toLowerCase()))
      found.set(name.toLowerCase(), name);
  }
  for (const known of KNOWN_ORDER)
    if (!found.has(known.toLowerCase())) found.set(known.toLowerCase(), known);
  const rank = (name: string) => {
    const i = KNOWN_ORDER.findIndex(
      k => k.toLowerCase() === name.toLowerCase(),
    );
    return i === -1 ? KNOWN_ORDER.length : i;
  };
  const categories = [...found.values()].sort(
    (a, b) => rank(a) - rank(b) || a.localeCompare(b),
  );
  return [
    new AllProjectsFilter(),
    new RecentProjectsFilter(),
    ...categories.map(c => new CategoryProjectsFilter(c)),
  ];
}
