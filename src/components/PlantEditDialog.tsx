"use client";

import { useMutation, useQuery } from "convex/react";
import { ImageIcon, Trash2Icon } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { PlantDetail } from "../../convex/plants";

/**
 * Modal editor for a single Plant: name, cultivar, collection status, notes,
 * and photos. Origin is wired separately on the canvas, so it isn't edited here.
 */
export function PlantEditDialog({
	plantId,
	onOpenChange,
	onSetOrigin,
}: {
	plantId: Id<"plants"> | null;
	onOpenChange: (open: boolean) => void;
	onSetOrigin: (id: Id<"plants">) => void;
}) {
	const detail = useQuery(
		api.plants.getPlantDetail,
		plantId ? { plantId } : "skip",
	);

	return (
		<Dialog onOpenChange={onOpenChange} open={plantId !== null}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Edit plant</DialogTitle>
					<DialogDescription>
						Update this plant's details, notes, and photos.
					</DialogDescription>
				</DialogHeader>
				{plantId && detail ? (
					// Remount per plant so the form's initial state tracks the row.
					<PlantEditForm
						detail={detail}
						key={plantId}
						onDone={() => onOpenChange(false)}
						onSetOrigin={onSetOrigin}
					/>
				) : (
					<div className="flex items-center justify-center gap-2 py-10 text-muted-foreground text-sm">
						<Spinner /> Loading…
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}

const originKindLabel = { cross: "Cross", division: "Division" } as const;

function PlantEditForm({
	detail,
	onDone,
	onSetOrigin,
}: {
	detail: PlantDetail;
	onDone: () => void;
	onSetOrigin: (id: Id<"plants">) => void;
}) {
	const { plant, photos, parents } = detail;
	const updatePlant = useMutation(api.plants.updatePlant);
	const generateUploadUrl = useMutation(api.plants.generateUploadUrl);
	const addPhoto = useMutation(api.plants.addPhoto);
	const removePhoto = useMutation(api.plants.removePhoto);

	const [name, setName] = useState(plant.name);
	const [cultivar, setCultivar] = useState(plant.cultivar ?? "");
	const [inCollection, setInCollection] = useState(plant.inCollection);
	const [notes, setNotes] = useState(plant.notes ?? "");
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [uploading, setUploading] = useState(false);
	const fileInput = useRef<HTMLInputElement>(null);

	async function save() {
		if (name.trim() === "") {
			setError("A name is required");
			return;
		}
		setSaving(true);
		setError(null);
		try {
			await updatePlant({
				plantId: plant._id,
				name,
				cultivar: cultivar.trim() === "" ? undefined : cultivar,
				inCollection,
				notes: notes.trim() === "" ? undefined : notes,
			});
			onDone();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Something went wrong");
		} finally {
			setSaving(false);
		}
	}

	async function uploadFiles(files: FileList | null) {
		if (!files || files.length === 0) return;
		setUploading(true);
		setError(null);
		try {
			for (const file of Array.from(files)) {
				const url = await generateUploadUrl();
				const res = await fetch(url, {
					method: "POST",
					headers: { "Content-Type": file.type },
					body: file,
				});
				if (!res.ok) {
					throw new Error("Upload failed");
				}
				const { storageId } = (await res.json()) as {
					storageId: Id<"_storage">;
				};
				await addPhoto({ plantId: plant._id, storageId });
			}
		} catch (e) {
			setError(e instanceof Error ? e.message : "Upload failed");
		} finally {
			setUploading(false);
			if (fileInput.current) fileInput.current.value = "";
		}
	}

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="edit-plant-name">Name</Label>
				<Input
					id="edit-plant-name"
					onChange={(e) => setName(e.target.value)}
					placeholder="Alocasia 'Polly'"
					value={name}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="edit-plant-cultivar">Cultivar (optional)</Label>
				<Input
					id="edit-plant-cultivar"
					onChange={(e) => setCultivar(e.target.value)}
					placeholder="'Polly'"
					value={cultivar}
				/>
			</div>

			<div className="flex items-center gap-2">
				<Checkbox
					checked={inCollection}
					id="edit-plant-in-collection"
					onCheckedChange={(v) => setInCollection(v === true)}
				/>
				<Label htmlFor="edit-plant-in-collection">In my collection</Label>
			</div>

			<div className="space-y-2">
				<Label>Origin</Label>
				{plant.originKind ? (
					<div className="rounded-md border p-2 text-sm">
						<span className="font-medium">
							{originKindLabel[plant.originKind]}
						</span>
						{parents.length > 0 ? (
							<span className="text-muted-foreground">
								{" — "}
								{parents
									.map((p) =>
										p.role ? `${p.role} parent ${p.label}` : p.label,
									)
									.join(" × ")}
							</span>
						) : null}
					</div>
				) : (
					<div className="flex items-center justify-between gap-2 rounded-md border border-dashed p-2">
						<span className="text-muted-foreground text-sm">
							No origin set yet.
						</span>
						<Button
							onClick={() => onSetOrigin(plant._id)}
							size="sm"
							type="button"
							variant="outline"
						>
							Set origin
						</Button>
					</div>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="edit-plant-notes">Notes</Label>
				<Textarea
					id="edit-plant-notes"
					onChange={(e) => setNotes(e.target.value)}
					placeholder="Care notes, source, observations…"
					rows={4}
					value={notes}
				/>
			</div>

			<div className="space-y-2">
				<Label>Photos</Label>
				{photos.length > 0 ? (
					<div className="grid grid-cols-3 gap-2">
						{photos.map((photo) => (
							<div
								className="group relative aspect-square overflow-hidden rounded-md border bg-muted"
								key={photo._id}
							>
								{photo.url ? (
									// biome-ignore lint/performance/noImgElement: signed Convex storage URLs
									<img
										alt="Plant"
										className="h-full w-full object-cover"
										src={photo.url}
									/>
								) : (
									<div className="flex h-full items-center justify-center text-muted-foreground">
										<ImageIcon className="size-5" />
									</div>
								)}
								<Button
									className="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100"
									onClick={() => removePhoto({ photoId: photo._id })}
									size="icon-sm"
									type="button"
									variant="destructive"
								>
									<Trash2Icon className="size-4" />
									<span className="sr-only">Remove photo</span>
								</Button>
							</div>
						))}
					</div>
				) : (
					<p className="text-muted-foreground text-sm">No photos yet.</p>
				)}
				<input
					accept="image/*"
					className="hidden"
					multiple
					onChange={(e) => uploadFiles(e.target.files)}
					ref={fileInput}
					type="file"
				/>
				<Button
					className="w-full"
					disabled={uploading}
					onClick={() => fileInput.current?.click()}
					type="button"
					variant="outline"
				>
					{uploading ? <Spinner /> : <ImageIcon className="size-4" />}
					{uploading ? "Uploading…" : "Upload photos"}
				</Button>
			</div>

			{error ? <p className="text-destructive text-sm">{error}</p> : null}

			<DialogFooter showCloseButton>
				<Button disabled={saving} onClick={save}>
					{saving ? <Spinner /> : null}
					Save changes
				</Button>
			</DialogFooter>
		</div>
	);
}
