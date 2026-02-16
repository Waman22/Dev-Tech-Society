// components/Header.tsx
import Link from "next/link";

export default function Header() {
  return (
    <header className="fixed top-0 z-30 w-full md:top-4 lg:top-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-end">
          {/* Only Admin Login button - aligned right */}
          <nav className="flex items-center">
            <Link
              href="/signin"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition"
            >
              Admin Login
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}