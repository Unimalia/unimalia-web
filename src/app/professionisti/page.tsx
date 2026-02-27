// src/app/professionisti/page.tsx
import { redirect } from "next/navigation";

export default function ProfessionistiHome() {
  // La home del portale NON è una landing.
  // È un ingresso operativo.
  redirect("/professionisti/scansiona");
}