import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'UltraFastBuilder',
  tagline: 'Ultra-fast TypeScript builder library with unified imports and auto-detection',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://noony-serverless.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  baseUrl: '/type-builder/',

  // GitHub pages deployment config
  organizationName: 'noony-serverless',
  projectName: 'type-builder',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to set "zh-Hans" as the lang.
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/noony-serverless/type-builder/tree/main/packages/docs/',
        },
        blog: {
          showReadingTime: true,
          authorsMapPath: 'authors.yml',
          editUrl:
            'https://github.com/noony-serverless/type-builder/tree/main/packages/docs/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/ultra-fast-builder-social-card.jpg',
    navbar: {
      title: 'UltraFastBuilder',
      // logo: {
      //   alt: 'UltraFastBuilder Logo',
      //   src: 'img/logo.svg',
      // },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        { to: '/blog', label: 'Blog', position: 'left' },
        {
          href: 'https://github.com/noony-serverless/type-builder',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/getting-started/installation',
            },
            {
              label: 'Functional Programming',
              to: '/docs/functional-programming/quick-start',
            },
            {
              label: 'API Reference',
              to: '/docs/api/core-functions',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/noony-serverless/type-builder',
            },
            {
              label: 'npm',
              href: 'https://www.npmjs.com/package/@noony-serverless/type-builder',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Documentation',
              to: '/docs/intro',
            },
            {
              label: 'Performance',
              to: '/docs/performance/benchmarks',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Noony Serverless Team. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['typescript', 'bash', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
