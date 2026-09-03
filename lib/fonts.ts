import { Poppins } from "next/font/google";

/** Figma landing + app typography — Light through ExtraBold. */
export const poppins = Poppins({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700", "800"],
});
