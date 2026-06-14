import { Badge } from "~/components/ui/badge";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import styles from "./tree.module.css";

type ParentRole = "seed" | "pollen";
type Origin = "cross" | "division";

type PedigreeNode = {
	id: string;
	name: string;
	cultivar: string;
	// How this Plant came to be. Leaves (no recorded ancestors) have no origin.
	origin?: Origin;
	// This Plant's role within its child's Cross. Undefined for a Division's
	// single parent.
	role?: ParentRole;
	// The same ancestor appears on more than one branch (pedigree is a DAG).
	shared?: boolean;
	// Upward edges: this Plant's parents. One parent => Division, two => Cross.
	parents?: PedigreeNode[];
};

// Static placeholder data. A real pedigree will come from Convex later.
//
// This one example demonstrates all three ideas the page teaches:
//   * Division — the subject is a cormlet with a SINGLE parent (its clone).
//   * Cross    — that parent descends from two parents (seed + pollen).
//   * DAG      — "A. longiloba" appears under both grandparents (shared ancestor).
const pedigree: PedigreeNode = {
	id: "p0",
	name: "Alocasia 'Polly'",
	cultivar: "Cormlet, 2024",
	origin: "division",
	parents: [
		{
			id: "p1",
			// Same cultivar as the subject: a Division produces a genetic clone.
			name: "Alocasia 'Polly'",
			cultivar: "Hybrid",
			origin: "cross",
			parents: [
				{
					id: "g1",
					name: "A. sanderiana",
					cultivar: "Species",
					origin: "cross",
					role: "seed",
					parents: [
						{
							id: "ggp-borneo",
							name: "Wild Borneo",
							cultivar: "Wild collected",
						},
						{
							id: "ggp-longiloba",
							name: "A. longiloba",
							cultivar: "Wild collected",
							shared: true,
						},
					],
				},
				{
					id: "g2",
					name: "A. watsoniana",
					cultivar: "Species",
					origin: "cross",
					role: "pollen",
					parents: [
						{
							id: "ggp-longiloba",
							name: "A. longiloba",
							cultivar: "Wild collected",
							shared: true,
						},
						{
							id: "ggp-sulawesi",
							name: "Wild Sulawesi",
							cultivar: "Wild collected",
						},
					],
				},
			],
		},
	],
};

const roleLabel: Record<ParentRole, string> = {
	seed: "Seed parent",
	pollen: "Pollen parent",
};

const originLabel: Record<Origin, string> = {
	cross: "Cross",
	division: "Division",
};

function PlantCard({ node }: { node: PedigreeNode }) {
	return (
		<Card className={`${styles.card} w-52 gap-2 py-3`}>
			<CardHeader className="px-4">
				<div className="flex items-center justify-between gap-2">
					<CardTitle className="text-base">{node.name}</CardTitle>
					{node.shared ? <Badge variant="outline">Shared</Badge> : null}
				</div>
				<CardDescription>{node.cultivar}</CardDescription>
				<div className="mt-1 flex flex-wrap gap-1">
					{node.origin ? (
						<Badge variant="default">{originLabel[node.origin]}</Badge>
					) : null}
					{node.role ? (
						<Badge variant="secondary">{roleLabel[node.role]}</Badge>
					) : null}
				</div>
			</CardHeader>
		</Card>
	);
}

function TreeNode({ node }: { node: PedigreeNode }) {
	return (
		<li>
			<PlantCard node={node} />
			{node.parents && node.parents.length > 0 ? (
				<ul>
					{node.parents.map((parent) => (
						<TreeNode key={parent.id} node={parent} />
					))}
				</ul>
			) : null}
		</li>
	);
}

export default function HomePage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-bold text-2xl tracking-tight">Your Plant Lineage</h1>
				<p className="text-muted-foreground text-sm">
					Example lineage. A Plant's origin is a Cross (two parents) or a
					Division (one parent), and the same ancestor can appear on more than
					one branch.
				</p>
			</div>

			<div className="overflow-x-auto pb-4">
				<div className={styles.tree}>
					<ul>
						<TreeNode node={pedigree} />
					</ul>
				</div>
			</div>
		</div>
	);
}
