import type { Metadata } from "next";
import Link from "next/link";
import {
  PiArrowRightDuotone,
  PiCertificateDuotone,
  PiClockDuotone,
  PiFingerprintSimpleDuotone,
  PiShieldCheckDuotone,
  PiTargetDuotone,
} from "react-icons/pi";
import type { IconType } from "react-icons";
import Announce from "../components/Announce";
import Footer from "../components/Footer";
import Nav from "../components/Nav";
import ScrollFade from "../components/ScrollFade";
import { frameworkSummaries } from "../data/questionnaires";

export const metadata: Metadata = {
  title: "Questionnaire | Auxgens",
  description:
    "Complete Sri Sri Academy's digital marketing questionnaire or run focused self-assessments for SOC 2, ISO 27001:2022, GDPR, and VAPT readiness.",
};

const iconMap: Record<string, IconType> = {
  certificate: PiCertificateDuotone,
  privacy: PiFingerprintSimpleDuotone,
  shield: PiShieldCheckDuotone,
  target: PiTargetDuotone,
};

export default function QuestionnairePage() {
  return (
    <>
      <Nav />
      <Announce />
      <main>
        <section className="questionnaire-hero">
          <div className="wrap questionnaire-hero-grid">
            <div className="questionnaire-hero-copy anim">
              <div className="hero-badge">
                <div className="badge-dot"></div>
                <span className="eyebrow">Guided questionnaires</span>
              </div>
              <h1 className="questionnaire-title">
                Better briefs. Clearer next steps.
              </h1>
              <p className="questionnaire-lede">
                Complete Sri Sri Academy&apos;s digital marketing brief or a focused
                security readiness assessment. Progress stays saved in your
                browser until you are ready to submit.
              </p>
            </div>
            <div className="questionnaire-hero-panel anim d1" aria-label="Questionnaire summary">
              <div>
                <span className="questionnaire-panel-kicker">Available tracks</span>
                <strong>{frameworkSummaries.length + 1}</strong>
              </div>
              <div>
                <span className="questionnaire-panel-kicker">Total questions</span>
                <strong>
                  {frameworkSummaries.reduce(
                    (total, framework) => total + framework.questionCount,
                    57,
                  )}
                </strong>
              </div>
              <div>
                <span className="questionnaire-panel-kicker">Scoring</span>
                <strong>Guided</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="section questionnaire-library">
          <div className="wrap">
            <div className="questionnaire-section-head anim">
              <p className="eyebrow">Choose a questionnaire</p>
              <h2>Five focused tracks for discovery and readiness.</h2>
            </div>
            <div className="questionnaire-framework-grid">
              <article className="questionnaire-framework-card anim">
                <div className="questionnaire-card-top">
                  <div className="questionnaire-card-icon">
                    <PiTargetDuotone aria-hidden="true" focusable="false" />
                  </div>
                  <span className="questionnaire-difficulty">Client brief</span>
                </div>
                <h3>Sri Sri Academy Marketing Proposal</h3>
                <p>
                  Capture admission goals, parent audiences, channels, content,
                  technology, budget, and success measures for Sri Sri Academy.
                </p>
                <div className="questionnaire-card-meta">
                  <span>57 questions</span>
                  <span>
                    <PiClockDuotone aria-hidden="true" focusable="false" />
                    15-20 min
                  </span>
                </div>
                <div className="questionnaire-card-cats" aria-label="Categories">
                  <span>Audience</span>
                  <span>Channels</span>
                  <span>Technology</span>
                  <span>Goals</span>
                </div>
                <Link href="/digital-marketing-questionnaire" className="btn-lime questionnaire-start">
                  Start Questionnaire
                  <PiArrowRightDuotone aria-hidden="true" focusable="false" />
                </Link>
              </article>
              {frameworkSummaries.map((framework, index) => {
                const Icon = iconMap[framework.icon] ?? PiShieldCheckDuotone;

                return (
                  <article
                    key={framework.slug}
                    className={`questionnaire-framework-card anim d${index + 1}`}
                  >
                    <div className="questionnaire-card-top">
                      <div className="questionnaire-card-icon">
                        <Icon aria-hidden="true" focusable="false" />
                      </div>
                      <span className="questionnaire-difficulty">
                        {framework.difficulty}
                      </span>
                    </div>
                    <h3>{framework.framework}</h3>
                    <p>{framework.description}</p>
                    <div className="questionnaire-card-meta">
                      <span>{framework.questionCount} questions</span>
                      <span>
                        <PiClockDuotone aria-hidden="true" focusable="false" />
                        {framework.estimatedTime}
                      </span>
                    </div>
                    <div className="questionnaire-card-cats" aria-label="Categories">
                      {framework.categories.slice(0, 4).map((category) => (
                        <span key={category}>{category}</span>
                      ))}
                    </div>
                    <Link href={`/questionnaire/${framework.slug}`} className="btn-lime questionnaire-start">
                      Start Assessment
                      <PiArrowRightDuotone aria-hidden="true" focusable="false" />
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <ScrollFade />
    </>
  );
}
