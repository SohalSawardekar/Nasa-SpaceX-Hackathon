'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/client'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { User, LogOut, Mail, Shield, Calendar } from 'lucide-react'

interface UserProfile {
	id: string
	email: string
	full_name?: string
	avatar_url?: string
	created_at?: string
}

export default function ProfileSection() {
	const supabase = createClient()
	const router = useRouter()
	const [user, setUser] = useState<UserProfile | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const fetchUser = async () => {
			const { data: { session }, error: sessionError } = await supabase.auth.getSession()
			if (sessionError || !session) {
				console.error('No active session', sessionError)
				setLoading(false)
				return
			}

			const { data: { user: supaUser }, error: userError } = await supabase.auth.getUser()
			if (userError || !supaUser) {
				console.error('Failed to fetch user', userError)
				setLoading(false)
				return
			}

			// Try to fetch profile from 'profiles' table
			const { data: profile, error: profileError } = await supabase
				.from('profiles')
				.select('*')
				.eq('id', supaUser.id)
				.single()

			const fullName = profile?.full_name || supaUser.user_metadata?.full_name
			const avatarUrl = profile?.avatar_url || supaUser.user_metadata?.avatar_url

			setUser({
				id: supaUser.id,
				email: supaUser.email || '',
				full_name: fullName,
				avatar_url: avatarUrl,
				created_at: supaUser.created_at,
			})
			setLoading(false)
		}

		fetchUser()
	}, [])

	const handleLogout = async () => {
		const { error } = await supabase.auth.signOut()
		if (error) {
			console.error(error)
			alert('Failed to log out')
			return
		}
		router.push('/login')
	}

	const getInitials = (name?: string) => {
		if (!name) return 'U'
		return name
			.split(' ')
			.map(n => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2)
	}

	const formatDate = (dateString?: string) => {
		if (!dateString) return 'Unknown'
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		})
	}

	if (loading) {
		return (
			<div className="mx-auto mt-10 px-4 max-w-2xl">
				<Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
					<CardHeader>
						<Skeleton className="bg-slate-800 w-32 h-8" />
						<Skeleton className="bg-slate-800 w-48 h-4" />
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="flex items-center gap-4">
							<Skeleton className="rounded-full w-20 h-20" />
							<div className="flex-1 space-y-2">
								<Skeleton className="bg-slate-800 w-40 h-6" />
								<Skeleton className="bg-slate-800 w-56 h-4" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	if (!user) {
		return (
			<div className="mx-auto mt-10 px-4 max-w-2xl">
				<Card className="bg-slate-900/50 backdrop-blur-sm border-rose-800/50">
					<CardContent className="pt-6">
						<div className="flex flex-col items-center gap-3 text-center">
							<div className="flex justify-center items-center bg-rose-500/10 rounded-full w-12 h-12">
								<Shield className="w-6 h-6 text-rose-400" />
							</div>
							<div>
								<p className="font-semibold text-rose-400">No user logged in</p>
								<p className="mt-1 text-slate-400 text-sm">Please sign in to view your profile</p>
							</div>
							<Button
								onClick={() => router.push('/login')}
								className="bg-slate-800 hover:bg-slate-700 mt-2"
							>
								Go to Login
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className="mx-auto mt-10 px-4 max-w-2xl">
			<Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
				<CardHeader>
					<div className="flex justify-between items-start">
						<div>
							<CardTitle className="flex items-center gap-2 text-white text-2xl">
								<User className="w-6 h-6" /> Profile
							</CardTitle>
							<CardDescription className="mt-1.5 text-slate-400">
								Manage your account information and preferences
							</CardDescription>
						</div>
						<Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
							Active
						</Badge>
					</div>
				</CardHeader>

				<Separator className="bg-slate-800" />

				<CardContent className="space-y-6 pt-6">
					{/* Profile Header */}
					<div className="flex items-center gap-4">
						<Avatar className="border-2 border-slate-700 rounded-full w-20 h-20">
							<AvatarImage src={user.avatar_url} alt={user.full_name || 'User'} />
							<AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 font-semibold text-white text-xl">
								{getInitials(user.full_name)}
							</AvatarFallback>
						</Avatar>
						<div className="flex-1">
							<h3 className="font-semibold text-white text-xl">
								{user.full_name || 'No Name Set'}
							</h3>
							<p className="flex items-center gap-1.5 mt-1 text-slate-400 text-sm">
								<Mail className="w-3.5 h-3.5" />
								{user.email}
							</p>
						</div>
					</div>

					<Separator className="bg-slate-800" />

					{/* Account Details */}
					<div className="space-y-4">
						<h4 className="font-medium text-slate-300 text-sm">Account Details</h4>

						<div className="space-y-3">
							<div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg">
								<div className="flex items-center gap-2">
									<Shield className="w-4 h-4 text-slate-400" />
									<span className="text-slate-300 text-sm">User ID</span>
								</div>
								<code className="bg-slate-900 px-2 py-1 rounded font-mono text-slate-400 text-xs">
									{user.id.slice(0, 8)}...
								</code>
							</div>

							{user.created_at && (
								<div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg">
									<div className="flex items-center gap-2">
										<Calendar className="w-4 h-4 text-slate-400" />
										<span className="text-slate-300 text-sm">Member Since</span>
									</div>
									<span className="text-slate-400 text-sm">
										{formatDate(user.created_at)}
									</span>
								</div>
							)}
						</div>
					</div>

					<Separator className="bg-slate-800" />

					{/* Actions */}
					<div className="flex gap-3">
						<Button
							onClick={handleLogout}
							variant="destructive"
							className="flex-1 bg-gradient-to-r from-rose-600 hover:from-rose-500 to-red-600 hover:to-red-500"
						>
							<LogOut className="mr-2 w-4 h-4" /> Log Out
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}