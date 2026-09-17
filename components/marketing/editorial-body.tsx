import { cn } from "@/lib/utils";

type EditorialBlock = {
  type:
    | "h2"
    | "h3"
    | "p"
    | "ul"
    | "ol"
    | "quote"
    | "tip"
    | "table"
    | "image";
  value:
    | string
    | string[]
    | { headers: string[]; rows: string[][] }
    | { alt: string; src: string; caption?: string };
};

function formatInline(text: string) {
  const withLinks = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return withLinks.map((segment, segmentIndex) => {
    const linkMatch = segment.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          className="font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
          href={linkMatch[2]}
          key={`l-${segmentIndex}`}
        >
          {linkMatch[1]}
        </a>
      );
    }
    const parts = segment.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong className="font-semibold text-[#1c133b]" key={`${segmentIndex}-${index}`}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={`${segmentIndex}-${index}`}>{part}</span>;
    });
  });
}

export function EditorialBody({
  accent = "#d4694a",
  blocks,
  className,
}: {
  accent?: string;
  blocks: EditorialBlock[];
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-3xl", className)}>
      {blocks.map((block, index) => {
        if (block.type === "h2") {
          return (
            <h2
              className="mt-12 text-[1.65rem] font-semibold tracking-[-0.03em] text-[#1c133b] sm:text-3xl"
              key={index}
            >
              {block.value as string}
            </h2>
          );
        }
        if (block.type === "h3") {
          return (
            <h3
              className="mt-8 text-xl font-semibold text-[#1c133b]"
              key={index}
            >
              {block.value as string}
            </h3>
          );
        }
        if (block.type === "tip") {
          return (
            <aside
              className="mt-8 rounded-[1.25rem] border px-5 py-4 text-sm leading-7 text-[#5a5470]"
              key={index}
              style={{
                backgroundColor: `${accent}14`,
                borderColor: `${accent}55`,
              }}
            >
              <p className="font-semibold text-[#1c133b]">
                {formatInline(block.value as string)}
              </p>
            </aside>
          );
        }
        if (block.type === "image") {
          const image = block.value as {
            alt: string;
            src: string;
            caption?: string;
          };
          return (
            <figure className="my-10 overflow-hidden rounded-[1.5rem] shadow-[0_14px_36px_rgba(49,44,121,0.1)] ring-1 ring-black/5" key={index}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={image.alt}
                className="h-auto w-full object-cover"
                src={image.src}
              />
              {image.caption || image.alt ? (
                <figcaption className="bg-[#f7f2ea] px-4 py-3 text-center text-xs leading-5 text-[#5a5470] sm:text-sm">
                  {image.caption || image.alt}
                </figcaption>
              ) : null}
            </figure>
          );
        }
        if (block.type === "quote") {
          return (
            <blockquote
              className="mt-6 border-l-4 py-1 pl-4 text-sm italic leading-7 text-[#5a5470]"
              key={index}
              style={{ borderColor: accent }}
            >
              {formatInline(block.value as string)}
            </blockquote>
          );
        }
        if (block.type === "ul") {
          return (
            <ul
              className="mt-5 list-disc space-y-2.5 pl-5 text-sm leading-7 text-[#5a5470] sm:text-[15px]"
              key={index}
            >
              {(block.value as string[]).map((item) => (
                <li key={item}>{formatInline(item)}</li>
              ))}
            </ul>
          );
        }
        if (block.type === "ol") {
          return (
            <ol
              className="mt-5 list-decimal space-y-2.5 pl-5 text-sm leading-7 text-[#5a5470] sm:text-[15px]"
              key={index}
            >
              {(block.value as string[]).map((item) => (
                <li key={item}>{formatInline(item)}</li>
              ))}
            </ol>
          );
        }
        if (block.type === "table") {
          const table = block.value as {
            headers: string[];
            rows: string[][];
          };
          return (
            <div
              className="mt-6 overflow-x-auto rounded-[1.25rem] border border-[#eadfce] bg-white/90 shadow-[0_8px_24px_rgba(49,44,121,0.05)]"
              key={index}
            >
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#eadfce] bg-[#f7f2ea]/80">
                    {table.headers.map((header) => (
                      <th
                        className="px-4 py-3 font-semibold text-[#1c133b]"
                        key={header}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, rowIndex) => (
                    <tr
                      className="border-b border-[#eadfce]/80 last:border-b-0"
                      key={rowIndex}
                    >
                      {row.map((cell, cellIndex) => (
                        <td
                          className="px-4 py-3 align-top leading-6 text-[#5a5470]"
                          key={`${rowIndex}-${cellIndex}`}
                        >
                          {formatInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return (
          <p
            className="mt-5 text-sm leading-7 text-[#5a5470] sm:text-[15px] sm:leading-8"
            key={index}
          >
            {formatInline(block.value as string)}
          </p>
        );
      })}
    </div>
  );
}
