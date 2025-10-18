import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'UltraFastBuilder',
  description: 'Ultra-fast TypeScript builder library with auto-detection',
  
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'API', link: '/api/' },
      { text: 'Performance', link: '/performance/' },
      { text: 'Examples', link: '/examples/' }
    ],
    
    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Quick Start', link: '/guide/quick-start' },
            { text: 'Basic Usage', link: '/guide/basic-usage' }
          ]
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Performance Optimization', link: '/guide/performance' },
            { text: 'Object Pooling', link: '/guide/object-pooling' },
            { text: 'Memory Management', link: '/guide/memory-management' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Core Functions', link: '/api/core' },
            { text: 'Types', link: '/api/types' },
            { text: 'Utilities', link: '/api/utilities' }
          ]
        }
      ],
      '/performance/': [
        {
          text: 'Performance',
          items: [
            { text: 'Benchmarks', link: '/performance/benchmarks' },
            { text: 'Memory Usage', link: '/performance/memory' },
            { text: 'GC Optimization', link: '/performance/gc' }
          ]
        }
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'API Validation', link: '/examples/api-validation' },
            { text: 'Domain Models', link: '/examples/domain-models' },
            { text: 'Data Transformation', link: '/examples/data-transformation' }
          ]
        }
      ]
    },
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/ultra-fast-builder' }
    ],
    
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024 UltraFastBuilder'
    }
  }
});
