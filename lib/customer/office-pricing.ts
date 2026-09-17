import type { CleaningStandard } from "@/types/customer";

/**
 * Office Cleaning time matrix from Mundoria commercial pricing logic.
 * Every minute value is for ONE cleaner.
 *
 * Override via COMMERCIAL_HOURLY_RATE_PENCE until platform rates are finalised.
 */
export const OFFICE_HOURLY_RATE_PENCE = Number(
  process.env.COMMERCIAL_HOURLY_RATE_PENCE ?? 3500,
);
export const MAX_HOURS_PER_CLEANER = 5;

export type OfficeSpaceType =
  | "office_work_area"
  | "meeting_room"
  | "toilet"
  | "kitchen"
  | "reception"
  | "corridor"
  | "custom";

export type OfficeSpaceSize = "small" | "medium" | "large" | "not_sure";

export type OfficeSpaceSelection = {
  quantity: number;
  size: OfficeSpaceSize;
  spaceType: OfficeSpaceType;
  /** Optional label when spaceType is custom */
  customLabel?: string;
};

export const OFFICE_SPACE_OPTIONS: Array<{
  label: string;
  sizeBands: Record<Exclude<OfficeSpaceSize, "not_sure">, string>;
  value: OfficeSpaceType;
}> = [
  {
    label: "Office / Work Areas",
    sizeBands: {
      large: "61–100m²",
      medium: "26–60m²",
      small: "≤25m²",
    },
    value: "office_work_area",
  },
  {
    label: "Meeting / Conference Rooms",
    sizeBands: {
      large: "31–50m²",
      medium: "16–30m²",
      small: "≤15m²",
    },
    value: "meeting_room",
  },
  {
    label: "Toilets / Washrooms",
    sizeBands: {
      large: "21–35m²",
      medium: "11–20m²",
      small: "≤10m²",
    },
    value: "toilet",
  },
  {
    label: "Kitchen / Break Rooms",
    sizeBands: {
      large: "26–40m²",
      medium: "11–25m²",
      small: "≤10m²",
    },
    value: "kitchen",
  },
  {
    label: "Reception / Waiting Areas",
    sizeBands: {
      large: "36–60m²",
      medium: "16–35m²",
      small: "≤15m²",
    },
    value: "reception",
  },
  {
    label: "Corridors / Common Areas",
    sizeBands: {
      large: "61–100m²",
      medium: "26–60m²",
      small: "≤25m²",
    },
    value: "corridor",
  },
];

/** Minutes for one cleaner: space → size → standard */
const OFFICE_TIME_MATRIX: Record<
  Exclude<OfficeSpaceType, "custom">,
  Record<OfficeSpaceSize, Record<CleaningStandard, number>>
> = {
  corridor: {
    large: { comprehensive: 50, enhanced: 35, essential: 25 },
    medium: { comprehensive: 35, enhanced: 25, essential: 15 },
    not_sure: { comprehensive: 45, enhanced: 30, essential: 20 },
    small: { comprehensive: 20, enhanced: 15, essential: 10 },
  },
  kitchen: {
    large: { comprehensive: 70, enhanced: 50, essential: 35 },
    medium: { comprehensive: 50, enhanced: 35, essential: 25 },
    not_sure: { comprehensive: 60, enhanced: 45, essential: 30 },
    small: { comprehensive: 35, enhanced: 25, essential: 15 },
  },
  meeting_room: {
    large: { comprehensive: 40, enhanced: 30, essential: 20 },
    medium: { comprehensive: 30, enhanced: 20, essential: 15 },
    not_sure: { comprehensive: 35, enhanced: 25, essential: 20 },
    small: { comprehensive: 20, enhanced: 15, essential: 10 },
  },
  office_work_area: {
    large: { comprehensive: 65, enhanced: 45, essential: 30 },
    medium: { comprehensive: 45, enhanced: 30, essential: 20 },
    not_sure: { comprehensive: 55, enhanced: 40, essential: 25 },
    small: { comprehensive: 25, enhanced: 15, essential: 10 },
  },
  reception: {
    large: { comprehensive: 50, enhanced: 35, essential: 25 },
    medium: { comprehensive: 35, enhanced: 25, essential: 15 },
    not_sure: { comprehensive: 45, enhanced: 30, essential: 20 },
    small: { comprehensive: 25, enhanced: 15, essential: 10 },
  },
  toilet: {
    large: { comprehensive: 55, enhanced: 40, essential: 30 },
    medium: { comprehensive: 40, enhanced: 30, essential: 20 },
    not_sure: { comprehensive: 50, enhanced: 35, essential: 25 },
    small: { comprehensive: 30, enhanced: 20, essential: 15 },
  },
};

export type OfficeLineItem = {
  label: string;
  minutesEach: number;
  quantity: number;
  selectionLabel: string;
  size: OfficeSpaceSize;
  spaceType: OfficeSpaceType;
  totalMinutes: number;
};

export type OfficeQuote = {
  allocatedCleaners: number;
  cleanerHours: number;
  /** Wall-clock hours for the visit */
  jobDurationHours: number;
  lineItems: OfficeLineItem[];
  /** Price in pence before add-ons / schedule multipliers */
  pricePence: number;
  totalMinutes: number;
};

function spaceLabel(selection: OfficeSpaceSelection) {
  if (selection.spaceType === "custom") {
    return selection.customLabel?.trim() || "Custom space";
  }
  return (
    OFFICE_SPACE_OPTIONS.find((option) => option.value === selection.spaceType)
      ?.label ?? selection.spaceType
  );
}

function minutesFor(
  spaceType: OfficeSpaceType,
  size: OfficeSpaceSize,
  standard: CleaningStandard,
) {
  if (spaceType === "custom") {
    // Treat custom like corridor / common until a dedicated matrix exists.
    return OFFICE_TIME_MATRIX.corridor[size][standard];
  }
  return OFFICE_TIME_MATRIX[spaceType][size][standard];
}

export function allocateCleaners(cleanerHours: number) {
  if (cleanerHours <= 0) return 1;
  return Math.max(1, Math.ceil(cleanerHours / MAX_HOURS_PER_CLEANER));
}

export function calculateOfficeQuote(
  spaces: OfficeSpaceSelection[],
  standard: CleaningStandard,
  hourlyRatePence: number = OFFICE_HOURLY_RATE_PENCE,
): OfficeQuote {
  const lineItems: OfficeLineItem[] = spaces
    .filter((space) => space.quantity > 0)
    .map((space) => {
      const minutesEach = minutesFor(space.spaceType, space.size, standard);
      const totalMinutes = minutesEach * space.quantity;
      return {
        label: spaceLabel(space),
        minutesEach,
        quantity: space.quantity,
        selectionLabel: `${space.quantity} × ${sizeLabel(space.size)} · ${minutesEach} min`,
        size: space.size,
        spaceType: space.spaceType,
        totalMinutes,
      };
    });

  const totalMinutes = lineItems.reduce(
    (sum, item) => sum + item.totalMinutes,
    0,
  );
  const cleanerHours = Number((totalMinutes / 60).toFixed(4));
  const allocatedCleaners = allocateCleaners(cleanerHours);
  const jobDurationHours = Number(
    (cleanerHours / allocatedCleaners).toFixed(2),
  );
  const pricePence = Math.round(cleanerHours * hourlyRatePence);

  return {
    allocatedCleaners,
    cleanerHours,
    jobDurationHours,
    lineItems,
    pricePence,
    totalMinutes,
  };
}

export function sizeLabel(size: OfficeSpaceSize) {
  switch (size) {
    case "small":
      return "Small";
    case "medium":
      return "Medium";
    case "large":
      return "Large";
    case "not_sure":
      return "Not sure";
  }
}

export function formatCleanerTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes} min cleaner-time`;
  if (minutes === 0) return `${hours} hr${hours === 1 ? "" : "s"} cleaner-time`;
  return `${hours} hr${hours === 1 ? "" : "s"} ${minutes} min cleaner-time`;
}
