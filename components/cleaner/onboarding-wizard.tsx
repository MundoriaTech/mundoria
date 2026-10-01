"use client";

import { Clock3, FileUp, Plus, Video, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { LandingLogo } from "@/components/marketing/landing/landing-logo";
import {
  ActionError,
  FieldError,
  invalidControlClass,
} from "@/components/shared/action-error";
import { GeoapifyMapView } from "@/components/shared/geoapify-map-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  INTERVIEW_DURATION_MINUTES,
  formatInterviewSlot,
  upcomingInterviewDays,
} from "@/lib/cleaner/interview-slots";
import {
  SKILLS_EXAM_PASS_SCORE,
  SKILLS_EXAM_QUESTIONS,
  scoreSkillsExam,
} from "@/lib/cleaner/skills-exam";
import { SERVICES } from "@/lib/customer/services";
import { LONDON_CENTER } from "@/lib/maps/geoapify";
import { ownStoragePath } from "@/lib/storage/own-object";
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

const STEPS = [
  { id: "appointment", label: "Your appointment with Mundoria" },
  { id: "services", label: "Your services" },
  { id: "hours", label: "Your hours" },
  { id: "coverage", label: "Your coverage area" },
  { id: "quiz", label: "Finish my quiz" },
  { id: "utr", label: "Your UTR" },
  { id: "identity", label: "Your identity document" },
  { id: "dbs", label: "Your DBS certificate" },
  { id: "photo", label: "Your profile picture" },
  { id: "about", label: "About you" },
  { id: "consent", label: "Location consent" },
  { id: "payout", label: "Getting paid" },
] as const;

const GROUPS: { ids: StepId[]; title: string }[] = [
  {
    ids: ["appointment", "services", "hours", "coverage"],
    title: "How you work",
  },
  {
    ids: ["quiz", "utr", "identity", "dbs", "photo"],
    title: "Checks and documents",
  },
  {
    ids: ["about", "consent", "payout"],
    title: "Account",
  },
];

type StepId = (typeof STEPS)[number]["id"];
type FieldIssue = { field: string; message: string };
type StepStatus = "completed" | "pending";

type AvailabilityDay = {
  day_of_week: number;
  end_time: string;
  is_available: boolean;
  start_time: string;
};

type OnboardingData = {
  interview_scheduled_at: string | null;
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
  preview = false,
  profile,
  takenSlots = [],
}: {
  cleaner: CleanerProfile;
  preview?: boolean;
  profile: Profile;
  takenSlots?: string[];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<StepId | null>("appointment");
  const [opened, setOpened] = useState<StepId[]>(["appointment"]);
  const [showCompleted, setShowCompleted] = useState(true);
  const [notice, setNotice] = useState<{
    message: string;
    title: string;
  } | null>(null);
  const [fieldIssue, setFieldIssue] = useState<FieldIssue | null>(null);
  const [previewNote, setPreviewNote] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    interview_scheduled_at: cleaner.interview_scheduled_at ?? null,
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
    setNotice(null);
    setFieldIssue(null);
    setPreviewNote(null);
    setData((current) => ({ ...current, [key]: value }));
  }

  function toggleStep(stepId: StepId) {
    setNotice(null);
    setFieldIssue(null);
    setExpanded((current) => (current === stepId ? null : stepId));
    setOpened((current) =>
      current.includes(stepId) ? current : [...current, stepId],
    );
  }

  function documentField(kind: "dbs" | "id" | "headshot") {
    return kind === "headshot" ? "headshot_url" : (`${kind}_document_url` as const);
  }

  function documentBucket(kind: "dbs" | "id" | "headshot") {
    return kind === "headshot" ? "avatars" : "cleaner-documents";
  }

  async function discardDraftFile(
    kind: "dbs" | "id" | "headshot",
    reference: string,
  ) {
    if (!reference) return;
    if (reference.startsWith("blob:")) {
      URL.revokeObjectURL(reference);
      return;
    }
    if (preview) return;
    const path = ownStoragePath(documentBucket(kind), reference, profile.id);
    if (!path) return;
    await createBrowserClient().storage.from(documentBucket(kind)).remove([path]);
  }

  async function uploadDocument(
    kind: "dbs" | "id" | "headshot",
    file: File,
  ) {
    setNotice(null);
    setFieldIssue(null);
    const field = documentField(kind);
    const previous = data[field];
    if (preview) {
      if (kind === "headshot" && !file.type.startsWith("image/")) {
        setNotice({
          message: "Choose a JPEG, PNG, or WebP.",
          title: "Couldn’t upload that file",
        });
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      if (previous) await discardDraftFile(kind, previous);
      update(field, previewUrl);
      return;
    }
    if (kind === "headshot" && !file.type.startsWith("image/")) {
      setNotice({
        message: "Choose a JPEG, PNG, or WebP.",
        title: "Couldn’t upload that file",
      });
      return;
    }
    const supabase = createBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setNotice({
        message: "Sign in again, then choose the file.",
        title: "Couldn’t upload that file",
      });
      return;
    }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 80);
    const path = `${user.id}/${kind}-${Date.now()}-${safeName}`;
    const bucket = documentBucket(kind);
    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file);
    if (uploadError) {
      setNotice({
        message: /row-level security/i.test(uploadError.message)
          ? "Sign in again, then choose the file."
          : uploadError.message,
        title: "Couldn’t upload that file",
      });
      return;
    }
    const nextValue =
      bucket === "avatars"
        ? supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
        : path;
    if (previous && previous !== nextValue) {
      await discardDraftFile(kind, previous);
    }
    update(field, nextValue);
  }

  async function removeDocument(kind: "dbs" | "id" | "headshot") {
    const field = documentField(kind);
    const current = data[field];
    if (!current) return;
    setNotice(null);
    setFieldIssue(null);
    if (!current.startsWith("blob:") && !preview) {
      const path = ownStoragePath(documentBucket(kind), current, profile.id);
      if (path) {
        const { error: removeError } = await createBrowserClient()
          .storage.from(documentBucket(kind))
          .remove([path]);
        if (removeError) {
          setNotice({
            message: removeError.message,
            title: "Couldn’t remove that file",
          });
          return;
        }
      }
    }
    if (current.startsWith("blob:")) URL.revokeObjectURL(current);
    update(field, "");
  }

  async function connectStripe() {
    setNotice(null);
    setFieldIssue(null);
    if (preview) {
      setPreviewNote("Stripe Connect is skipped in this preview.");
      return;
    }

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

      setNotice({
        message: result.error ?? "Try again in a moment.",
        title: "Couldn’t connect Stripe",
      });
    } catch (stripeError) {
      setNotice({
        message:
          stripeError instanceof Error
            ? stripeError.message
            : "Try again in a moment.",
        title: "Couldn’t connect Stripe",
      });
    }
  }

  async function submit() {
    const normalized = sanitizeOnboardingData(data);

    for (const step of STEPS) {
      const validationError = validateStep(step.id, normalized);

      if (validationError) {
        setData(normalized);
        setExpanded(step.id);
        setOpened((current) =>
          current.includes(step.id) ? current : [...current, step.id],
        );
        setShowCompleted(true);
        setFieldIssue(validationError);
        setNotice({
          message: "Finish the highlighted step, then try again.",
          title: "Couldn’t submit your application",
        });
        return;
      }
    }

    setData(normalized);
    if (preview) {
      setPreviewNote(
        "Preview only. This application was not submitted.",
      );
      return;
    }
    setSubmitting(true);

    try {
      const payload = normalized;
      const response = await fetch("/api/cleaner/onboarding", {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await parseJsonResponse(response)) as { error?: string };

      if (!response.ok) {
        setFieldIssue(null);
        setNotice({
          message: result.error ?? "Try again in a moment.",
          title: "Couldn’t submit your application",
        });
        return;
      }

      window.localStorage.removeItem("mundoria-cleaner-onboarding");
      router.refresh();
    } catch (submitError) {
      setFieldIssue(null);
      setNotice({
        message:
          submitError instanceof Error
            ? submitError.message
            : "Try again in a moment.",
        title: "Couldn’t submit your application",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const completedCount = STEPS.filter((step) =>
    isStepComplete(step.id, data),
  ).length;
  const activeStep =
    STEPS.find((step) => step.id === expanded) ?? STEPS[0];

  async function logout() {
    await createBrowserClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const progress = Math.round((completedCount / STEPS.length) * 100);

  return (
    <main className="min-h-screen bg-[#f7f5fb]">
      <div className="sticky top-0 z-20 border-b border-[#e8e0f5] bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <LandingLogo />
            <span className="rounded-full bg-[#f3eef8] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#312c79]">
              Pro
            </span>
          </div>
          <Button onClick={() => void logout()} type="button" variant="outline">
            Log out
          </Button>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#1c133b]">
              Build your cleaner profile
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#6b6588]">
              Finish the steps in any order. One stays open until you complete
              it, and the others can still be filled in.
            </p>
          </div>
          <p className="text-sm font-medium text-[#312c79]">
            {completedCount} of {STEPS.length} complete
          </p>
        </div>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full bg-[#312c79]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:px-6">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-[#e8e0f5] bg-white p-3">
            {GROUPS.map((group, groupIndex) => {
              const steps = group.ids
                .map((id) => STEPS.find((step) => step.id === id))
                .filter((step): step is (typeof STEPS)[number] => Boolean(step))
                .filter(
                  (step) => showCompleted || !isStepComplete(step.id, data),
                );
              if (steps.length === 0) return null;
              return (
                <section
                  className={groupIndex > 0 ? "mt-4 border-t border-[#f0eaf6] pt-4" : ""}
                  key={group.title}
                >
                  <h2 className="px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b84a8]">
                    {group.title}
                  </h2>
                  <ol className="mt-1">
                    {steps.map((step) => {
                      const status = stepStatus(step.id, data, opened);
                      const isOpen = expanded === step.id;
                      return (
                        <li key={step.id}>
                          <button
                            className={`flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left ${
                              isOpen ? "bg-[#f3eef8]" : "hover:bg-[#faf8fc]"
                            }`}
                            onClick={() => toggleStep(step.id)}
                            type="button"
                          >
                            <span
                              className={`h-2 w-2 shrink-0 rounded-full ${
                                status === "completed"
                                  ? "bg-[#312c79]"
                                  : status
                                    ? "bg-[#d4694a]"
                                    : "bg-[#d9d3e6]"
                              }`}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-medium text-[#1c133b]">
                                {step.label}
                              </span>
                            </span>
                            <StatusPill status={status} />
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              );
            })}
            <button
              className="mt-2 w-full rounded-2xl px-2 py-2 text-left text-sm font-medium text-[#312c79] hover:bg-[#faf8fc]"
              onClick={() => setShowCompleted((current) => !current)}
              type="button"
            >
              {showCompleted ? "Hide finished steps" : "Show all steps"}
            </button>
          </div>
        </aside>
        <section className="rounded-3xl border border-[#e8e0f5] bg-white p-6 sm:p-8">
          <p className="text-sm font-medium text-[#8b84a8]">
            Step {STEPS.findIndex((item) => item.id === activeStep.id) + 1} of{" "}
            {STEPS.length}
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#1c133b]">
            {activeStep.label}
          </h2>
          <div className="mt-6">
            <StepBody
              data={data}
              onConnectStripe={() => void connectStripe()}
              issue={fieldIssue}
              onFile={(kind, file) => void uploadDocument(kind, file)}
              onRemove={(kind) => void removeDocument(kind)}
              onPrefix={setPrefix}
              onUpdate={update}
              onSchedule={(startsAt) => update("interview_scheduled_at", startsAt)}
              prefix={prefix}
              stepId={activeStep.id}
              takenSlots={takenSlots}
            />
          </div>
          {notice ? (
            <div className="mt-4">
              <ActionError message={notice.message} title={notice.title} />
            </div>
          ) : null}
          {previewNote ? (
            <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
              {previewNote}
            </p>
          ) : null}
          <div className="mt-8 flex justify-end border-t border-[#e8e0f5] pt-5">
            <Button disabled={submitting} onClick={() => void submit()} size="lg">
              {submitting ? "Submitting…" : "Submit application"}
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusPill({ status }: { status: StepStatus | null }) {
  if (!status) return null;
  const label = status === "completed" ? "Completed" : "Pending";
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        status === "completed"
          ? "bg-[#f3eef8] text-[#312c79]"
          : "bg-[#fff1ea] text-[#9a3412]"
      }`}
    >
      {label}
    </span>
  );
}

function StepBody({
  data,
  issue,
  onConnectStripe,
  onFile,
  onPrefix,
  onRemove,
  onSchedule,
  onUpdate,
  prefix,
  stepId,
  takenSlots,
}: {
  data: OnboardingData;
  issue: FieldIssue | null;
  onConnectStripe: () => void;
  onFile: (kind: "dbs" | "id" | "headshot", file: File) => void;
  onPrefix: (value: string) => void;
  onRemove: (kind: "dbs" | "id" | "headshot") => void;
  onSchedule: (startsAt: string) => void;
  onUpdate: <Key extends keyof OnboardingData>(
    key: Key,
    value: OnboardingData[Key],
  ) => void;
  prefix: string;
  stepId: StepId;
  takenSlots: string[];
}) {
  const issueFor = (field: string) =>
    issue?.field === field ? issue.message : undefined;

  if (stepId === "appointment") {
    return (
      <AppointmentPicker
        error={issueFor("slot")}
        onSchedule={onSchedule}
        selected={data.interview_scheduled_at}
        takenSlots={takenSlots}
      />
    );
  }

  if (stepId === "services") {
    return (
      <div className="grid gap-3">
        {issueFor("services") ? (
          <FieldError message={issueFor("services")!} />
        ) : null}
        {SERVICES.map((service) => (
          <label
            className="flex gap-3 rounded-2xl border border-border p-4"
            key={service.value}
          >
            <input
              checked={data.services.includes(service.value)}
              onChange={(event) =>
                onUpdate(
                  "services",
                  event.target.checked
                    ? [...data.services, service.value]
                    : data.services.filter((item) => item !== service.value),
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
    );
  }

  if (stepId === "hours") {
    return (
      <div className="space-y-2">
        {data.availability.map((day, index) => (
          <div
            className="rounded-2xl bg-background p-3"
            key={day.day_of_week}
          >
            <label className="flex min-h-11 items-center text-sm font-medium">
              <input
                checked={day.is_available}
                className="mr-2 h-4 w-4"
                onChange={(event) => {
                  const next = [...data.availability];
                  next[index] = { ...day, is_available: event.target.checked };
                  onUpdate("availability", next);
                }}
                type="checkbox"
              />
              {days[index]}
            </label>
            <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <Input
                className="min-h-11"
                disabled={!day.is_available}
                onChange={(event) => {
                  const next = [...data.availability];
                  next[index] = { ...day, start_time: event.target.value };
                  onUpdate("availability", next);
                }}
                type="time"
                value={day.start_time}
              />
              <span className="text-sm text-muted-foreground">to</span>
              <Input
                className="min-h-11"
                disabled={!day.is_available}
                onChange={(event) => {
                  const next = [...data.availability];
                  next[index] = { ...day, end_time: event.target.value };
                  onUpdate("availability", next);
                }}
                type="time"
                value={day.end_time}
              />
            </div>
          </div>
        ))}
        {issueFor("hours") ? <FieldError message={issueFor("hours")!} /> : null}
      </div>
    );
  }

  if (stepId === "coverage") {
    return (
      <div>
        <div className="flex gap-2">
          <Input
            className={issueFor("areas") ? invalidControlClass : undefined}
            onChange={(event) => onPrefix(event.target.value.toUpperCase())}
            placeholder="SW1"
            value={prefix}
          />
          <Button
            onClick={() => {
              const area = prefix.trim().toUpperCase();
              if (area && !data.working_areas.includes(area)) {
                onUpdate("working_areas", [...data.working_areas, area]);
              }
              onPrefix("");
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
                onUpdate(
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
        {issueFor("areas") ? <FieldError message={issueFor("areas")!} /> : null}
      </div>
    );
  }

  if (stepId === "quiz") {
    return (
      <div className="space-y-5">
        <p className="text-sm text-muted-foreground">
          {SKILLS_EXAM_QUESTIONS.length} short questions. Pass mark:{" "}
          {SKILLS_EXAM_PASS_SCORE}/{SKILLS_EXAM_QUESTIONS.length}.
        </p>
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
                      data.skills_exam_answers[question.id] === optionIndex
                    }
                    className="mt-0.5"
                    name={question.id}
                    onChange={() =>
                      onUpdate("skills_exam_answers", {
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
        {issueFor("quiz") ? <FieldError message={issueFor("quiz")!} /> : null}
      </div>
    );
  }

  if (stepId === "utr") {
    return (
      <Field error={issueFor("utr")} label="UTR number (10 digits)">
        <Input
          className={issueFor("utr") ? invalidControlClass : undefined}
          inputMode="numeric"
          maxLength={10}
          onChange={(event) =>
            onUpdate(
              "utr_number",
              event.target.value.replace(/\D/g, "").slice(0, 10),
            )
          }
          placeholder="1234567890"
          value={data.utr_number}
        />
        <p className="mt-2 text-xs font-normal text-muted-foreground">
          Find your UTR on HMRC letters or your personal tax account. We use it
          to verify self-employed status. We never share it with customers.
        </p>
      </Field>
    );
  }

  if (stepId === "identity") {
    return (
      <DocumentUpload
        error={issueFor("id")}
        label="Government-issued ID"
        onFile={(file) => onFile("id", file)}
        onRemove={() => onRemove("id")}
        uploaded={Boolean(data.id_document_url)}
      />
    );
  }

  if (stepId === "dbs") {
    return (
      <DocumentUpload
        error={issueFor("dbs")}
        label="DBS certificate"
        onFile={(file) => onFile("dbs", file)}
        onRemove={() => onRemove("dbs")}
        uploaded={Boolean(data.dbs_document_url)}
      />
    );
  }

  if (stepId === "photo") {
    return (
      <div>
        <p className="mb-4 text-sm text-muted-foreground">
          A clear photo of your face, shoulders up, on a plain background.
        </p>
        <DocumentUpload
          accept="image/*"
          error={issueFor("headshot")}
          label="Upload headshot"
          onFile={(file) => onFile("headshot", file)}
          onRemove={() => onRemove("headshot")}
          uploaded={Boolean(data.headshot_url)}
        />
      </div>
    );
  }

  if (stepId === "about") {
    return (
      <div className="space-y-4">
        <Field error={issueFor("full_name")} label="Full name">
          <Input
            className={issueFor("full_name") ? invalidControlClass : undefined}
            onChange={(event) => onUpdate("full_name", event.target.value)}
            value={data.full_name}
          />
        </Field>
        <Field error={issueFor("phone")} label="Phone number">
          <Input
            className={issueFor("phone") ? invalidControlClass : undefined}
            onChange={(event) => onUpdate("phone", event.target.value)}
            required
            type="tel"
            value={data.phone}
          />
        </Field>
        <Field label="Years of experience">
          <Input
            min={0}
            onChange={(event) =>
              onUpdate("years_experience", Number(event.target.value))
            }
            type="number"
            value={data.years_experience}
          />
        </Field>
        <Field error={issueFor("bio")} label="Bio">
          <textarea
            className={`min-h-28 w-full rounded-md border p-3 text-sm ${
              issueFor("bio") ? invalidControlClass : ""
            }`}
            onChange={(event) => onUpdate("bio", event.target.value)}
            value={data.bio}
          />
        </Field>
      </div>
    );
  }

  if (stepId === "consent") {
    return (
      <div className="rounded-2xl border border-border bg-background p-5 text-sm leading-6">
        <p>
          Mundoria records your GPS position only when you check in and check
          out of an active job. We do not track your location outside those
          actions.
        </p>
        <label className="mt-5 flex items-start gap-3 rounded-2xl bg-card p-4">
          <input
            checked={data.location_tracking_consent_accepted}
            className="mt-1"
            onChange={(event) =>
              onUpdate(
                "location_tracking_consent_accepted",
                event.target.checked,
              )
            }
            type="checkbox"
          />
          <span>
            I understand and agree that Mundoria may capture my GPS coordinates
            when I check in and check out of an active job.
          </span>
        </label>
        {issueFor("consent") ? (
          <div className="mt-4">
            <FieldError message={issueFor("consent")!} />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        {(["weekly", "monthly"] as const).map((value) => (
          <button
            className={`rounded-2xl border p-5 text-left transition ${
              data.payout_preference === value
                ? "border-primary bg-primary/15"
                : "border-border hover:border-primary/50"
            }`}
            key={value}
            onClick={() => onUpdate("payout_preference", value)}
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
        onClick={onConnectStripe}
        type="button"
        variant="outline"
      >
        Connect Stripe Express
      </Button>
      <p className="mt-2 text-xs text-muted-foreground">
        Optional for now. You can connect Stripe later from your profile before
        receiving payouts.
      </p>
    </div>
  );
}

function AppointmentPicker({
  error,
  onSchedule,
  selected,
  takenSlots,
}: {
  error?: string;
  onSchedule: (startsAt: string) => void;
  selected: string | null;
  takenSlots: string[];
}) {
  const days = upcomingInterviewDays(new Date(), takenSlots);
  const selectedDay =
    days.find((day) =>
      day.slots.some((slot) => sameMinute(slot.startsAt, selected)),
    ) ?? days[0];
  const [dayDate, setDayDate] = useState(selectedDay?.date ?? "");
  const day = days.find((item) => item.date === dayDate) ?? selectedDay;
  const [choice, setChoice] = useState<string | null>(selected);

  return (
    <div>
      <p className="text-lg font-semibold text-[#1c133b]">
        Make an appointment with our team
      </p>
      <p className="mt-2 text-sm leading-6 text-[#1c133b]">
        This step is mandatory to validate your account and start working.
      </p>
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#6b6588]">
        <span className="inline-flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-[#d4694a]" />
          {INTERVIEW_DURATION_MINUTES} min
        </span>
        <span className="inline-flex items-center gap-2">
          <Video className="h-4 w-4 text-[#d4694a]" />
          Online
        </span>
      </div>
      <p className="mt-6 text-sm font-semibold text-[#1c133b]">
        Choose a time slot
      </p>
      {days.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No interview times are open right now. Check back shortly.
        </p>
      ) : (
        <>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {days.map((item) => (
              <button
                className={`min-w-28 rounded-2xl border px-3 py-3 text-left ${
                  item.date === day?.date
                    ? "border-[#d4694a] bg-white"
                    : "border-transparent bg-[#f6f3ee]"
                }`}
                key={item.date}
                onClick={() => setDayDate(item.date)}
                type="button"
              >
                <span className="block text-sm font-semibold text-[#1c133b]">
                  {item.label}
                </span>
                <span className="mt-1 block text-xs text-[#6b6588]">
                  {item.sublabel}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {day?.slots.map((slot) => {
              const active = choice ? sameMinute(choice, slot.startsAt) : false;
              return (
                <button
                  className={`rounded-2xl px-3 py-3 text-sm font-semibold ${
                    active
                      ? "bg-[#d4694a] text-white"
                      : "bg-[#f6f3ee] text-[#1c133b]"
                  }`}
                  key={slot.startsAt}
                  onClick={() => setChoice(slot.startsAt)}
                  type="button"
                >
                  {slot.label}
                </button>
              );
            })}
          </div>
          <Button
            className="mt-6 bg-[#221f50] hover:bg-[#312c79]"
            disabled={!choice}
            onClick={() => {
              if (choice) onSchedule(choice);
            }}
            type="button"
          >
            Confirm
          </Button>
          {selected ? (
            <p className="mt-3 text-sm text-[#1c133b]">
              Booked for {formatInterviewSlot(selected)}. You can pick another
              time before you submit.
            </p>
          ) : null}
          {error ? (
            <div className="mt-3">
              <FieldError message={error} />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function sameMinute(left: string | null, right: string | null) {
  if (!left || !right) return false;
  return (
    Math.floor(new Date(left).getTime() / 60_000) ===
    Math.floor(new Date(right).getTime() / 60_000)
  );
}

function Field({
  children,
  error,
  label,
}: {
  children: React.ReactNode;
  error?: string;
  label: string;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span>{label}</span>
      {children}
      {error ? <FieldError message={error} /> : null}
    </label>
  );
}

function DocumentUpload({
  accept = ".pdf,image/*",
  error,
  label,
  onFile,
  onRemove,
  uploaded,
}: {
  accept?: string;
  error?: string;
  label: string;
  onFile: (file: File) => void;
  onRemove?: () => void;
  uploaded: boolean;
}) {
  return (
    <div>
      <label className={`flex cursor-pointer flex-col items-center rounded-xl border border-dashed p-8 text-center ${error ? "border-[#d4694a]" : ""}`}>
        <FileUp className="h-7 w-7 text-primary" />
        <b className="mt-3 text-sm">{label}</b>
        <span className="mt-1 text-xs text-muted-foreground">
          {uploaded
            ? "Uploaded. Choose another file to replace it."
            : accept.includes("image") && !accept.includes("pdf")
              ? "JPEG, PNG or WebP"
              : "PDF, JPEG, PNG or WebP"}
        </span>
        <input
          accept={accept}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFile(file);
          }}
          type="file"
        />
      </label>
      {uploaded && onRemove ? (
        <Button
          className="mt-3"
          onClick={onRemove}
          type="button"
          variant="outline"
        >
          Remove
        </Button>
      ) : null}
      {error ? (
        <div className="mt-3">
          <FieldError message={error} />
        </div>
      ) : null}
    </div>
  );
}

function toIso(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function sanitizeOnboardingData(value: OnboardingData): OnboardingData {
  return {
    ...value,
    interview_scheduled_at: toIso(value.interview_scheduled_at),
    availability: (value.availability ?? []).map((day) => ({
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
    services: (value.services ?? [])
      .map((service) => service.trim())
      .filter(Boolean),
    skills_exam_answers: value.skills_exam_answers ?? {},
    utr_number: String(value.utr_number ?? "")
      .replace(/\D/g, "")
      .slice(0, 10),
    working_areas: (value.working_areas ?? [])
      .map((area) => area.trim().toUpperCase())
      .filter(Boolean),
    years_experience: Number.isFinite(value.years_experience)
      ? value.years_experience
      : 0,
  };
}

function validateStep(stepId: StepId, value: OnboardingData): FieldIssue | null {
  const data = sanitizeOnboardingData(value);
  const issue = (field: string, message: string): FieldIssue => ({
    field,
    message,
  });

  if (stepId === "appointment" && !data.interview_scheduled_at) {
    return issue("slot", "Choose a time for your appointment.");
  }

  if (stepId === "services" && data.services.length === 0) {
    return issue("services", "Select at least one service you offer.");
  }

  if (stepId === "hours") {
    const availableDays = data.availability.filter((day) => day.is_available);
    if (availableDays.length === 0) {
      return issue("hours", "Choose at least one day you are available.");
    }
    if (availableDays.some((day) => !day.start_time || !day.end_time)) {
      return issue("hours", "Set a start and end time for each available day.");
    }
    if (availableDays.some((day) => day.start_time >= day.end_time)) {
      return issue(
        "hours",
        "Availability end time must be later than start time.",
      );
    }
  }

  if (stepId === "coverage" && data.working_areas.length === 0) {
    return issue(
      "areas",
      "Add at least one postcode prefix you cover, for example SW1.",
    );
  }

  if (stepId === "quiz") {
    for (const question of SKILLS_EXAM_QUESTIONS) {
      if (data.skills_exam_answers[question.id] === undefined) {
        return issue("quiz", "Answer every skills check question.");
      }
    }
    const exam = scoreSkillsExam(data.skills_exam_answers);
    if (!exam.passed) {
      return issue(
        "quiz",
        `You scored ${exam.score}/${exam.total}. You need ${SKILLS_EXAM_PASS_SCORE} or more. Review and try again.`,
      );
    }
  }

  if (stepId === "utr" && !/^\d{10}$/.test(data.utr_number)) {
    return issue("utr", "Enter your 10-digit UTR number.");
  }

  if (stepId === "identity" && !data.id_document_url) {
    return issue("id", "Upload your government-issued ID.");
  }

  if (stepId === "dbs" && !data.dbs_document_url) {
    return issue("dbs", "Upload your DBS certificate.");
  }

  if (stepId === "photo" && !data.headshot_url) {
    return issue("headshot", "Upload a clear headshot of yourself.");
  }

  if (stepId === "about") {
    if (data.full_name.length < 2) {
      return issue("full_name", "Enter your full name.");
    }
    if (data.phone.length < 7) {
      return issue("phone", "Enter a valid phone number.");
    }
    if (data.bio.length < 20) {
      return issue("bio", "Bio must be at least 20 characters.");
    }
  }

  if (stepId === "consent" && !data.location_tracking_consent_accepted) {
    return issue("consent", "Accept location consent before submitting.");
  }

  return null;
}

function isStepComplete(stepId: StepId, value: OnboardingData) {
  return validateStep(stepId, value) === null;
}

function stepStatus(
  stepId: StepId,
  value: OnboardingData,
  opened: StepId[],
): StepStatus | null {
  if (isStepComplete(stepId, value)) return "completed";
  if (stepId === "utr") return "pending";
  if (stepId === "quiz") {
    const started =
      opened.includes(stepId) ||
      Object.keys(value.skills_exam_answers ?? {}).length > 0;
    return started ? "pending" : null;
  }
  if (opened.includes(stepId) && stepId !== "appointment") return "pending";
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
