# Documentation

**Complete documentation for @noony-serverless/type-builder**

---

## 📚 Documentation Structure

This documentation follows the **[Diataxis](https://diataxis.fr/)** framework, a systematic approach to organizing technical documentation.

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│               Understanding                             │
│               ↓                                         │
│   ┌──────────────────────┐                             │
│   │   EXPLANATION        │  Why it works this way      │
│   │  (Understanding)     │  Design decisions           │
│   └──────────────────────┘  Trade-offs                 │
│               ↓                                         │
│   ┌──────────────────────┐                             │
│   │     TUTORIAL         │  Learning-oriented          │
│   │    (Learning)        │  Hands-on lessons           │
│   └──────────────────────┘  Step-by-step               │
│               ↓                                         │
│   ┌──────────────────────┐  ┌──────────────────────┐   │
│   │     HOW-TO           │  │    REFERENCE         │   │
│   │  (Problem-solving)   │  │  (Information)       │   │
│   │  Practical recipes   │  │  API documentation   │   │
│   └──────────────────────┘  └──────────────────────┘   │
│               ↓                          ↓              │
│             Doing                   Looking up          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Choose Your Path

### I want to understand WHY

**→ [Explanation: Why Use This Library?](./EXPLANATION.md)**

- The builder pattern problem and solution
- Type detection innovation explained
- Performance through object pooling
- Design philosophy and trade-offs
- When to use (and when NOT to use)
- Comparison with alternatives

**Best for:** Technical decision-makers, architects, curious developers

---

### I want to LEARN how to use it

**→ [Tutorial: Getting Started](./TUTORIAL.md)**

- Step-by-step hands-on tutorial
- Build your first Zod builder
- Create class-based builders
- Use interface builders for speed
- Handle errors gracefully
- Work with async builders

**Best for:** Beginners, new users, onboarding

---

### I need to SOLVE a specific problem

**→ [How-To Guide: Practical Recipes](./HOW-TO.md)**

- How to validate API input
- How to transform database records
- How to optimize for high throughput
- How to integrate with Express/NestJS
- How to handle errors
- How to test builders

**Best for:** Developers solving specific tasks

---

### I need to LOOK UP an API detail

**→ [Reference: Complete API Documentation](./REFERENCE.md)**

- `builder()` function
- `builderAsync()` function
- All types and interfaces
- Utility functions
- Detection functions
- Error handling

**Best for:** Experienced users, API reference

---

## 🚀 Quick Start

**1. Installation**

```bash
npm install @noony-serverless/type-builder zod
```

**2. Basic Example**

```typescript
import builder from '@noony-serverless/type-builder';
import { z } from 'zod';

const UserSchema = z.object({
  email: z.string().email(),
  name: z.string(),
});

const createUser = builder(UserSchema);

const user = createUser().withEmail('alice@example.com').withName('Alice').build();
```

**→ [Continue with full tutorial](./TUTORIAL.md)**

---

## 📖 Documentation Map

| Document                               | Type          | Purpose                              | When to Read                                   |
| -------------------------------------- | ------------- | ------------------------------------ | ---------------------------------------------- |
| **[EXPLANATION.md](./EXPLANATION.md)** | Understanding | Learn WHY it exists and HOW it works | Before adopting, during architecture decisions |
| **[TUTORIAL.md](./TUTORIAL.md)**       | Learning      | Step-by-step hands-on lessons        | First time using, onboarding new devs          |
| **[HOW-TO.md](./HOW-TO.md)**           | Tasks         | Solve specific problems              | When implementing features                     |
| **[REFERENCE.md](./REFERENCE.md)**     | Information   | Look up API details                  | When coding, for syntax reference              |

---

## 📊 Additional Resources

### Core Documentation

- **[README.md](../README.md)** - Project overview and quick start
- **[COVERAGE-ANALYSIS.md](../COVERAGE-ANALYSIS.md)** - Test coverage details (97.43%)
- **[TEST-SUMMARY.md](../TEST-SUMMARY.md)** - Test suite summary (396 tests)
- **[PERFORMANCE.md](../PERFORMANCE.md)** - Benchmark results

### Examples

- **[Basic Usage](../src/examples/basic-usage.ts)** - Simple examples
- **[Typed Usage](../src/examples/typed-usage.ts)** - TypeScript type examples

### Development

- **[CHANGELOG.md](../CHANGELOG.md)** - Version history
- **[CONTRIBUTING.md](../CONTRIBUTING.md)** - How to contribute
- **[LICENSE](../LICENSE)** - MIT License

---

## 🎓 Learning Path

### Beginner → Intermediate → Advanced

**Week 1: Basics**

1. Read [Why Use This Library?](./EXPLANATION.md#the-builder-pattern-problem)
2. Complete [Tutorial Steps 1-6](./TUTORIAL.md)
3. Try building your own Zod schema builder

**Week 2: Advanced Patterns** 4. Read [The Three Modes Philosophy](./EXPLANATION.md#the-three-modes-philosophy) 5. Complete [Tutorial Steps 7-14](./TUTORIAL.md) 6. Implement class and interface builders

**Week 3: Production Ready** 7. Study [Performance Optimization](./HOW-TO.md#performance) 8. Read [Design Decisions](./EXPLANATION.md#trade-offs-and-design-decisions) 9. Integrate with your production codebase

**Ongoing: Reference** 10. Bookmark [API Reference](./REFERENCE.md) for quick lookup

---

## 🔍 Finding What You Need

### By Topic

| Topic                 | Document                                                           | Section       |
| --------------------- | ------------------------------------------------------------------ | ------------- |
| **Installation**      | [Tutorial](./TUTORIAL.md#step-1-installation)                      | Step 1        |
| **First Builder**     | [Tutorial](./TUTORIAL.md#step-2-your-first-builder-zod-mode)       | Step 2        |
| **Validation**        | [Tutorial](./TUTORIAL.md#step-3-validation-in-action)              | Step 3        |
| **API Integration**   | [How-To](./HOW-TO.md#how-to-integrate-with-expressjs)              | Integration   |
| **Performance**       | [Explanation](./EXPLANATION.md#performance-through-object-pooling) | Design        |
| **API Reference**     | [Reference](./REFERENCE.md)                                        | All functions |
| **Error Handling**    | [How-To](./HOW-TO.md#how-to-handle-validation-errors-gracefully)   | Advanced      |
| **Testing**           | [How-To](./HOW-TO.md#how-to-test-builders)                         | Integration   |
| **Design Philosophy** | [Explanation](./EXPLANATION.md#the-core-philosophy)                | Conclusion    |

### By Question

| Question                          | Answer                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------- |
| "How do I install it?"            | [Tutorial: Installation](./TUTORIAL.md#step-1-installation)                           |
| "Why should I use this?"          | [Explanation: The Problem](./EXPLANATION.md#the-builder-pattern-problem)              |
| "How do I validate input?"        | [How-To: Validate API Input](./HOW-TO.md#how-to-validate-api-input)                   |
| "What's the API for `builder()`?" | [Reference: builder()](./REFERENCE.md#builder)                                        |
| "How fast is it?"                 | [Explanation: Performance](./EXPLANATION.md#performance-through-object-pooling)       |
| "Can I use it with NestJS?"       | [How-To: NestJS Integration](./HOW-TO.md#how-to-integrate-with-nestjs)                |
| "When should I NOT use this?"     | [Explanation: When Not To Use](./EXPLANATION.md#when-to-use-and-not-use-this-library) |
| "How do I handle errors?"         | [How-To: Error Handling](./HOW-TO.md#how-to-handle-validation-errors-gracefully)      |

### By Use Case

| Use Case                   | Recommended Reading                                                   |
| -------------------------- | --------------------------------------------------------------------- |
| **Evaluating the library** | [Explanation](./EXPLANATION.md) → [Tutorial Steps 1-3](./TUTORIAL.md) |
| **Learning to use it**     | [Tutorial](./TUTORIAL.md) (all steps)                                 |
| **Building an API**        | [How-To: API Integration](./HOW-TO.md#integration)                    |
| **Optimizing performance** | [How-To: Performance](./HOW-TO.md#performance)                        |
| **Debugging issues**       | [How-To: Troubleshooting](./HOW-TO.md#troubleshooting)                |
| **API reference lookup**   | [Reference](./REFERENCE.md)                                           |

---

## 🤝 Contributing to Documentation

Found a typo? Have a suggestion? Want to add an example?

1. Check the [contribution guidelines](../CONTRIBUTING.md)
2. Open an issue or pull request on [GitHub](https://github.com/your-org/typescript-bulder-lib)
3. Follow the Diataxis framework for new content

### Documentation Guidelines

- **Tutorials** - Learning-oriented, hands-on, step-by-step
- **How-To Guides** - Task-oriented, problem-solving, practical
- **Explanation** - Understanding-oriented, background, theory
- **Reference** - Information-oriented, accurate, complete

---

## 📝 Documentation Versions

| Version         | Status      | Branch |
| --------------- | ----------- | ------ |
| 1.0.x (current) | ✅ Active   | `main` |
| 0.x.x (legacy)  | 🔒 Archived | `v0`   |

---

## 🔗 External Resources

### Related Topics

- **[Zod Documentation](https://zod.dev)** - Schema validation
- **[TypeScript Handbook](https://www.typescriptlang.org/docs/)** - TypeScript guide
- **[Builder Pattern (Wikipedia)](https://en.wikipedia.org/wiki/Builder_pattern)** - Pattern history
- **[Diataxis Framework](https://diataxis.fr/)** - Documentation structure

### Community

- **[GitHub Discussions](https://github.com/your-org/typescript-bulder-lib/discussions)** - Ask questions
- **[GitHub Issues](https://github.com/your-org/typescript-bulder-lib/issues)** - Report bugs
- **[NPM Package](https://npmjs.com/@noony-serverless/type-builder)** - Package info

---

## 📞 Get Help

### I'm Stuck!

1. **Check the docs:**
   - [Tutorial](./TUTORIAL.md#troubleshooting) - Common issues
   - [How-To](./HOW-TO.md#troubleshooting) - Problem-solving

2. **Search existing issues:**
   - [GitHub Issues](https://github.com/your-org/typescript-bulder-lib/issues)

3. **Ask the community:**
   - [GitHub Discussions](https://github.com/your-org/typescript-bulder-lib/discussions)

4. **Report a bug:**
   - [New Issue](https://github.com/your-org/typescript-bulder-lib/issues/new)

---

## 📈 Documentation Stats

- **4 main guides** (Explanation, Tutorial, How-To, Reference)
- **50+ code examples**
- **20+ recipes**
- **Complete API reference**
- **97.43% test coverage** ([details](../COVERAGE-ANALYSIS.md))
- **396 passing tests** ([summary](../TEST-SUMMARY.md))

---

**Happy Building! 🚀**

[← Back to Project README](../README.md)
