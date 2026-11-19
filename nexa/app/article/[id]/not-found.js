import Link from "next/link";

export default function ArticleNotFound() {
  return (
    <main className="min-h-screen bg-[#f8faf9] px-4 py-24 text-center text-[#112117]">
      <h1 className="text-2xl font-bold">Article not found</h1>
      <p className="mt-2 text-sm text-[#455c50]">This dispatch is unavailable or the link is no longer valid.</p>
      <Link href="/" className="mt-6 inline-block rounded-lg bg-[#16834f] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white">
        Return to top stories
      </Link>
    </main>
  );
}
