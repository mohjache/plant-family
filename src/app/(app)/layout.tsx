
import { AppSidebar } from "~/components/AppSidebar";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "~/components/ui/sidebar";
import { TooltipProvider } from "~/components/ui/tooltip";

export default function AppLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<SidebarProvider>
			<TooltipProvider>
			<AppSidebar />
			<SidebarInset>
				<header className="flex h-14 items-center gap-2 border-b px-4">
					<SidebarTrigger />
				</header>
				<div className="flex-1 p-6">{children}</div>
			</SidebarInset>
			</TooltipProvider>
		</SidebarProvider>
	);
}
