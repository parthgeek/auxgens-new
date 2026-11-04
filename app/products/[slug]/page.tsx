import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  PiArrowRightDuotone,
  PiArrowUpRightBold,
  PiCheckCircleDuotone,
} from "react-icons/pi";
import Announce from "../../components/Announce";
import Footer from "../../components/Footer";
import Nav from "../../components/Nav";
import ProductFlow from "../../components/ProductFlow";
import ScrollFade from "../../components/ScrollFade";
import { getProduct, products } from "../../data/products";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);

  if (!product) {
    return {};
  }

  return {
    title: `${product.name} | Auxgens Products`,
    description: product.summary,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProduct(slug);

  if (!product) {
    notFound();
  }

  const otherProducts = products.filter((p) => p.slug !== product.slug);

  return (
    <>
      <Nav />
      <Announce />
      <main>
        {/* ── HERO ── */}
        <section className="about-hero prod-hero prod-detail-hero">
          <div className="wrap prod-detail-hero-grid">
            <div className="about-hero-inner anim">
              <nav className="prod-crumbs" aria-label="Breadcrumb">
                <a href="/products">Products</a>
                <span aria-hidden="true">/</span>
                <span aria-current="page">{product.name}</span>
              </nav>
              <p className="eyebrow prod-hero-eyebrow">{product.eyebrow}</p>
              <h1 className="about-hero-h1">
                {product.hero.lead}<br />
                <em>{product.hero.em}</em>
              </h1>
              <p className="prod-hero-desc">{product.hero.description}</p>
              <div className="hero-btns">
                <a href="/contact-us#contact-form" className="btn-lime">
                  Request a briefing
                </a>
                <a
                  href={product.website.href}
                  className="btn-ghost-light prod-btn-icon"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit {product.website.label}
                  <PiArrowUpRightBold aria-hidden="true" focusable="false" />
                </a>
              </div>
            </div>
            <div className="prod-hero-logo anim d1">
              <div className={`prod-logo-plate prod-logo-${product.logo.tone}`}>
                <img src={product.logo.src} alt={product.logo.alt} />
              </div>
              <p className="prod-hero-logo-caption">
                <strong>{product.name}</strong>
                <span>{product.tagline}</span>
              </p>
            </div>
          </div>
        </section>

        {/* ── OVERVIEW ── */}
        <section className="section about-story">
          <div className="wrap about-story-grid">
            <div className="about-pull anim">
              <blockquote className="about-quote">
                &ldquo;{product.overview.quote}&rdquo;
              </blockquote>
            </div>
            <div className="about-story-body anim d1">
              <p className="eyebrow" style={{ marginBottom: ".9rem" }}>Product brief</p>
              {product.overview.paragraphs.map((paragraph, idx) => (
                <p key={idx} style={idx > 0 ? { marginTop: "1.2rem" } : undefined}>
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* ── PROBLEM ── */}
        <section className="section section-alt">
          <div className="wrap">
            <div className="prod-section-hdr anim">
              <p className="eyebrow">{product.problem.eyebrow}</p>
              <h2 className="prod-h2">{product.problem.title}</h2>
            </div>
            <div className="prod-problem-grid">
              {product.problem.items.map((item, idx) => (
                <article key={item.title} className={`prod-problem-card anim d${idx}`}>
                  <span className="prod-problem-idx">{pad(idx + 1)}</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── CAPABILITIES ── */}
        <section className="section">
          <div className="wrap">
            <div className="prod-section-hdr anim">
              <p className="eyebrow">{product.capabilities.eyebrow}</p>
              <h2 className="prod-h2">{product.capabilities.title}</h2>
              <p className="prod-section-intro">{product.capabilities.intro}</p>
            </div>
            <div className="prod-cap-grid">
              {product.capabilities.items.map((item, idx) => (
                <article key={item.title} className={`prod-cap-card anim d${idx % 2}`}>
                  <h3>{pad(idx + 1)}. {item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── FLOW ── */}
        <section className="section section-alt">
          <div className="wrap">
            <div className="prod-section-hdr anim">
              <p className="eyebrow">{product.flow.eyebrow}</p>
              <h2 className="prod-h2">{product.flow.title}</h2>
              <p className="prod-section-intro">{product.flow.intro}</p>
            </div>
            <ProductFlow steps={product.flow.steps} name={product.name} />
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="prod-stats">
          <div className="wrap">
            <div className="prod-stats-grid">
              {product.stats.items.map((stat, idx) => (
                <div key={stat.label} className={`prod-stat anim d${idx % 2}`}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                  {stat.note && <em>{stat.note}</em>}
                </div>
              ))}
            </div>
            <p className="prod-stats-foot">{product.stats.footnote}</p>
          </div>
        </section>

        {/* ── PROOF ── */}
        <section className="section">
          <div className="wrap">
            <div className="prod-section-hdr anim">
              <p className="eyebrow">{product.proof.eyebrow}</p>
              <h2 className="prod-h2">{product.proof.title}</h2>
            </div>
            <div
              className={`prod-proof-grid${
                product.proof.items.length === 5 ? " prod-proof-grid-5" : ""
              }`}
            >
              {product.proof.items.map((item, idx) => (
                <article key={item.title} className={`about-value-card prod-proof-card anim d${idx % 2}`}>
                  <div className="about-value-ico">
                    <PiCheckCircleDuotone aria-hidden="true" focusable="false" />
                  </div>
                  <h3 className="about-value-title">{item.title}</h3>
                  <p className="about-value-body">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── GOVERNANCE ── */}
        <section className="section section-alt">
          <div className="wrap prod-gov-grid">
            <div className="anim">
              <p className="eyebrow" style={{ marginBottom: ".8rem" }}>{product.governance.eyebrow}</p>
              <h2 className="prod-h2">{product.governance.title}</h2>
              <p className="prod-section-intro">{product.governance.intro}</p>
            </div>
            <div className="anim d1">
              {product.governance.items && (
                <dl className="prod-gov-list">
                  {product.governance.items.map((item) => (
                    <div key={item.title} className="prod-gov-item">
                      <dt>{item.title}</dt>
                      <dd>{item.body}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {product.governance.tags && (
                <ul className="prod-tags">
                  {product.governance.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                  <li className="prod-tag-more">+ more</li>
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* ── PARTNERSHIP + OTHER PRODUCTS ── */}
        <section className="section">
          <div className="wrap prod-partner">
            <div className="prod-partner-copy anim">
              <p className="eyebrow" style={{ marginBottom: ".8rem" }}>
                Auxgens + {product.name}
              </p>
              <p className="about-quote prod-partner-quote">{product.partnership}</p>
            </div>
            <div className="prod-related anim d1">
              <p className="prod-related-label">Explore other products</p>
              {otherProducts.map((other) => (
                <a key={other.slug} href={`/products/${other.slug}`} className="prod-related-card">
                  <div className={`prod-logo-plate prod-logo-${other.logo.tone} prod-logo-sm`}>
                    <img src={other.logo.src} alt="" loading="lazy" />
                  </div>
                  <div>
                    <strong>{other.name}</strong>
                    <span>{other.tagline}</span>
                  </div>
                  <PiArrowRightDuotone className="prod-related-arrow" aria-hidden="true" focusable="false" />
                </a>
              ))}
              <a href="/products" className="about-story-link">
                All products
                <PiArrowRightDuotone aria-hidden="true" focusable="false" />
              </a>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="cta">
          <div className="cta-grid">
            <div className="anim">
              <h2>{product.cta.title}</h2>
            </div>
            <div className="anim d1">
              <p className="cta-desc">{product.cta.body}</p>
              <div className="cta-btns">
                <a href="/contact-us#contact-form" className="btn-lime">Schedule a discussion</a>
                <a href="mailto:contact@auxgens.net" className="btn-ghost-light">Email Us Now</a>
              </div>
              <div className="cta-meta">
                <span>contact@auxgens.net</span>
                <span>{product.website.label}</span>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <ScrollFade />
    </>
  );
}
