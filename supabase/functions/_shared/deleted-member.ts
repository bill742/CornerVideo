// Postgres raises 23503 (foreign_key_violation) when a row points at an
// auth.users id that no longer exists. Every member table references
// auth.users, so after delete-account removes a member this is the error a
// late Stripe or RevenueCat event hits when it tries to write for them.

interface PostgrestLikeError {
  code?: string;
}

/** True when a write failed because the member's account has been deleted. */
export function isDeletedMember(error: PostgrestLikeError | null): boolean {
  return error?.code === "23503";
}
