import { I18n } from 'i18n';

const i18n = new I18n();

i18n.configure({
  locales: ['en', 'es'],
  directory: `./src/locales`,
  defaultLocale: 'en',
  objectNotation: true
});

export default i18n;