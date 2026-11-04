import type { Metadata } from "next";
import Image from "next/image";
import {
  PiArrowUpRightBold,
  PiClockCountdownDuotone,
  PiEnvelopeSimpleDuotone,
  PiGlobeHemisphereWestDuotone,
  PiLinkedinLogoDuotone,
  PiMapPinDuotone,
  PiPhoneDuotone,
  PiShieldCheckDuotone,
} from "react-icons/pi";
import Announce from "../components/Announce";
import Footer from "../components/Footer";
import Nav from "../components/Nav";
import ScrollFade from "../components/ScrollFade";
import ContactForm from "./ContactForm";
import { CopyEmail, LocalTime } from "./ContactExtras";
import "./contact.css";

type Office = {
  label: string;
  city: string;
  address: string[];
  country: "in" | "us";
  countryName: string;
  timeZone: string;
  phone?: string;
};

const offices: Office[] = [
  {
    label: "India operations",
    city: "Bengaluru",
    address: ["C3834, Brigade Meadows", "Udayapura, Bengaluru 560082"],
    country: "in",
    countryName: "India",
    timeZone: "Asia/Kolkata",
  },
  {
    label: "United States of America operations",
    city: "Austin, Texas",
    address: ["Office 242, 1205 BMC Drive", "Cedar Park, Austin, TX 78613"],
    country: "us",
    countryName: "United States",
    timeZone: "America/Chicago",
    phone: "+1 360 875 2205",
  },
];

const heroStats = [
  { icon: PiClockCountdownDuotone, value: "1 day", label: "Response window" },
  { icon: PiGlobeHemisphereWestDuotone, value: "3 regions", label: "Asia · EMEA · USA" },
  { icon: PiShieldCheckDuotone, value: "2 hubs", label: "Bengaluru & Austin" },
];

const coverage = [
  { label: "Response window", value: "1 business day" },
  { label: "Coverage", value: "Asia · EMEA · USA" },
  { label: "Engagements", value: "Remote & on-site" },
];

const email = "contact@auxgens.net";
const linkedInUrl = "https://www.linkedin.com/company/auxgen";

export const metadata: Metadata = {
  title: "Contact Us | Auxgens",
  description:
    "Contact Auxgens for Forward Deployed AI Engineer, SOC, cybersecurity, GRC, privacy, compliance, and secure application development enquiries.",
};

export default function ContactUsPage() {
  return (
    <>
      <Nav />
      <Announce />
      <main className="cx-page">
        <section className="cx-hero" aria-labelledby="cx-hero-title">
          <div className="cx-hero-orbit" aria-hidden="true">
            <span />
            <span />
            <span />
            <div className="cx-hero-logo">
              <Image
                src="/logo_3d.gif"
                alt=""
                width={360}
                height={285}
                unoptimized
                priority
              />
            </div>
          </div>
          <div className="wrap cx-hero-inner">
            <h1 id="cx-hero-title" className="anim">
              Let&rsquo;s secure <em>what&rsquo;s next.</em>
            </h1>
            <p className="cx-hero-intro anim d1">
              Whether you need a SOC, a virtual CISO, AI engineers embedded in your
              team, or audit-ready compliance, tell us where you are and we&rsquo;ll
              map the shortest path to where you need to be.
            </p>
            <ul className="cx-stats anim d2">
              {heroStats.map(({ icon: Icon, value, label }) => (
                <li key={label}>
                  <Icon aria-hidden="true" focusable="false" />
                  <span>
                    <strong>{value}</strong>
                    <small>{label}</small>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="cx-stage">
          <div className="wrap">
            <div className="cx-shell anim">
              <aside className="cx-aside" aria-label="Contact summary">
                <div className="cx-aside-glow" aria-hidden="true" />

                <div className="cx-aside-block">
                  <p className="cx-aside-eyebrow">Direct line</p>
                  <a className="cx-email" href={`mailto:${email}`}>
                    {email}
                  </a>
                  <div className="cx-email-actions">
                    <a className="cx-btn-light" href={`mailto:${email}`}>
                      <PiEnvelopeSimpleDuotone aria-hidden="true" focusable="false" />
                      <span>Email sales</span>
                    </a>
                    <CopyEmail email={email} />
                  </div>
                </div>

                <div className="cx-aside-block">
                  <p className="cx-aside-eyebrow">At a glance</p>
                  <div className="cx-coverage">
                    {coverage.map((item) => (
                      <div key={item.label}>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <a
                  className="cx-linkedin"
                  href={linkedInUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <PiLinkedinLogoDuotone aria-hidden="true" focusable="false" />
                  <span>
                    <small>Follow along</small>
                    <strong>Auxgens on LinkedIn</strong>
                  </span>
                  <PiArrowUpRightBold className="cx-arrow" aria-hidden="true" focusable="false" />
                </a>
              </aside>

              <ContactForm />
            </div>
          </div>
        </section>

        <section className="cx-offices" aria-labelledby="cx-offices-title">
          <div className="wrap">
            <div className="cx-offices-head anim">
              <p className="eyebrow">Our offices</p>
              <h2 id="cx-offices-title">
                Two hubs. <em>One team</em> working around the clock.
              </h2>
            </div>

            <div className="cx-office-grid">
              {offices.map((office, index) => (
                <article
                  key={office.country}
                  className={`cx-office anim${index ? " d1" : ""}`}
                >
                  <div className="cx-office-top">
                    <span
                      className={`flag-mark flag-mark-${office.country} cx-flag`}
                      aria-label={`${office.countryName} flag`}
                      role="img"
                    />
                    <LocalTime timeZone={office.timeZone} />
                  </div>
                  <small>{office.label}</small>
                  <h3>{office.city}</h3>
                  <address>
                    <span className="cx-office-line">
                      <PiMapPinDuotone aria-hidden="true" focusable="false" />
                      <span>
                        {office.address.map((line) => (
                          <span key={line}>{line}</span>
                        ))}
                      </span>
                    </span>
                    {office.phone && (
                      <a
                        className="cx-office-line"
                        href={`tel:${office.phone.replace(/\s/g, "")}`}
                      >
                        <PiPhoneDuotone aria-hidden="true" focusable="false" />
                        <span>{office.phone}</span>
                      </a>
                    )}
                  </address>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <ScrollFade />
    </>
  );
}
