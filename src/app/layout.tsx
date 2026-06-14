import "~/styles/globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { cn } from "~/lib/utils";
import { ConvexClientProvider } from "~/components/ConvexClientProvider";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
	title: "Plant Family",
	description: "Track and Share your Plants",
	icons: [{ rel: "icon", url: "/favicon.svg" }],
};


export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html className={cn(geist.variable, "font-sans", geist.variable)} lang="en">
			 <body>
				<ConvexClientProvider>{children}</ConvexClientProvider>
			 </body>
		</html>
	);
}
