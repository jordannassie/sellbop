import Image from 'next/image'

const HERO_SRC =
  'https://qsvmgzdaashfsavmfjuz.supabase.co/storage/v1/object/public/SELL/images2/logos/63c10c3c-9bb4-4996-9bf1-62f626cb6401.png'

const TOOL_LOGOS = [
  {
    src: 'https://qsvmgzdaashfsavmfjuz.supabase.co/storage/v1/object/public/SELL/images2/logos/Font-Fiverr-Logo.jpg',
    alt: 'Fiverr',
  },
  {
    src: 'https://qsvmgzdaashfsavmfjuz.supabase.co/storage/v1/object/public/SELL/images2/logos/higgsfield-logo-750x450.png',
    alt: 'Higgsfield',
  },
  {
    src: 'https://qsvmgzdaashfsavmfjuz.supabase.co/storage/v1/object/public/SELL/images2/logos/images.jpg',
    alt: 'Canva',
  },
]

export function HeroBanner() {
  return (
    <>
      {/* Static hero image */}
      <div className="relative w-full overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-[0_8px_40px_rgba(0,0,0,0.06)]">
        <Image
          src={HERO_SRC}
          alt="SellBop — sell digital products and build your affiliate network"
          width={1200}
          height={675}
          className="w-full h-auto object-contain"
          sizes="(max-width: 768px) 100vw, 90vw"
          priority
          unoptimized
        />
      </div>

      {/* Tool logos strip */}
      <div className="mt-6 sm:mt-8 rounded-2xl border border-neutral-100 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.04)] px-6 py-5">
        <p className="text-center text-xs font-medium text-neutral-400 mb-4 tracking-wide">
          Build your business with the tools you already know
        </p>
        <div className="flex items-center justify-center flex-wrap gap-6 sm:gap-10">
          {TOOL_LOGOS.map((logo) => (
            <div
              key={logo.alt}
              className="relative flex items-center justify-center"
              style={{ height: '44px', width: '110px' }}
            >
              <Image
                src={logo.src}
                alt={logo.alt}
                fill
                className="object-contain"
                sizes="110px"
                unoptimized
              />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
