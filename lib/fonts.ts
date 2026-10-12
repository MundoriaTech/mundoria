import { Sora } from "next/font/google";

/** Site typography — Light through ExtraBold. */
export const sora = Sora({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["300", "400", "500", "600", "700", "800"],
});
