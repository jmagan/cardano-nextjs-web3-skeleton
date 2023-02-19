/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: function (config, options) {
    config.experiments = {
      asyncWebAssembly: true,
      layers: true
    };
    return config;
  },
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
    localeDetection: true
  },
}

module.exports = nextConfig
