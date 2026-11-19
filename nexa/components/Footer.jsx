import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="w-full bg-[#f0f5f2] border-t border-[#e1ece5] mt-16 sm:mt-24 pt-10 sm:pt-12 pb-10 text-[#455c50] text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b border-[#e1ece5]">
          <div>
            <span className="text-lg font-editorial font-bold text-[#112117] tracking-wide">
              {SITE_NAME.toUpperCase()}
            </span>
            <p className="text-xs text-[#455c50] mt-1 max-w-xl">
              International News and real-time intelligence from verified world wires. Stay informed with continuous reporting, deep contextual analysis, and synthesized takeaways.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-[#455c50]">
            <Link href="/" className="hover:text-[#16834f] transition-colors">Top Stories</Link>
            <Link href="/?category=technology" className="hover:text-[#16834f] transition-colors">Technology</Link>
            <Link href="/?category=business" className="hover:text-[#16834f] transition-colors">Markets</Link>
            <Link href="/?category=science" className="hover:text-[#16834f] transition-colors">Science</Link>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-[#738c7f]">
          <p>© {new Date().getFullYear()} {SITE_NAME}. Verified syndicated dispatches.</p>
        </div>
      </div>
    </footer>
  );
}
