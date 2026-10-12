import Image from "next/image";
import Link from "next/link";

import type { CastAndCrew } from "@/types";

function CastAndCrewInfo({
  character,
  id,
  job,
  name,
  profile_path,
}: CastAndCrew) {
  return (
    <Link href={`/cast-and-crew/${id}`}>
      {profile_path ? (
        <Image
          src={`${process.env.NEXT_PUBLIC_API_IMAGE_PATH}w200${profile_path}`}
          alt={`${name} - ${job}`}
          width={128}
          height={192}
          className="mb-2 h-auto w-full rounded-md md:w-32"
        />
      ) : (
        <div className="bg-muted flex h-48 w-32 items-center justify-center text-center">
          <span className="text-muted-foreground px-4 text-sm">
            No Image Available
          </span>
        </div>
      )}

      <p key={id} className="font-medium">
        {name}
      </p>

      {character && (
        <p className="text-muted-foreground text-sm">as {character}</p>
      )}
    </Link>
  );
}

CastAndCrewInfo.displayName = "CastAndCrewInfo";

export { CastAndCrewInfo };
