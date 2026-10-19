export type PasswordRequirementId =
  | "capital"
  | "small"
  | "number"
  | "symbol"
  | "length";

export type PasswordRequirement = {
  id: PasswordRequirementId;
  /** Short example glyph, e.g. A, a, 123, #$%, 8+. */
  glyph: string;
  /** Short category label, e.g. Capital. */
  label: string;
  /** Example-style copy for tips/status, e.g. "A capital". */
  example: string;
  met: boolean;
};

export function passwordRequirements(password: string): PasswordRequirement[] {
  return [
    {
      id: "capital",
      glyph: "A",
      label: "Uppercase",
      example: "an uppercase letter (A)",
      met: /[A-Z]/.test(password),
    },
    {
      id: "small",
      glyph: "a",
      label: "Lowercase",
      example: "a lowercase letter (a)",
      met: /[a-z]/.test(password),
    },
    {
      id: "number",
      glyph: "123",
      label: "Number",
      example: "a number (123)",
      met: /\d/.test(password),
    },
    {
      id: "symbol",
      glyph: "#$%",
      label: "Symbol",
      example: "a symbol (#$%)",
      met: /[^A-Za-z0-9]/.test(password),
    },
    {
      id: "length",
      glyph: "8+",
      label: "Characters",
      example: "8+ characters",
      met: password.length >= 8 && password.length <= 72,
    },
  ];
}

export function passwordMeetsRequirements(password: string) {
  return passwordRequirements(password).every((rule) => rule.met);
}
