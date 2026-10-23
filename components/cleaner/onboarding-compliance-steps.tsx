"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { FieldError, invalidControlClass } from "@/components/shared/action-error";
import { Input } from "@/components/ui/input";
import { MAX_DBS_DOCUMENT_PAGES } from "@/lib/cleaner/document-urls";
import {
  BOOKING_PREFERENCE_OPTIONS,
  CLEANING_SKILLS,
  CLEANER_AGREEMENT_DOCS,
  DBS_APPLY_URL,
  DBS_FAQS,
  EMERGENCY_COUNTRIES,
  EMERGENCY_FAQS,
  EQUIPMENT_FAQS,
  EQUIPMENT_ITEMS,
  EXPERIENCE_FAQS,
  FINAL_REVIEW_FAQS,
  HMRC_FIND_UTR_URL,
  HMRC_REGISTER_URL,
  INSURANCE_COVER_MODEL_COPY,
  INSURANCE_FAQS,
  LOCATION_FAQS,
  PAYOUT_FAQS,
  PPE_ITEMS,
  PRODUCT_ITEMS,
  SAFETY_GUIDELINES,
  SPECIALISED_EQUIPMENT,
  TRAINING_OPTIONS,
  UTR_FAQS,
  UTR_PROOF_TYPES,
  digitsOnly,
  insuranceCoverBand,
  insuranceCoverOtherText,
  transportModeBand,
  transportModeOtherText,
  type DbsPath,
  type InsurancePath,
  type UtrPath,
} from "@/lib/cleaner/onboarding-compliance";
import { cn } from "@/lib/utils";

import {
  BranchChoice,
  ChipMultiSelect,
  DocumentUpload,
  ExternalCta,
  FaqAccordion,
  InfoCallout,
  OnboardingCheckbox,
  SoftDeferButton,
  SuccessBanner,
} from "@/components/cleaner/onboarding-primitives";

const FIELD =
  "border-2 border-[#1c133b] bg-[#f9f6ef] focus-visible:ring-[#1c133b]";

function SectionHeading({
  children,
  subtitle,
}: {
  children: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4">
      <h3 className="text-lg font-bold tracking-[-0.02em] text-[#1c133b]">
        {children}
      </h3>
      {subtitle ? (
        <p className="mt-1.5 text-sm leading-6 text-[#5a5470]">{subtitle}</p>
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
      <p className="text-sm leading-6 text-[#5a5470]">
        A Unique Taxpayer Reference (UTR) is a 10-digit number issued by HMRC.
        If you&apos;re registered for Self Assessment, you&apos;ll have one. As
        part of joining Mundoria as a self-employed cleaner, we&apos;ll need
        your UTR to verify your tax registration details.
      </p>

      <SectionHeading>Do you already have a UTR number?</SectionHeading>
      <BranchChoice
        onChange={(next) => onPath(next as UtrPath)}
        options={[
          { label: "Yes, I have a UTR", value: "have" },
          { label: "No, I don't have one yet", value: "none" },
          { label: "I'm not sure", value: "unsure" },
        ]}
        value={path === "waiting" ? "none" : path}
      />

      {path === "have" ? (
        <div className="space-y-4">
          <SectionHeading subtitle="Enter your UTR and upload a document from HMRC showing your name and UTR.">
            Let&apos;s verify your UTR
          </SectionHeading>
          <label className="block space-y-2 text-sm font-medium">
            <span>UTR number</span>
            <Input
              className={cn(FIELD, error ? invalidControlClass : undefined)}
              inputMode="numeric"
              maxLength={10}
              onChange={(event) =>
                onUtrChange(digitsOnly(event.target.value))
              }
              placeholder="Enter your 10-digit UTR"
              value={utrNumber}
            />
            <p className="text-xs font-normal leading-5 text-[#8a8498]">
              Your UTR is usually 10 digits. Find it on your HMRC account, app
              or Self Assessment documents.
            </p>
          </label>
          <div className="rounded-2xl border-2 border-[#1c133b]/25 bg-[#f3eee4] px-4 py-3">
            <p className="text-sm font-semibold text-[#1c133b]">
              Accepted proof (one of the following)
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-[#5a5470]">
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
          <label className="flex cursor-pointer items-start gap-3 text-sm text-[#1c133b]">
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
          <ol className="list-decimal space-y-3 pl-5 text-sm leading-6 text-[#5a5470]">
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
          <BranchChoice
            onChange={(next) => onWaiting(next === "yes")}
            options={[
              { label: "Yes, I'm waiting for my UTR", value: "yes" },
              { label: "No, I haven't registered yet", value: "no" },
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
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-6 text-[#5a5470]">
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
  const [awaitingNextPage, setAwaitingNextPage] = useState(false);

  useEffect(() => {
    if (pages.length === 0) setAwaitingNextPage(false);
  }, [pages.length]);

  // One empty starter slot, or all uploaded pages (+ one empty only after Add).
  const slotCount =
    pages.length === 0
      ? 1
      : Math.min(
          MAX_DBS_DOCUMENT_PAGES,
          pages.length + (awaitingNextPage ? 1 : 0),
        );
  const showAddPage =
    path === "have" &&
    pages.length >= 1 &&
    !awaitingNextPage &&
    pages.length < MAX_DBS_DOCUMENT_PAGES;

  return (
    <div className="space-y-6">
      {successMessage ? <SuccessBanner>{successMessage}</SuccessBanner> : null}
      <p className="text-sm leading-6 text-[#5a5470]">
        To help keep customers and cleaners safe, we require a Basic DBS check.
        It shows any unspent convictions and conditional cautions.
      </p>

      <SectionHeading>Do you already have a Basic DBS certificate?</SectionHeading>
      <BranchChoice
        onChange={(next) => onPath(next as DbsPath)}
        options={[
          { label: "Yes, I have one", value: "have" },
          { label: "No, I need to apply", value: "apply" },
          { label: "I've applied and I'm waiting", value: "waiting" },
        ]}
        value={path}
      />

      {path === "have" ? (
        <div className="space-y-4">
          <SectionHeading>
            Great! Let&apos;s verify your DBS.
          </SectionHeading>
          <label className="block space-y-2 text-sm font-medium">
            <span>Certificate number</span>
            <Input
              className={cn(FIELD, error ? invalidControlClass : undefined)}
              onChange={(event) => onCertificateNumber(event.target.value)}
              placeholder="Certificate number"
              value={certificateNumber}
            />
          </label>
          <label className="block space-y-2 text-sm font-medium">
            <span>Date issued</span>
            <Input
              className={cn(FIELD, error ? invalidControlClass : undefined)}
              onChange={(event) => onIssuedOn(event.target.value)}
              type="date"
              value={issuedOn}
            />
          </label>
          <div className="space-y-3">
            <p className="text-sm font-medium text-[#1c133b]">
              Certificate pages
            </p>
            <p className="text-xs leading-5 text-[#8b8798]">
              Upload a PDF or clear photos. One page is enough for most Basic
              DBS certificates — add more only if you need to.
            </p>
            <div className="flex flex-wrap items-start gap-3 sm:gap-4">
              {Array.from({ length: slotCount }, (_, index) => {
                const slotKey = `dbs:${index}`;
                const preview = pagePreviews[slotKey];
                const hasFile = Boolean(pages[index]);
                const isNextEmpty =
                  index === pages.length &&
                  (pages.length === 0 || awaitingNextPage);
                const uploadTarget = hasFile ? index : pages.length;
                const isUploadingHere =
                  uploadingSlot === `dbs:${uploadTarget}`;
                return (
                  <div
                    className="w-full min-w-0 space-y-2 sm:w-[calc(50%-0.5rem)] sm:max-w-sm"
                    key={slotKey}
                  >
                    <DocumentUpload
                      label={`Certificate page ${index + 1}`}
                      onFile={(file) => {
                        if (!hasFile && !isNextEmpty) return;
                        onFile(file, uploadTarget);
                        if (!hasFile) setAwaitingNextPage(false);
                      }}
                      onRemove={
                        hasFile ? () => onRemove(index) : undefined
                      }
                      previewIsPdf={preview?.isPdf}
                      previewUrl={hasFile ? preview?.url : undefined}
                      progress={isUploadingHere ? uploadProgress : undefined}
                      uploaded={hasFile}
                      uploading={isUploadingHere}
                    />
                    {isNextEmpty && pages.length > 0 ? (
                      <button
                        className="text-sm font-semibold text-[#d4694a] hover:underline"
                        onClick={() => setAwaitingNextPage(false)}
                        type="button"
                      >
                        Remove page
                      </button>
                    ) : null}
                  </div>
                );
              })}
              {showAddPage ? (
                <div className="flex flex-col pt-[1.75rem]">
                  <button
                    aria-label="Add another page"
                    className="inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#1c133b] bg-[#f9f6ef] text-[#1c133b] transition hover:bg-[#1c133b] hover:text-white"
                    onClick={() => setAwaitingNextPage(true)}
                    type="button"
                  >
                    <Plus className="h-5 w-5" strokeWidth={2.5} />
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {path === "apply" ? (
        <div className="space-y-4">
          <SectionHeading subtitle="Apply directly through the official UK government website.">
            Let&apos;s get your DBS sorted
          </SectionHeading>
          <p className="text-sm font-semibold text-[#1c133b]">
            Application fee: £20
          </p>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-[#5a5470]">
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
          <p className="text-sm leading-6 text-[#5a5470]">
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
  return (
    <div className="space-y-6">
      {successMessage ? <SuccessBanner>{successMessage}</SuccessBanner> : null}
      <p className="text-sm leading-6 text-[#5a5470]">
        Accidents can happen, even when you&apos;re careful. Public Liability
        Insurance helps protect you if someone is injured or property is
        damaged because of your cleaning work, subject to the policy.
      </p>
      <InfoCallout>{INSURANCE_COVER_MODEL_COPY}</InfoCallout>

      <SectionHeading>Do you currently have Public Liability Insurance?</SectionHeading>
      <BranchChoice
        onChange={(next) => onPath(next as InsurancePath)}
        options={[
          { label: "Yes, I have insurance", value: "have" },
          { label: "No, I don't have insurance yet", value: "none" },
          { label: "I'm not sure", value: "unsure" },
        ]}
        value={path}
      />

      {path === "have" ? (
        <div className="space-y-4">
          <SectionHeading>Great! Let&apos;s verify your insurance.</SectionHeading>
          <label className="block space-y-2 text-sm font-medium">
            <span>Insurance provider</span>
            <Input
              className={cn(FIELD, error ? invalidControlClass : undefined)}
              onChange={(event) => onProvider(event.target.value)}
              placeholder="Enter your insurance company's name"
              value={provider}
            />
          </label>
          <label className="block space-y-2 text-sm font-medium">
            <span>Policy number</span>
            <Input
              className={cn(FIELD, error ? invalidControlClass : undefined)}
              onChange={(event) => onPolicyNumber(event.target.value)}
              placeholder="Enter your policy number"
              value={policyNumber}
            />
          </label>
          <label className="block space-y-2 text-sm font-medium">
            <span>Name on the policy</span>
            <Input
              className={cn(FIELD, error ? invalidControlClass : undefined)}
              onChange={(event) => onInsuredName(event.target.value)}
              placeholder="As shown on your certificate"
              value={insuredName}
            />
            <p className="text-xs font-normal leading-5 text-[#8a8498]">
              Should match your legal name (or registered business name).
              Mismatches are flagged for review.
            </p>
          </label>
          <div className="space-y-3">
            <p className="mb-2 text-sm font-medium">Coverage amount</p>
            <BranchChoice
              columns={2}
              onChange={(next) => {
                if (next === "other") {
                  const existing = insuranceCoverOtherText(coverAmount);
                  onCoverAmount(existing || "other");
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
              value={insuranceCoverBand(coverAmount)}
            />
            {insuranceCoverBand(coverAmount) === "other" ? (
              <label className="block space-y-2 text-sm font-medium">
                <span>Enter your cover amount (minimum £1 million)</span>
                <Input
                  className={cn(FIELD, error ? invalidControlClass : undefined)}
                  onChange={(event) => {
                    const next = event.target.value;
                    onCoverAmount(next.trim() ? next : "other");
                  }}
                  placeholder="e.g. £1.5 million"
                  value={insuranceCoverOtherText(coverAmount)}
                />
              </label>
            ) : null}
          </div>
          <label className="block space-y-2 text-sm font-medium">
            <span>Policy expiry date</span>
            <Input
              className={cn(FIELD, error ? invalidControlClass : undefined)}
              onChange={(event) => onExpiryDate(event.target.value)}
              type="date"
              value={expiryDate}
            />
          </label>
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
          <label className="flex cursor-pointer items-start gap-3 text-sm text-[#1c133b]">
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
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-[#5a5470]">
            <li>Find a provider offering Public Liability for cleaners.</li>
            <li>Check the policy covers the services you offer.</li>
            <li>Choose cover that meets Mundoria&apos;s £1m minimum.</li>
            <li>Return here to upload your certificate.</li>
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
            Your profile stays pending until cover is verified. Expired cover
            blocks new bookings once you&apos;re live.
          </InfoCallout>
        </div>
      ) : null}

      {path === "unsure" ? (
        <div className="space-y-4">
          <SectionHeading>
            Let&apos;s help you check
          </SectionHeading>
          <p className="text-sm leading-6 text-[#5a5470]">
            Check your certificate or contact your provider to confirm Public
            Liability covers professional cleaning work.
          </p>
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

export function ExperienceExtras({
  cleaningSkills,
  cleaningSkillsOther,
  onCleaningSkills,
  onCleaningSkillsOther,
  onPriorType,
  onPriorEmployer,
  onPriorDuration,
  onPriorSummary,
  onTrainingCertFile,
  onTrainingCertRemove,
  onTrainingCompleted,
  onTrainingPath,
  priorDuration,
  priorEmployer,
  priorSummary,
  priorType,
  trainingCertPreview,
  trainingCertUploaded,
  trainingCertUploading,
  trainingCertProgress,
  trainingCompleted,
  trainingPath,
}: {
  cleaningSkills: string[];
  cleaningSkillsOther: string;
  onCleaningSkills: (next: string[]) => void;
  onCleaningSkillsOther: (next: string) => void;
  onPriorType: (next: string) => void;
  onPriorEmployer: (next: string) => void;
  onPriorDuration: (next: string) => void;
  onPriorSummary: (next: string) => void;
  onTrainingCertFile: (file: File) => void;
  onTrainingCertRemove: () => void;
  onTrainingCompleted: (next: string[]) => void;
  onTrainingPath: (next: string) => void;
  priorDuration: string;
  priorEmployer: string;
  priorSummary: string;
  priorType: string;
  trainingCertPreview?: { isPdf?: boolean; url?: string };
  trainingCertUploaded: boolean;
  trainingCertUploading: boolean;
  trainingCertProgress: number;
  trainingCompleted: string[];
  trainingPath: string;
}) {
  const hasPrior =
    priorType === "company" ||
    priorType === "independent" ||
    priorType === "both";
  const showSkillsOther = cleaningSkills.includes("Other (please specify)");

  return (
    <div className="mt-8 space-y-6 border-t border-[#e8e0d0] pt-8">
      <SectionHeading subtitle="Select the tasks you’re confident carrying out. Specialist services usually pay more — they still need Mundoria review before you can take those jobs.">
        Cleaning skills
      </SectionHeading>
      <ChipMultiSelect
        onChange={onCleaningSkills}
        options={[...CLEANING_SKILLS, "Other (please specify)"]}
        selected={cleaningSkills}
      />
      {showSkillsOther ? (
        <Input
          className={FIELD}
          onChange={(event) => onCleaningSkillsOther(event.target.value)}
          placeholder="Please specify other skills"
          value={cleaningSkillsOther}
        />
      ) : null}

      <SectionHeading>Have you worked professionally as a cleaner before?</SectionHeading>
      <BranchChoice
        onChange={onPriorType}
        options={[
          { label: "Yes, for a cleaning company", value: "company" },
          { label: "Yes, independently / self-employed", value: "independent" },
          { label: "Yes, both", value: "both" },
          { label: "No, I'm just starting", value: "none" },
        ]}
        value={priorType || null}
      />

      {hasPrior ? (
        <div className="space-y-3">
          <Input
            className={FIELD}
            onChange={(event) => onPriorEmployer(event.target.value)}
            placeholder="Company or business name (optional)"
            value={priorEmployer}
          />
          <Input
            className={FIELD}
            onChange={(event) => onPriorDuration(event.target.value)}
            placeholder="How long did you work there?"
            value={priorDuration}
          />
          <textarea
            className={cn(
              "min-h-24 w-full rounded-md p-3 text-sm outline-none ring-offset-white focus-visible:ring-2",
              FIELD,
            )}
            onChange={(event) => onPriorSummary(event.target.value)}
            placeholder="Briefly describe the cleaning work you've done"
            value={priorSummary}
          />
        </div>
      ) : null}

      {priorType === "none" ? (
        <InfoCallout>
          Everyone starts somewhere. Applications without professional
          experience may need extra training or assessment before approval.
        </InfoCallout>
      ) : null}

      <SectionHeading subtitle="Optional — certificates help verification.">
        Training &amp; qualifications
      </SectionHeading>
      <BranchChoice
        onChange={onTrainingPath}
        options={[
          { label: "Yes, I've completed training", value: "yes" },
          { label: "No formal training yet", value: "no" },
        ]}
        value={trainingPath || null}
      />
      {trainingPath === "yes" ? (
        <div className="space-y-4">
          <ChipMultiSelect
            onChange={onTrainingCompleted}
            options={TRAINING_OPTIONS}
            selected={trainingCompleted}
          />
          <DocumentUpload
            label="Upload a training certificate (optional)"
            onFile={onTrainingCertFile}
            onRemove={onTrainingCertRemove}
            previewIsPdf={trainingCertPreview?.isPdf}
            previewUrl={trainingCertPreview?.url}
            progress={trainingCertUploading ? trainingCertProgress : undefined}
            uploaded={trainingCertUploaded}
            uploading={trainingCertUploading}
          />
        </div>
      ) : null}

      <FaqAccordion items={EXPERIENCE_FAQS} />
    </div>
  );
}

export function LocationExtras({
  bookingPreferences,
  canTransportEquipment,
  error,
  onBookingPreferences,
  onCanTransport,
  onTransportMode,
  transportMode,
}: {
  bookingPreferences: string[];
  canTransportEquipment: string;
  error?: string;
  onBookingPreferences: (next: string[]) => void;
  onCanTransport: (next: string) => void;
  onTransportMode: (next: string) => void;
  transportMode: string;
}) {
  return (
    <div className="mt-8 space-y-6 border-t border-[#e8e0d0] pt-8">
      <SectionHeading>How do you usually travel to cleaning jobs?</SectionHeading>
      <BranchChoice
        columns={2}
        onChange={(next) => {
          if (next === "other") {
            const existing = transportModeOtherText(transportMode);
            onTransportMode(existing || "other");
            return;
          }
          onTransportMode(next);
        }}
        options={[
          { label: "I drive and have my own car", value: "car" },
          { label: "Public transport", value: "public" },
          { label: "Bicycle", value: "bike" },
          { label: "Walking", value: "walk" },
          { label: "Other", value: "other" },
        ]}
        value={transportModeBand(transportMode)}
      />
      {transportModeBand(transportMode) === "other" ? (
        <label className="block space-y-2 text-sm font-medium">
          <span>How do you usually travel?</span>
          <Input
            className={cn(FIELD, error ? invalidControlClass : undefined)}
            onChange={(event) => {
              const next = event.target.value;
              onTransportMode(next.trim() ? next : "other");
            }}
            placeholder="e.g. Motorbike, lifts with a colleague"
            value={transportModeOtherText(transportMode)}
          />
          {error ? <FieldError message={error} /> : null}
        </label>
      ) : null}

      <SectionHeading>
        Are you able to travel with cleaning equipment when required?
      </SectionHeading>
      <BranchChoice
        onChange={onCanTransport}
        options={[
          { label: "Yes", value: "yes" },
          { label: "No", value: "no" },
          { label: "Depends on the equipment", value: "depends" },
        ]}
        value={canTransportEquipment || null}
      />

      <SectionHeading subtitle="Preferences help matching — they don't guarantee bookings.">
        Booking preferences
      </SectionHeading>
      <ChipMultiSelect
        onChange={onBookingPreferences}
        options={BOOKING_PREFERENCE_OPTIONS}
        selected={bookingPreferences}
      />

      <FaqAccordion items={LOCATION_FAQS} />
    </div>
  );
}

function OtherSpecify({
  onChange,
  value,
}: {
  onChange: (next: string) => void;
  value: string;
}) {
  return (
    <Input
      className={FIELD}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Other (please specify)"
      value={value}
    />
  );
}

export function EquipmentComplianceStep({
  equipmentCondition,
  equipmentOther,
  equipmentOwned,
  equipmentOwnership,
  equipmentTransport,
  onEquipmentCondition,
  onEquipmentOther,
  onEquipmentOwned,
  onEquipmentOwnership,
  onEquipmentTransport,
  onPpeOther,
  onPpeOwned,
  onProductsOther,
  onProductsOwned,
  onProductsOwnership,
  onSpecialised,
  onSpecialisedOther,
  onSpecialisedTraining,
  ppeOther,
  ppeOwned,
  productsOther,
  productsOwned,
  productsOwnership,
  specialised,
  specialisedOther,
  specialisedTraining,
}: {
  equipmentCondition: string;
  equipmentOther: string;
  equipmentOwned: string[];
  equipmentOwnership: string;
  equipmentTransport: string;
  onEquipmentCondition: (next: string) => void;
  onEquipmentOther: (next: string) => void;
  onEquipmentOwned: (next: string[]) => void;
  onEquipmentOwnership: (next: string) => void;
  onEquipmentTransport: (next: string) => void;
  onPpeOther: (next: string) => void;
  onPpeOwned: (next: string[]) => void;
  onProductsOther: (next: string) => void;
  onProductsOwned: (next: string[]) => void;
  onProductsOwnership: (next: string) => void;
  onSpecialised: (next: string[]) => void;
  onSpecialisedOther: (next: string) => void;
  onSpecialisedTraining: (next: string) => void;
  ppeOther: string;
  ppeOwned: string[];
  productsOther: string;
  productsOwned: string[];
  productsOwnership: string;
  specialised: string[];
  specialisedOther: string;
  specialisedTraining: string;
}) {
  const showEquipmentList =
    equipmentOwnership === "yes" || equipmentOwnership === "some";
  const OTHER = "Other (please specify)";

  return (
    <div className="space-y-6">
      <p className="text-sm leading-6 text-[#5a5470]">
        Some bookings need you to bring equipment and products; others provide
        supplies. Tell us what you have so we can match you well. Products
        (liquids/sprays) and equipment (vacuum, mop) are tracked separately.
      </p>

      <SectionHeading>Do you have your own cleaning equipment?</SectionHeading>
      <BranchChoice
        onChange={onEquipmentOwnership}
        options={[
          { label: "Yes, I have my own equipment", value: "yes" },
          { label: "I have some equipment", value: "some" },
          { label: "No, I don't have any equipment yet", value: "none" },
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
            <OtherSpecify onChange={onEquipmentOther} value={equipmentOther} />
          ) : null}
          <SectionHeading>Is your equipment in good working condition?</SectionHeading>
          <BranchChoice
            onChange={onEquipmentCondition}
            options={[
              { label: "Yes", value: "yes" },
              { label: "Some equipment needs replacing", value: "replace" },
              { label: "I'm not sure", value: "unsure" },
            ]}
            value={equipmentCondition || null}
          />
        </div>
      ) : null}

      <SectionHeading>Do you have your own cleaning products?</SectionHeading>
      <BranchChoice
        onChange={onProductsOwnership}
        options={[
          { label: "Yes, I have my own cleaning products", value: "yes" },
          { label: "I have some cleaning products", value: "some" },
          { label: "No, I don't have any", value: "none" },
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
            <OtherSpecify onChange={onProductsOther} value={productsOther} />
          ) : null}
        </div>
      ) : null}

      <SectionHeading>Personal protective equipment (PPE)</SectionHeading>
      <ChipMultiSelect
        onChange={onPpeOwned}
        options={[...PPE_ITEMS, OTHER, "None of the above"]}
        selected={ppeOwned}
      />
      {ppeOwned.includes(OTHER) ? (
        <OtherSpecify onChange={onPpeOther} value={ppeOther} />
      ) : null}

      <SectionHeading>
        Can you transport your equipment to cleaning bookings?
      </SectionHeading>
      <BranchChoice
        onChange={onEquipmentTransport}
        options={[
          { label: "Yes, I can bring my equipment", value: "yes" },
          { label: "I can bring smaller equipment only", value: "small" },
          {
            label: "Prefer bookings where equipment is provided",
            value: "prefer_provided",
          },
        ]}
        value={equipmentTransport || null}
      />

      <SectionHeading>
        Specialised cleaning equipment
      </SectionHeading>
      <ChipMultiSelect
        onChange={onSpecialised}
        options={[...SPECIALISED_EQUIPMENT, OTHER, "None of the above"]}
        selected={specialised}
      />
      {specialised.includes(OTHER) ? (
        <OtherSpecify onChange={onSpecialisedOther} value={specialisedOther} />
      ) : null}
      {specialised.some(
        (item) => item !== "None of the above" && item !== OTHER,
      ) || specialised.includes(OTHER) ? (
        <>
          <SectionHeading>
            Have you been trained to use the specialised equipment selected?
          </SectionHeading>
          <BranchChoice
            onChange={onSpecialisedTraining}
            options={[
              { label: "Yes", value: "yes" },
              { label: "No", value: "no" },
              { label: "Not applicable", value: "na" },
            ]}
            value={specialisedTraining || null}
          />
          <InfoCallout>
            Specialised kit doesn&apos;t auto-approve specialist bookings —
            Mundoria reviews these before offers go live.
          </InfoCallout>
        </>
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
  const countryBand = EMERGENCY_COUNTRIES.includes(
    country as (typeof EMERGENCY_COUNTRIES)[number],
  )
    ? country
    : country
      ? "Other"
      : null;

  return (
    <div className="space-y-6">
      {successMessage ? <SuccessBanner>{successMessage}</SuccessBanner> : null}
      <p className="text-sm leading-6 text-[#5a5470]">
        Provide someone we can contact in an emergency while you&apos;re on a
        Mundoria booking. This stays private and is only used when necessary.
      </p>

      <label className="block space-y-2 text-sm font-medium">
        <span>Full name</span>
        <Input
          className={cn(FIELD, error ? invalidControlClass : undefined)}
          onChange={(event) => onName(event.target.value)}
          placeholder="Enter their full name"
          value={name}
        />
      </label>

      <SectionHeading>Relationship to you</SectionHeading>
      <BranchChoice
        columns={2}
        onChange={(next) => {
          if (next === "other") {
            onRelationship("other");
            return;
          }
          onRelationship(next);
        }}
        options={[
          { label: "Spouse / Partner", value: "partner" },
          { label: "Parent", value: "parent" },
          { label: "Sibling", value: "sibling" },
          { label: "Relative", value: "relative" },
          { label: "Friend", value: "friend" },
          { label: "Other", value: "other" },
        ]}
        value={
          ["partner", "parent", "sibling", "relative", "friend", "other"].includes(
            relationship,
          )
            ? relationship
            : relationship
              ? "other"
              : null
        }
      />
      {relationship === "other" ||
      (Boolean(relationship) &&
        !["partner", "parent", "sibling", "relative", "friend", "other"].includes(
          relationship,
        )) ? (
        <label className="block space-y-2 text-sm font-medium">
          <span>Please specify relationship</span>
          <Input
            className={cn(FIELD, error ? invalidControlClass : undefined)}
            onChange={(event) => {
              const next = event.target.value;
              onRelationship("other");
              onRelationshipOther(next);
            }}
            placeholder="e.g. Colleague, neighbour"
            value={
              relationship === "other"
                ? relationshipOther
                : relationshipOther || relationship
            }
          />
        </label>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <label className="block min-w-0 space-y-2 text-sm font-medium">
          <span>Mobile number</span>
          <Input
            className={cn(FIELD, error ? invalidControlClass : undefined)}
            onChange={(event) => onMobile(event.target.value)}
            placeholder="+44 7XXX XXXXXX"
            value={mobile}
          />
        </label>
        <label className="block min-w-0 space-y-2 text-sm font-medium">
          <span>Alternative phone (optional)</span>
          <Input
            className={FIELD}
            onChange={(event) => onAltPhone(event.target.value)}
            placeholder="Another contact number"
            value={altPhone}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <label className="block min-w-0 space-y-2 text-sm font-medium">
          <span>Email (optional)</span>
          <Input
            className={FIELD}
            onChange={(event) => onEmail(event.target.value)}
            placeholder="Email address"
            type="email"
            value={email}
          />
        </label>
        <label className="block min-w-0 space-y-2 text-sm font-medium">
          <span>Country of residence</span>
          <select
            className={cn(
              "flex h-10 w-full rounded-md px-3 text-sm outline-none focus-visible:ring-2",
              FIELD,
            )}
            onChange={(event) => onCountry(event.target.value)}
            value={countryBand ?? "United Kingdom"}
          >
            {EMERGENCY_COUNTRIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>
      {countryBand === "Other" ? (
        <Input
          className={FIELD}
          onChange={(event) => onCountry(event.target.value || "Other")}
          placeholder="Enter country"
          value={country === "Other" ? "" : country}
        />
      ) : null}

      <SectionHeading>
        Is this person aware you&apos;ve listed them?
      </SectionHeading>
      <BranchChoice
        onChange={onInformed}
        options={[
          { label: "Yes", value: "yes" },
          { label: "No, but I'll let them know", value: "later" },
        ]}
        value={informed || null}
      />

      <SectionHeading>Staying safe while you work</SectionHeading>
      <ul className="list-disc space-y-1.5 pl-5 text-sm leading-6 text-[#5a5470]">
        {SAFETY_GUIDELINES.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <InfoCallout>
        After you&apos;re approved, use Report an incident in your cleaner
        account for injuries, damage and unsafe conditions. Dial 999 in an
        emergency, or 101 for non-emergencies.
      </InfoCallout>
      <label className="flex cursor-pointer items-start gap-3 text-sm text-[#1c133b]">
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

export function PayoutFaqs() {
  return <FaqAccordion items={PAYOUT_FAQS} />;
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
      <p className="text-sm leading-6 text-[#5a5470]">
        You&apos;re almost there. Check your application summary, then accept
        the agreements before submitting.
      </p>

      <div className="rounded-2xl border-2 border-[#1c133b] bg-[#f9f6ef] p-4">
        <p className="font-semibold text-[#1c133b]">Application summary</p>
        <ul className="mt-3 divide-y divide-[#e8e0d0]">
          {summaryRows.map((row) => (
            <li
              className="flex items-center justify-between gap-3 py-2.5 text-sm"
              key={row.stepId}
            >
              <div className="min-w-0">
                <p className="font-medium text-[#1c133b]">{row.label}</p>
                <p className="text-[#5a5470]">{row.status}</p>
              </div>
              <button
                className="shrink-0 text-sm font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
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
            className="rounded-2xl border-2 border-[#1c133b] bg-[#f9f6ef] p-4"
            key={doc.key}
          >
            <p className="font-semibold text-[#1c133b]">{doc.label}</p>
            <p className="mt-1 text-sm leading-5 text-[#5a5470]">
              {doc.description}
            </p>
            <a
              className="mt-2 inline-block text-sm font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
              href={doc.href}
              rel="noopener noreferrer"
              target="_blank"
            >
              Read {doc.label}
            </a>
            <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm text-[#1c133b]">
              <OnboardingCheckbox
                checked={acceptedKeys.includes(doc.key)}
                onCheckedChange={(next) => onToggle(doc.key, next)}
              />
              <span>I have read and agree to the {doc.label}.</span>
            </label>
          </div>
        ))}
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-sm text-[#1c133b]">
        <OnboardingCheckbox
          checked={accuracyConfirmed}
          onCheckedChange={onAccuracyConfirmed}
        />
        <span>
          I confirm the information in this application is accurate and belongs
          to me.
        </span>
      </label>

      <label className="flex cursor-pointer items-start gap-3 text-sm text-[#1c133b]">
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
