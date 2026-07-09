"use client";

import { api } from "@convex/_generated/api";
import type { InventoryItem } from "@convex/plants";
import { useQuery } from "convex/react";
import { ImageIcon, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "~/components/ui/empty";
import { Input } from "~/components/ui/input";

function matches(item: InventoryItem, q: string): boolean {
	if (q === "") return true;
	return item.plant.name.toLowerCase().includes(q.toLowerCase());
}

export default function InventoryPage() {
	const inventory = useQuery(api.plants.listInventory);
	const [search, setSearch] = useState("");

	const filtered = useMemo(
		() => (inventory ? inventory.filter((item) => matches(item, search)) : []),
		[inventory, search],
	);

	if (inventory === undefined) {
		return <p className="text-muted-foreground text-sm">Loading…</p>;
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-4">
				<h1 className="font-bold text-2xl tracking-tight">Your plants</h1>
				<Button asChild size="sm">
					<Link href="/plants/new">Add plant</Link>
				</Button>
			</div>

			{inventory.length === 0 ? (
				<div className="flex min-h-[50vh] items-center justify-center">
					<Empty>
						<EmptyHeader>
							<EmptyTitle>No plants yet</EmptyTitle>
							<EmptyDescription>
								Add your first plant to start your inventory.
							</EmptyDescription>
						</EmptyHeader>
						<Button asChild>
							<Link href="/plants/new">Add plant</Link>
						</Button>
					</Empty>
				</div>
			) : (
				<>
					<div className="relative">
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
						<Input
							className="pl-9"
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search by name…"
							value={search}
						/>
					</div>

					{filtered.length === 0 ? (
						<p className="py-10 text-center text-muted-foreground text-sm">
							No plants match “{search}”.
						</p>
					) : (
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
							{filtered.map((item) => (
								<InventoryCard item={item} key={item.plant._id} />
							))}
						</div>
					)}
				</>
			)}
		</div>
	);
}

function InventoryCard({ item }: { item: InventoryItem }) {
	const { plant, coverUrl, photoCount } = item;
	return (
		<Link
			className="group overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md"
			href={`/plants/${plant._id}`}
		>
			<div className="relative aspect-[4/5] bg-muted">
				{coverUrl ? (
					// biome-ignore lint/performance/noImgElement: signed Convex storage URL
					<img
						alt={plant.name}
						className="size-full object-cover transition-transform group-hover:scale-105"
						src={coverUrl}
					/>
				) : (
					<div className="flex size-full items-center justify-center text-muted-foreground">
						<ImageIcon className="size-8" />
					</div>
				)}
				{photoCount > 0 ? (
					<Badge
						className="absolute right-1.5 bottom-1.5 bg-black/60 text-white"
						variant="secondary"
					>
						{photoCount}
					</Badge>
				) : null}
			</div>
			<div className="p-2.5">
				<p className="line-clamp-1 font-medium text-sm">{plant.name}</p>
			</div>
		</Link>
	);
}
