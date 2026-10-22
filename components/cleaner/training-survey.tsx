"use client";

import { useState } from "react";

import { FieldError } from "@/components/shared/action-error";
import {
  CHARTER_AGREEMENTS,
  TRAINING_PAGES,
  answerIsComplete,
  questionsForPage,
  type SkillsExamAnswer,
  type SkillsExamQuestion,
} from "@/lib/cleaner/skills-exam";

export function TrainingSurvey({
  agreements,
  answers,
  error,
  onAgreements,
  onAnswers,
}: {
  agreements: boolean[];
  answers: Record<string, SkillsExamAnswer>;
  error?: string;
  onAgreements: (next: boolean[]) => void;
  onAnswers: (next: Record<string, SkillsExamAnswer>) => void;
}) {
  const [page, setPage] = useState(0);
  const [pageError, setPageError] = useState<string | null>(null);
  const current = TRAINING_PAGES[page];
  const progress = Math.round(((page + 1) / TRAINING_PAGES.length) * 100);

  function goNext() {
    if (current.id === "situations" || current.id === "skills") {
      const missing = questionsForPage(current.id).some(
        (question) => !answerIsComplete(question, answers[question.id]),
      );
      if (missing) {
        setPageError("Answer every question on this page before you continue.");
        return;
      }
    }
    setPageError(null);
    setPage((value) => Math.min(value + 1, TRAINING_PAGES.length - 1));
  }

  return (
    <div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#f3eef8]">
        <div className="h-full rounded-full bg-[#312c79]" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-3 text-sm font-medium text-[#8b84a8]">
        {page + 1} of {TRAINING_PAGES.length}
      </p>
      <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#1c133b]">
        {current.title}
      </h3>

      {current.id === "intro" ? <Intro /> : null}
      {current.id === "situations" || current.id === "skills" ? (
        <div className="mt-5 space-y-5">
          {current.id === "situations" ? (
            <p className="text-sm leading-6 text-[#6b6588]">
              These questions check how you would handle a real visit.
            </p>
          ) : (
            <p className="text-sm leading-6 text-[#6b6588]">
              These questions check everyday cleaning choices. Where it says to
              select both, tick the two that are right.
            </p>
          )}
          {questionsForPage(current.id).map((question, index) => (
            <QuestionField
              answer={answers[question.id]}
              index={(current.id === "skills" ? 6 : 0) + index}
              key={question.id}
              onChange={(next) =>
                onAnswers({
                  ...answers,
                  [question.id]: next,
                })
              }
              question={question}
            />
          ))}
        </div>
      ) : null}
      {current.id === "charter" ? (
        <Charter
          agreements={agreements}
          onChange={onAgreements}
        />
      ) : null}

      {pageError ? (
        <div className="mt-4">
          <FieldError message={pageError} />
        </div>
      ) : null}
      {error ? (
        <div className="mt-4">
          <FieldError message={error} />
        </div>
      ) : null}

      <div className="mt-6 flex items-center gap-4">
        <button
          className="text-sm font-medium text-[#8b8798] transition hover:text-[#1c133b] disabled:opacity-40"
          disabled={page === 0}
          onClick={() => {
            setPageError(null);
            setPage((value) => Math.max(value - 1, 0));
          }}
          type="button"
        >
          Previous
        </button>
        {page < TRAINING_PAGES.length - 1 ? (
          <button
            className="ml-auto text-sm font-semibold text-[#312c79] transition hover:text-[#1c133b]"
            onClick={goNext}
            type="button"
          >
            Next →
          </button>
        ) : (
          <p className="ml-auto text-sm text-[#8b8798]">
            Tick every agreement, then submit your application below.
          </p>
        )}
      </div>
    </div>
  );
}

function Intro() {
  return (
    <div className="mt-5 space-y-4 text-sm leading-6 text-[#3d3654]">
      <p>
        You work with Mundoria as a self-employed cleaner. Mundoria finds
        customers, takes payment, and handles support. You choose which offers
        to accept. This is a partnership, not a job with Mundoria.
      </p>
      <p>Read these before the questions:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>Offers arrive in the Mundoria Pro app. Accept or decline before the respond-by time.</li>
        <li>You do the visit yourself. Do not send someone else.</li>
        <li>
          Bring suitable products and tools unless the booking says the customer
          will provide them.
        </li>
        <li>
          Agree priorities before you start. If you will run out of time, say so
          before adding hours.
        </li>
        <li>Do not use bleach, or treat delicate surfaces, unless the customer has agreed.</li>
        <li>Keep payment and future bookings on Mundoria.</li>
        <li>If something is damaged, tell Mundoria in the app as soon as you can.</li>
        <li>A clear DBS check is required before you work in someone’s home.</li>
      </ul>
    </div>
  );
}

function QuestionField({
  answer,
  index,
  onChange,
  question,
}: {
  answer: SkillsExamAnswer | undefined;
  index: number;
  onChange: (next: SkillsExamAnswer) => void;
  question: SkillsExamQuestion;
}) {
  const multi = Boolean(question.correctIndexes);
  const selected = Array.isArray(answer) ? answer : [];

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-[#1c133b]">
        {index + 1}. {question.prompt}
      </legend>
      {question.selectLabel ? (
        <p className="text-xs text-[#8b84a8]">{question.selectLabel}</p>
      ) : null}
      {question.options.map((option, optionIndex) => {
        const checked = multi
          ? selected.includes(optionIndex)
          : answer === optionIndex;
        return (
          <label className="flex items-start gap-2 text-sm text-[#3d3654]" key={option}>
            <input
              checked={checked}
              className="mt-1"
              name={multi ? undefined : question.id}
              onChange={() => {
                if (!multi) {
                  onChange(optionIndex);
                  return;
                }
                const next = selected.includes(optionIndex)
                  ? selected.filter((value) => value !== optionIndex)
                  : [...selected, optionIndex];
                onChange(next);
              }}
              type={multi ? "checkbox" : "radio"}
              value={optionIndex}
            />
            <span>{option}</span>
          </label>
        );
      })}
    </fieldset>
  );
}

function Charter({
  agreements,
  onChange,
}: {
  agreements: boolean[];
  onChange: (next: boolean[]) => void;
}) {
  return (
    <div className="mt-5 space-y-4 text-sm leading-6 text-[#3d3654]">
      <p className="font-medium text-[#1c133b]">Please read this carefully before you continue.</p>
      <p>
        Mundoria supports your work. Mundoria is not your employer. Mundoria
        finds customers, collects payment, and handles customer support. Job
        offers come through the Mundoria Pro app for the services, times, and
        areas you set. Accepting an offer is your choice. Customers can book
        you again after a visit. Payouts go to your bank, weekly or monthly,
        through Mundoria.
      </p>
      <div className="space-y-3">
        {CHARTER_AGREEMENTS.map((label, index) => (
          <label className="flex items-start gap-2" key={label}>
            <input
              checked={Boolean(agreements[index])}
              className="mt-1"
              onChange={(event) => {
                const next = CHARTER_AGREEMENTS.map(
                  (_, item) => agreements[item] ?? false,
                );
                next[index] = event.target.checked;
                onChange(next);
              }}
              type="checkbox"
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
