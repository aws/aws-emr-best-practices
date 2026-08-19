// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from 'prism-react-renderer';

// LEGAL-REVIEW-HOLD: Migration guide temporarily unpublished pending legal
// review. Set SHOW_MIGRATION = true here and in sidebars.js to restore it.
// The docs content under docs/migration/ is untouched.
const SHOW_MIGRATION = false;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'AWS Open Data Analytics',
  tagline: 'All your AWS Open Data Analytics Needs',

  // Set the production url of your site here
  url: 'https://aws.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/aws-emr-best-practices/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'aws', // Usually your GitHub org/user name.
  projectName: 'aws-emr-best-practices', // Usually your repo name.
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          // LEGAL-REVIEW-HOLD: removes migration pages (incl. direct URLs)
          // from the published site while SHOW_MIGRATION is false.
          ...(SHOW_MIGRATION ? {} : { exclude: ['migration/**'] }),
          editUrl:
            'https://github.com/aws/aws-emr-best-practices/edit/main/website/',
        },
        googleAnalytics: {
          trackingID: 'G-MF59LKNSDN',
          anonymizeIP: true,
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/AWS_logo_RGB.png',
      navbar: {
        title: 'AWS Open Data Analytics',
        items: [
          {
            type: 'doc',
            docId: 'bestpractices/introduction',
            position: 'left',
            label: 'Best Practices'
          },
          {
            type: 'doc',
            docId: 'benchmarks/introduction',
            position: 'left',
            label: 'Benchmarks'
          },
          // LEGAL-REVIEW-HOLD: Migration navbar entry hidden while
          // SHOW_MIGRATION is false.
          ...(SHOW_MIGRATION
            ? [
                {
                  type: 'doc',
                  docId: 'migration/introduction',
                  position: 'left',
                  label: 'Migration',
                },
              ]
            : []),
          {
            type: 'doc',
            docId: 'utilities/introduction',
            position: 'left',
            label: 'Utilities'
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Contributing',
            items: [
              {
                label: 'Github',
                href: 'https://github.com/aws/aws-emr-best-practices/tree/main',
              },
            ],
          },
        ],
        copyright: `Built with ❤️ at AWS  <br/> © ${new Date().getFullYear()} Amazon.com, Inc. or its affiliates. All Rights Reserved`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
  plugins: [require.resolve('docusaurus-lunr-search')],
};

export default config;
