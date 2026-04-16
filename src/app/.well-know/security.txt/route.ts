import { NextResponse } from "next/server";

const SECURITY_TXT = `Contact: mailto:professionisti@unimalia.it
Expires: 2027-03-27T23:59:59.000Z
Preferred-Languages: it, en
Canonical: https://www.unimalia.it/.well-known/security.txt
Policy: https://www.unimalia.it/privacy
`;

export async function GET() {
  return new NextResponse(SECURITY_TXT, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, must-revalidate",
    },
  });
}
