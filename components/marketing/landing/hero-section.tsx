import Image from "next/image";
import Link from "next/link";

export function HeroSection({ bookingHref }: { bookingHref: string }) {
  return (
    <section className="bg-gradient-to-b from-white to-[#f6f0ff] px-3 pb-14 pt-2 min-[380px]:px-4 sm:px-8 sm:pb-16">
      <div className="relative mx-auto w-full max-w-[1551px]">
        <div className="relative isolate overflow-visible rounded-[24px] bg-white px-4 min-[380px]:px-6 sm:rounded-[38px] sm:px-10 sm:pt-2 lg:px-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-[24px] sm:rounded-[38px]"
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(200.22deg, rgba(230, 229, 243, 0.51) 17%, rgba(139, 123, 185, 0.51) 86%)",
              }}
            />
            <div
              className="absolute inset-0 mix-blend-soft-light opacity-[0.74]"
              style={{
                backgroundImage:
                  "url(/images/marketing/landing/hero-stripes.png)",
                backgroundPosition: "center",
                backgroundSize: "cover",
              }}
            />
          </div>

          <div className="relative z-10 mx-auto max-w-[767px] pt-6 text-center sm:pt-8 lg:pt-9">
            <h1 className="text-[1.75rem] font-medium leading-[1.05] tracking-[-0.04em] text-[#1c133b] min-[380px]:text-[2rem] sm:text-4xl lg:text-[44px] lg:leading-[1.08]">
              Book Trusted Home Cleaning service in Minutes
            </h1>
            <p className="mx-auto mt-2 max-w-[550px] text-[13px] font-normal leading-5 text-[#1c133b] sm:mt-3 sm:text-[14px] sm:leading-[21px]">
              From residential and commercial cleaning to short-term rentals,
              exterior work and recovery support, book certified professionals,
              track every visit, and pay only after the job is complete.
            </p>
            <Link
              className="mt-3 inline-flex h-[29px] items-center justify-center rounded-2xl bg-[#1c133b] px-5 text-[12px] font-medium text-[#e6e5f3] transition hover:bg-[#1c133b]/90 sm:mt-4"
              href={bookingHref}
            >
              Book a Service
            </Link>
          </div>

          <div className="relative z-10 mx-auto mt-4 block w-full max-w-[980px] sm:mt-5">
            <Image
              alt="CleanScape cleaning professionals"
              className="mx-auto block h-auto w-full"
              height={503}
              priority
              sizes="(min-width: 1280px) 980px, 90vw"
              src="/images/marketing/landing/hero-cleaners.png"
              width={1296}
            />
          </div>

          <div className="relative z-20 mx-auto w-[min(92%,985px)] pb-6 pt-0 sm:pb-8">
            <div className="flex items-center justify-between gap-3 rounded-[93px] border border-[#c79c66] bg-[#1c133b] px-5 py-4 text-white sm:gap-4 sm:px-10 sm:py-5">
              <Metric label={"Service\ncategories"} value="5" />
              <Metric label={"Services\navailable"} value="20+" />
              <Metric label={"Status\nvisibility"} value="Live" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
      <p className="text-xl font-normal leading-none tracking-tight text-[#c79c66] sm:text-3xl lg:text-4xl">
        {value}
      </p>
      <p className="whitespace-pre-line text-[9px] font-normal leading-[1.15] text-white sm:text-sm lg:text-base lg:leading-[17px]">
        {label}
      </p>
    </div>
  );
}
