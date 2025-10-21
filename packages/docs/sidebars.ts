import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Concepts',
      items: ['concepts/why-ultrafast-builder', 'concepts/design-philosophy'],
    },
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/installation',
        'getting-started/quick-start',
        'getting-started/basic-usage',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/interface-builder',
        'guides/class-builder',
        'guides/zod-builder',
        'guides/async-validation',
        'guides/object-pooling',
        'guides/performance-optimization',
      ],
    },
    {
      type: 'category',
      label: 'Functional Programming',
      items: [
        'functional-programming/quick-start',
        'functional-programming/immutable-builder',
        'functional-programming/pipe-compose',
        'functional-programming/higher-order-functions',
        'functional-programming/transducers',
        'functional-programming/partial-currying',
        'functional-programming/conditional-templates',
        'functional-programming/api-reference',
        'functional-programming/real-world-examples',
      ],
    },
    {
      type: 'category',
      label: 'DynamicPick',
      items: [
        'projection/quick-start',
        'projection/how-to-guides',
        'projection/api-reference',
        'projection/understanding',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: ['api/api-reference'],
    },
    {
      type: 'category',
      label: 'Performance',
      items: ['performance/benchmarks', 'performance/memory-usage', 'performance/gc-optimization'],
    },
    {
      type: 'category',
      label: 'Examples',
      items: [
        'examples/api-validation',
        'examples/domain-models',
        'examples/data-transformation',
        'examples/testing',
      ],
    },
  ],
};

export default sidebars;
