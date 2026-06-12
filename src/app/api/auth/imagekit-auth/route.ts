import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"
import ImageKit from "@imagekit/nodejs";
import { Logger, LogTags, categorizeError } from "@/lib/logger";

export async function GET() {
  Logger.d(LogTags.IMAGEKIT_AUTH, 'ImageKit auth request received');

  try {
    const imagekit = new ImageKit({
      publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || '',
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
      urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/demo',
    });

    const authParams = imagekit.getAuthenticationParameters();
    Logger.i(LogTags.IMAGEKIT_AUTH, 'ImageKit authentication parameters generated successfully');
    Logger.d(LogTags.IMAGEKIT_AUTH, 'Auth parameters generated', {
      hasToken: !!authParams.token,
      hasSignature: !!authParams.signature,
      expire: authParams.expire
    });

    return NextResponse.json({
      authenticationParameters: authParams,
      publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY
    });
  } catch (error) {
    const categorizedError = categorizeError(error);
    Logger.e(LogTags.IMAGEKIT_AUTH, `ImageKit auth error: ${categorizedError.message}`, { error: categorizedError });
    return NextResponse.json({
      error: "Authentication for ImageKit failed"
    }, { status: 500 })
  }
}