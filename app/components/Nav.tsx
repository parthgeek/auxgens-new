"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import LogoLockup from "./LogoLockup";

const navItems = [
  { label: "Home", href: "/#home" },
  { label: "Our Services", href: "/services" },
  { label: "About Us", href: "/about-us" },
];

export default function Nav() {
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const syncHash = () => {
      setHash(window.location.hash);
      setIsMenuOpen(false);
    };

    syncHash();
    window.addEventListener("hashchange", syncHash);

    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isMenuOpen]);

  const isActive = (href: string) => {
    if (href.startsWith("/") && !href.includes("#")) {
      return pathname === href;
    }

    if (pathname !== "/") {
      return false;
    }

    if (href === "/#home") {
      return hash === "" || hash === "#home";
    }

    return hash === href.slice(1);
  };

  return (
    <header className="nav">
      <div className="nav-inner">
        <LogoLockup
          href="/"
          className="nav-brand"
          logoClassName="nav-logo"
          taglineClassName="nav-tagline"
        />
        <nav className="desktop-nav" aria-label="Primary navigation">
          <ul className="nav-links">
            {navItems.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <a href="/contact-us" className="nav-cta">Contact Us</a>
        <button
          type="button"
          className={`mobile-menu-toggle${isMenuOpen ? " is-open" : ""}`}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
      {isMenuOpen && (
        <nav
          id="mobile-navigation"
          className="mobile-nav"
          aria-label="Mobile navigation"
        >
          <ul className="mobile-nav-links">
            {navItems.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="/contact-us"
            className="mobile-nav-cta"
            aria-current={pathname === "/contact-us" ? "page" : undefined}
            onClick={() => setIsMenuOpen(false)}
          >
            Contact Us
          </a>
        </nav>
      )}
    </header>
  );
}
