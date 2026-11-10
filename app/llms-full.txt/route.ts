import { buildLlmsFullTxt, llmsResponse } from "@/lib/seo/llms";

export const revalidate = 300;

export async function GET() {
  return llmsResponse(await buildLlmsFullTxt());
}
