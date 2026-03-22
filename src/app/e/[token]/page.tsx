import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type PageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function LegacyEmergencyRedirectPage({ params }: PageProps) {
  const { token } = await params;
  redirect(`/emergency/${token}`);
}