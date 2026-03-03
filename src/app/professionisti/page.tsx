// src/app/professionisti/page.tsx
import { redirect } from "next/navigation";

export default function ProfessionistiHome() {
  // Redirect SOLO quando sei sulla root /professionisti
  redirect("/professionisti/scansiona");
}