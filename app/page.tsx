import { redirect } from "next/navigation";

export const metadata = {
  title: "Yuwei Li",
  description: "Portfolio of Yuwei Li.",
};

export default function Home() {
  redirect("/about");
}
