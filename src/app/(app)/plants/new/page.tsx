"use client";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PhotoCropInput } from "~/components/PhotoCropInput";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Spinner } from "~/components/ui/spinner";

export default function NewPlantPage() {
	const createPlant = useMutation(api.plants.createPlant);
	const generateUploadUrl = useMutation(api.plants.generateUploadUrl);
	const addPhoto = useMutation(api.plants.addPhoto);
	const router = useRouter();

	const [name, setName] = useState("");
	const [blob, setBlob] = useState<Blob | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	async function submit() {
		if (name.trim() === "") {
			setError("A name is required");
			return;
		}
		setSaving(true);
		setError(null);
		try {
			const id = await createPlant({ name: name.trim() });
			if (blob) {
				const url = await generateUploadUrl();
				const res = await fetch(url, {
					method: "POST",
					headers: { "Content-Type": blob.type },
					body: blob,
				});
				if (!res.ok) {
					throw new Error("Photo upload failed");
				}
				const { storageId } = (await res.json()) as {
					storageId: Id<"_storage">;
				};
				await addPhoto({ plantId: id, storageId, takenAt: Date.now() });
			}
			router.replace(`/plants/${id}`);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Something went wrong");
			setSaving(false);
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-2">
				<Button asChild size="icon" variant="ghost">
					<Link href="/home">
						<ArrowLeft className="size-5" />
						<span className="sr-only">Back</span>
					</Link>
				</Button>
				<h1 className="font-bold text-2xl tracking-tight">Add a plant</h1>
			</div>

			<PhotoCropInput onChange={setBlob} />

			<div className="space-y-2">
				<Label htmlFor="new-plant-name">Name</Label>
				<Input
					autoFocus
					id="new-plant-name"
					onChange={(e) => setName(e.target.value)}
					placeholder="Alocasia 'Polly'"
					value={name}
				/>
			</div>

			{error ? <p className="text-destructive text-sm">{error}</p> : null}
			<Button className="w-full" disabled={saving} onClick={submit}>
				{saving ? <Spinner /> : null}
				Add plant
			</Button>
		</div>
	);
}
