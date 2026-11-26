import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";

import { MUNDORIA_IDENTITY, registeredOfficeLine } from "@/lib/seo/identity";

export type InvoiceLine = { amountPence: number; label: string };

export type BookingInvoiceInput = {
  bookingRef: string;
  customer: { address: string | null; email: string | null; name: string };
  invoiceNumber: string;
  issuedAt: Date;
  lines: InvoiceLine[];
  paymentStatus: string;
  service: { date: string; name: string; time: string };
  totalPence: number;
};

const INK = rgb(0.11, 0.07, 0.23);
const MUTED = rgb(0.42, 0.4, 0.5);
const BRAND = rgb(0.13, 0.12, 0.31);
const RULE = rgb(0.86, 0.85, 0.9);

const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;

function money(pence: number) {
  const sign = pence < 0 ? "-" : "";
  return `${sign}£${(Math.abs(pence) / 100).toFixed(2)}`;
}

function ukDate(value: Date | string) {
  const date = typeof value === "string" ? new Date(`${value}T12:00:00Z`) : value;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/London",
    year: "numeric",
  });
}

/** Keep text to what the standard PDF fonts can draw (WinAnsi). */
function safe(text: string) {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/[^\x20-\x7E£·é]/g, "");
}

/** Split text into lines that fit a width. */
function wrap(text: string, font: PDFFont, size: number, width: number) {
  const words = safe(text).split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > width && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** A one-page A4 PDF invoice for a completed booking. */
export async function buildBookingInvoicePdf(input: BookingInvoiceInput) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Invoice ${input.invoiceNumber}`);
  pdf.setAuthor(MUNDORIA_IDENTITY.legalName);
  pdf.setCreationDate(input.issuedAt);

  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const right = PAGE_WIDTH - MARGIN;

  const text = (
    target: PDFPage,
    value: string,
    x: number,
    y: number,
    options: { color?: ReturnType<typeof rgb>; font?: PDFFont; size?: number } = {},
  ) =>
    target.drawText(safe(value), {
      color: options.color ?? INK,
      font: options.font ?? regular,
      size: options.size ?? 10,
      x,
      y,
    });
  const textRight = (
    value: string,
    y: number,
    options: { color?: ReturnType<typeof rgb>; font?: PDFFont; size?: number } = {},
  ) => {
    const font = options.font ?? regular;
    const size = options.size ?? 10;
    text(page, value, right - font.widthOfTextAtSize(safe(value), size), y, options);
  };
  const rule = (y: number) =>
    page.drawLine({ color: RULE, end: { x: right, y }, start: { x: MARGIN, y }, thickness: 1 });

  // Header band
  page.drawRectangle({ color: BRAND, height: 110, width: PAGE_WIDTH, x: 0, y: PAGE_HEIGHT - 110 });
  text(page, MUNDORIA_IDENTITY.brandName.toUpperCase(), MARGIN, PAGE_HEIGHT - 60, {
    color: rgb(1, 1, 1),
    font: bold,
    size: 22,
  });
  text(page, "Home and office cleaning", MARGIN, PAGE_HEIGHT - 80, {
    color: rgb(0.85, 0.84, 0.92),
    size: 10,
  });
  textRight("INVOICE", PAGE_HEIGHT - 60, { color: rgb(1, 1, 1), font: bold, size: 22 });
  textRight(input.invoiceNumber, PAGE_HEIGHT - 80, { color: rgb(0.85, 0.84, 0.92), size: 11 });

  // From / invoice details
  let y = PAGE_HEIGHT - 150;
  text(page, "FROM", MARGIN, y, { color: MUTED, font: bold, size: 8 });
  text(page, "INVOICE DETAILS", 330, y, { color: MUTED, font: bold, size: 8 });
  y -= 16;
  const from = [
    MUNDORIA_IDENTITY.legalName,
    registeredOfficeLine(),
    MUNDORIA_IDENTITY.supportEmail,
    MUNDORIA_IDENTITY.phone,
    MUNDORIA_IDENTITY.companyNumber
      ? `Company number ${MUNDORIA_IDENTITY.companyNumber}`
      : null,
  ].filter(Boolean) as string[];
  const details: [string, string][] = [
    ["Invoice number", input.invoiceNumber],
    ["Invoice date", ukDate(input.issuedAt)],
    ["Booking reference", input.bookingRef],
    ["Payment", input.paymentStatus],
  ];
  let fromY = y;
  from.forEach((line, index) => {
    for (const part of wrap(line, index === 0 ? bold : regular, 10, 250)) {
      text(page, part, MARGIN, fromY, { font: index === 0 ? bold : regular });
      fromY -= 14;
    }
  });
  let detailY = y;
  for (const [label, value] of details) {
    text(page, label, 330, detailY, { color: MUTED });
    textRight(value, detailY, { font: bold });
    detailY -= 14;
  }

  // Bill to / service
  y = Math.min(fromY, detailY) - 20;
  rule(y + 8);
  y -= 12;
  text(page, "BILLED TO", MARGIN, y, { color: MUTED, font: bold, size: 8 });
  text(page, "SERVICE", 330, y, { color: MUTED, font: bold, size: 8 });
  y -= 16;
  let billY = y;
  text(page, input.customer.name, MARGIN, billY, { font: bold });
  billY -= 14;
  for (const line of [input.customer.email, input.customer.address].filter(Boolean) as string[]) {
    for (const part of wrap(line, regular, 10, 250)) {
      text(page, part, MARGIN, billY);
      billY -= 14;
    }
  }
  let serviceY = y;
  text(page, input.service.name, 330, serviceY, { font: bold });
  serviceY -= 14;
  text(page, `${ukDate(input.service.date)} at ${input.service.time}`, 330, serviceY);
  serviceY -= 14;

  // Line items
  y = Math.min(billY, serviceY) - 24;
  page.drawRectangle({ color: rgb(0.96, 0.95, 0.98), height: 24, width: right - MARGIN, x: MARGIN, y: y - 7 });
  text(page, "Description", MARGIN + 10, y, { color: MUTED, font: bold, size: 9 });
  textRight("Amount", y, { color: MUTED, font: bold, size: 9 });
  y -= 28;
  for (const line of input.lines) {
    const parts = wrap(line.label, regular, 10, 360);
    parts.forEach((part, index) => {
      text(page, part, MARGIN + 10, y - index * 13);
    });
    textRight(money(line.amountPence), y);
    y -= 13 * parts.length + 9;
    rule(y + 5);
    y -= 6;
  }

  // Total
  y -= 10;
  text(page, "Total", 330, y, { font: bold, size: 12 });
  textRight(money(input.totalPence), y, { font: bold, size: 14 });

  // Footer
  const footer = [
    "Thank you for booking with Mundoria.",
    `Questions about this invoice? Email ${MUNDORIA_IDENTITY.supportEmail} quoting ${input.invoiceNumber}.`,
  ];
  let footY = MARGIN + 20;
  for (const line of footer) {
    text(page, line, MARGIN, footY, { color: MUTED, size: 9 });
    footY -= 13;
  }

  return pdf.save();
}
