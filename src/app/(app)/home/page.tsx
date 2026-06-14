"use client";

import "@xyflow/react/dist/style.css";

import dagre from "@dagrejs/dagre";
import {
	Background,
	Controls,
	type Edge,
	Handle,
	type Node,
	type NodeProps,
	Panel,
	Position,
	ReactFlow,
} from "@xyflow/react";
import { useMutation, useQuery } from "convex/react";
import { ChevronDownIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "~/components/ui/command";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "~/components/ui/empty";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { cn } from "~/lib/utils";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import type { BreedingGraph } from "../../../../convex/plants";

type Plant = Doc<"plants">;

const originLabel: Record<"cross" | "division", string> = {
	cross: "Cross",
	division: "Division",
};

const roleLabel: Record<"seed" | "pollen", string> = {
	seed: "Seed",
	pollen: "Pollen",
};

function plantLabel(p: Plant): string {
	return p.cultivar ? `${p.name} — ${p.cultivar}` : p.name;
}

// ---------------------------------------------------------------------------
// Layout — Dagre lays the whole Breeding graph out top-down (oldest at top).
// Positions are ephemeral: recomputed from the query each render, never saved.
// ---------------------------------------------------------------------------

const NODE_W = 208;
const NODE_H = 150;

function computeLayout(
	graph: BreedingGraph,
): Map<string, { x: number; y: number }> {
	const g = new dagre.graphlib.Graph();
	g.setGraph({ rankdir: "TB", nodesep: 48, ranksep: 80 });
	g.setDefaultEdgeLabel(() => ({}));
	for (const plant of graph.plants) {
		g.setNode(plant._id, { width: NODE_W, height: NODE_H });
	}
	for (const edge of graph.edges) {
		g.setEdge(edge.parentId, edge.childId);
	}
	dagre.layout(g);
	const positions = new Map<string, { x: number; y: number }>();
	for (const plant of graph.plants) {
		const node = g.node(plant._id);
		positions.set(plant._id, {
			x: node.x - NODE_W / 2,
			y: node.y - NODE_H / 2,
		});
	}
	return positions;
}

/** Every Plant that is `focusId` or an ancestor of it, walking edges upward. */
function ancestryOf(focusId: string, graph: BreedingGraph): Set<string> {
	const parentsByChild = new Map<string, string[]>();
	for (const edge of graph.edges) {
		const arr = parentsByChild.get(edge.childId) ?? [];
		arr.push(edge.parentId);
		parentsByChild.set(edge.childId, arr);
	}
	const result = new Set<string>([focusId]);
	const stack = [focusId];
	while (stack.length > 0) {
		const current = stack.pop();
		if (current === undefined) continue;
		for (const parentId of parentsByChild.get(current) ?? []) {
			if (!result.has(parentId)) {
				result.add(parentId);
				stack.push(parentId);
			}
		}
	}
	return result;
}

// ---------------------------------------------------------------------------
// Custom node — the existing PlantCard, adapted as a React Flow node.
// ---------------------------------------------------------------------------

type PlantNodeData = {
	plant: Plant;
	focused: boolean;
	dimmed: boolean;
	pickRole: "div" | "seed" | "pollen" | null;
	pickable: boolean;
	isOriginChild: boolean;
	canSetOrigin: boolean;
	onSetOrigin: (id: Id<"plants">) => void;
};

type PlantFlowNode = Node<PlantNodeData, "plant">;

const pickRoleLabel: Record<"div" | "seed" | "pollen", string> = {
	div: "Parent",
	seed: "Seed parent",
	pollen: "Pollen parent",
};

function PlantNode({ data }: NodeProps<PlantFlowNode>) {
	const {
		plant,
		focused,
		dimmed,
		pickRole,
		pickable,
		isOriginChild,
		canSetOrigin,
		onSetOrigin,
	} = data;
	return (
		<div className={cn("transition-opacity", dimmed && "opacity-30")}>
			<Handle
				className="!border-0 !bg-transparent"
				position={Position.Top}
				type="target"
			/>
			<Card
				className={cn(
					"w-52 gap-2 py-3 transition-shadow",
					focused && "ring-2 ring-primary",
					isOriginChild && "ring-2 ring-primary ring-dashed",
					pickRole && "ring-2 ring-emerald-500",
					pickable && "cursor-pointer hover:ring-2 hover:ring-emerald-400",
				)}
			>
				<CardHeader className="px-4">
					<CardTitle className="text-base">{plant.name}</CardTitle>
					{plant.cultivar ? (
						<CardDescription>{plant.cultivar}</CardDescription>
					) : null}
					<div className="mt-1 flex flex-wrap gap-1">
						{plant.originKind ? (
							<Badge variant="default">{originLabel[plant.originKind]}</Badge>
						) : null}
						{!plant.inCollection ? (
							<Badge variant="outline">Reference</Badge>
						) : null}
						{pickRole ? (
							<Badge className="bg-emerald-500" variant="default">
								{pickRoleLabel[pickRole]}
							</Badge>
						) : null}
						{isOriginChild ? (
							<Badge variant="secondary">Setting origin…</Badge>
						) : null}
					</div>
					{canSetOrigin ? (
						<Button
							className="mt-1 w-full"
							onClick={(e) => {
								e.stopPropagation();
								onSetOrigin(plant._id);
							}}
							size="sm"
							variant="outline"
						>
							Set origin
						</Button>
					) : null}
				</CardHeader>
			</Card>
			<Handle
				className="!border-0 !bg-transparent"
				position={Position.Bottom}
				type="source"
			/>
		</div>
	);
}

const nodeTypes = { plant: PlantNode };

// ---------------------------------------------------------------------------
// Searchable plant picker — the dropdown fallback for guided parent-picking.
// ---------------------------------------------------------------------------

function PlantCombobox({
	plants,
	value,
	onSelect,
	exclude,
	placeholder,
}: {
	plants: Plant[];
	value: Id<"plants"> | null;
	onSelect: (id: Id<"plants">) => void;
	exclude: (Id<"plants"> | null)[];
	placeholder: string;
}) {
	const [open, setOpen] = useState(false);
	const selected = plants.find((p) => p._id === value) ?? null;
	const options = plants.filter((p) => !exclude.includes(p._id));
	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger asChild>
				<Button
					className="w-full justify-between font-normal"
					variant="outline"
				>
					<span className="truncate">
						{selected ? plantLabel(selected) : placeholder}
					</span>
					<ChevronDownIcon className="size-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-64 p-0">
				<Command>
					<CommandInput placeholder="Search plants…" />
					<CommandList>
						<CommandEmpty>No plants found.</CommandEmpty>
						<CommandGroup>
							{options.map((p) => (
								<CommandItem
									key={p._id}
									onSelect={() => {
										onSelect(p._id);
										setOpen(false);
									}}
									value={`${plantLabel(p)} ${p._id}`}
								>
									{plantLabel(p)}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

// ---------------------------------------------------------------------------
// Add-plant control — inline form that drops a floating, unconnected node.
// ---------------------------------------------------------------------------

function AddPlantControl() {
	const createPlant = useMutation(api.plants.createPlant);
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [cultivar, setCultivar] = useState("");
	const [inCollection, setInCollection] = useState(true);
	const [error, setError] = useState<string | null>(null);

	function reset() {
		setName("");
		setCultivar("");
		setInCollection(true);
		setError(null);
	}

	async function submit() {
		if (name.trim() === "") {
			setError("A name is required");
			return;
		}
		const c = cultivar.trim();
		try {
			await createPlant({
				name: name.trim(),
				cultivar: c === "" ? undefined : c,
				inCollection,
			});
			reset();
			setOpen(false);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Something went wrong");
		}
	}

	return (
		<Popover
			onOpenChange={(o) => {
				setOpen(o);
				if (!o) reset();
			}}
			open={open}
		>
			<PopoverTrigger asChild>
				<Button size="sm">Add plant</Button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-72 space-y-4">
				<div className="space-y-2">
					<Label htmlFor="add-plant-name">Name</Label>
					<Input
						id="add-plant-name"
						onChange={(e) => setName(e.target.value)}
						placeholder="Alocasia 'Polly'"
						value={name}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="add-plant-cultivar">Cultivar (optional)</Label>
					<Input
						id="add-plant-cultivar"
						onChange={(e) => setCultivar(e.target.value)}
						placeholder="'Polly'"
						value={cultivar}
					/>
				</div>
				<div className="flex items-center gap-2">
					<Checkbox
						checked={inCollection}
						id="add-plant-in-collection"
						onCheckedChange={(v) => setInCollection(v === true)}
					/>
					<Label htmlFor="add-plant-in-collection">In my collection</Label>
				</div>
				{error ? <p className="text-destructive text-sm">{error}</p> : null}
				<Button className="w-full" onClick={submit}>
					Add plant
				</Button>
			</PopoverContent>
		</Popover>
	);
}

// ---------------------------------------------------------------------------
// Guided origin control — the per-node panel for wiring a Plant's Origin.
// Hybrid parent-picking: click a plant on the canvas, or use the dropdown.
// ---------------------------------------------------------------------------

type OriginDraft = {
	childId: Id<"plants">;
	kind: "division" | "cross";
	divParent: Id<"plants"> | null;
	seed: Id<"plants"> | null;
	pollen: Id<"plants"> | null;
	activeSlot: "div" | "seed" | "pollen";
};

function OriginPanel({
	draft,
	child,
	plants,
	error,
	onKind,
	onActiveSlot,
	onPick,
	onSave,
	onCancel,
}: {
	draft: OriginDraft;
	child: Plant;
	plants: Plant[];
	error: string | null;
	onKind: (kind: "division" | "cross") => void;
	onActiveSlot: (slot: "div" | "seed" | "pollen") => void;
	onPick: (id: Id<"plants">) => void;
	onSave: () => void;
	onCancel: () => void;
}) {
	const slotHint = (slot: "div" | "seed" | "pollen") =>
		draft.activeSlot === slot
			? "Click a plant on the canvas, or search below"
			: "Click here, then pick on the canvas";

	return (
		<Card className="w-80 gap-3 p-4 shadow-lg">
			<CardHeader className="p-0">
				<CardTitle className="text-base">
					Origin of {plantLabel(child)}
				</CardTitle>
				<CardDescription>
					Point this plant at the parent(s) it descends from.
				</CardDescription>
			</CardHeader>

			<Tabs
				onValueChange={(v) => onKind(v as "division" | "cross")}
				value={draft.kind}
			>
				<TabsList>
					<TabsTrigger value="division">Division</TabsTrigger>
					<TabsTrigger value="cross">Cross</TabsTrigger>
				</TabsList>
			</Tabs>

			{draft.kind === "division" ? (
				<button
					className={cn(
						"space-y-2 rounded-md border p-2 text-left",
						draft.activeSlot === "div" && "ring-2 ring-emerald-400",
					)}
					onClick={() => onActiveSlot("div")}
					type="button"
				>
					<Label>Parent</Label>
					<p className="text-muted-foreground text-xs">{slotHint("div")}</p>
					<PlantCombobox
						exclude={[child._id]}
						onSelect={onPick}
						placeholder="Choose the parent"
						plants={plants}
						value={draft.divParent}
					/>
				</button>
			) : (
				<>
					<button
						className={cn(
							"space-y-2 rounded-md border p-2 text-left",
							draft.activeSlot === "seed" && "ring-2 ring-emerald-400",
						)}
						onClick={() => onActiveSlot("seed")}
						type="button"
					>
						<Label>Seed parent</Label>
						<p className="text-muted-foreground text-xs">{slotHint("seed")}</p>
						<PlantCombobox
							exclude={[child._id, draft.pollen]}
							onSelect={onPick}
							placeholder="Choose the seed parent"
							plants={plants}
							value={draft.seed}
						/>
					</button>
					<button
						className={cn(
							"space-y-2 rounded-md border p-2 text-left",
							draft.activeSlot === "pollen" && "ring-2 ring-emerald-400",
						)}
						onClick={() => onActiveSlot("pollen")}
						type="button"
					>
						<Label>Pollen parent</Label>
						<p className="text-muted-foreground text-xs">
							{slotHint("pollen")}
						</p>
						<PlantCombobox
							exclude={[child._id, draft.seed]}
							onSelect={onPick}
							placeholder="Choose the pollen parent"
							plants={plants}
							value={draft.pollen}
						/>
					</button>
				</>
			)}

			{error ? <p className="text-destructive text-sm">{error}</p> : null}

			<div className="flex justify-end gap-2">
				<Button onClick={onCancel} size="sm" variant="ghost">
					Cancel
				</Button>
				<Button onClick={onSave} size="sm">
					Save origin
				</Button>
			</div>
		</Card>
	);
}

// ---------------------------------------------------------------------------
// Page — the whole-collection Breeding graph canvas.
// ---------------------------------------------------------------------------

export default function HomePage() {
	const graph = useQuery(api.plants.getBreedingGraph);
	const recordDivision = useMutation(api.plants.recordDivision);
	const recordCross = useMutation(api.plants.recordCross);

	const [focusId, setFocusId] = useState<Id<"plants"> | null>(null);
	const [draft, setDraft] = useState<OriginDraft | null>(null);
	const [error, setError] = useState<string | null>(null);

	const positions = useMemo(
		() => (graph ? computeLayout(graph) : new Map()),
		[graph],
	);

	const ancestry = useMemo(
		() => (focusId && graph ? ancestryOf(focusId, graph) : null),
		[focusId, graph],
	);

	const startOrigin = useCallback((childId: Id<"plants">) => {
		setFocusId(null);
		setError(null);
		setDraft({
			childId,
			kind: "division",
			divParent: null,
			seed: null,
			pollen: null,
			activeSlot: "div",
		});
	}, []);

	const pickParent = useCallback((id: Id<"plants">) => {
		setError(null);
		setDraft((d) => {
			if (!d || id === d.childId) return d;
			if (d.kind === "division") {
				return { ...d, divParent: id };
			}
			if (d.activeSlot === "seed") {
				return {
					...d,
					seed: id,
					pollen: d.pollen === id ? null : d.pollen,
					activeSlot: "pollen",
				};
			}
			return {
				...d,
				pollen: id,
				seed: d.seed === id ? null : d.seed,
				activeSlot: "seed",
			};
		});
	}, []);

	const onNodeClick = useCallback(
		(_event: React.MouseEvent, node: Node) => {
			const id = node.id as Id<"plants">;
			if (draft) {
				pickParent(id);
			} else {
				setFocusId((cur) => (cur === id ? null : id));
			}
		},
		[draft, pickParent],
	);

	async function saveOrigin() {
		if (!draft) return;
		try {
			if (draft.kind === "division") {
				if (!draft.divParent) {
					setError("Choose a parent");
					return;
				}
				await recordDivision({
					childId: draft.childId,
					parentId: draft.divParent,
				});
			} else {
				if (!draft.seed || !draft.pollen) {
					setError("Choose both parents");
					return;
				}
				await recordCross({
					childId: draft.childId,
					seedParentId: draft.seed,
					pollenParentId: draft.pollen,
				});
			}
			setDraft(null);
			setError(null);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Something went wrong");
		}
	}

	const nodes = useMemo<PlantFlowNode[]>(() => {
		if (!graph) return [];
		return graph.plants.map((plant) => {
			const pickRole: "div" | "seed" | "pollen" | null = draft
				? draft.divParent === plant._id
					? "div"
					: draft.seed === plant._id
						? "seed"
						: draft.pollen === plant._id
							? "pollen"
							: null
				: null;
			return {
				id: plant._id,
				type: "plant",
				position: positions.get(plant._id) ?? { x: 0, y: 0 },
				data: {
					plant,
					focused: focusId === plant._id,
					dimmed: ancestry ? !ancestry.has(plant._id) : false,
					pickRole,
					pickable: Boolean(draft) && draft?.childId !== plant._id,
					isOriginChild: draft?.childId === plant._id,
					canSetOrigin: !draft && plant.originKind === undefined,
					onSetOrigin: startOrigin,
				},
			};
		});
	}, [graph, positions, focusId, ancestry, draft, startOrigin]);

	const edges = useMemo<Edge[]>(() => {
		if (!graph) return [];
		return graph.edges.map((edge) => {
			const onPath = ancestry
				? ancestry.has(edge.childId) && ancestry.has(edge.parentId)
				: false;
			return {
				id: `${edge.parentId}-${edge.childId}`,
				source: edge.parentId,
				target: edge.childId,
				label: edge.role ? roleLabel[edge.role] : undefined,
				animated: onPath,
				style: ancestry ? { opacity: onPath ? 1 : 0.15 } : undefined,
			};
		});
	}, [graph, ancestry]);

	if (graph === undefined) {
		return <p className="text-muted-foreground text-sm">Loading…</p>;
	}

	const draftChild = draft
		? (graph.plants.find((p) => p._id === draft.childId) ?? null)
		: null;

	return (
		<div className="flex h-[calc(100vh-9rem)] flex-col gap-4">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">Breeding graph</h1>
					<p className="text-muted-foreground text-sm">
						Your whole collection at once. Click a plant to focus its ancestry;
						use “Set origin” to wire up where each one came from.
					</p>
				</div>
			</div>

			<div className="relative flex-1 overflow-hidden rounded-lg border">
				{graph.plants.length === 0 ? (
					<div className="flex h-full items-center justify-center">
						<Empty>
							<EmptyHeader>
								<EmptyTitle>No plants yet</EmptyTitle>
								<EmptyDescription>
									Add your first plant to start the Breeding graph.
								</EmptyDescription>
							</EmptyHeader>
							<AddPlantControl />
						</Empty>
					</div>
				) : (
					<ReactFlow
						edges={edges}
						fitView
						nodes={nodes}
						nodesConnectable={false}
						nodesDraggable={false}
						nodeTypes={nodeTypes}
						onNodeClick={onNodeClick}
						onPaneClick={() => setFocusId(null)}
						proOptions={{ hideAttribution: true }}
					>
						<Background />
						<Controls showInteractive={false} />
						<Panel position="top-right">
							<AddPlantControl />
						</Panel>
						{draft && draftChild ? (
							<Panel position="top-left">
								<OriginPanel
									child={draftChild}
									draft={draft}
									error={error}
									onActiveSlot={(slot) =>
										setDraft((d) => (d ? { ...d, activeSlot: slot } : d))
									}
									onCancel={() => {
										setDraft(null);
										setError(null);
									}}
									onKind={(kind) =>
										setDraft((d) =>
											d
												? {
														...d,
														kind,
														divParent: null,
														seed: null,
														pollen: null,
														activeSlot: kind === "division" ? "div" : "seed",
													}
												: d,
										)
									}
									onPick={pickParent}
									onSave={saveOrigin}
									plants={graph.plants}
								/>
							</Panel>
						) : null}
					</ReactFlow>
				)}
			</div>
		</div>
	);
}
