// components/Header.tsx  (or wherever your header lives)
import Link from "next/link";
import Logo from "./logo";   // assuming your <Logo /> component

export default function Header() {
  return (
    <header className="fixed top-0 z-30 w-full md:top-4 lg:top-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo / Branding - left */}
          <div className="shrink-0">
            <Logo />
          </div>

          {/* Right side: Login + Register */}
          <nav className="flex items-center space-x-6 md:space-x-10">
            <Link
              href="/signin"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition"
            >
              Admin Login
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition"
            >
              Register
            </Link>
          </nav>

        </div>
      </div>
    </header>
  );
}