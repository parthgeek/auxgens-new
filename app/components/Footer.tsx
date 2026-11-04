import LogoLockup from "./LogoLockup";
import { detailedServices } from "../data/services";

type FooterLink = {
  label: string;
  href: string;
};

const serviceLinks: FooterLink[] = detailedServices.map((service) => ({
  label: service.title,
  href: `/services#${service.id}`,
}));

const cols: Array<{ title: string; links: FooterLink[] }> = [
  {
    title: "Services",
    links: serviceLinks,
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/#about" },
      { label: "Products", href: "/products" },
      { label: "Contact Us", href: "/contact-us" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Service", href: "/terms-of-service" },
    ],
  },
];

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <LogoLockup
              href="/"
              className="foot-logo"
              logoClassName="foot-logo-img"
              taglineClassName="foot-logo-tagline"
            />
            <p>
              Managed cyber &amp; information security across Asia, EMEA, and United States of America — protecting what matters most to your business.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.title} className="foot-col">
              <h4>{c.title}</h4>
              <ul>
                {c.links.map((link) => (
                  <li key={link.href}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="foot-bottom">
          <span>&copy; 2026 Auxgens. All rights reserved.</span>
          <span className="foot-locations">
            <span className="foot-location">
              <span className="flag-mark flag-mark-in" aria-label="India" role="img"></span>
              India
            </span>
            <span className="foot-location-sep" aria-hidden="true">·</span>
            <span className="foot-location">
              <span className="flag-mark flag-mark-us" aria-label="United States" role="img"></span>
              US
            </span>
          </span>
        </div>
      </div>
    </footer>
  );
}
