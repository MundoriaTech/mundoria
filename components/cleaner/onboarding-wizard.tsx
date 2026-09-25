"use client";

import { ArrowLeft, ArrowRight, FileUp, Plus, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { GeoapifyMapView } from "@/components/shared/geoapify-map-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SKILLS_EXAM_PASS_SCORE,
  SKILLS_EXAM_QUESTIONS,
  scoreSkillsExam,
} from "@/lib/cleaner/skills-exam";
import { SERVICES } from "@/lib/customer/services";
import { LONDON_CENTER } from "@/lib/maps/geoapify";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/auth";
import type { CleanerProfile } from "@/types/cleaner";

const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const TOTAL_STEPS = 10;

type AvailabilityDay = {
  day_of_week: number;
  end_time: string;
  is_available: boolean;
  start_time: string;
};

type OnboardingData = {
  availability: AvailabilityDay[];
  bio: string;
  dbs_document_url: string;
  full_name: string;
  headshot_url: string;
  id_document_url: string;
  location_tracking_consent_accepted: boolean;
  location_tracking_consent_version: string;
  payout_preference: "weekly" | "monthly";
  phone: string;
  services: string[];
  skills_exam_answers: Record<string, number>;
  utr_number: string;
  working_areas: string[];
  years_experience: number;
};

export function OnboardingWizard({
  cleaner,
  profile,
}: {
  cleaner: CleanerProfile;
  profile: Profile;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    availability: days.map((_, day_of_week) => ({
      day_of_week,
      end_time: "18:00",
      is_available: day_of_week > 0 && day_of_week < 6,
      start_time: "08:00",
    })),
    bio: cleaner.bio ?? "",
    dbs_document_url: cleaner.dbs_document_url ?? "",
    full_name: profile.full_name,
    headshot_url: cleaner.headshot_url ?? profile.avatar_url ?? "",
    id_document_url: cleaner.id_document_url ?? "",
    location_tracking_consent_accepted: Boolean(
      cleaner.location_tracking_consent_at,
    ),
    location_tracking_consent_version: "cleaner-location-consent-v1",
    payout_preference: cleaner.payout_preference,
    phone: profile.phone ?? "",
    services: [] as string[],
    skills_exam_answers: {},
    utr_number: cleaner.utr_number ?? "",
    working_areas: [] as string[],
    years_experience: cleaner.years_experience ?? 0,
  });
  const [prefix, setPrefix] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem("mundoria-cleaner-onboarding");
    if (saved) {
      try {
        setData((current) =>
          sanitizeOnboardingData({
            ...current,
            ...(JSON.parse(saved) as Partial<OnboardingData>),
          }),
        );
      } catch {
        window.localStorage.removeItem("mundoria-cleaner-onboarding");
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "mundoria-cleaner-onboarding",
      JSON.stringify(data),
    );
  }, [data]);

  function update<Key extends keyof OnboardingData>(
    key: Key,
    value: OnboardingData[Key],
  ) {
    setError(null);
    setData((current) => ({ ...current, [key]: value }));
  }

  function goNext() {
    const validationError = validateStep(step, data);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setData((current) => sanitizeOnboardingData(current));
    setStep(step + 1);
  }

  async function uploadDocument(
    kind: "dbs" | "id" | "headshot",
    file: File,
  ) {
    setError(null);
    if (kind === "headshot" && !file.type.startsWith("image/")) {
      setError("Headshot must be an image (JPEG, PNG, or WebP).");
      return;
    }
    const supabase = createBrowserClient();
    const path = `${profile.id}/${kind}-${Date.now()}-${file.name.replaceAll(" ", "-")}`;

    if (kind === "headshot") {
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) {
        setError(uploadError.message);
        return;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);
      update("headshot_url", publicUrl);
      return;
    }

    const { error: uploadError } = await supabase.storage
      .from("cleaner-documents")
      .upload(path, file, { upsert: true });
    if (uploadError) {
      setError(uploadError.message);
      return;
    }
    update(`${kind}_document_url`, path);
  }

  async function connectStripe() {
    setError(null);

    try {
      const response = await fetch("/api/cleaner/stripe-connect", {
        method: "POST",
      });
      const result = (await parseJsonResponse(response)) as {
        error?: string;
        url?: string;
      };

      if (result.url) {
        window.location.assign(result.url);
        return;
      }

      setError(result.error ?? "Unable to connect Stripe.");
    } catch (stripeError) {
      setError(
        stripeError instanceof Error
          ? stripeError.message
          : "Unable to connect Stripe.",
      );
    }
  }

  async function submit() {
    const normalized = sanitizeOnboardingData(data);

    for (let stepToValidate = 1; stepToValidate <= TOTAL_STEPS - 1; stepToValidate += 1) {
      const validationError = validateStep(stepToValidate, normalized);

      if (validationError) {
        setData(normalized);
        setStep(stepToValidate);
        setError(validationError);
        return;
      }
    }

    setData(normalized);
    setSubmitting(true);

    try {
      const response = await fetch("/api/cleaner/onboarding", {
        body: JSON.stringify(normalized),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await parseJsonResponse(response)) as { error?: string };

      if (!response.ok) {
        setError(result.error ?? "Unable to submit application.");
        return;
      }

      window.localStorage.removeItem("mundoria-cleaner-onboarding");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit application.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-[2rem] bg-[#221f50] p-6 text-white shadow-2xl shadow-[#221f50]/15 sm:p-8">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-semibold text-white/70">Mundoria Pro</p>
              <h1 className="text-2xl font-semibold tracking-[-0.04em] sm:text-4xl">
                Build your cleaner profile
              </h1>
            </div>
          </div>
          <p className="mt-5 flex items-center gap-2 text-sm leading-6 text-white/75">
            <Sparkles className="h-4 w-4 text-[#ffc79f]" />
            Headshot, UTR, skills check, documents, and payouts — then a short
            phone interview before you go live.
          </p>
        </div>
        <div className="mt-6 grid grid-cols-10 gap-1.5 sm:gap-2">
          {Array.from({ length: TOTAL_STEPS }, (_, index) => (
            <span
              className={`h-1.5 rounded-full ${index < step ? "bg-primary" : "bg-muted"}`}
              key={index}
            />
          ))}
        </div>
        <section className="mt-6 rounded-[2rem] border border-border bg-card p-6 shadow-xl shadow-[#5a51aa]/10">
          {step === 1 ? (
            <div className="space-y-4">
              <Heading title="Tell us about yourself" />
              <Field label="Full name">
                <Input
                  onChange={(e) => update("full_name", e.target.value)}
                  value={data.full_name}
                />
              </Field>
              <Field label="Phone">
                <Input
                  onChange={(e) => update("phone", e.target.value)}
                  type="tel"
                  value={data.phone}
                />
              </Field>
              <Field label="Years of experience">
                <Input
                  min={0}
                  onChange={(e) =>
                    update("years_experience", Number(e.target.value))
                  }
                  type="number"
                  value={data.years_experience}
                />
              </Field>
              <Field label="Bio">
                <textarea
                  className="min-h-28 w-full rounded-md border p-3 text-sm"
                  onChange={(e) => update("bio", e.target.value)}
                  value={data.bio}
                />
              </Field>
            </div>
          ) : null}

          {step === 2 ? (
            <div>
              <Heading title="Profile headshot" />
              <p className="mb-5 text-sm text-muted-foreground">
                A clear photo of your face helps customers recognise you on the
                doorstep. No group shots or logos.
              </p>
              <DocumentUpload
                accept="image/*"
                label="Upload headshot"
                onFile={(file) => void uploadDocument("headshot", file)}
                uploaded={Boolean(data.headshot_url)}
              />
            </div>
          ) : null}

          {step === 3 ? (
            <div>
              <Heading title="Services you offer" />
              <div className="grid gap-3 sm:grid-cols-2">
                {SERVICES.map((service) => (
                  <label
                    className="flex gap-3 rounded-2xl border border-border p-4 transition hover:border-primary/50"
                    key={service.value}
                  >
                    <input
                      checked={data.services.includes(service.value)}
                      onChange={(e) =>
                        update(
                          "services",
                          e.target.checked
                            ? [...data.services, service.value]
                            : data.services.filter(
                                (item) => item !== service.value,
                              ),
                        )
                      }
                      type="checkbox"
                    />
                    <span>
                      <b>{service.label}</b>
                      <small className="mt-1 block leading-5 text-muted-foreground">
                        {service.description}
                      </small>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div>
              <Heading title="Working areas" />
              <div className="flex gap-2">
                <Input
                  onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                  placeholder="SW1"
                  value={prefix}
                />
                <Button
                  onClick={() => {
                    const area = prefix.trim().toUpperCase();
                    if (area && !data.working_areas.includes(area)) {
                      update("working_areas", [...data.working_areas, area]);
                    }
                    setPrefix("");
                  }}
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="my-4 flex flex-wrap gap-2">
                {data.working_areas.map((area) => (
                  <button
                    className="rounded-full bg-primary/15 px-3 py-1 text-sm font-medium text-primary"
                    key={area}
                    onClick={() =>
                      update(
                        "working_areas",
                        data.working_areas.filter((item) => item !== area),
                      )
                    }
                    type="button"
                  >
                    {area} <X className="inline h-3 w-3" />
                  </button>
                ))}
              </div>
              <CoverageMap count={data.working_areas.length} />
            </div>
          ) : null}

          {step === 5 ? (
            <div>
              <Heading title="Weekly availability" />
              <div className="space-y-2">
                {data.availability.map((day, index) => (
                  <div
                    className="flex flex-col gap-3 rounded-2xl bg-background p-3 sm:grid sm:grid-cols-[1fr_auto_auto_auto] sm:items-center sm:gap-2"
                    key={day.day_of_week}
                  >
                    <label className="flex min-h-11 items-center text-sm font-medium">
                      <input
                        checked={day.is_available}
                        className="mr-2 h-4 w-4"
                        onChange={(e) => {
                          const next = [...data.availability];
                          next[index] = {
                            ...day,
                            is_available: e.target.checked,
                          };
                          update("availability", next);
                        }}
                        type="checkbox"
                      />
                      {days[index]}
                    </label>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                      <Input
                        className="min-h-11"
                        disabled={!day.is_available}
                        onChange={(e) => {
                          const next = [...data.availability];
                          next[index] = { ...day, start_time: e.target.value };
                          update("availability", next);
                        }}
                        type="time"
                        value={day.start_time}
                      />
                      <span className="text-sm text-muted-foreground">to</span>
                      <Input
                        className="min-h-11"
                        disabled={!day.is_available}
                        onChange={(e) => {
                          const next = [...data.availability];
                          next[index] = { ...day, end_time: e.target.value };
                          update("availability", next);
                        }}
                        type="time"
                        value={day.end_time}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {step === 6 ? (
            <div>
              <Heading title="Identity & tax" />
              <p className="mb-5 text-sm text-muted-foreground">
                DBS, photo ID, and your HMRC Unique Taxpayer Reference (UTR).
                Documents are reviewed before you go live.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <DocumentUpload
                  label="DBS certificate"
                  onFile={(file) => void uploadDocument("dbs", file)}
                  uploaded={Boolean(data.dbs_document_url)}
                />
                <DocumentUpload
                  label="Government-issued ID"
                  onFile={(file) => void uploadDocument("id", file)}
                  uploaded={Boolean(data.id_document_url)}
                />
              </div>
              <Field label="UTR number (10 digits)">
                <Input
                  className="mt-4"
                  inputMode="numeric"
                  maxLength={10}
                  onChange={(e) =>
                    update(
                      "utr_number",
                      e.target.value.replace(/\D/g, "").slice(0, 10),
                    )
                  }
                  placeholder="1234567890"
                  value={data.utr_number}
                />
              </Field>
              <p className="mt-2 text-xs text-muted-foreground">
                Find your UTR on HMRC letters or your personal tax account. We
                use it to verify self-employed status — we never share it with
                customers.
              </p>
            </div>
          ) : null}

          {step === 7 ? (
            <div>
              <Heading title="Skills check" />
              <p className="mb-5 text-sm text-muted-foreground">
                {SKILLS_EXAM_QUESTIONS.length} short questions on Mundoria
                standards. Pass mark: {SKILLS_EXAM_PASS_SCORE}/
                {SKILLS_EXAM_QUESTIONS.length}.
              </p>
              <div className="space-y-5">
                {SKILLS_EXAM_QUESTIONS.map((question, index) => (
                  <fieldset
                    className="rounded-2xl border border-border p-4"
                    key={question.id}
                  >
                    <legend className="px-1 text-sm font-medium">
                      {index + 1}. {question.prompt}
                    </legend>
                    <div className="mt-3 space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <label
                          className="flex cursor-pointer gap-3 rounded-xl bg-background p-3 text-sm"
                          key={option}
                        >
                          <input
                            checked={
                              data.skills_exam_answers[question.id] ===
                              optionIndex
                            }
                            className="mt-0.5"
                            name={question.id}
                            onChange={() =>
                              update("skills_exam_answers", {
                                ...data.skills_exam_answers,
                                [question.id]: optionIndex,
                              })
                            }
                            type="radio"
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>
            </div>
          ) : null}

          {step === 8 ? (
            <div>
              <Heading title="Location consent" />
              <div className="rounded-2xl border border-border bg-background p-5 text-sm leading-6">
                <p>
                  Mundoria records your GPS position only when you check in and
                  check out of an active job. This creates an audit trail for
                  no-show and completion disputes. We do not track your location
                  outside active job actions.
                </p>
                <label className="mt-5 flex items-start gap-3 rounded-2xl bg-card p-4">
                  <input
                    checked={data.location_tracking_consent_accepted}
                    className="mt-1"
                    onChange={(event) =>
                      update(
                        "location_tracking_consent_accepted",
                        event.target.checked,
                      )
                    }
                    type="checkbox"
                  />
                  <span>
                    I understand and agree that Mundoria may capture my GPS
                    coordinates when I check in and check out of an active job.
                  </span>
                </label>
              </div>
            </div>
          ) : null}

          {step === 9 ? (
            <div>
              <Heading title="Getting paid" />
              <div className="grid gap-3 sm:grid-cols-2">
                {(["weekly", "monthly"] as const).map((value) => (
                  <button
                    className={`rounded-2xl border p-5 text-left transition ${
                      data.payout_preference === value
                        ? "border-primary bg-primary/15"
                        : "border-border hover:border-primary/50"
                    }`}
                    key={value}
                    onClick={() => update("payout_preference", value)}
                    type="button"
                  >
                    <b className="capitalize">{value}</b>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {value === "weekly"
                        ? "Faster, regular payouts."
                        : "One consolidated monthly payout."}
                    </p>
                  </button>
                ))}
              </div>
              <Button
                className="mt-5"
                onClick={() => void connectStripe()}
                type="button"
                variant="outline"
              >
                Connect Stripe Express
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                Optional for now. You can submit and connect Stripe later from
                your profile before receiving payouts.
              </p>
            </div>
          ) : null}

          {step === 10 ? (
            <div>
              <Heading title="Ready to submit" />
              <div className="space-y-3 rounded-2xl bg-background p-5 text-sm">
                <p>
                  <b>Name:</b> {data.full_name}
                </p>
                <p>
                  <b>Headshot:</b>{" "}
                  {data.headshot_url ? "Uploaded" : "Missing"}
                </p>
                <p>
                  <b>UTR:</b>{" "}
                  {data.utr_number.length === 10
                    ? `••••••${data.utr_number.slice(-4)}`
                    : "Missing"}
                </p>
                <p>
                  <b>Skills check:</b>{" "}
                  {scoreSkillsExam(data.skills_exam_answers).passed
                    ? `Passed (${scoreSkillsExam(data.skills_exam_answers).score}/${SKILLS_EXAM_QUESTIONS.length})`
                    : "Not passed"}
                </p>
                <p>
                  <b>Services:</b> {data.services.length}
                </p>
                <p>
                  <b>Areas:</b> {data.working_areas.join(", ")}
                </p>
                <p>
                  <b>Documents:</b>{" "}
                  {data.dbs_document_url && data.id_document_url
                    ? "Uploaded"
                    : "Missing"}
                </p>
                <p>
                  <b>Payout:</b> {data.payout_preference}
                </p>
                <p>
                  <b>Stripe:</b>{" "}
                  {profile.stripe_account_id
                    ? "Connected"
                    : "Not connected yet"}
                </p>
              </div>
              <p className="mt-4 rounded-2xl border border-[#e8e0f5] bg-[#faf8ff] p-4 text-sm leading-6 text-[#1c133b]">
                After you submit, Mundoria will call you for a short phone
                interview before approving you for live jobs.
              </p>
              <Button
                className="mt-6 w-full"
                disabled={submitting}
                onClick={() => void submit()}
                size="lg"
              >
                {submitting ? "Submitting…" : "Submit application"}
              </Button>
            </div>
          ) : null}

          {error ? (
            <p className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <div className="mt-7 flex justify-between border-t border-border pt-5">
            <Button
              disabled={step === 1}
              onClick={() => setStep(step - 1)}
              variant="ghost"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            {step < TOTAL_STEPS ? (
              <Button onClick={goNext}>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function Heading({ title }: { title: string }) {
  return <h2 className="mb-5 text-xl font-semibold">{title}</h2>;
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}

function DocumentUpload({
  accept = ".pdf,image/*",
  label,
  onFile,
  uploaded,
}: {
  accept?: string;
  label: string;
  onFile: (file: File) => void;
  uploaded: boolean;
}) {
  return (
    <label className="flex cursor-pointer flex-col items-center rounded-xl border border-dashed p-8 text-center">
      <FileUp className="h-7 w-7 text-primary" />
      <b className="mt-3 text-sm">{label}</b>
      <span className="mt-1 text-xs text-muted-foreground">
        {uploaded
          ? "Uploaded ✓"
          : accept.includes("image") && !accept.includes("pdf")
            ? "JPEG, PNG or WebP"
            : "PDF, JPEG, PNG or WebP"}
      </span>
      <input
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
        }}
        type="file"
      />
    </label>
  );
}

function sanitizeOnboardingData(value: OnboardingData): OnboardingData {
  return {
    ...value,
    availability: value.availability.map((day) => ({
      day_of_week: Number(day.day_of_week),
      end_time: String(day.end_time ?? "").trim(),
      is_available: Boolean(day.is_available),
      start_time: String(day.start_time ?? "").trim(),
    })),
    bio: String(value.bio ?? "").trim(),
    dbs_document_url: String(value.dbs_document_url ?? "").trim(),
    full_name: String(value.full_name ?? "").trim(),
    headshot_url: String(value.headshot_url ?? "").trim(),
    id_document_url: String(value.id_document_url ?? "").trim(),
    location_tracking_consent_accepted: Boolean(
      value.location_tracking_consent_accepted,
    ),
    location_tracking_consent_version: String(
      value.location_tracking_consent_version ??
        "cleaner-location-consent-v1",
    ).trim(),
    phone: String(value.phone ?? "").trim(),
    services: value.services.map((service) => service.trim()).filter(Boolean),
    skills_exam_answers: value.skills_exam_answers ?? {},
    utr_number: String(value.utr_number ?? "")
      .replace(/\D/g, "")
      .slice(0, 10),
    working_areas: value.working_areas
      .map((area) => area.trim().toUpperCase())
      .filter(Boolean),
    years_experience: Number.isFinite(value.years_experience)
      ? value.years_experience
      : 0,
  };
}

function validateStep(step: number, value: OnboardingData) {
  const data = sanitizeOnboardingData(value);

  if (step === 1) {
    if (data.full_name.length < 2) return "Enter your full name.";
    if (data.phone.length < 7) return "Enter a valid phone number.";
    if (data.bio.length < 20) return "Bio must be at least 20 characters.";
  }

  if (step === 2 && !data.headshot_url) {
    return "Upload a clear headshot of yourself.";
  }

  if (step === 3 && data.services.length === 0) {
    return "Select at least one service you offer.";
  }

  if (step === 4 && data.working_areas.length === 0) {
    return "Add at least one postcode prefix you cover, for example SW1.";
  }

  if (step === 5) {
    const availableDays = data.availability.filter((day) => day.is_available);

    if (availableDays.length === 0) {
      return "Choose at least one day you are available.";
    }

    if (availableDays.some((day) => !day.start_time || !day.end_time)) {
      return "Set a start and end time for each available day.";
    }

    if (availableDays.some((day) => day.start_time >= day.end_time)) {
      return "Availability end time must be later than start time.";
    }
  }

  if (step === 6) {
    if (!data.dbs_document_url) return "Upload your DBS certificate.";
    if (!data.id_document_url) return "Upload your government-issued ID.";
    if (!/^\d{10}$/.test(data.utr_number)) {
      return "Enter your 10-digit UTR number.";
    }
  }

  if (step === 7) {
    for (const question of SKILLS_EXAM_QUESTIONS) {
      if (data.skills_exam_answers[question.id] === undefined) {
        return "Answer every skills check question.";
      }
    }
    const exam = scoreSkillsExam(data.skills_exam_answers);
    if (!exam.passed) {
      return `You scored ${exam.score}/${exam.total}. You need ${SKILLS_EXAM_PASS_SCORE} or more — review and try again.`;
    }
  }

  if (step === 8 && !data.location_tracking_consent_accepted) {
    return "Accept location consent to continue.";
  }

  return null;
}

async function parseJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return {
    error:
      text ||
      `Request failed with status ${response.status}. Please try again.`,
  };
}

function CoverageMap({ count }: { count: number }) {
  return (
    <GeoapifyMapView
      center={LONDON_CENTER}
      circles={[
        {
          center: LONDON_CENTER,
          color: "#5a51aa",
          id: "coverage",
          radiusMeters: Math.max(5000, count * 3500),
        },
      ]}
      className="h-56"
      markers={[]}
      zoom={10}
    />
  );
}
