import { createI18n } from 'vue-i18n';
import en from '../locales/en.json';
import vi from '../locales/vi.json';

// Get saved language preference from localStorage, default to 'en'
const savedLocale = typeof localStorage !== 'undefined' 
  ? localStorage.getItem('app-locale') || 'en'
  : 'en';

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: {
    en,
    vi,
  },
});

// Function to change language and save to localStorage
export function setLocale(locale: string) {
  i18n.global.locale.value = locale;
  localStorage.setItem('app-locale', locale);
}

// Function to get current language
export function getLocale() {
  return i18n.global.locale.value;
}

export default i18n;
