"use client"

import * as React from "react"
import { Check, ChevronsUpDown, GalleryVerticalEnd } from "lucide-react"

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar"

export function VersionSwitcher({
	versions,
	defaultVersion,
}: {
	versions: string[]
	defaultVersion: string
}) {
	const [selectedVersion, setSelectedVersion] = React.useState(defaultVersion)

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-slate-900 hover:bg-slate-900 data-[state=open]:text-white"
						>
							<div className="flex justify-center items-center bg-gradient-to-br from-violet-600 to-purple-600 shadow-lg shadow-violet-500/20 rounded-lg size-8 aspect-square">
								<GalleryVerticalEnd className="size-4 text-white" />
							</div>
							<div className="flex flex-col gap-0.5 leading-none">
								<span className="font-medium text-white">Documentation</span>
								<span className="text-slate-400 text-sm">v{selectedVersion}</span>
							</div>
							<ChevronsUpDown className="ml-auto text-slate-400" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="bg-slate-900 border-slate-800 w-(--radix-dropdown-menu-trigger-width)"
						align="start"
					>
						{versions.map((version) => (
							<DropdownMenuItem
								key={version}
								onSelect={() => setSelectedVersion(version)}
								className="hover:bg-slate-800 focus:bg-slate-800 text-slate-300 hover:text-white focus:text-white"
							>
								v{version}{" "}
								{version === selectedVersion && <Check className="ml-auto text-violet-400" />}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	)
}