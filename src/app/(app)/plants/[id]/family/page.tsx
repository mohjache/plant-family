"use client";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { OriginEditor } from "~/components/OriginEditor";
import { Pedigree } from "~/components/Pedigree";
import { Button } from "~/components/ui/button";

/**
 * The Family history editor: set a Plant's Origin (Division or Cross) and see
 * the rooted Pedigree it builds. Reached from the "Family history" action on the
 * compact plant detail page. Photos live on the separate Timeline page.
 */
export default function PlantFamilyPage() {
	const params = useParams<{ id: string }>();
	const plantId = params.id as Id<"plants">;
	const detail = useQuery(api.plants.getPlantDetail, { plantId });
	const pedigree = useQuery(api.plants.getPedigree, { plantId });
	const plants = useQuery(api.plants.listPlants);

	if (detail === undefined) {
		return <p className="text-muted-foreground text-sm">Loading…</p>;
	}
	if (detail === null) {
		return (
			<p className="text-muted-foreground text-sm">
				This plant no longer exists.
			</p>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-2">
				<Button asChild size="icon" variant="ghost">
					<Link href={`/plants/${plantId}`}>
						<ArrowLeft className="size-5" />
						<span className="sr-only">Back to plant</span>
					</Link>
				</Button>
				<h1 className="flex-1 truncate font-bold text-2xl tracking-tight">
					{detail.plant.name} · Family history
				</h1>
			</div>

			{plants === undefined ? (
				<p className="text-muted-foreground text-sm">Loading…</p>
			) : (
				<OriginEditor plant={detail.plant} plantId={plantId} plants={plants} />
			)}

			{pedigree && pedigree.edges.length > 0 ? (
				<Pedigree data={pedigree} />
			) : (
				<p className="text-muted-foreground text-sm">
					No ancestors recorded yet. Set this plant's origin above to build its
					pedigree.
				</p>
			)}
		</div>
	);
}
