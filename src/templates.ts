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
  { id: 'daisy', name: 'Daisy', url: `${base}daisy.webp`, thumbnail: `${base}daisy-thumb.webp`,
    author: 'AnRo0002', source: `${commons}20131022Bellis_perennis.jpg`,
    license: 'CC0', licenseUrl: cc0 },
  { id: 'cat', name: 'Cat', url: `${base}cat.webp`, thumbnail: `${base}cat-thumb.webp`,
    author: 'Pavel Kovalev', source: `${commons}Portrait_of_a_cat1.jpg`,
    license: 'CC0', licenseUrl: cc0 },
  { id: 'earth', name: 'Earth', url: `${base}earth.webp`, thumbnail: `${base}earth-thumb.webp`,
    author: 'NASA / Apollo 17', source: `${commons}The_Earth_seen_from_Apollo_17.jpg`,
    license: 'Public domain', licenseUrl: `${commons}The_Earth_seen_from_Apollo_17.jpg#Licensing` },
  { id: 'red-panda', name: 'Red Panda', url: `${base}red-panda.webp`, thumbnail: `${base}red-panda-thumb.webp`,
    author: 'Mathias Appel', source: `${commons}Red_Panda_-_53008873649.jpg`,
    license: 'CC0', licenseUrl: cc0 },
  { id: 'moon', name: 'Moon', url: `${base}moon.webp`, thumbnail: `${base}moon-thumb.webp`,
    author: 'NASA / JPL / Galileo', source: `${commons}Full_moon.png`,
    license: 'Public domain', licenseUrl: `${commons}Full_moon.png` },
  { id: 'sunflower', name: 'Sunflower', url: `${base}sunflower.webp`, thumbnail: `${base}sunflower-thumb.webp`,
    author: 'Tokeamour', source: `${commons}Sunflower_zoomed_in_(IMG_4860).jpg`,
    license: 'CC0', licenseUrl: cc0 },
];
