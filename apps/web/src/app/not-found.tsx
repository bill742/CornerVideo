import Link from "next/link";

/**
 * Custom 404 Not Found page component
 * @returns 404 error page
 */
const NotFound = () => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 py-16 text-center">
      <h1 className="font-display text-4xl font-semibold tracking-wide">
        Page not found
      </h1>
      <p className="text-muted-foreground">
        This page doesn&apos;t exist or has moved.
      </p>
      <Link
        className="text-primary font-semibold underline underline-offset-4"
        href="/"
      >
        Go to Browse
      </Link>
    </div>
  );
};

NotFound.displayName = "NotFound";

export default NotFound;
