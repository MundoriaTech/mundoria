"use client";

import { FormField } from "@/components/auth/form-field";
import { FieldError, invalidControlClass } from "@/components/shared/action-error";
import { Input } from "@/components/ui/input";
import type { InputProps } from "@/components/ui/input";
import { MAX_DBS_DOCUMENT_PAGES } from "@/lib/cleaner/document-urls";
import {
  CLEANER_AGREEMENT_DOCS,
  DBS_APPLY_URL,
  DBS_FAQS,
  EMERGENCY_FAQS,
  EQUIPMENT_FAQS,
  EQUIPMENT_ITEMS,
  FINAL_REVIEW_FAQS,
  HMRC_FIND_UTR_URL,
  HMRC_REGISTER_URL,
  INSURANCE_COVER_MODEL_COPY,
  INSURANCE_FAQS,
  LOCATION_FAQS,
  PRODUCT_ITEMS,
  SAFETY_GUIDELINES,
  UTR_FAQS,
  UTR_PROOF_TYPES,
  TRANSPORT_MODE_OPTIONS,
  digitsOnly,
  insuranceCoverBand,
  insuranceCoverOtherText,
  parseTransportModes,
  serializeTransportModes,
  type DbsPath,
  type InsurancePath,
  type UtrPath,
} from "@/lib/cleaner/onboarding-compliance";
import { WORLD_COUNTRY_SELECT_OPTIONS } from "@/lib/countries";
import { cn } from "@/lib/utils";

import {
  ChoiceMultiPills,
  DecisionStrip,
  ChipMultiSelect,
  DocumentUpload,
  ExternalCta,
  FaqAccordion,
  InfoCallout,
  OnboardingCheckbox,
  OnboardingDateField,
  OnboardingSelect,
  SoftDeferButton,
  SuccessBanner,
} from "@/components/cleaner/onboarding-primitives";

/** Floating-label field matching signup / booking (`placeholder=" "`). */
function OnboardingField({
  error,
  hint,
  id,
  label,
  ...inputProps
}: {
  error?: string;
  hint?: string;
  id: string;
  label: string;
} & Omit<InputProps, "id" | "placeholder" | "className">) {
  return (
    <div className="space-y-1.5">
      <FormField compact hint={hint} htmlFor={id} label={label} plain>
        <Input
          className={error ? invalidControlClass : undefined}
          id={id}
          placeholder=" "
          {...inputProps}
        />
      </FormField>
      {error ? <FieldError message={error} /> : null}
    </div>
  );
}

function SectionHeading({
  children,
  subtitle,
}: {
  children: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4">
      <h3 className="text-lg font-bold tracking-[-0.02em] text-brand-ink">
        {children}
      </h3>
      {subtitle ? (
        <p className="mt-1.5 text-sm leading-6 text-brand-muted">{subtitle}</p>
      ) : null}
    </div>
  );
}

export function UtrComplianceStep({
  clarityConfirmed,
  error,
  onClarityConfirmed,
  onDefer,
  onPath,
  onProofFile,
  onProofRemove,
  onUtrChange,
  onWaiting,
  path,
  proofPreview,
  proofQualityWarning,
  proofUploaded,
  proofUploading,
  successMessage,
  uploadProgress,
  utrNumber,
  waitingRegistered,
}: {
  clarityConfirmed: boolean;
  error?: string;
  onClarityConfirmed: (next: boolean) => void;
  onDefer?: () => void;
  onPath: (next: UtrPath) => void;
  onProofFile: (file: File) => void;
  onProofRemove: () => void;
  onUtrChange: (next: string) => void;
  onWaiting: (waiting: boolean) => void;
  path: UtrPath | null;
  proofPreview?: { isPdf?: boolean; url?: string };
  proofQualityWarning?: string | null;
  proofUploaded: boolean;
  proofUploading: boolean;
  successMessage?: string | null;
  uploadProgress: number;
  utrNumber: string;
  waitingRegistered: boolean;
}) {
  return (
    <div className="space-y-6">
      {successMessage ? <SuccessBanner>{successMessage}</SuccessBanner> : null}
      <p className="text-sm leading-6 text-brand-muted">
        If you&apos;re registered for Self Assessment, you&apos;ll have one. As
        part of joining Mundoria as a self-employed cleaner, we&apos;ll need
        your UTR to verify your tax registration details.
      </p>

      <SectionHeading>Do you already have a UTR number?</SectionHeading>
      <DecisionStrip
        label="Do you already have a UTR number?"
        onChange={(next) => onPath(next as UtrPath)}
        options={[
          {
            hint: "Enter your 10-digit UTR and upload HMRC proof next.",
            label: "Yes",
            value: "have",
          },
          {
            hint: "We’ll show you how to register with HMRC and come back later.",
            label: "Not yet",
            value: "none",
          },
          {
            hint: "We’ll help you check whether you already have one.",
            label: "Not sure",
            value: "unsure",
          },
        ]}
        value={path === "waiting" ? "none" : path}
      />

      {path === "have" ? (
        <div className="space-y-4">
          <SectionHeading subtitle="Enter your UTR and upload a document from HMRC showing your name and UTR.">
            Let&apos;s verify your UTR
          </SectionHeading>
          <OnboardingField
            error={error}
            hint="Your UTR is usually 10 digits. Find it on your HMRC account, app or Self Assessment documents."
            id="onboarding-utr-number"
            inputMode="numeric"
            label="UTR number"
            maxLength={10}
            onChange={(event) => onUtrChange(digitsOnly(event.target.value))}
            value={utrNumber}
          />
          <div className="rounded-2xl border-2 border-brand-ink/25 bg-[#f3eee4] px-4 py-3">
            <p className="text-sm font-semibold text-brand-ink">
              Accepted proof (one of the following)
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-brand-muted">
              {UTR_PROOF_TYPES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs leading-5 text-[#8a8498]">
              PDF, JPG, JPEG or PNG · max 10 MB. The document must show your
              name and UTR clearly.
            </p>
          </div>
          <DocumentUpload
            label="Upload proof of UTR"
            onFile={onProofFile}
            onRemove={onProofRemove}
            previewIsPdf={proofPreview?.isPdf}
            previewUrl={proofPreview?.url}
            progress={proofUploading ? uploadProgress : undefined}
            uploaded={proofUploaded}
            uploading={proofUploading}
          />
          {proofQualityWarning ? (
            <InfoCallout>{proofQualityWarning}</InfoCallout>
          ) : null}
          <label className="flex cursor-pointer items-start gap-3 text-sm text-brand-ink">
            <OnboardingCheckbox
              checked={clarityConfirmed}
              onCheckedChange={onClarityConfirmed}
            />
            <span>
              I confirm my name and UTR are clearly visible on this document.
              Blurry or cropped uploads are flagged for review.
            </span>
          </label>
        </div>
      ) : null}

      {path === "none" || path === "waiting" ? (
        <div className="space-y-4">
          <SectionHeading subtitle="If you're new to self-employment, register with HMRC to receive your UTR.">
            No UTR? No problem.
          </SectionHeading>
          <ol className="list-decimal space-y-3 pl-5 text-sm leading-6 text-brand-muted">
            <li>
              Register as a sole trader for Self Assessment on GOV.UK.
              <div className="mt-2">
                <ExternalCta href={HMRC_REGISTER_URL} label="Register with HMRC" />
              </div>
            </li>
            <li>
              HMRC usually posts your UTR in around 15 days (times can vary).
            </li>
            <li>
              Return to Mundoria to enter your number and upload supporting
              proof.
            </li>
          </ol>
          <SectionHeading>
            Have you already registered with HMRC and are waiting for your UTR?
          </SectionHeading>
          <DecisionStrip
            label="Waiting for UTR"
            onChange={(next) => onWaiting(next === "yes")}
            options={[
              {
                hint: "You’re registered and waiting for HMRC to send your UTR.",
                label: "Yes, waiting",
                value: "yes",
              },
              {
                hint: "Register for Self Assessment first, then come back with your UTR.",
                label: "Not yet",
                value: "no",
              },
            ]}
            value={waitingRegistered ? "yes" : path === "waiting" ? "yes" : "no"}
          />
          <InfoCallout>
            You can complete the remaining onboarding steps while waiting for
            your UTR. Your application stays pending until verification checks
            are complete.
          </InfoCallout>
          {onDefer ? (
            <SoftDeferButton
              label="I'll do this later"
              onClick={onDefer}
            />
          ) : null}
        </div>
      ) : null}

      {path === "unsure" ? (
        <div className="space-y-4">
          <SectionHeading subtitle="If you've registered for Self Assessment before, you may already have a UTR.">
            Let&apos;s help you find out
          </SectionHeading>
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-6 text-brand-muted">
            <li>Your HMRC Personal Tax Account</li>
            <li>The HMRC mobile app</li>
            <li>Previous Self Assessment tax returns</li>
            <li>Letters or payment reminders from HMRC</li>
          </ul>
          <div className="flex flex-wrap gap-3">
            <ExternalCta href={HMRC_FIND_UTR_URL} label="Find My UTR" />
            {onDefer ? (
              <SoftDeferButton
                label="I'll do this later"
                onClick={onDefer}
              />
            ) : null}
          </div>
          <InfoCallout>
            You can return to upload your UTR without restarting onboarding.
          </InfoCallout>
        </div>
      ) : null}

      {error ? <FieldError message={error} /> : null}
      <FaqAccordion items={UTR_FAQS} />
    </div>
  );
}

export function DbsComplianceStep({
  certificateNumber,
  error,
  issuedOn,
  onCertificateNumber,
  onDefer,
  onFile,
  onIssuedOn,
  onPath,
  onRemove,
  pagePreviews,
  path,
  successMessage,
  uploadProgress,
  uploadingSlot,
  urls,
}: {
  certificateNumber: string;
  error?: string;
  issuedOn: string;
  onCertificateNumber: (next: string) => void;
  onDefer?: () => void;
  onFile: (file: File, slot: number) => void;
  onIssuedOn: (next: string) => void;
  onPath: (next: DbsPath) => void;
  onRemove: (slot: number) => void;
  pagePreviews: Partial<
    Record<string, { isPdf?: boolean; url?: string }>
  >;
  path: DbsPath | null;
  successMessage?: string | null;
  uploadProgress: number;
  uploadingSlot: string | null;
  urls: string[];
}) {
  const pages = urls.filter(Boolean);

  return (
    <div className="space-y-6">
      {successMessage ? <SuccessBanner>{successMessage}</SuccessBanner> : null}

      <SectionHeading>Do you already have a Basic DBS certificate?</SectionHeading>
      <DecisionStrip
        label="Do you already have a Basic DBS certificate?"
        onChange={(next) => onPath(next as DbsPath)}
        options={[
          {
            hint: "Enter your certificate details and upload the pages next.",
            label: "Yes",
            value: "have",
          },
          {
            hint: "We’ll show you how to apply for a Basic DBS on GOV.UK.",
            label: "Need to apply",
            value: "apply",
          },
          {
            hint: "Continue onboarding now and upload the certificate when it arrives.",
            label: "Waiting",
            value: "waiting",
          },
        ]}
        value={path}
      />

      {path === "have" ? (
        <div className="space-y-4">
          <SectionHeading>
            Great! Let&apos;s verify your DBS.
          </SectionHeading>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <OnboardingField
              error={error}
              id="onboarding-dbs-certificate"
              label="Certificate number"
              onChange={(event) => onCertificateNumber(event.target.value)}
              value={certificateNumber}
            />
            <OnboardingDateField
              id="onboarding-dbs-issued"
              label="Date issued"
              maxDate={new Date().toISOString().slice(0, 10)}
              onChange={onIssuedOn}
              value={issuedOn}
            />
          </div>
          <div className="space-y-3">
            <p className="text-xs leading-5 text-brand-subtle">
              Upload a PDF or clear photos. One file is enough for most Basic
              DBS certificates — add more below if you photographed each page
              separately.
            </p>
            <DocumentUpload
              files={pages.map((url, index) => {
                const slotKey = `dbs:${index}`;
                const preview = pagePreviews[slotKey];
                const nameFromPreview = preview?.url
                  ? preview.url.split("/").filter(Boolean).pop()
                  : null;
                const nameFromStored = url.split("/").filter(Boolean).pop();
                const rawName = nameFromPreview || nameFromStored || "";
                let displayName = `Page ${index + 1}`;
                try {
                  displayName = decodeURIComponent(rawName) || displayName;
                } catch {
                  displayName = rawName || displayName;
                }
                const isUploadingHere = uploadingSlot === slotKey;
                return {
                  key: slotKey,
                  name: displayName,
                  onRemove: () => onRemove(index),
                  progress: isUploadingHere ? uploadProgress : undefined,
                  uploading: isUploadingHere,
                };
              })}
              label="Certificate pages"
              maxFiles={MAX_DBS_DOCUMENT_PAGES}
              onFile={(file) => {
                if (pages.length >= MAX_DBS_DOCUMENT_PAGES) return;
                onFile(file, pages.length);
              }}
              progress={
                uploadingSlot === `dbs:${pages.length}`
                  ? uploadProgress
                  : undefined
              }
              uploaded={pages.length > 0}
              uploading={uploadingSlot === `dbs:${pages.length}`}
            />
          </div>
        </div>
      ) : null}

      {path === "apply" ? (
        <div className="space-y-4">
          <SectionHeading subtitle="Apply directly through the official UK government website.">
            Let&apos;s get your DBS sorted
          </SectionHeading>
          <p className="text-sm font-semibold text-brand-ink">
            Application fee: £20
          </p>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-brand-muted">
            <li>Visit GOV.UK and select Start now.</li>
            <li>Provide personal details, address history and ID.</li>
            <li>Pay the £20 fee.</li>
            <li>When your certificate arrives, return here to upload it.</li>
          </ol>
          <div className="flex flex-wrap gap-3">
            <ExternalCta href={DBS_APPLY_URL} label="Apply for Basic DBS Check" />
            {onDefer ? (
              <SoftDeferButton label="I'll apply later" onClick={onDefer} />
            ) : null}
          </div>
          <InfoCallout>
            You can continue Mundoria onboarding while waiting for your
            certificate. Your status stays as Awaiting DBS until upload and
            review.
          </InfoCallout>
        </div>
      ) : null}

      {path === "waiting" ? (
        <div className="space-y-4">
          <SectionHeading>
            You&apos;re almost there!
          </SectionHeading>
          <p className="text-sm leading-6 text-brand-muted">
            Continue onboarding while your DBS application is processed. Come
            back to upload the certificate when it arrives. We&apos;ll keep your
            status as Awaiting DBS until then.
          </p>
          {onDefer ? (
            <SoftDeferButton label="I'll upload later" onClick={onDefer} />
          ) : null}
        </div>
      ) : null}

      {error ? <FieldError message={error} /> : null}
      <FaqAccordion items={DBS_FAQS} />
    </div>
  );
}

export function InsuranceComplianceStep({
  activityConfirmed,
  coverAmount,
  error,
  expiryDate,
  insuredName,
  onActivityConfirmed,
  onCoverAmount,
  onDefer,
  onExpiryDate,
  onFile,
  onInsuredName,
  onPath,
  onPolicyNumber,
  onProvider,
  onRemove,
  path,
  policyNumber,
  preview,
  provider,
  successMessage,
  uploaded,
  uploading,
  uploadProgress,
}: {
  activityConfirmed: boolean;
  coverAmount: string;
  error?: string;
  expiryDate: string;
  insuredName: string;
  onActivityConfirmed: (next: boolean) => void;
  onCoverAmount: (next: string) => void;
  onDefer?: () => void;
  onExpiryDate: (next: string) => void;
  onFile: (file: File) => void;
  onInsuredName: (next: string) => void;
  onPath: (next: InsurancePath) => void;
  onPolicyNumber: (next: string) => void;
  onProvider: (next: string) => void;
  onRemove: () => void;
  path: InsurancePath | null;
  policyNumber: string;
  preview?: { isPdf?: boolean; url?: string };
  provider: string;
  successMessage?: string | null;
  uploaded: boolean;
  uploading: boolean;
  uploadProgress: number;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const expiryMax = (() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 15);
    return date.toISOString().slice(0, 10);
  })();

  return (
    <div className="space-y-6">
      {successMessage ? <SuccessBanner>{successMessage}</SuccessBanner> : null}
      <InfoCallout>{INSURANCE_COVER_MODEL_COPY}</InfoCallout>

      <SectionHeading>
        Do you currently have Public Liability Insurance?
      </SectionHeading>
      <DecisionStrip
        label="Do you currently have Public Liability Insurance?"
        onChange={(next) => onPath(next as InsurancePath)}
        options={[
          {
            hint: "Enter your policy details and upload the certificate next.",
            label: "Yes",
            value: "have",
          },
          {
            hint: "We’ll outline how to arrange cover before activation.",
            label: "Not yet",
            value: "none",
          },
          {
            hint: "We’ll help you check what your policy actually covers.",
            label: "Not sure",
            value: "unsure",
          },
        ]}
        value={path}
      />

      {path === "have" ? (
        <div className="space-y-5">
          <SectionHeading subtitle="Use the details exactly as they appear on your certificate.">
            Let&apos;s verify your insurance
          </SectionHeading>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <OnboardingField
              id="onboarding-insurance-provider"
              label="Insurance provider"
              onChange={(event) => onProvider(event.target.value)}
              value={provider}
            />
            <OnboardingField
              id="onboarding-insurance-policy"
              label="Policy number"
              onChange={(event) => onPolicyNumber(event.target.value)}
              value={policyNumber}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 sm:items-start">
            <OnboardingField
              hint="Should match your legal name (or registered business name)."
              id="onboarding-insurance-insured-name"
              label="Name on the policy"
              onChange={(event) => onInsuredName(event.target.value)}
              value={insuredName}
            />
            <OnboardingDateField
              id="onboarding-insurance-expiry"
              label="Policy expiry date"
              maxDate={expiryMax}
              minDate={today}
              onChange={onExpiryDate}
              value={expiryDate}
            />
          </div>

          <div className="space-y-2">
            <div
              className={cn(
                "flex flex-col gap-2 sm:flex-row sm:items-start",
                insuranceCoverBand(coverAmount) === "other"
                  ? "sm:max-w-md"
                  : "sm:max-w-[13.5rem]",
              )}
            >
              <div
                className={cn(
                  "min-w-0",
                  insuranceCoverBand(coverAmount) === "other"
                    ? "sm:w-[11.5rem] sm:shrink-0"
                    : "w-full",
                )}
              >
                <OnboardingSelect
                  error={
                    insuranceCoverBand(coverAmount) === "other"
                      ? undefined
                      : error
                  }
                  label="Coverage amount"
                  onChange={(next) => {
                    if (next === "other") {
                      onCoverAmount(
                        insuranceCoverOtherText(coverAmount) || "other",
                      );
                      return;
                    }
                    onCoverAmount(next);
                  }}
                  options={[
                    { label: "£1 million", value: "1m" },
                    { label: "£2 million", value: "2m" },
                    { label: "£5 million", value: "5m" },
                    { label: "Other", value: "other" },
                  ]}
                  value={insuranceCoverBand(coverAmount) ?? ""}
                />
              </div>
              {insuranceCoverBand(coverAmount) === "other" ? (
                <div
                  className={cn(
                    "flex h-11 min-w-0 flex-1 items-center gap-1.5 rounded-xl border-2 bg-transparent px-3.5 transition",
                    error
                      ? "border-brand-terracotta ring-2 ring-brand-terracotta"
                      : "border-brand-ink focus-within:ring-2 focus-within:ring-brand-ink",
                  )}
                >
                  <span className="text-[15px] font-medium text-brand-ink">
                    £
                  </span>
                  <input
                    aria-label="Other cover amount"
                    autoFocus
                    className="h-full w-full min-w-0 bg-transparent text-[15px] font-medium text-brand-ink outline-none placeholder:text-[#8a8498]"
                    id="onboarding-insurance-cover-other"
                    inputMode="decimal"
                    onChange={(event) => {
                      const next = event.target.value;
                      onCoverAmount(next.trim() ? next : "other");
                    }}
                    placeholder="e.g. 1.5m"
                    value={insuranceCoverOtherText(coverAmount)}
                  />
                </div>
              ) : null}
            </div>
            <p className="text-xs leading-5 text-[#8a8498]">
              Mundoria’s minimum is £1 million for standard domestic cleaning.
            </p>
            {error && insuranceCoverBand(coverAmount) === "other" ? (
              <FieldError message={error} />
            ) : null}
          </div>

          <DocumentUpload
            label="Upload insurance certificate"
            onFile={onFile}
            onRemove={onRemove}
            previewIsPdf={preview?.isPdf}
            previewUrl={preview?.url}
            progress={uploading ? uploadProgress : undefined}
            uploaded={uploaded}
            uploading={uploading}
          />

          <label className="flex cursor-pointer items-start gap-3 text-sm text-brand-ink">
            <OnboardingCheckbox
              checked={activityConfirmed}
              onCheckedChange={onActivityConfirmed}
            />
            <span>
              I confirm this policy covers professional domestic cleaning
              activity (not only personal home contents cover).
            </span>
          </label>
        </div>
      ) : null}

      {path === "none" ? (
        <div className="space-y-4">
          <SectionHeading subtitle="Arrange suitable cleaning business insurance before activation.">
            Let&apos;s help you get covered
          </SectionHeading>
          <ol className="space-y-3">
            {[
              "Find a provider offering Public Liability for cleaners.",
              "Check the policy covers the services you offer.",
              "Choose cover that meets Mundoria’s £1m minimum.",
              "Return here to upload your certificate.",
            ].map((step, index) => (
              <li
                className="flex items-start gap-3 text-sm leading-6 text-brand-muted"
                key={step}
              >
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-brand-ink text-xs font-bold text-brand-ink">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <p className="text-xs leading-5 text-[#8a8498]">
            Starting points (not endorsements): Simply Business, PolicyBee,
            Hiscox. Always check eligibility and exclusions.
          </p>
          {onDefer ? (
            <SoftDeferButton label="I'll get insured" onClick={onDefer} />
          ) : null}
          <InfoCallout>
            You can finish other onboarding steps while arranging insurance.
            Your profile stays pending until cover is verified.
          </InfoCallout>
        </div>
      ) : null}

      {path === "unsure" ? (
        <div className="space-y-4">
          <SectionHeading subtitle="Two quick checks usually settle it.">
            Let&apos;s help you check
          </SectionHeading>
          <ul className="space-y-3">
            {[
              "Look for “Public Liability” on your certificate — not only home contents.",
              "Confirm the policy covers professional domestic cleaning work.",
              "If you’re still unsure, ask your provider before uploading.",
            ].map((item) => (
              <li
                className="flex items-start gap-3 text-sm leading-6 text-brand-muted"
                key={item}
              >
                <span
                  aria-hidden
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-ink"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          {onDefer ? (
            <SoftDeferButton
              label="I'll check my insurance"
              onClick={onDefer}
            />
          ) : null}
          <InfoCallout>
            Continue for now and return once you&apos;ve confirmed your cover.
          </InfoCallout>
        </div>
      ) : null}

      {error ? <FieldError message={error} /> : null}
      <FaqAccordion items={INSURANCE_FAQS} />
    </div>
  );
}

export function LocationExtras({
  canTransportEquipment,
  error,
  onCanTransport,
  onTransportMode,
  transportMode,
}: {
  canTransportEquipment: string;
  error?: string;
  onCanTransport: (next: string) => void;
  onTransportMode: (next: string) => void;
  transportMode: string;
}) {
  const travel = parseTransportModes(transportMode);

  return (
    <div className="mt-8 space-y-6 border-t border-brand-sand pt-8">
      <SectionHeading subtitle="Select every option that applies.">
        How do you usually travel to cleaning jobs?
      </SectionHeading>
      <ChoiceMultiPills
        label="Travel modes"
        onChange={(modes) => {
          onTransportMode(serializeTransportModes(modes, travel.otherText));
        }}
        options={[...TRANSPORT_MODE_OPTIONS]}
        values={travel.modes}
      />
      {travel.modes.includes("other") ? (
        <OnboardingField
          error={error}
          id="onboarding-travel-other"
          label="How else do you travel?"
          onChange={(event) => {
            onTransportMode(
              serializeTransportModes(travel.modes, event.target.value),
            );
          }}
          value={travel.otherText}
        />
      ) : error ? (
        <FieldError message={error} />
      ) : null}

      <SectionHeading>
        Are you able to travel with cleaning equipment when required?
      </SectionHeading>
      <DecisionStrip
        label="Travel with cleaning equipment"
        onChange={onCanTransport}
        options={[
          {
            hint: "You’re happy to bring kit when a booking needs it.",
            label: "Yes",
            value: "yes",
          },
          {
            hint: "Prefer bookings where equipment is already on site.",
            label: "No",
            value: "no",
          },
        ]}
        value={
          canTransportEquipment === "yes" || canTransportEquipment === "no"
            ? canTransportEquipment
            : null
        }
      />

      <FaqAccordion items={LOCATION_FAQS} />
    </div>
  );
}

function OtherSpecify({
  id = "onboarding-other-specify",
  onChange,
  value,
}: {
  id?: string;
  onChange: (next: string) => void;
  value: string;
}) {
  return (
    <OnboardingField
      id={id}
      label="Other (please specify)"
      onChange={(event) => onChange(event.target.value)}
      value={value}
    />
  );
}

export function EquipmentComplianceStep({
  equipmentOther,
  equipmentOwned,
  equipmentOwnership,
  onEquipmentOther,
  onEquipmentOwned,
  onEquipmentOwnership,
  onProductsOther,
  onProductsOwned,
  onProductsOwnership,
  productsOther,
  productsOwned,
  productsOwnership,
}: {
  equipmentOther: string;
  equipmentOwned: string[];
  equipmentOwnership: string;
  onEquipmentOther: (next: string) => void;
  onEquipmentOwned: (next: string[]) => void;
  onEquipmentOwnership: (next: string) => void;
  onProductsOther: (next: string) => void;
  onProductsOwned: (next: string[]) => void;
  onProductsOwnership: (next: string) => void;
  productsOther: string;
  productsOwned: string[];
  productsOwnership: string;
}) {
  const showEquipmentList =
    equipmentOwnership === "yes" || equipmentOwnership === "some";
  const OTHER = "Other (please specify)";

  return (
    <div className="space-y-6">
      <p className="text-sm leading-6 text-brand-muted">
        Some bookings need you to bring equipment and products; others provide
        supplies. Tell us what you have so we can match you well. Products
        (liquids/sprays) and equipment (vacuum, mop) are tracked separately.
      </p>

      <SectionHeading>Do you have your own cleaning products?</SectionHeading>
      <DecisionStrip
        label="Own cleaning products"
        onChange={onProductsOwnership}
        options={[
          {
            hint: "You’re set to bring products when a booking needs them.",
            label: "Yes",
            value: "yes",
          },
          {
            hint: "You have some products — add details below if useful.",
            label: "Some",
            value: "some",
          },
          {
            hint: "Prefer bookings where products are provided for now.",
            label: "None",
            value: "none",
          },
        ]}
        value={productsOwnership || null}
      />

      {productsOwnership === "yes" || productsOwnership === "some" ? (
        <div className="space-y-3">
          <ChipMultiSelect
            onChange={onProductsOwned}
            options={[...PRODUCT_ITEMS, OTHER]}
            selected={productsOwned}
          />
          {productsOwned.includes(OTHER) ? (
            <OtherSpecify
              id="onboarding-products-other"
              onChange={onProductsOther}
              value={productsOther}
            />
          ) : null}
        </div>
      ) : null}

      <SectionHeading>Do you have your own cleaning equipment?</SectionHeading>
      <DecisionStrip
        label="Own cleaning equipment"
        onChange={onEquipmentOwnership}
        options={[
          {
            hint: "You can bring a full kit to bookings when needed.",
            label: "Yes",
            value: "yes",
          },
          {
            hint: "You have part of a kit — we’ll match with that in mind.",
            label: "Some",
            value: "some",
          },
          {
            hint: "Prefer bookings where equipment is already on site for now.",
            label: "None yet",
            value: "none",
          },
        ]}
        value={equipmentOwnership || null}
      />

      {showEquipmentList ? (
        <div className="space-y-4">
          <SectionHeading>What cleaning equipment do you own?</SectionHeading>
          <ChipMultiSelect
            onChange={onEquipmentOwned}
            options={[...EQUIPMENT_ITEMS, OTHER]}
            selected={equipmentOwned}
          />
          {equipmentOwned.includes(OTHER) ? (
            <OtherSpecify
              id="onboarding-equipment-other"
              onChange={onEquipmentOther}
              value={equipmentOther}
            />
          ) : null}
        </div>
      ) : null}

      <FaqAccordion items={EQUIPMENT_FAQS} />
    </div>
  );
}

export function EmergencyContactStep({
  altPhone,
  country,
  email,
  error,
  informed,
  mobile,
  name,
  onAltPhone,
  onCountry,
  onEmail,
  onInformed,
  onMobile,
  onName,
  onRelationship,
  onRelationshipOther,
  onSafetyAck,
  relationship,
  relationshipOther,
  safetyAck,
  successMessage,
}: {
  altPhone: string;
  country: string;
  email: string;
  error?: string;
  informed: string;
  mobile: string;
  name: string;
  onAltPhone: (next: string) => void;
  onCountry: (next: string) => void;
  onEmail: (next: string) => void;
  onInformed: (next: string) => void;
  onMobile: (next: string) => void;
  onName: (next: string) => void;
  onRelationship: (next: string) => void;
  onRelationshipOther: (next: string) => void;
  onSafetyAck: (next: boolean) => void;
  relationship: string;
  relationshipOther: string;
  safetyAck: boolean;
  successMessage?: string | null;
}) {
  const countryOptions = (() => {
    if (
      !country ||
      WORLD_COUNTRY_SELECT_OPTIONS.some((option) => option.value === country)
    ) {
      return WORLD_COUNTRY_SELECT_OPTIONS;
    }
    return [
      { flag: "🏳️", label: country, value: country },
      ...WORLD_COUNTRY_SELECT_OPTIONS,
    ];
  })();

  return (
    <div className="space-y-6">
      {successMessage ? <SuccessBanner>{successMessage}</SuccessBanner> : null}
      <p className="text-sm leading-6 text-brand-muted">
        Provide someone we can contact in an emergency while you&apos;re on a
        Mundoria booking. This stays private and is only used when necessary.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 sm:items-start">
        <OnboardingField
          error={error}
          id="onboarding-emergency-name"
          label="Full name"
          onChange={(event) => onName(event.target.value)}
          value={name}
        />
        <OnboardingSelect
          label="Relationship to you"
          onChange={(next) => {
            if (next === "other") {
              onRelationship("other");
              return;
            }
            onRelationship(next);
            onRelationshipOther("");
          }}
          options={[
            { label: "Spouse / Partner", value: "partner" },
            { label: "Parent", value: "parent" },
            { label: "Sibling", value: "sibling" },
            { label: "Relative", value: "relative" },
            { label: "Friend", value: "friend" },
            { label: "Other", value: "other" },
          ]}
          placeholder="Select relationship"
          value={
            ["partner", "parent", "sibling", "relative", "friend", "other"].includes(
              relationship,
            )
              ? relationship
              : relationship
                ? "other"
                : ""
          }
        />
      </div>
      {relationship === "other" ||
      (Boolean(relationship) &&
        !["partner", "parent", "sibling", "relative", "friend", "other"].includes(
          relationship,
        )) ? (
        <OnboardingField
          id="onboarding-emergency-relationship-other"
          label="Please specify relationship"
          onChange={(event) => {
            const next = event.target.value;
            onRelationship("other");
            onRelationshipOther(next);
          }}
          value={
            relationship === "other"
              ? relationshipOther
              : relationshipOther || relationship
          }
        />
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <OnboardingField
          error={error}
          id="onboarding-emergency-mobile"
          label="Mobile number"
          onChange={(event) => onMobile(event.target.value)}
          value={mobile}
        />
        <OnboardingField
          id="onboarding-emergency-alt-phone"
          label="Alternative phone (optional)"
          onChange={(event) => onAltPhone(event.target.value)}
          value={altPhone}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <OnboardingField
          id="onboarding-emergency-email"
          label="Email (optional)"
          onChange={(event) => onEmail(event.target.value)}
          type="email"
          value={email}
        />
        <OnboardingSelect
          label="Country of residence"
          onChange={onCountry}
          options={countryOptions}
          placeholder="Select country"
          searchPlaceholder="Search countries…"
          value={country || "United Kingdom"}
        />
      </div>

      <SectionHeading>
        Is this person aware you&apos;ve listed them?
      </SectionHeading>
      <DecisionStrip
        label="Emergency contact informed"
        onChange={onInformed}
        options={[
          {
            hint: "They already know they may be contacted.",
            label: "Yes",
            value: "yes",
          },
          {
            hint: "You’ll let them know before you submit.",
            label: "I’ll tell them",
            value: "later",
          },
        ]}
        value={informed || null}
      />

      <SectionHeading>Staying safe while you work</SectionHeading>
      <ul className="list-disc space-y-1.5 pl-5 text-sm leading-6 text-brand-muted">
        {SAFETY_GUIDELINES.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <InfoCallout>
        After you&apos;re approved, use Report an incident in your cleaner
        account for injuries, damage and unsafe conditions. Dial 999 in an
        emergency, or 101 for non-emergencies.
      </InfoCallout>
      <label className="flex cursor-pointer items-start gap-3 text-sm text-brand-ink">
        <OnboardingCheckbox
          checked={safetyAck}
          onCheckedChange={onSafetyAck}
        />
        <span>
          I understand I should report safety concerns, accidents and
          emergencies to Mundoria as soon as reasonably possible.
        </span>
      </label>
      {error ? <FieldError message={error} /> : null}
      <FaqAccordion items={EMERGENCY_FAQS} />
    </div>
  );
}

export function AgreementsReviewStep({
  acceptedKeys,
  accuracyConfirmed,
  error,
  marketingConsent,
  onAccuracyConfirmed,
  onEditStep,
  onMarketingConsent,
  onToggle,
  summaryRows,
}: {
  acceptedKeys: string[];
  accuracyConfirmed: boolean;
  error?: string;
  marketingConsent: boolean;
  onAccuracyConfirmed: (next: boolean) => void;
  onEditStep: (stepId: string) => void;
  onMarketingConsent: (next: boolean) => void;
  onToggle: (key: string, next: boolean) => void;
  summaryRows: { label: string; status: string; stepId: string }[];
}) {
  return (
    <div className="space-y-6">
      <p className="text-sm leading-6 text-brand-muted">
        You&apos;re almost there. Check your application summary, then accept
        the agreements before submitting.
      </p>

      <div className="rounded-2xl border-2 border-brand-ink bg-brand-cream p-4">
        <p className="font-semibold text-brand-ink">Application summary</p>
        <ul className="mt-3 divide-y divide-brand-sand">
          {summaryRows.map((row) => (
            <li
              className="flex items-center justify-between gap-3 py-2.5 text-sm"
              key={row.stepId}
            >
              <div className="min-w-0">
                <p className="font-medium text-brand-ink">{row.label}</p>
                <p className="text-brand-muted">{row.status}</p>
              </div>
              <button
                className="shrink-0 text-sm font-semibold text-brand-purple underline-offset-2 hover:underline"
                onClick={() => onEditStep(row.stepId)}
                type="button"
              >
                Edit
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        {CLEANER_AGREEMENT_DOCS.map((doc) => (
          <div
            className="rounded-2xl border-2 border-brand-ink bg-brand-cream p-4"
            key={doc.key}
          >
            <p className="font-semibold text-brand-ink">{doc.label}</p>
            <p className="mt-1 text-sm leading-5 text-brand-muted">
              {doc.description}
            </p>
            <a
              className="mt-2 inline-block text-sm font-semibold text-brand-purple underline-offset-2 hover:underline"
              href={doc.href}
              rel="noopener noreferrer"
              target="_blank"
            >
              Read {doc.label}
            </a>
            <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm text-brand-ink">
              <OnboardingCheckbox
                checked={acceptedKeys.includes(doc.key)}
                onCheckedChange={(next) => onToggle(doc.key, next)}
              />
              <span>I have read and agree to the {doc.label}.</span>
            </label>
          </div>
        ))}
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-sm text-brand-ink">
        <OnboardingCheckbox
          checked={accuracyConfirmed}
          onCheckedChange={onAccuracyConfirmed}
        />
        <span>
          I confirm the information in this application is accurate and belongs
          to me.
        </span>
      </label>

      <label className="flex cursor-pointer items-start gap-3 text-sm text-brand-ink">
        <OnboardingCheckbox
          checked={marketingConsent}
          onCheckedChange={onMarketingConsent}
        />
        <span>
          Optional: I&apos;d like tips and product updates from Mundoria by
          email. I can unsubscribe anytime.
        </span>
      </label>

      <InfoCallout>
        Some documents may still be under review. You can submit while checks
        are pending, but your profile must be approved before you accept
        bookings. Activation requires mandatory checks (ID, DBS, UTR,
        insurance) to be verified.
      </InfoCallout>
      {error ? <FieldError message={error} /> : null}
      <FaqAccordion items={FINAL_REVIEW_FAQS} />
    </div>
  );
}
