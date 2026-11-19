import { assertEquals } from "jsr:@std/assert@1";

import { isDeletedMember } from "./deleted-member.ts";

Deno.test("a foreign-key violation means the member is gone", () => {
  assertEquals(isDeletedMember({ code: "23503" }), true);
});

Deno.test("other errors, and no error, are not a deleted member", () => {
  assertEquals(isDeletedMember({ code: "23505" }), false);
  assertEquals(isDeletedMember({}), false);
  assertEquals(isDeletedMember(null), false);
});
