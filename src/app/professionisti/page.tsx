// src/app/professionisti/page.tsx
import { redirect } from "next/navigation";

export default function ProfessionistiHome() {
  // Root del portale professionisti → Dashboard vera
  redirect("/professionisti/dashboard");
}