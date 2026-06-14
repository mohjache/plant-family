"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { ChevronsUpDown, House, LogOut, Sprout } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "~/components/ui/sidebar";

const navItems = [{ title: "Home", href: "/home", icon: House }];

export function AppSidebar() {
	const pathname = usePathname();

	return (
		<Sidebar>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton asChild size="lg">
							<Link href="/home">
								<Sprout className="size-5 text-primary" />
								<span className="font-semibold text-base">Plant Family</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarMenu>
						{navItems.map((item) => (
							<SidebarMenuItem key={item.href}>
								<SidebarMenuButton
									asChild
									isActive={pathname === item.href}
									tooltip={item.title}
								>
									<Link href={item.href}>
										<item.icon />
										<span>{item.title}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<UserFooter />
			</SidebarFooter>
		</Sidebar>
	);
}

function UserFooter() {
	const { user, signOut } = useAuth();

	if (!user) return null;

	const name =
		[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
	const initials =
		[user.firstName?.[0], user.lastName?.[0]].filter(Boolean).join("") ||
		user.email[0]?.toUpperCase() ||
		"?";

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton size="lg">
							<Avatar className="size-8 rounded-lg">
								{user.profilePictureUrl ? (
									<AvatarImage alt={name} src={user.profilePictureUrl} />
								) : null}
								<AvatarFallback className="rounded-lg">
									{initials}
								</AvatarFallback>
							</Avatar>
							<span className="truncate text-sm">{user.email}</span>
							<ChevronsUpDown className="ml-auto size-4" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="w-(--radix-dropdown-menu-trigger-width)"
						side="top"
					>
						<DropdownMenuItem onClick={() => signOut()}>
							<LogOut />
							<span>Log out</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
