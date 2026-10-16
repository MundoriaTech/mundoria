export type PasswordRequirementId =
  | "length"
  | "capital"
  | "number"
  | "symbol";

export type PasswordRequirement = {
  id: PasswordRequirementId;
  label: string;
  met: boolean;
};

export function passwordRequirements(password: string): PasswordRequirement[] {
  return [
    {
      id: "length",
      label: "At least 8 characters",
      met: password.length >= 8 && password.length <= 72,
    },
    {
      id: "capital",
      label: "One capital letter",
      met: /[A-Z]/.test(password),
    },
    {
      id: "number",
      label: "One number",
      met: /\d/.test(password),
    },
    {
      id: "symbol",
      label: "One symbol",
      met: /[^A-Za-z0-9]/.test(password),
    },
  ];
}

export function passwordMeetsRequirements(password: string) {
  return passwordRequirements(password).every((rule) => rule.met);
}
