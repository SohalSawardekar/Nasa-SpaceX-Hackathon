'use client'
import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@/components/ui/sidebar"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const data = {
	navMain: [
		{
			title: "Nasa SpaceX Hackathon",
			items: [
				{ title: "Dashboard", url: "/dashboard", isActive: false },
				{ title: "Globe", url: "/globe", isActive: false },
				{ title: "Profile", url: "/profile", isActive: false },
			],
		}
	]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const pathname = usePathname()
	const router = useRouter()
	const supabase = createClientComponentClient()

	const handleLogout = async () => {
		const { error } = await supabase.auth.signOut()
		if (error) {
			console.error("Logout error:", error.message)
			alert("Failed to log out. Please try again.")
			return
		}
		// Redirect to login or home page after logout
		router.push("/login")
	}

	return (
		<Sidebar className="bg-slate-950 border-slate-800" {...props}>
			<SidebarContent className="bg-slate-950">
				{data.navMain.map((group) => (
					<SidebarGroup key={group.title}>
						<div className="h-5" />
						<SidebarGroupLabel className="text-slate-400 hover:text-slate-300 text-xl">
							{group.title}
						</SidebarGroupLabel>
						<div className="h-10" />
						<SidebarGroupContent>
							<SidebarMenu>
								{group.items.map((navItem) => {
									const isActive = pathname === navItem.url
									return (
										<SidebarMenuItem key={navItem.title}>
											<SidebarMenuButton
												asChild
												data-active={isActive}
												className="data-[active=true]:bg-violet-600 hover:bg-slate-900 text-slate-300 data-[active=true]:text-white hover:text-white"
											>
												<a href={navItem.url}>{navItem.title}</a>
											</SidebarMenuButton>
										</SidebarMenuItem>
									)
								})}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				))}
			</SidebarContent>

			<SidebarFooter className="bg-slate-800 p-4">
				<button
					onClick={handleLogout}
					className="bg-slate-900 hover:bg-red-500 py-2 rounded-md w-full text-white transition-colors"
				>
					Log Out
				</button>
			</SidebarFooter>

			<SidebarRail className="bg-slate-800" />
		</Sidebar>
	)
}
