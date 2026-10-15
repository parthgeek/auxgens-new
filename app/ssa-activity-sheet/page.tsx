import type { Metadata } from "next";
import Announce from "../components/Announce";
import Footer from "../components/Footer";
import Nav from "../components/Nav";
import ScrollFade from "../components/ScrollFade";
import SSAActivitySheet from "./SSAActivitySheet";

export const metadata: Metadata = {
  title: "SSA & JSSA Activity Sheet | Auxgens",
  description:
    "Shared SSA and JSSA workboards for the Auxgens team to record and follow activities.",
};

export default function SSAActivitySheetPage() {
  return (
    <>
      <Nav />
      <Announce />
      <main>
        <SSAActivitySheet />
      </main>
      <Footer />
      <ScrollFade />
    </>
  );
}
