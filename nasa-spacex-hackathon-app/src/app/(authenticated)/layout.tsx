'use client'

import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"


export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider>
			<AppSidebar />

			<SidebarInset className="bg-slate-950">
				{/* Header */}
				<header className="flex items-center gap-2 bg-slate-950 px-4 border-slate-800 border-b h-16 shrink-0">
					<SidebarTrigger className="hover:bg-slate-900 -ml-1 text-slate-400 hover:text-white" />
					<Separator
						orientation="vertical"
						className="bg-slate-800 mr-2 data-[orientation=vertical]:h-4"
					/>
				</header>

				{/* Children content goes here */}
				<div className="flex-1 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 rounded-xl min-h-[100vh] md:min-h-min">
					{children}
				</div>
			</SidebarInset>
		</SidebarProvider>
	)
}