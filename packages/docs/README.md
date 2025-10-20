# @ultra-fast-builder/docs

Documentation website for UltraFastBuilder built with Docusaurus.

## Overview

This package contains the complete documentation website for the UltraFastBuilder TypeScript library, including tutorials, API references, guides, and performance analysis.

## Quick Start

### Prerequisites
```bash
# Ensure Node.js 18+ is installed
node --version
```

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run start
# Open http://localhost:3000
```

### Building
```bash
# Build for production
npm run build

# Serve built files locally
npm run serve
# Open http://localhost:3000
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `start` | Start development server with hot reload |
| `build` | Build static site for production |
| `serve` | Serve built site locally |
| `clear` | Clear Docusaurus cache |
| `swizzle` | Copy and customize components |
| `deploy` | Deploy to GitHub Pages |
| `write-translations` | Extract translatable strings |
| `write-heading-ids` | Generate heading IDs for anchors |

## Documentation Structure

### Core Documentation
- **Getting Started**: Installation and basic usage
- **Tutorial**: Step-by-step learning guide
- **API Reference**: Complete function documentation
- **Guides**: Practical how-to guides

### Specialized Topics
- **Functional Programming**: FP patterns and utilities
- **Performance**: Benchmarks and optimization
- **Examples**: Real-world usage examples

### Blog
- **Welcome Post**: Introduction to the library
- **Performance Analysis**: Detailed performance insights
- **Best Practices**: Recommended usage patterns

## Content Organization

```
docs/
├── docs/                          # Main documentation
│   ├── getting-started/           # Installation and setup
│   ├── functional-programming/    # FP-specific docs
│   ├── performance/              # Performance analysis
│   ├── guides/                   # How-to guides
│   └── api/                      # API reference
├── blog/                         # Blog posts
├── src/                          # Custom components
└── static/                       # Static assets
```

## Customization

### Adding New Documentation
1. Create new `.md` file in appropriate `docs/` subdirectory
2. Add entry to `sidebars.ts` for navigation
3. Use proper frontmatter for metadata

### Styling
- Custom CSS in `src/css/custom.css`
- Component overrides in `src/components/`
- Theme customization in `docusaurus.config.ts`

### Blog Posts
1. Create new `.md` file in `blog/` directory
2. Use proper frontmatter with date, title, and author
3. Add to `authors.yml` if new author

## Deployment

### GitHub Pages
```bash
# Build and deploy
npm run build
npm run deploy
```

### Custom Hosting
```bash
# Build static files
npm run build

# Upload build/ directory to your hosting provider
```

## Configuration

### Docusaurus Config
Main configuration in `docusaurus.config.ts`:
- Site metadata
- Navigation structure
- Theme settings
- Plugin configuration

### Sidebar Navigation
Edit `sidebars.ts` to modify:
- Documentation structure
- Navigation order
- Category organization

## Development Workflow

### Local Development
1. Start dev server: `npm run start`
2. Edit documentation files
3. Preview changes in browser
4. Test on different screen sizes

### Content Updates
1. Edit markdown files
2. Update navigation if needed
3. Test locally
4. Commit and push changes

### Performance Testing
1. Build production version: `npm run build`
2. Test with `npm run serve`
3. Check Lighthouse scores
4. Optimize images and assets

## Troubleshooting

### Common Issues

**Build Errors**
```bash
# Clear cache and rebuild
npm run clear
npm run build
```

**Missing Dependencies**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Port Conflicts**
```bash
# Use different port
npm run start -- --port 3001
```

### Performance Issues
- Optimize images in `static/img/`
- Use proper image formats (WebP, AVIF)
- Minimize custom CSS
- Check bundle size with `npm run build`

## Contributing

### Adding Content
1. Fork the repository
2. Create feature branch
3. Add or edit documentation
4. Test locally
5. Submit pull request

### Content Guidelines
- Use clear, concise language
- Include code examples
- Test all code snippets
- Follow markdown best practices
- Add proper frontmatter

## License

MIT © UltraFastBuilder Team
