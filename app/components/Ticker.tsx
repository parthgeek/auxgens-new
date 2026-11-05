const brands = {
  dell: {
    id: "dell",
    name: "Dell",
    url: "https://www.dell.com/",
    logo: (
      <img className="brand-logo-img" src="/dell.png" alt="" loading="lazy" />
    ),
  },
  rsa: {
    id: "rsa",
    name: "RSA",
    url: "https://www.rsa.com/",
    logo: (
      <img className="brand-logo-img" src="/rsa.png" alt="" loading="lazy" />
    ),
  },
  versa: {
    id: "versa",
    name: "Versa",
    url: "https://versa-networks.com/",
    logo: (
      <img className="brand-logo-img" src="/versa-logo-color.svg" alt="" loading="lazy" />
    ),
  },
  ssrvm: {
    id: "ssrvm",
    name: "SSRVM",
    url: "https://ssrvm.org/",
    logo: (
      <img className="brand-logo-img" src="/ssrvm.avif" alt="" loading="lazy" />
    ),
  },
  ibsfintech: {
    id: "ibsfintech",
    name: "IBSFINtech",
    url: "https://www.ibsfintech.com/",
    logo: (
      <img className="brand-logo-img" src="/ibs-new.png" alt="" loading="lazy" />
    ),
  },
  seceon: {
    id: "seceon",
    name: "Seceon",
    url: "https://seceon.com/",
    logo: (
      <img className="brand-logo-img" src="/seceon.png" alt="" loading="lazy" />
    ),
  },
  docq: {
    id: "docq",
    name: "DocQ",
    url: "https://docq.com/",
    logo: (
      <img className="brand-logo-img" src="/docq2.png" alt="" loading="lazy" />
    ),
  },
  virtusa: {
    id: "virtusa",
    name: "Virtusa",
    url: "https://www.virtusa.com/",
    logo: (
      <img className="brand-logo-img" src="/virtusa.png" alt="" loading="lazy" />
    ),
  },
  bankOfIndia: {
    id: "bank-of-india",
    name: "Bank Of India",
    url: "https://bankofindia.bank.in/",
    logo: (
      <img className="brand-logo-img" src="/bank%20of%20india.png" alt="" loading="lazy" />
    ),
  },
  cisoPrime: {
    id: "ciso-prime",
    name: "CISO Prime",
    url: "https://www.cisoprime.io/",
    logo: (
      <img className="brand-logo-img" src="/ciso-prime-logo.png" alt="" loading="lazy" />
    ),
  },
  daab: {
    id: "daab",
    name: "DAAB",
    url: "https://daab.app/",
    logo: (
      <img className="brand-logo-img" src="/daab-logo.svg" alt="" loading="lazy" />
    ),
  },
};

const items = [
  brands.dell,
  brands.rsa,
  brands.versa,
  brands.ssrvm,
  brands.ibsfintech,
  brands.seceon,
  brands.docq,
  brands.virtusa,
  brands.bankOfIndia,
  brands.cisoPrime,
  brands.daab,
];

export default function Ticker() {
  return (
    <div className="ticker">
      <p className="ticker-headline">Trusted by Frontier Labs and Industry Leaders</p>
      <div className="ticker-track">
        {[0, 1].map((groupIndex) => (
          <div
            key={groupIndex}
            className="ticker-group"
            aria-hidden={groupIndex === 1 ? true : undefined}
          >
            {items.map((brand, i) => (
              <a
                key={`${brand.name}-${groupIndex}-${i}`}
                href={brand.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ticker-item"
                tabIndex={groupIndex === 1 ? -1 : 0}
                aria-label={`Visit ${brand.name}`}
              >
                <span className={`ticker-inline-logo ticker-inline-logo-${brand.id}`} aria-hidden="true">
                  {brand.logo}
                </span>
                <span className="ticker-label">{brand.name}</span>
                <span className={`ticker-logo ticker-logo-${brand.id}`} aria-hidden="true">
                  {brand.logo}
                </span>
              </a>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
