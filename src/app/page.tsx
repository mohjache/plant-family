"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import Link from "next/link";
import { api } from "~/../convex/_generated/api";

export default function Home() {
	const { user, signOut } = useAuth();

	return (
		<div className="p-4">
			<div className="mb-4 flex items-center justify-between">
				<div className="flex gap-2">
					{user ? (
						<button onClick={() => signOut()}>Sign out</button>
					) : (
						<>
							<Link href="/sign-in" prefetch={false}>
								<button>Sign in</button>
							</Link>
							<Link href="/sign-up" prefetch={false}>
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
			<p>Numbers: {data.numbers?.join(", ") || "None"}</p>
		</div>
	);
}
