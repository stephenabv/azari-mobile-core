/**
 * 24x24 stroke icon set. Adding an icon is one entry here; every consumer
 * picks it up by name.
 */
export const ICON_PATHS = Object.freeze({
  home: ['M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z'],
  bag: ['M5 8h14l-1 12H6z', 'M9 8V6a3 3 0 0 1 6 0v2'],
  calculator: [
    'M6 3h12v18H6z',
    'M9 7h6',
    'M9 12h.01',
    'M15 12h.01',
    'M9 16h.01',
    'M15 16h.01',
  ],
  image: ['M4 5h16v14H4z', 'M4 15l4-4 4 4 3-3 5 5', 'M15 9h.01'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h10'],
  chat: ['M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z'],
  route: [
    'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    'M18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    'M6 15V9a4 4 0 0 1 4-4h6',
    'M18 9v6a4 4 0 0 1-4 4H8',
  ],
  shop: ['M4 9l1-5h14l1 5', 'M4 9h16v11H4z', 'M9 20v-6h6v6'],
  factory: ['M3 20V10l6 4V10l6 4V6h6v14z'],
  arrowRight: ['M5 12h14', 'M13 6l6 6-6 6'],
  arrowLeft: ['M19 12H5', 'M11 6l-6 6 6 6'],
  chevronRight: ['M9 6l6 6-6 6'],
  chevronDown: ['M6 9l6 6 6-6'],
  close: ['M6 6l12 12', 'M18 6L6 18'],
  check: ['M5 12l5 5 9-10'],
  search: ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z', 'M20 20l-4-4'],
  pin: [
    'M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z',
    'M12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  ],
  upload: ['M12 16V4', 'M7 9l5-5 5 5', 'M5 20h14'],
  play: ['M8 5v14l11-7z'],
  sun: [
    'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    'M12 2v2',
    'M12 20v2',
    'M4.9 4.9l1.4 1.4',
    'M17.7 17.7l1.4 1.4',
    'M2 12h2',
    'M20 12h2',
    'M4.9 19.1l1.4-1.4',
    'M17.7 6.3l1.4-1.4',
  ],
  bolt: ['M13 2L4 14h7l-1 8 9-12h-7z'],
  battery: ['M3 8h15v8H3z', 'M21 11v2', 'M6 11v2', 'M9 11v2'],
  leaf: ['M5 19c0-8 6-14 15-14 0 9-6 15-14 15', 'M5 19l7-7'],
  shield: ['M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z'],
  document: ['M7 3h7l5 5v13H7z', 'M14 3v5h5', 'M10 13h6', 'M10 17h6'],
  external: ['M14 4h6v6', 'M20 4l-9 9', 'M18 14v6H4V6h6'],
  phone: [
    'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  ],
  globe: [
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
    'M3 12h18',
    'M12 3a14 14 0 0 1 0 18',
    'M12 3a14 14 0 0 0 0 18',
  ],
  sparkle: ['M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z'],
} satisfies Record<string, readonly string[]>);

export type IconName = keyof typeof ICON_PATHS;
