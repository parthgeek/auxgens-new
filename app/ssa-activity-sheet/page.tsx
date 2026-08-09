import type { Metadata } from "next";
import Announce from "../components/Announce";
import Footer from "../components/Footer";
import Nav from "../components/Nav";
import ScrollFade from "../components/ScrollFade";
import SSAActivitySheet from "./SSAActivitySheet";

export const metadata: Metadata = {
  title: "SSA Activity Sheet | Auxgens",
  description:
    "A shared workboard for the Auxgens team to record and follow Sri Sri Academy activity.",
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
