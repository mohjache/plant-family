"use client";

import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { api } from "~/../convex/_generated/api";
import Link from "next/link";

export default function Home() {
  const { user, signOut } = useAuth();

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1>Convex + AuthKit</h1>
        <div className="flex gap-2">
          {user ? (
            <button onClick={() => signOut()}>Sign out</button>
          ) : (
            <>
              <Link href="/sign-in">
                <button>Sign in</button>
              </Link>
              <Link href="/sign-up">
                <button>Sign up</button>
              </Link>
            </>
          )}
        </div>
      </div>
      <Authenticated>
        <Content />
      </Authenticated>
      <Unauthenticated>
        <p>Please sign in to view data</p>
      </Unauthenticated>
    </div>
  );
}

function Content() {
  const data = useQuery(api.myFunctions.listNumbers, { count: 10 });

  if (!data) return <p>Loading...</p>;

  return (
    <div>
      <p>Welcome {data.viewer}!</p>
      <p>Numbers: {data.numbers?.join(', ') || 'None'}</p>
    </div>
  );
}