import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to="/docs/intro">
            Object-Oriented Programming (OOP) - 5min ⏱️
          </Link>
          <Link
            className="button button--secondary button--lg margin-left--md"
            to="/docs/functional-programming/quick-start"
          >
            Functional Programming (FP) 🎨 - 5min ⏱️
          </Link>
        </div>
      </div>
    </header>
  );
}

type FeatureItem = {
  title: string;
  description: JSX.Element;
  icon: string;
};

const features: FeatureItem[] = [
  {
    title: '⚡ Ultra Fast',
    icon: '⚡',
    description: (
      <>
        400,000+ operations per second with interface mode. Built for maximum performance with
        object pooling and minimal GC pressure.
      </>
    ),
  },
  {
    title: '🎯 Auto-Detection',
    icon: '🎯',
    description: (
      <>
        Automatically detects Zod schemas, TypeScript classes, and interfaces. No configuration
        needed - just pass your type and start building.
      </>
    ),
  },
  {
    title: '🎨 Functional Programming',
    icon: '🎨',
    description: (
      <>
        Build immutable objects with composable functions using pipe, compose, transducers, and
        higher-order functions. Perfect for React/Redux.
      </>
    ),
  },
  {
    title: '🔒 Type Safe',
    icon: '🔒',
    description: (
      <>
        Full TypeScript support with zero runtime overhead. Catch errors at compile time, not in
        production.
      </>
    ),
  },
  {
    title: '✅ Validated',
    icon: '✅',
    description: (
      <>
        Automatic validation with Zod schemas. Keep your data safe at API boundaries with sync or
        async validation.
      </>
    ),
  },
  {
    title: '🔧 Flexible',
    icon: '🔧',
    description: (
      <>
        Choose OOP or FP based on your needs, or mix both approaches. Works great with existing
        codebases.
      </>
    ),
  },
];

function Feature({ title, description, icon }: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <div className={styles.featureIcon}>{icon}</div>
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {features.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`Welcome to ${siteConfig.title}`}
      description="Ultra-fast TypeScript builder library with auto-detection and functional programming support"
    >
      <HomepageHeader />
      <main>
        <HomepageFeatures />

        <section className={styles.codeExamples}>
          <div className="container">
            <div className="row">
              <div className="col col--6">
                <Heading as="h2">OOP Builder (Mutable)</Heading>
                <pre className={styles.codeBlock}>
                  {`import { builder } from '@noony-serverless/type-builder';
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string(),
  email: z.string().email()
});

const createUser = builder(UserSchema);

const user = createUser()
  .withName('Alice')
  .withEmail('alice@example.com')
  .build(); // ✅ Validated!`}
                </pre>
              </div>
              <div className="col col--6">
                <Heading as="h2">Functional Programming (Immutable)</Heading>
                <pre className={styles.codeBlock}>
                  {`import { createImmutableBuilder, pipe }
  from '@noony-serverless/type-builder';

const userBuilder = createImmutableBuilder<User>(
  ['id', 'name', 'email']
);

const user = userBuilder.build(
  pipe<User>(
    userBuilder.withId(1),
    userBuilder.withName('Alice'),
    userBuilder.withEmail('alice@example.com')
  )(userBuilder.empty())
); // ✅ Immutable!`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.performance}>
          <div className="container">
            <Heading as="h2" className="text--center">
              Performance Benchmarks
            </Heading>
            <table className={styles.perfTable}>
              <thead>
                <tr>
                  <th>Mode</th>
                  <th>Operations/sec</th>
                  <th>Memory/op</th>
                  <th>Use Case</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Interface (OOP)</strong>
                  </td>
                  <td>400,000+</td>
                  <td>~60 bytes</td>
                  <td>Internal DTOs</td>
                </tr>
                <tr>
                  <td>
                    <strong>Class (OOP)</strong>
                  </td>
                  <td>300,000+</td>
                  <td>~80 bytes</td>
                  <td>Domain Models</td>
                </tr>
                <tr>
                  <td>
                    <strong>Immutable (FP)</strong>
                  </td>
                  <td>150,000+</td>
                  <td>~120 bytes</td>
                  <td>Complex Transformations</td>
                </tr>
                <tr>
                  <td>
                    <strong>Zod (OOP)</strong>
                  </td>
                  <td>100,000+</td>
                  <td>~120 bytes</td>
                  <td>API Validation</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </Layout>
  );
}
