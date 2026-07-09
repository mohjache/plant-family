"use client";

import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useState } from "react";
import { PlantCombobox } from "~/components/PlantCombobox";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Spinner } from "~/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";

/**
 * Inline Origin editor: point a Plant at the parent(s) it descends from as a
 * Division (one parent) or Cross (seed × pollen). Saves in place — the rooted
 * Pedigree it feeds updates reactively, so this lives alongside the pedigree
 * under "Family history" on the plant edit page rather than on its own route.
 */
export function OriginEditor({
	plantId,
	plant,
	plants,
}: {
	plantId: Id<"plants">;
	plant: Doc<"plants">;
	plants: Doc<"plants">[];
}) {
	const recordDivision = useMutation(api.plants.recordDivision);
	const recordCross = useMutation(api.plants.recordCross);
	const clearPlantOrigin = useMutation(api.plants.clearPlantOrigin);

	const [kind, setKind] = useState<"division" | "cross">(
		plant.originKind ?? "division",
	);
	const [divParent, setDivParent] = useState<Id<"plants"> | null>(null);
	const [seed, setSeed] = useState<Id<"plants"> | null>(null);
	const [pollen, setPollen] = useState<Id<"plants"> | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);

	const hasOrigin = plant.originKind !== undefined;

	async function save() {
		setError(null);
		setSaved(false);
		setSaving(true);
		try {
			// Replacing an existing Origin: clear it first (record* rejects a second).
			if (hasOrigin) {
				await clearPlantOrigin({ plantId });
			}
			if (kind === "division") {
				if (!divParent) {
					setError("Choose a parent");
					setSaving(false);
					return;
				}
				await recordDivision({ childId: plantId, parentId: divParent });
			} else {
				if (!seed || !pollen) {
					setError("Choose both parents");
					setSaving(false);
					return;
				}
				await recordCross({
					childId: plantId,
					seedParentId: seed,
					pollenParentId: pollen,
				});
			}
			setSaved(true);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Something went wrong");
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="space-y-4 rounded-lg border p-3">
			<p className="text-muted-foreground text-sm">
				Point {plant.name} at the parent(s) it descends from.
			</p>

			<Tabs
				onValueChange={(v) => {
					setKind(v as "division" | "cross");
					setSaved(false);
				}}
				value={kind}
			>
				<TabsList>
					<TabsTrigger value="division">Division</TabsTrigger>
					<TabsTrigger value="cross">Cross</TabsTrigger>
				</TabsList>
			</Tabs>

			{kind === "division" ? (
				<div className="space-y-2">
					<Label>Parent</Label>
					<PlantCombobox
						exclude={[plantId]}
						onSelect={setDivParent}
						placeholder="Choose the parent"
						plants={plants}
						value={divParent}
					/>
				</div>
			) : (
				<div className="space-y-4">
					<div className="space-y-2">
						<Label>Seed parent</Label>
						<PlantCombobox
							exclude={[plantId, pollen]}
							onSelect={setSeed}
							placeholder="Choose the seed parent"
							plants={plants}
							value={seed}
						/>
					</div>
					<div className="space-y-2">
						<Label>Pollen parent</Label>
						<PlantCombobox
							exclude={[plantId, seed]}
							onSelect={setPollen}
							placeholder="Choose the pollen parent"
							plants={plants}
							value={pollen}
						/>
					</div>
				</div>
			)}

			{error ? <p className="text-destructive text-sm">{error}</p> : null}
			{saved ? <p className="text-muted-foreground text-sm">Saved.</p> : null}

			<Button disabled={saving} onClick={save}>
				{saving ? <Spinner /> : null}
				{hasOrigin ? "Update origin" : "Save origin"}
			</Button>
		</div>
	);
}
