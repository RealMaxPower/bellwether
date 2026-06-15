import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container max-w-md py-24 text-center">
      <p className="mb-2 font-mono text-caption uppercase tracking-wider text-accent-dark">404</p>
      <h1 className="font-serif text-display-2 text-ink-700">Off the timeline.</h1>
      <p className="mt-3 text-body text-ink-500">
        The thing you're looking for isn't on Bellwether. Maybe try the master timeline?
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <Link href="/">
          <Button variant="primary">Back to timeline</Button>
        </Link>
        <Link href="/about">
          <Button variant="ghost">About</Button>
        </Link>
      </div>
    </div>
  );
}
