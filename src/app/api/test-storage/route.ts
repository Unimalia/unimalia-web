import { NextResponse } from "next/server"
import { uploadPrivateFile } from "@/lib/storage"

export async function GET() {
  try {
    const result = await uploadPrivateFile({
      path: "test/test-file.txt",
      body: "HELLO UNIMALIA",
      contentType: "text/plain",
    })

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
    })
  }
}