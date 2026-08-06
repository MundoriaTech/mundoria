"use client";

import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  CreditCard,
  MapPin,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { BookingAuthPrompt, type BookingAuthMode } from "@/components/customer/booking-auth-prompt";
import {
  AddressForm,
} from "@/components/customer/address-manager";
import { RecurringToggle } from "@/components/shared/recurring-toggle";
import { TimeSlotPicker } from "@/components/shared/time-slot-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  availableAddOns,
  allowedStandards,
  categoryDefinition,
  CLEANING_STANDARDS,
  estimatePrice,
  formatMoney,
  formatServiceName,
  getSmartRecommendation,
  normalizeStandard,
  recommendedStandardFor,
  schedulePriceLabel,
  selectedAddOnTotal,
  SERVICES,
  SERVICE_ADD_ONS,
  SERVICE_CATEGORIES,
  servicesForCategory,
  standardLabel,
} from "@/lib/customer/services";
import { cn } from "@/lib/utils";
import type {
  Address,
  BookingDraft,
  CleaningStandard,
  PropertyCondition,
  ServiceCategory,
  ServiceType,
} from "@/types/customer";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const blankDraft: BookingDraft = {
  addressId: null,
  cleaningStandard: null,
  isRecurring: false,
  preferSameCleaner: false,
  propertyCondition: null,
  promoCode: "",
  recurrencePattern: null,
  recommendationOutcome: "not_shown",
  recommendedCleaningStandard: null,
  recommendedServiceType: null,
  recentlyMoved: null,
  scheduledDate: "",
  scheduledTime: "",
  selectedAddOns: [],
  serviceCategory: null,
  serviceType: null,
  specialAttentionAreas: [],
  specialInstructions: "",
};

const steps = [
  "Category",
  "Service",
  "Standard",
  "Questions",
  "Recommendation",
  "Add-ons",
  "Address",
  "Schedule",
  "Review",
  "Payment",
];

function initialWizardStep(draft?: Partial<BookingDraft>) {
  if (draft?.serviceType) return 3;
  if (draft?.serviceCategory) return 2;
  return 1;
}

const BOOKING_DRAFT_KEY = "cleanscape-booking-draft";
const BOOKING_STEP_KEY = "cleanscape-booking-step";

export function BookingWizard({
  initialAddresses,
  initialDraft,
  userId,
}: {
  initialAddresses: Address[];
  initialDraft?: Partial<BookingDraft>;
  userId: string | null;
}) {
  const router = useRouter();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [draft, setDraft] = useState<BookingDraft>({
    ...blankDraft,
    ...initialDraft,
  });
  const [step, setStep] = useState(() => initialWizardStep(initialDraft));
  const [hydrated, setHydrated] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(
    () => initialAddresses.length === 0 && Boolean(userId),
  );
  const [authMode, setAuthMode] = useState<BookingAuthMode>("ask");
  const [promoFeedback, setPromoFeedback] = useState<string | null>(null);
  const [promoAmount, setPromoAmount] = useState<number | null>(null);
  const needsAuth = !userId;
  const selectedAddress = addresses.find(
    (address) => address.id === draft.addressId,
  );
  const selectedStandard = draft.serviceType
    ? normalizeStandard(draft.serviceType, draft.cleaningStandard)
    : null;
  const estimatedAmount =
    draft.serviceType && selectedAddress && selectedStandard
      ? estimatePrice(
          draft.serviceType,
          selectedAddress,
          selectedStandard,
          draft.selectedAddOns,
          {
            date: draft.scheduledDate,
            time: draft.scheduledTime,
          },
        )
      : 0;
  const recommendation = getSmartRecommendation({
    propertyCondition: draft.propertyCondition,
    recentlyMoved: draft.recentlyMoved,
    selectedStandard,
    serviceType: draft.serviceType,
  });

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(BOOKING_DRAFT_KEY);
      const storedStep = Number(
        window.localStorage.getItem(BOOKING_STEP_KEY) ?? "",
      );
      if (stored) {
        const parsed = JSON.parse(stored) as BookingDraft;
        // Prefer the in-progress draft so login/signup can resume selections.
        // URL/rebook seeds only fill gaps when storage is empty of a service.
        setDraft({
          ...blankDraft,
          ...parsed,
          ...(initialDraft && !parsed.serviceType ? initialDraft : {}),
        });
      }
      if (Number.isFinite(storedStep) && storedStep >= 1 && storedStep <= 10) {
        setStep(storedStep);
      }
    } catch {
      window.localStorage.removeItem(BOOKING_DRAFT_KEY);
      window.localStorage.removeItem(BOOKING_STEP_KEY);
    }
    setHydrated(true);
    // Hydrate once on mount so auth refresh keeps the same draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(draft));
  }, [draft, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(BOOKING_STEP_KEY, String(step));
  }, [hydrated, step]);

  useEffect(() => {
    setAddresses(initialAddresses);
    if (userId && initialAddresses.length === 0) {
      setShowAddressForm(true);
    }
  }, [initialAddresses, userId]);

  useEffect(() => {
    if (step !== 7) {
      setAuthMode("ask");
    }
  }, [step]);

  function goBack() {
    if (step === 1) {
      const fallback = userId ? "/dashboard" : "/";
      const sameOriginReferrer =
        typeof document !== "undefined" &&
        Boolean(document.referrer) &&
        document.referrer.startsWith(window.location.origin);
      if (sameOriginReferrer) {
        router.back();
      } else {
        router.push(fallback);
      }
      return;
    }
    if (step === 7 && showAddressForm && addresses.length > 0) {
      setShowAddressForm(false);
      return;
    }
    if (step === 7 && needsAuth && authMode !== "ask") {
      setAuthMode("ask");
      return;
    }
    setStep((current) => Math.max(1, current - 1));
  }

  function update<K extends keyof BookingDraft>(
    key: K,
    value: BookingDraft[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
    if (
      key === "promoCode" ||
      key === "scheduledDate" ||
      key === "scheduledTime" ||
      key === "selectedAddOns" ||
      key === "cleaningStandard" ||
      key === "serviceType"
    ) {
      setPromoAmount(null);
      if (key === "promoCode") setPromoFeedback(null);
    }
  }

  useEffect(() => {
    if (step !== 5 || !recommendation?.autoApplied) return;
    if (draft.recommendationOutcome !== "not_shown") return;
    const service = SERVICES.find(
      (item) => item.value === recommendation.recommendedServiceType,
    );
    setDraft((current) => ({
      ...current,
      cleaningStandard: recommendation.recommendedStandard,
      recommendationOutcome: "auto_applied",
      recommendedCleaningStandard: recommendation.recommendedStandard,
      recommendedServiceType: recommendation.recommendedServiceType,
      selectedAddOns:
        current.serviceType === recommendation.recommendedServiceType
          ? current.selectedAddOns
          : [],
      serviceCategory: service?.category ?? current.serviceCategory,
      serviceType: recommendation.recommendedServiceType,
    }));
  }, [
    draft.recommendationOutcome,
    recommendation?.autoApplied,
    recommendation?.recommendedServiceType,
    recommendation?.recommendedStandard,
    step,
  ]);

  function canContinue() {
    if (step === 1) return Boolean(draft.serviceCategory);
    if (step === 2) return Boolean(draft.serviceType);
    if (step === 3) return Boolean(draft.cleaningStandard);
    if (step === 4) {
      return Boolean(
        draft.propertyCondition && draft.recentlyMoved !== null,
      );
    }
    if (step === 7) {
      if (needsAuth) return false;
      return Boolean(draft.addressId);
    }
    if (step === 8) {
      return Boolean(
        draft.scheduledDate &&
          draft.scheduledTime &&
          (!draft.isRecurring || draft.recurrencePattern),
      );
    }
    return true;
  }

  function selectCategory(category: ServiceCategory) {
    setDraft((current) => ({
      ...current,
      cleaningStandard: null,
      recommendationOutcome: "not_shown",
      recommendedCleaningStandard: null,
      recommendedServiceType: null,
      selectedAddOns: [],
      serviceCategory: category,
      serviceType: null,
    }));
  }

  function selectService(serviceType: ServiceType) {
    const standard = recommendedStandardFor(serviceType);
    setDraft((current) => ({
      ...current,
      cleaningStandard: normalizeStandard(serviceType, standard),
      recommendationOutcome: "not_shown",
      recommendedCleaningStandard: null,
      recommendedServiceType: null,
      selectedAddOns: [],
      serviceCategory: SERVICES.find((service) => service.value === serviceType)?.category ?? current.serviceCategory,
      serviceType,
    }));
  }

  function applyRecommendation() {
    if (!recommendation) return;
    const service = SERVICES.find(
      (item) => item.value === recommendation.recommendedServiceType,
    );
    setDraft((current) => ({
      ...current,
      cleaningStandard: recommendation.recommendedStandard,
      recommendationOutcome: recommendation.autoApplied ? "auto_applied" : "accepted",
      recommendedCleaningStandard: recommendation.recommendedStandard,
      recommendedServiceType: recommendation.recommendedServiceType,
      selectedAddOns:
        current.serviceType === recommendation.recommendedServiceType
          ? current.selectedAddOns
          : [],
      serviceCategory: service?.category ?? current.serviceCategory,
      serviceType: recommendation.recommendedServiceType,
    }));
  }

  function continueFromRecommendation() {
    if (recommendation?.autoApplied) {
      applyRecommendation();
    } else if (recommendation?.shouldShow) {
      setDraft((current) => ({
        ...current,
        recommendationOutcome:
          current.recommendationOutcome === "not_shown"
            ? "overridden"
            : current.recommendationOutcome,
        recommendedCleaningStandard:
          current.recommendedCleaningStandard ??
          recommendation.recommendedStandard,
        recommendedServiceType:
          current.recommendedServiceType ?? recommendation.recommendedServiceType,
      }));
    } else {
      setDraft((current) => ({
        ...current,
        recommendationOutcome: "not_shown",
        recommendedCleaningStandard: null,
        recommendedServiceType: null,
      }));
    }
    setStep(6);
  }

  async function validatePromo() {
    if (!draft.promoCode || !draft.addressId || !draft.serviceType || !selectedStandard) return;
    setPromoFeedback("Checking…");
    const response = await fetch("/api/promos/validate", {
      body: JSON.stringify({
        addressId: draft.addressId,
        cleaningStandard: selectedStandard,
        code: draft.promoCode,
        scheduledDate: draft.scheduledDate,
        scheduledTime: draft.scheduledTime,
        selectedAddOns: draft.selectedAddOns,
        serviceType: draft.serviceType,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as {
      amount?: number;
      error?: string;
      message?: string;
    };
    setPromoFeedback(result.error ?? result.message ?? null);
    setPromoAmount(response.ok ? result.amount ?? null : null);
  }

  return (
    <div className="mx-auto max-w-4xl pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:pb-0">
      <div className="mb-5 sm:mb-8">
        <p className="text-sm font-medium text-primary">New booking</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Book your cleaner
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Step {step} of {steps.length}
          <span className="mx-1.5 text-muted-foreground/50">·</span>
          {steps[step - 1]}
        </p>
        <div className="mt-3 grid grid-cols-10 gap-1 sm:mt-4 sm:gap-1.5" aria-hidden="true">
          {steps.map((label, index) => (
            <div
              className={cn(
                "h-1.5 rounded-full",
                index + 1 <= step ? "bg-primary" : "bg-muted",
              )}
              key={label}
            />
          ))}
        </div>
      </div>

      <section className="rounded-2xl border bg-background p-4 shadow-sm sm:p-8">
        {step === 1 ? (
          <CategoryStep
            selected={draft.serviceCategory}
            select={selectCategory}
          />
        ) : null}
        {step === 2 ? (
          <ServiceStep
            category={draft.serviceCategory}
            selected={draft.serviceType}
            select={selectService}
          />
        ) : null}
        {step === 3 && draft.serviceType ? (
          <StandardStep
            selected={selectedStandard}
            select={(value) => update("cleaningStandard", value)}
            serviceType={draft.serviceType}
          />
        ) : null}
        {step === 4 ? (
          <QuestionsStep draft={draft} update={update} />
        ) : null}
        {step === 5 ? (
          <RecommendationStep
            applyRecommendation={applyRecommendation}
            draft={draft}
            recommendation={recommendation}
            update={update}
          />
        ) : null}
        {step === 6 ? (
          <AddOnsStep draft={draft} update={update} />
        ) : null}
        {step === 7 ? (
          needsAuth || !userId ? (
            <BookingAuthPrompt mode={authMode} onModeChange={setAuthMode} />
          ) : (
            <AddressStep
              addresses={addresses}
              selectedId={draft.addressId}
              select={(id) => update("addressId", id)}
              setShowForm={setShowAddressForm}
              showForm={showAddressForm}
              userId={userId}
              onSaved={(address) => {
                setAddresses((current) => [address, ...current]);
                update("addressId", address.id);
                setShowAddressForm(false);
              }}
            />
          )
        ) : null}
        {step === 8 ? (
          <ScheduleStep
            address={selectedAddress}
            draft={draft}
            standard={selectedStandard}
            update={update}
          />
        ) : null}
        {step === 9 && draft.serviceType && selectedAddress && selectedStandard ? (
          <ReviewStep
            address={selectedAddress}
            amount={promoAmount ?? estimatedAmount}
            draft={{
              ...draft,
              cleaningStandard: selectedStandard,
              serviceType: draft.serviceType,
            }}
            promoFeedback={promoFeedback}
            update={update}
            validatePromo={() => void validatePromo()}
          />
        ) : null}
        {step === 10 && draft.serviceType && selectedAddress && selectedStandard ? (
          stripePromise ? (
            <Elements stripe={stripePromise}>
              <PaymentStep
                address={selectedAddress}
                amount={promoAmount ?? estimatedAmount}
                draft={{
                  ...draft,
                  cleaningStandard: selectedStandard,
                  serviceType: draft.serviceType,
                }}
              />
            </Elements>
          ) : (
            <p className="rounded-md border border-border bg-muted p-4 text-sm text-foreground">
              Add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to enable secure payment.
            </p>
          )
        ) : null}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur supports-[backdrop-filter]:bg-background/90 sm:static sm:mt-0 sm:border-0 sm:bg-transparent sm:p-0 sm:pt-0 sm:backdrop-blur-none">
        <div className="mx-auto flex max-w-4xl gap-2 sm:mt-6 sm:justify-between sm:gap-3 sm:border-t sm:pt-5">
          <Button
            className="min-h-11 flex-1 touch-manipulation sm:flex-none"
            onClick={goBack}
            type="button"
            variant="ghost"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {step < 10 && !(needsAuth && step === 7) ? (
            <Button
              className="min-h-11 flex-[1.6] touch-manipulation sm:flex-none"
              disabled={!canContinue()}
              onClick={() =>
                step === 5
                  ? continueFromRecommendation()
                  : setStep((current) => current + 1)
              }
              type="button"
            >
              <span className="sm:hidden">
                {step === 9 ? "Payment" : "Continue"}
              </span>
              <span className="hidden sm:inline">
                {step === 9 ? "Continue to payment" : "Continue"}
              </span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CategoryStep({
  select,
  selected,
}: {
  select: (category: ServiceCategory) => void;
  selected: ServiceCategory | null;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold sm:text-xl">What type of cleaning do you need?</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Start broad — CleanScape will guide you to the right service and standard.
      </p>
      <div className="mt-5 grid gap-3 sm:mt-6 sm:grid-cols-2">
        {SERVICE_CATEGORIES.map((category) => {
          const Icon = category.icon;
          const active = selected === category.value;
          return (
            <button
              className={cn(
                "rounded-xl border p-3.5 text-left transition hover:border-primary touch-manipulation sm:p-4",
                active && "border-primary bg-primary/5 ring-1 ring-primary",
              )}
              key={category.value}
              onClick={() => select(category.value)}
              type="button"
            >
              <div className="flex items-start gap-3">
                <span className="shrink-0 rounded-lg bg-emerald-100 p-2 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{category.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </div>
                {active ? (
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ServiceStep({
  category,
  select,
  selected,
}: {
  category: ServiceCategory | null;
  select: (service: ServiceType) => void;
  selected: ServiceType | null;
}) {
  const services = category ? servicesForCategory(category) : SERVICES;

  return (
    <div>
      <h2 className="text-lg font-semibold sm:text-xl">
        Choose your {category ? categoryDefinition(category).label.toLowerCase() : "cleaning"} service
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick the service that best matches what you need.
      </p>
      <div className="mt-5 grid gap-3 sm:mt-6 sm:grid-cols-2">
        {services.map((service) => {
          const Icon = service.icon;
          const active = selected === service.value;
          return (
            <button
              className={cn(
                "rounded-xl border p-3.5 text-left transition hover:border-primary touch-manipulation sm:p-4",
                active && "border-primary bg-primary/5 ring-1 ring-primary",
              )}
              key={service.value}
              onClick={() => select(service.value)}
              type="button"
            >
              <div className="flex items-start gap-3">
                <span className="shrink-0 rounded-lg bg-emerald-100 p-2 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{service.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {service.description}
                  </p>
                </div>
                {active ? (
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StandardStep({
  select,
  selected,
  serviceType,
}: {
  select: (standard: CleaningStandard) => void;
  selected: CleaningStandard | null;
  serviceType: ServiceType;
}) {
  const service = SERVICES.find((item) => item.value === serviceType)!;
  const standards = allowedStandards(serviceType);

  return (
    <div>
      <h2 className="text-lg font-semibold sm:text-xl">Choose your cleaning standard</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {service.fixedStandard
          ? `${service.label} uses a fixed ${standardLabel(service.fixedStandard)} Standard.`
          : "Pick the level of detail you want. We’ll advise you if a different standard seems better."}
      </p>
      <div className="mt-5 grid gap-3 sm:mt-6 sm:grid-cols-3">
        {CLEANING_STANDARDS.map((standard) => {
          const disabled = !standards.some((item) => item.value === standard.value);
          const active = selected === standard.value;

          return (
            <button
              className={cn(
                "rounded-xl border p-3.5 text-left transition touch-manipulation sm:p-4",
                active && "border-primary bg-primary/5 ring-1 ring-primary",
                disabled
                  ? "cursor-not-allowed opacity-40"
                  : "hover:border-primary",
              )}
              disabled={disabled}
              key={standard.value}
              onClick={() => select(standard.value)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{standard.label}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {standard.description}
                  </p>
                  {service.recommendedStandard === standard.value ? (
                    <p className="mt-3 text-xs font-semibold text-primary">
                      Recommended standard
                    </p>
                  ) : null}
                </div>
                {active ? <Check className="h-5 w-5 shrink-0 text-primary" /> : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const propertyConditionOptions: Array<{
  label: string;
  value: PropertyCondition;
}> = [
  { label: "It is cleaned regularly.", value: "maintained" },
  { label: "It needs a little extra attention.", value: "extra_attention" },
  {
    label: "It hasn't been cleaned for quite some time.",
    value: "neglected",
  },
];

const attentionAreas = [
  "Kitchen",
  "Bathroom",
  "Windows",
  "Bedrooms",
  "Living Areas",
  "Other",
];

function QuestionsStep({
  draft,
  update,
}: {
  draft: BookingDraft;
  update: <K extends keyof BookingDraft>(
    key: K,
    value: BookingDraft[K],
  ) => void;
}) {
  function toggleArea(area: string) {
    const selected = new Set(draft.specialAttentionAreas);
    if (selected.has(area)) selected.delete(area);
    else selected.add(area);
    update("specialAttentionAreas", Array.from(selected));
  }

  return (
    <div>
      <h2 className="text-lg font-semibold sm:text-xl">A few quick property questions</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        These help us give professional guidance before you confirm.
      </p>

      <div className="mt-5 space-y-6 sm:mt-6">
        <div>
          <p className="font-medium">How would you describe the current condition?</p>
          <div className="mt-3 grid gap-3">
            {propertyConditionOptions.map((option) => (
              <button
                className={cn(
                  "min-h-11 rounded-xl border p-3.5 text-left text-sm transition hover:border-primary touch-manipulation sm:p-4",
                  draft.propertyCondition === option.value &&
                    "border-primary bg-primary/5 ring-1 ring-primary",
                )}
                key={option.value}
                onClick={() => update("propertyCondition", option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="font-medium">Have you recently moved into or out of the property?</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {[true, false].map((value) => (
              <Button
                className="min-h-11 touch-manipulation"
                key={String(value)}
                onClick={() => update("recentlyMoved", value)}
                type="button"
                variant={draft.recentlyMoved === value ? "default" : "outline"}
              >
                {value ? "Yes" : "No"}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <p className="font-medium">Any areas requiring special attention?</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {attentionAreas.map((area) => {
              const selected = draft.specialAttentionAreas.includes(area);
              return (
                <button
                  className={cn(
                    "min-h-11 rounded-xl border p-3 text-left text-sm transition hover:border-primary touch-manipulation",
                    selected && "border-primary bg-primary/5 ring-1 ring-primary",
                  )}
                  key={area}
                  onClick={() => toggleArea(area)}
                  type="button"
                >
                  {selected ? "✓ " : ""}
                  {area}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function RecommendationStep({
  applyRecommendation,
  draft,
  recommendation,
  update,
}: {
  applyRecommendation: () => void;
  draft: BookingDraft;
  recommendation: ReturnType<typeof getSmartRecommendation>;
  update: <K extends keyof BookingDraft>(
    key: K,
    value: BookingDraft[K],
  ) => void;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold sm:text-xl">CleanScape recommendation</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Based on your service, standard and property answers.
      </p>

      {recommendation?.shouldShow ? (
        <div className="mt-5 rounded-2xl border border-border bg-muted p-4 text-foreground sm:p-5">
          <p className="text-sm font-semibold">Our recommendation</p>
          <p className="mt-2 text-sm leading-6">{recommendation.message}</p>
          {recommendation.autoApplied ? (
            <p className="mt-4 rounded-lg bg-card p-3 text-sm font-semibold">
              The cleaning standard has automatically been updated for this
              service.
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              <Button
                className="min-h-11 w-full touch-manipulation whitespace-normal"
                onClick={applyRecommendation}
                type="button"
              >
                Switch to{" "}
                {formatServiceName(recommendation.recommendedServiceType)}
              </Button>
              <Button
                className="min-h-11 w-full touch-manipulation whitespace-normal"
                onClick={() => {
                  update("recommendationOutcome", "overridden");
                  update(
                    "recommendedServiceType",
                    recommendation.recommendedServiceType,
                  );
                  update(
                    "recommendedCleaningStandard",
                    recommendation.recommendedStandard,
                  );
                }}
                type="button"
                variant="outline"
              >
                Continue with{" "}
                {formatServiceName(draft.serviceType ?? "regular")}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border bg-emerald-50 p-4 text-emerald-950 sm:p-5">
          <p className="text-sm font-semibold">Your selection looks suitable</p>
          <p className="mt-2 text-sm leading-6">
            Based on your answers, this service and standard look appropriate.
            Continue to optional add-ons.
          </p>
        </div>
      )}
    </div>
  );
}

function AddOnsStep({
  draft,
  update,
}: {
  draft: BookingDraft;
  update: <K extends keyof BookingDraft>(
    key: K,
    value: BookingDraft[K],
  ) => void;
}) {
  const addOns = draft.serviceType ? availableAddOns(draft.serviceType) : [];

  function toggleAddOn(id: string) {
    const selected = new Set(draft.selectedAddOns);
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    update("selectedAddOns", Array.from(selected));
  }

  return (
    <div>
      <h2 className="text-lg font-semibold sm:text-xl">Optional add-ons</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Extras for your booking. You can skip this step.
      </p>

      <div className="mt-5 flex items-end justify-between gap-3 sm:mt-6 sm:gap-4">
        <p className="min-w-0 text-sm text-muted-foreground">
          {addOns.length
            ? "Select any extras you would like included."
            : "No add-ons are available for this service."}
        </p>
        <p className="shrink-0 text-sm font-semibold">
          {formatMoney(selectedAddOnTotal(draft.selectedAddOns))}
        </p>
      </div>

      {addOns.length ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {addOns.map((addOn) => {
            const selected = draft.selectedAddOns.includes(addOn.id);

            return (
              <button
                className={cn(
                  "rounded-xl border p-3.5 text-left transition hover:border-primary touch-manipulation sm:p-4",
                  selected && "border-primary bg-primary/5 ring-1 ring-primary",
                )}
                key={addOn.id}
                onClick={() => toggleAddOn(addOn.id)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{addOn.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {addOn.description}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold">
                    {formatMoney(addOn.amount)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function AddressStep({
  addresses,
  onSaved,
  select,
  selectedId,
  setShowForm,
  showForm,
  userId,
}: {
  addresses: Address[];
  onSaved: (address: Address) => void;
  select: (id: string) => void;
  selectedId: string | null;
  setShowForm: (value: boolean) => void;
  showForm: boolean;
  userId: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold sm:text-xl">Where should we clean?</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {addresses.map((address) => (
          <button
            className={cn(
              "rounded-xl border p-3.5 text-left touch-manipulation sm:p-4",
              selectedId === address.id &&
                "border-primary bg-primary/5 ring-1 ring-primary",
            )}
            key={address.id}
            onClick={() => select(address.id)}
            type="button"
          >
            <div className="flex gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="font-semibold">{address.label ?? "Address"}</p>
                <p className="mt-1 break-words text-sm text-muted-foreground">
                  {address.address_line_1}, {address.city}, {address.postcode}
                </p>
                <p className="mt-2 text-xs capitalize text-muted-foreground">
                  {address.property_type} · {address.num_bedrooms ?? 0} bed ·{" "}
                  {address.num_bathrooms ?? 0} bath
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
      <Button
        className="mt-4 min-h-11 w-full touch-manipulation sm:w-auto"
        onClick={() => setShowForm(!showForm)}
        type="button"
        variant="outline"
      >
        {showForm ? (
          "Cancel new address"
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Add another address
          </>
        )}
      </Button>
      {showForm ? (
        <div className="mt-5 overflow-x-auto rounded-xl bg-muted/40 p-3 sm:p-4">
          <AddressForm compact onSaved={onSaved} userId={userId} />
        </div>
      ) : null}
    </div>
  );
}

function ScheduleStep({
  address,
  draft,
  standard,
  update,
}: {
  address?: Address;
  draft: BookingDraft;
  standard: CleaningStandard | null;
  update: <K extends keyof BookingDraft>(
    key: K,
    value: BookingDraft[K],
  ) => void;
}) {
  const minDate = new Date().toISOString().slice(0, 10);
  const arrivalNote = schedulePriceLabel(
    draft.scheduledDate,
    draft.scheduledTime,
  );

  return (
    <div>
      <h2 className="text-lg font-semibold sm:text-xl">Pick a date and time</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Price depends on when the cleaner arrives — evenings and weekends are a
        little higher than weekday daytime.
      </p>
      <div className="mt-5 grid gap-6 sm:mt-6 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium">
          <span className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Date
          </span>
          <Input
            className="min-h-11"
            min={minDate}
            onChange={(event) => update("scheduledDate", event.target.value)}
            type="date"
            value={draft.scheduledDate}
          />
        </label>
        <div>
          <p className="flex items-center gap-2 text-sm font-medium">
            <Clock3 className="h-4 w-4" />
            Start time
          </p>
          <TimeSlotPicker
            className="mt-2 max-h-56 overflow-y-auto overscroll-contain pr-1"
            date={draft.scheduledDate}
            formatSlotPrice={
              draft.serviceType && address && standard
                ? (slot) =>
                    formatMoney(
                      estimatePrice(
                        draft.serviceType!,
                        address,
                        standard,
                        draft.selectedAddOns,
                        { date: draft.scheduledDate, time: slot },
                      ),
                    )
                : undefined
            }
            onChange={(slot) => update("scheduledTime", slot)}
            value={draft.scheduledTime}
          />
        </div>
      </div>

      {arrivalNote && draft.scheduledTime ? (
        <p className="mt-4 rounded-lg border border-border bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
          {arrivalNote} rate applied for {draft.scheduledTime}.
        </p>
      ) : null}

      <div className="mt-6">
        <RecurringToggle
          onChange={(value) => {
            update("isRecurring", value.enabled);
            update("recurrencePattern", value.frequency);
            update("preferSameCleaner", value.preferSameCleaner);
          }}
          value={{
            enabled: draft.isRecurring,
            frequency: draft.recurrencePattern,
            preferSameCleaner: draft.preferSameCleaner,
          }}
        />
      </div>
    </div>
  );
}

function ReviewStep({
  address,
  amount,
  draft,
  promoFeedback,
  update,
  validatePromo,
}: {
  address: Address;
  amount: number;
  draft: BookingDraft & {
    cleaningStandard: CleaningStandard;
    serviceType: ServiceType;
  };
  promoFeedback: string | null;
  update: <K extends keyof BookingDraft>(
    key: K,
    value: BookingDraft[K],
  ) => void;
  validatePromo: () => void;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold sm:text-xl">Review your booking</h2>
      <div className="mt-5 divide-y overflow-hidden rounded-xl border sm:mt-6">
        <SummaryRow label="Service" value={formatServiceName(draft.serviceType)} />
        <SummaryRow
          label="Standard"
          value={standardLabel(draft.cleaningStandard)}
        />
        <SummaryRow
          label="Recommendation"
          value={
            draft.recommendationOutcome === "accepted"
              ? "Switched to CleanScape recommendation"
              : draft.recommendationOutcome === "overridden"
                ? "Continued with original selection"
                : draft.recommendationOutcome === "auto_applied"
                  ? "Standard automatically applied"
                  : "Selection looked suitable"
          }
        />
        <SummaryRow
          label="Add-ons"
          value={
            draft.selectedAddOns.length
              ? draft.selectedAddOns
                  .map((id) => SERVICE_ADD_ONS.find((addOn) => addOn.id === id)?.label)
                  .filter(Boolean)
                  .join(", ")
              : "None"
          }
        />
        <SummaryRow
          label="Address"
          value={`${address.address_line_1}, ${address.city}, ${address.postcode}`}
        />
        <SummaryRow
          label="When"
          value={`${draft.scheduledDate} at ${draft.scheduledTime}`}
        />
        {schedulePriceLabel(draft.scheduledDate, draft.scheduledTime) ? (
          <SummaryRow
            label="Arrival rate"
            value={schedulePriceLabel(draft.scheduledDate, draft.scheduledTime)!}
          />
        ) : null}
        <SummaryRow
          label="Recurring"
          value={
            draft.isRecurring
              ? `${draft.recurrencePattern}${draft.preferSameCleaner ? ", same cleaner preferred" : ""}`
              : "No"
          }
        />
      </div>

      <label className="mt-5 block space-y-2 text-sm font-medium">
        <span>Special instructions</span>
        <textarea
          className="min-h-24 w-full rounded-md border bg-background p-3 text-sm"
          onChange={(event) => update("specialInstructions", event.target.value)}
          placeholder="Anything your cleaner should know?"
          value={draft.specialInstructions}
        />
      </label>

      <div className="mt-5">
        <p className="text-sm font-medium">Promo code</p>
        <div className="mt-2 flex flex-col gap-2 min-[400px]:flex-row">
          <Input
            className="min-h-11"
            onChange={(event) => update("promoCode", event.target.value)}
            placeholder="CLEAN10"
            value={draft.promoCode}
          />
          <Button
            className="min-h-11 shrink-0 touch-manipulation"
            disabled={!draft.promoCode}
            onClick={validatePromo}
            type="button"
            variant="outline"
          >
            Apply
          </Button>
        </div>
        {promoFeedback ? (
          <p className="mt-2 text-sm text-muted-foreground">{promoFeedback}</p>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col gap-2 rounded-xl bg-emerald-50 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
        <div className="min-w-0">
          <p className="text-sm text-emerald-800">Estimated total</p>
          <p className="mt-1 text-xs text-emerald-700">
            Final adjustments require your approval.
          </p>
        </div>
        <p className="text-2xl font-bold text-emerald-950">
          {formatMoney(amount)}
        </p>
      </div>
    </div>
  );
}

function PaymentStep({
  address,
  amount,
  draft,
}: {
  address: Address;
  amount: number;
  draft: BookingDraft & {
    cleaningStandard: CleaningStandard;
    serviceType: ServiceType;
  };
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  async function pay(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!stripe || !elements) return;
    const card = elements.getElement(CardElement);
    if (!card) return;

    setProcessing(true);
    try {
      const authorizationResponse = await fetch(
        "/api/bookings/payment-intent",
        {
          body: JSON.stringify(draft),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        },
      );
      const authorization = (await authorizationResponse.json()) as {
        clientSecret?: string;
        error?: string;
        paymentIntentId?: string;
      };
      if (!authorizationResponse.ok || !authorization.clientSecret) {
        throw new Error(authorization.error ?? "Unable to authorize payment.");
      }

      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(authorization.clientSecret, {
          payment_method: {
            card,
            billing_details: {
              address: {
                city: address.city,
                line1: address.address_line_1,
                line2: address.address_line_2 ?? undefined,
                postal_code: address.postcode,
              },
            },
          },
        });
      if (stripeError || !paymentIntent) {
        throw new Error(stripeError?.message ?? "Card authorization failed.");
      }

      const bookingResponse = await fetch("/api/bookings", {
        body: JSON.stringify({
          ...draft,
          paymentIntentId: paymentIntent.id,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const booking = (await bookingResponse.json()) as {
        bookingId?: string;
        error?: string;
      };
      if (!bookingResponse.ok || !booking.bookingId) {
        throw new Error(booking.error ?? "Unable to create booking.");
      }

      window.localStorage.removeItem(BOOKING_DRAFT_KEY);
      window.localStorage.removeItem(BOOKING_STEP_KEY);
      router.replace(`/booking/${booking.bookingId}`);
      router.refresh();
    } catch (paymentError) {
      setError(
        paymentError instanceof Error
          ? paymentError.message
          : "Unable to complete booking.",
      );
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={pay}>
      <div className="flex items-start gap-3">
        <span className="shrink-0 rounded-full bg-emerald-100 p-3 text-primary">
          <CreditCard className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold sm:text-xl">Secure your booking</h2>
          <p className="text-sm text-muted-foreground">
            Authorization amount: {formatMoney(amount)}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-lg border p-3 sm:mt-6 sm:p-4">
        <CardElement
          options={{
            hidePostalCode: true,
            style: {
              base: {
                color: "#17211d",
                fontFamily: "system-ui, sans-serif",
                fontSize: "16px",
              },
            },
          }}
        />
      </div>

      <div className="mt-5 flex gap-3 rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          Your card will only be charged after the job is completed. Today we
          place a secure authorization hold.
        </p>
      </div>

      {error ? (
        <p className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button
        className="mt-6 min-h-11 w-full touch-manipulation"
        disabled={!stripe || processing}
        size="lg"
        type="submit"
      >
        {processing ? "Securing your booking…" : "Confirm Booking"}
      </Button>
    </form>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 px-3 py-3 sm:grid-cols-[8rem_1fr] sm:px-4">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground sm:text-sm sm:normal-case sm:tracking-normal">
        {label}
      </span>
      <span className="break-words text-sm font-medium sm:text-right">
        {value}
      </span>
    </div>
  );
}
