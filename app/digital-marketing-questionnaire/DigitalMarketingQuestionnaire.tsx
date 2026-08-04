"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  marketingQuestions,
  marketingSections,
  type MarketingQuestion,
} from "./questions";

type Profile = {
  name: string;
  email: string;
  organisation: string;
  website: string;
};

type AnswerValue = string | string[];
type AnswerMap = Record<string, AnswerValue>;
type Stage = "intro" | "questions" | "review" | "success";

const storageKey = "auxgens-digital-marketing-questionnaire";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emptyProfile: Profile = {
  name: "",
  email: "",
  organisation: "Sri Sri Academy, Siliguri",
  website: "",
};

function ArrowIcon({ direction = "right" }: { direction?: "left" | "right" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={direction === "left" ? "dmq-icon-flip" : undefined}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21 3-8.2 18-2.5-7.3L3 11.2 21 3Z" />
      <path d="m10.3 13.7 4.3-4.3" />
    </svg>
  );
}

function answerAsText(value: AnswerValue | undefined) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return value ?? "";
}

function hasAnswer(value: AnswerValue | undefined) {
  return Array.isArray(value) ? value.length > 0 : Boolean(value?.trim());
}

function getInputMode(question: MarketingQuestion) {
  return question.type === "number" ? "numeric" : "text";
}

export default function DigitalMarketingQuestionnaire() {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stage, setStage] = useState<Stage>("intro");
  const [hydrated, setHydrated] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "error">("idle");
  const [submitError, setSubmitError] = useState("");
  const conversationEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as {
          profile?: Partial<Profile>;
          answers?: AnswerMap;
          currentIndex?: number;
          stage?: Stage;
        };
        setProfile({
          ...emptyProfile,
          ...parsed.profile,
          organisation: emptyProfile.organisation,
        });
        setAnswers(parsed.answers ?? {});
        setCurrentIndex(
          Math.min(
            Math.max(Number(parsed.currentIndex) || 0, 0),
            marketingQuestions.length - 1,
          ),
        );
        if (parsed.stage && parsed.stage !== "success") {
          setStage(parsed.stage);
        }
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || stage === "success") {
      return;
    }

    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ profile, answers, currentIndex, stage }),
    );
  }, [answers, currentIndex, hydrated, profile, stage]);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [currentIndex, stage]);

  const currentQuestion = marketingQuestions[currentIndex];
  const currentAnswer = answers[currentQuestion.id];
  const answeredCount = useMemo(
    () => marketingQuestions.filter((question) => hasAnswer(answers[question.id])).length,
    [answers],
  );
  const progress = Math.round((answeredCount / marketingQuestions.length) * 100);
  const previousQuestions = marketingQuestions.slice(Math.max(0, currentIndex - 2), currentIndex);

  const sectionDetails = useMemo(
    () =>
      marketingSections.map((section) => {
        const questions = marketingQuestions.filter((question) => question.section === section);
        const completed = questions.filter((question) => hasAnswer(answers[question.id])).length;
        return { section, questions, completed };
      }),
    [answers],
  );

  const updateProfile = (field: keyof Profile, value: string) => {
    setProfile((current) => ({ ...current, [field]: value }));
    setFieldError("");
  };

  const beginQuestionnaire = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!profile.name.trim() || !profile.email.trim()) {
      setFieldError("Please add your name and work email to continue.");
      return;
    }

    if (!emailPattern.test(profile.email.trim())) {
      setFieldError("Please enter a valid work email address.");
      return;
    }

    setStage("questions");
  };

  const setCurrentAnswer = (value: AnswerValue) => {
    setAnswers((current) => ({ ...current, [currentQuestion.id]: value }));
    setFieldError("");
  };

  const toggleMultiAnswer = (option: string) => {
    const selected = Array.isArray(currentAnswer) ? currentAnswer : [];
    setCurrentAnswer(
      selected.includes(option)
        ? selected.filter((item) => item !== option)
        : [...selected, option],
    );
  };

  const moveForward = () => {
    if (!hasAnswer(currentAnswer)) {
      setFieldError("Add an answer or choose Not sure / not applicable.");
      return;
    }

    if (currentIndex === marketingQuestions.length - 1) {
      setStage("review");
      return;
    }

    setCurrentIndex((index) => index + 1);
    setFieldError("");
  };

  const skipQuestion = () => {
    setAnswers((current) => ({
      ...current,
      [currentQuestion.id]: "Not sure / not applicable",
    }));

    if (currentIndex === marketingQuestions.length - 1) {
      setStage("review");
      return;
    }

    setCurrentIndex((index) => index + 1);
    setFieldError("");
  };

  const moveBack = () => {
    if (currentIndex === 0) {
      setStage("intro");
      return;
    }

    setCurrentIndex((index) => index - 1);
    setFieldError("");
  };

  const jumpToQuestion = (question: MarketingQuestion) => {
    setCurrentIndex(marketingQuestions.findIndex((item) => item.id === question.id));
    setStage("questions");
    setFieldError("");
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      moveForward();
    }
  };

  const submitQuestionnaire = async () => {
    setSubmitStatus("loading");
    setSubmitError("");

    try {
      const response = await fetch("/api/digital-marketing-questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          responses: marketingQuestions.map((question) => ({
            id: question.id,
            answer: answers[question.id] ?? "Not answered",
          })),
        }),
      });
      const result = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok || !result.success) {
        throw new Error(result.error || "We could not send your questionnaire.");
      }

      window.localStorage.removeItem(storageKey);
      setStage("success");
      setSubmitStatus("idle");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setSubmitStatus("error");
      setSubmitError(
        error instanceof Error
          ? error.message
          : "We could not send your questionnaire. Please try again.",
      );
    }
  };

  const renderQuestionInput = () => {
    if (currentQuestion.type === "single" && currentQuestion.options) {
      return (
        <div className="dmq-choice-list" role="radiogroup" aria-label={currentQuestion.prompt}>
          {currentQuestion.options.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={currentAnswer === option}
              className={currentAnswer === option ? "is-selected" : undefined}
              onClick={() => setCurrentAnswer(option)}
            >
              <span className="dmq-choice-control"><CheckIcon /></span>
              {option}
            </button>
          ))}
        </div>
      );
    }

    if (currentQuestion.type === "multi" && currentQuestion.options) {
      const selected = Array.isArray(currentAnswer) ? currentAnswer : [];
      return (
        <div className="dmq-choice-list dmq-choice-list-multi" aria-label={currentQuestion.prompt}>
          {currentQuestion.options.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={selected.includes(option)}
              className={selected.includes(option) ? "is-selected" : undefined}
              onClick={() => toggleMultiAnswer(option)}
            >
              <span className="dmq-choice-control"><CheckIcon /></span>
              {option}
            </button>
          ))}
        </div>
      );
    }

    if (currentQuestion.type === "textarea") {
      return (
        <label className="dmq-input-block" htmlFor={`answer-${currentQuestion.id}`}>
          <span>Your answer</span>
          <textarea
            id={`answer-${currentQuestion.id}`}
            rows={5}
            value={typeof currentAnswer === "string" ? currentAnswer : ""}
            placeholder={currentQuestion.placeholder}
            onChange={(event) => setCurrentAnswer(event.target.value)}
            autoFocus
          />
        </label>
      );
    }

    return (
      <label className="dmq-input-block" htmlFor={`answer-${currentQuestion.id}`}>
        <span>Your answer</span>
        <input
          id={`answer-${currentQuestion.id}`}
          type={currentQuestion.type === "date" ? "date" : "text"}
          inputMode={getInputMode(currentQuestion)}
          value={typeof currentAnswer === "string" ? currentAnswer : ""}
          placeholder={currentQuestion.placeholder}
          onChange={(event) => setCurrentAnswer(event.target.value)}
          onKeyDown={handleInputKeyDown}
          autoFocus
        />
      </label>
    );
  };

  if (!hydrated) {
    return (
      <section className="dmq-shell" aria-label="Loading questionnaire">
        <div className="wrap dmq-loading">
          <span />
          <span />
          <span />
        </div>
      </section>
    );
  }

  return (
    <section className="dmq-shell">
      <div className="wrap dmq-topline">
        <Link href="/questionnaire" className="dmq-back-link">
          <ArrowIcon direction="left" />
          Questionnaire library
        </Link>
        <span>Responses are sent securely to contact@auxgens.net</span>
      </div>

      <div className="wrap dmq-heading">
        <div>
          <p className="eyebrow">Sri Sri Academy, Siliguri</p>
          <h1>Questionnaire for Digital Marketing Proposal.</h1>
        </div>
        <p>
          Transforming Sri Sri Academy&apos;s digital presence to drive admissions
          growth.
        </p>
      </div>

      <div className="wrap dmq-layout">
        <aside className="dmq-rail" aria-label="Questionnaire progress">
          <div className="dmq-progress-copy">
            <span>Progress</span>
            <strong>{progress}%</strong>
          </div>
          <div className="dmq-progress-track" aria-hidden="true">
            <span style={{ transform: `scaleX(${progress / 100})` }} />
          </div>
          <p>{answeredCount} of {marketingQuestions.length} questions answered</p>

          <nav className="dmq-sections" aria-label="Questionnaire sections">
            {sectionDetails.map(({ section, questions, completed }, index) => {
              const isActive = currentQuestion.section === section && stage === "questions";
              return (
                <button
                  key={section}
                  type="button"
                  className={isActive ? "is-active" : undefined}
                  onClick={() => jumpToQuestion(questions[0])}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{section}</strong>
                  <small>{completed}/{questions.length}</small>
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="dmq-chat-window">
          <div className="dmq-chat-bar">
            <div className="dmq-agent-mark" aria-hidden="true">A</div>
            <div>
              <strong>Auxgens questionnaire assistant</strong>
              <span><i /> Prepared for Sri Sri Academy</span>
            </div>
            <small>Usually 15-20 min</small>
          </div>

          <div className="dmq-conversation" aria-live="polite">
            {stage === "intro" && (
              <>
                <div className="dmq-message dmq-message-agent">
                  <span className="dmq-message-author">Auxgens</span>
                  <p>
                    Welcome. This questionnaire will help us understand Sri Sri
                    Academy&apos;s admission goals, parent audience, marketing,
                    technology, content, and priorities. Your progress is saved
                    on this device, so you can return at any time.
                  </p>
                </div>
                <form className="dmq-profile-form" onSubmit={beginQuestionnaire} noValidate>
                  <div className="dmq-profile-grid">
                    <label>
                      <span>Your name *</span>
                      <input
                        type="text"
                        autoComplete="name"
                        value={profile.name}
                        onChange={(event) => updateProfile("name", event.target.value)}
                        placeholder="Who are we speaking with?"
                      />
                    </label>
                    <label>
                      <span>Work email *</span>
                      <input
                        type="email"
                        autoComplete="email"
                        value={profile.email}
                        onChange={(event) => updateProfile("email", event.target.value)}
                        placeholder="name@company.com"
                      />
                    </label>
                    <label>
                      <span>School</span>
                      <input
                        type="text"
                        autoComplete="organization"
                        value={profile.organisation}
                        readOnly
                      />
                    </label>
                    <label>
                      <span>Website</span>
                      <input
                        type="url"
                        autoComplete="url"
                        value={profile.website}
                        onChange={(event) => updateProfile("website", event.target.value)}
                        placeholder="https://"
                      />
                    </label>
                  </div>
                  {fieldError && <p className="dmq-field-error">{fieldError}</p>}
                  <button type="submit" className="dmq-primary-button">
                    Begin conversation
                    <ArrowIcon />
                  </button>
                </form>
              </>
            )}

            {stage === "questions" && (
              <>
                {previousQuestions.map((question) => (
                  <div className="dmq-history" key={question.id}>
                    <div className="dmq-message dmq-message-agent is-history">
                      <span className="dmq-message-author">Auxgens</span>
                      <p>{question.prompt}</p>
                    </div>
                    <div className="dmq-message dmq-message-user is-history">
                      <span className="dmq-message-author">You</span>
                      <p>{answerAsText(answers[question.id])}</p>
                    </div>
                  </div>
                ))}

                <div className="dmq-section-divider">
                  <span>{currentQuestion.section}</span>
                  <small>Question {currentIndex + 1} of {marketingQuestions.length}</small>
                </div>
                <div className="dmq-message dmq-message-agent dmq-current-message" key={currentQuestion.id}>
                  <span className="dmq-message-author">Auxgens</span>
                  <p>{currentQuestion.prompt}</p>
                  {currentQuestion.helper && <small>{currentQuestion.helper}</small>}
                </div>
                <div className="dmq-composer" key={`composer-${currentQuestion.id}`}>
                  {renderQuestionInput()}
                  {fieldError && <p className="dmq-field-error">{fieldError}</p>}
                  <div className="dmq-composer-actions">
                    <button type="button" className="dmq-text-button" onClick={moveBack}>
                      <ArrowIcon direction="left" />
                      Back
                    </button>
                    <button type="button" className="dmq-skip-button" onClick={skipQuestion}>
                      Not sure / not applicable
                    </button>
                    <button type="button" className="dmq-primary-button" onClick={moveForward}>
                      {currentIndex === marketingQuestions.length - 1 ? "Review answers" : "Send answer"}
                      <ArrowIcon />
                    </button>
                  </div>
                </div>
              </>
            )}

            {stage === "review" && (
              <div className="dmq-review">
                <div className="dmq-message dmq-message-agent">
                  <span className="dmq-message-author">Auxgens</span>
                  <p>
                    Your brief is ready, {profile.name.split(" ")[0]}. Review any
                    response below, then send Sri Sri Academy&apos;s completed brief
                    to our digital marketing team.
                  </p>
                </div>

                <div className="dmq-review-summary">
                  <div><span>School</span><strong>{profile.organisation}</strong></div>
                  <div><span>Responses</span><strong>{answeredCount}/{marketingQuestions.length}</strong></div>
                  <div><span>Recipient</span><strong>contact@auxgens.net</strong></div>
                </div>

                <div className="dmq-review-sections">
                  {sectionDetails.map(({ section, questions }) => (
                    <details key={section}>
                      <summary>
                        <span>{section}</span>
                        <small>{questions.length} answers</small>
                      </summary>
                      <div>
                        {questions.map((question) => (
                          <button key={question.id} type="button" onClick={() => jumpToQuestion(question)}>
                            <span>{question.prompt}</span>
                            <strong>{answerAsText(answers[question.id]) || "Not answered"}</strong>
                          </button>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>

                {submitError && <p className="dmq-submit-error">{submitError}</p>}
                <div className="dmq-review-actions">
                  <button type="button" className="dmq-text-button" onClick={() => setStage("questions")}>
                    <ArrowIcon direction="left" />
                    Return to answers
                  </button>
                  <button
                    type="button"
                    className="dmq-primary-button"
                    disabled={submitStatus === "loading"}
                    onClick={submitQuestionnaire}
                  >
                    {submitStatus === "loading" ? "Sending securely..." : "Send completed brief"}
                    <SendIcon />
                  </button>
                </div>
              </div>
            )}

            {stage === "success" && (
              <div className="dmq-success">
                <div className="dmq-success-mark"><CheckIcon /></div>
                <p className="eyebrow">Brief received</p>
                <h2>Thank you, {profile.name.split(" ")[0]}.</h2>
                <p>
                  Sri Sri Academy&apos;s digital marketing questionnaire has been sent to
                  <strong> contact@auxgens.net</strong>. Our team now has the context
                  needed to prepare a focused conversation.
                </p>
                <div className="dmq-success-actions">
                  <Link href="/services" className="dmq-text-button">Explore our services</Link>
                  <Link href="/contact-us" className="dmq-primary-button">
                    Contact Auxgens
                    <ArrowIcon />
                  </Link>
                </div>
              </div>
            )}

            <div ref={conversationEndRef} />
          </div>
        </div>
      </div>
    </section>
  );
}
