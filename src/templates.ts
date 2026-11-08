import landscapeUrl from './sample.svg?url';

export interface TemplateImage {
  id: string;
  name: string;
  url: string;
  thumbnail: string;
  author: string;
  source: string;
  license: string;
  licenseUrl: string;
}

const base = `${import.meta.env.BASE_URL}templates/`;
const commons = 'https://commons.wikimedia.org/wiki/File:';
const cc0 = 'https://creativecommons.org/publicdomain/zero/1.0/';

export const templates: TemplateImage[] = [
  { id: 'landscape', name: 'Landscape', url: landscapeUrl, thumbnail: landscapeUrl,
    author: 'Halftone QR Studio', source: 'https://github.com/pRizz/halftone-qr-studio',
    license: 'MIT', licenseUrl: 'https://github.com/pRizz/halftone-qr-studio/blob/main/LICENSE' },
  { id: 'tree', name: 'Tree', url: `${base}tree.webp`, thumbnail: `${base}tree-thumb.webp`,
    author: 'Amada44', source: `${commons}Silhouette_of_a_Tree.svg`,
    license: 'Public domain', licenseUrl: `${commons}Silhouette_of_a_Tree.svg#Summary` },
  { id: 'daisy', name: 'Daisy', url: `${base}daisy.webp`, thumbnail: `${base}daisy-thumb.webp`,
    author: 'AnRo0002', source: `${commons}20131022Bellis_perennis.jpg`,
    license: 'CC0', licenseUrl: cc0 },
  { id: 'cat', name: 'Cat', url: `${base}cat.webp`, thumbnail: `${base}cat-thumb.webp`,
    author: 'Pavel Kovalev', source: `${commons}Portrait_of_a_cat1.jpg`,
    license: 'CC0', licenseUrl: cc0 },
  { id: 'earth', name: 'Earth', url: `${base}earth.webp`, thumbnail: `${base}earth-thumb.webp`,
    author: 'NASA / Apollo 17', source: `${commons}The_Earth_seen_from_Apollo_17.jpg`,
    license: 'Public domain', licenseUrl: `${commons}The_Earth_seen_from_Apollo_17.jpg#Licensing` },
];
