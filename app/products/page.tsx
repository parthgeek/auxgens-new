import type { Metadata } from "next";
import {
  PiArrowRightDuotone,
  PiArrowUpRightBold,
  PiCheckCircleDuotone,
} from "react-icons/pi";
import Announce from "../components/Announce";
import CTA from "../components/CTA";
import Footer from "../components/Footer";
import Nav from "../components/Nav";
import ScrollFade from "../components/ScrollFade";
import { products } from "../data/products";

export const metadata: Metadata = {
  title: "Products | Auxgens",
  description:
    "Explore CISOPrime with Auxgens for cyber & AI risk governance and assurance.",
};

export default function ProductsPage() {
  return (
    <>
      <Nav />
      <Announce />
      <main>
        {/* ── HERO ── */}
        <section className="about-hero prod-hero">
          <div className="wrap about-hero-inner anim">
            <p className="eyebrow prod-hero-eyebrow">Auxgens products</p>
            <h1 className="about-hero-h1">
              Understand your risk.<br />
              Know what to <em>do next.</em>
            </h1>
            <p className="prod-hero-desc">
              Use CISOPrime to manage cyber and AI risk, assign responsibility,
              and track progress. Together with Auxgens advisors, your teams can
              decide where to focus and see how their actions reduce risk.
            </p>
            <div className="about-hero-meta">
              <span>{products.length} {products.length === 1 ? "platform" : "platforms"}</span>
              <span className="about-meta-sep" />
              <span>Cyber risk quantification</span>
              <span className="about-meta-sep" />
              <span>Governance &amp; assurance</span>
            </div>
          </div>
        </section>

        {/* ── PRODUCT CARDS ── */}
        <section className="section prod-list-section">
          <div className="wrap">
            <div className="prod-section-hdr anim">
              <p className="eyebrow">Our platforms</p>
              <h2 className="prod-h2">
                Choose where to start.
              </h2>
            </div>
            <div className="prod-list-grid">
              {products.map((product, idx) => (
                <article key={product.slug} className={`prod-card anim d${idx}`}>
                  <div className={`prod-logo-plate prod-logo-${product.logo.tone}`}>
                    <img src={product.logo.src} alt={product.logo.alt} loading="lazy" />
                  </div>
                  <div className="prod-card-body">
                    <p className="prod-card-eyebrow">{product.eyebrow}</p>
                    <h3 className="prod-card-title">
                      <a href={`/products/${product.slug}`} className="prod-card-link">
                        {product.name}
                      </a>
                    </h3>
                    <p className="prod-card-tagline">{product.tagline}</p>
                    <p className="prod-card-summary">{product.summary}</p>
                    <ul className="prod-card-highlights">
                      {product.highlights.map((highlight) => (
                        <li key={highlight}>
                          <PiCheckCircleDuotone aria-hidden="true" focusable="false" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="prod-card-foot">
                    <span className="prod-card-cta">
                      Explore {product.name}
                      <PiArrowRightDuotone aria-hidden="true" focusable="false" />
                    </span>
                    <a
                      href={product.website.href}
                      className="prod-card-ext"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {product.website.label}
                      <PiArrowUpRightBold aria-hidden="true" focusable="false" />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW WE DELIVER ── */}
        <section className="section section-alt">
          <div className="wrap about-diff-grid">
            <div className="anim">
              <p className="eyebrow" style={{ marginBottom: ".8rem" }}>Platform + practitioners</p>
              <h2 className="about-diff-h2">
                Technology, delivered<br />by senior advisors.
              </h2>
            </div>
            <ul className="about-diff-list anim d1">
              {[
                "Every platform engagement is led by CISSP- and CISM-certified Auxgens practitioners.",
                "Start with a single business service or framework and expand once the baseline is proven.",
                "Runs alongside your existing security tooling — no rip-and-replace.",
                "Board-ready outputs, with every figure traceable to its evidence and assumptions.",
              ].map((point) => (
                <li key={point} className="about-diff-item">
                  <PiCheckCircleDuotone className="about-diff-check" aria-hidden="true" focusable="false" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <CTA />
      </main>
      <Footer />
      <ScrollFade />
    </>
  );
}
