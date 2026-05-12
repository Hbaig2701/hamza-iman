import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-neutral-50">
      <h1 className="heading-serif text-3xl text-neutral-800 mb-2">Not here.</h1>
      <p className="text-neutral-500 text-sm mb-6">
        This page doesn&apos;t belong to your story.
      </p>
      <Link href="/today" className="btn-primary">
        Back to today
      </Link>
    </main>
  );
}
