/** Matches the purple→warm wash baked into the residential Mask 8 hero. */
export function CategoryHeroOverlay() {
  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0 mix-blend-multiply"
        style={{
          backgroundImage:
            "linear-gradient(90deg, #3a1a52 0%, #4a2558 30%, #6e3545 55%, #b85a38 82%, #d47a48 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-[#1c133b]/55 via-[#291845]/25 to-transparent"
      />
    </>
  );
}
