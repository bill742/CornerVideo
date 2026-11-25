import Link from "next/link";

import { Button } from "@/components/ui/button";

import { Search } from "./search";
import { UserMenu } from "./user-menu";

interface HeaderContentProps {
  /** Called after a search or a nav click, so the mobile sheet can close. */
  onSearchSubmit?: () => void;
}

function HeaderContent({ onSearchSubmit }: HeaderContentProps = {}) {
  return (
    <>
      {/* The logo goes to "/", the landing page; members are sent on to
          /movies by the middleware, but this is the direct way there. */}
      <Button asChild className="justify-start" variant="ghost">
        <Link href="/movies" onClick={onSearchSubmit}>
          Browse
        </Link>
      </Button>
      <Search onSubmit={onSearchSubmit} />
      <UserMenu />
    </>
  );
}

HeaderContent.displayName = "HeaderContent";

export { HeaderContent };
