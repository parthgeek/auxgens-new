import type { Metadata } from "next";
import Announce from "../components/Announce";
import Footer from "../components/Footer";
import Nav from "../components/Nav";
import DigitalMarketingQuestionnaire from "./DigitalMarketingQuestionnaire";

export const metadata: Metadata = {
  title: "Sri Sri Academy — Questionnaire for Digital Marketing Proposal | Auxgens",
  description:
    "Transforming Sri Sri Academy's digital presence to drive admissions growth through a focused social media and digital marketing proposal.",
  alternates: {
    canonical: "/digital-marketing-questionnaire",
  },
};

export default function DigitalMarketingQuestionnairePage() {
  return (
    <>
      <Nav />
      <Announce />
      <main className="dmq-page">
        <DigitalMarketingQuestionnaire />
      </main>
      <Footer />
    </>
  );
}
