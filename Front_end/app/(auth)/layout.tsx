import Image from "next/image";
import Logo from "@/components/ui/logo";
import AuthBg from "@/public/images/auth-bg.svg";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Full-page background */}
      <div className="absolute inset-0 -z-10">
        <Image
          src={AuthBg}
          alt="Auth background illustration"
          fill
          className="object-cover object-center opacity-40" // adjust opacity as needed (0.3–0.6 looks nice)
          priority
        />
        {/* Optional: subtle overlay to improve text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/50 to-transparent lg:from-blue-50/80 lg:via-white/60 lg:to-transparent" />
      </div>

      {/* Optional decorative blobs (keep or remove) */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 -z-20 -translate-x-1/3 translate-y-1/3"
        aria-hidden="true"
      >
        <div className="h-80 w-80 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 opacity-30 blur-[160px]" />
      </div>

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between md:h-20">
            {/* Site branding */}
            <div className="mr-4 shrink-0">
              <Logo />
            </div>
            {/* You can add Login/Register links here if needed on auth pages */}
          </div>
        </div>
      </header>

      {/* Main content - centered form */}
      <main className="relative flex min-h-screen items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-sm py-16 md:py-20">
          {children}
        </div>
      </main>
    </div>
  );
}