'use client'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/utils/client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
	return (
		<div className="relative flex flex-col justify-center items-center bg-black p-4 min-h-screen overflow-hidden">
			{/* Background stars */}
			<div className="-z-10 absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_25%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.1),transparent_20%)]"></div>
			<div className="-z-20 absolute inset-0 bg-gradient-to-b from-black via-indigo-950 to-black"></div>

			{/* Glow effect */}
			<div className="-top-40 -left-40 absolute bg-indigo-600/20 blur-3xl rounded-full w-[500px] h-[500px] animate-pulse"></div>
			<div className="right-0 bottom-0 absolute bg-purple-600/20 blur-3xl rounded-full w-[400px] h-[400px] animate-pulse"></div>

			<div className="z-10 w-full max-w-sm md:max-w-4xl">
				<LoginForm />
			</div>
		</div>
	)
}

type LoginForm = {
	email: string
	password: string
}

function LoginForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	const supabase = createClient()
	const router = useRouter()
	const [loading, setLoading] = useState(false)
	const [showPassword, setShowPassword] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [formData, setFormData] = useState<LoginForm>({
		email: "",
		password: "",
	})

	const handleSubmit = async () => {
		setLoading(true)
		setError(null)
		try {
			const { error } = await supabase.auth.signInWithPassword({
				email: formData.email,
				password: formData.password,
			})
			if (error) {
				setError("Invalid email or password")
			} else {
				router.push("/dashboard")
			}
		} catch (error) {
			setError(error instanceof Error ? error.message : String(error))
			console.error("Login error:", error)
		} finally {
			setLoading(false)
		}

	}

	const handleGoogleSignIn = async () => {
		setLoading(true)
		setError(null)

		try {
			const { error } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: {
					redirectTo: `${window.location.origin}/api/auth/callback`,
				}
			})

			if (error) {
				setError(error.message)
				console.error("Error signing in with Google:", error)
			}
		} catch (err) {
			setError('Failed to sign in with Google')
			console.error('Google sign in error:', err)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className={cn("flex flex-col gap-6 text-white", className)} {...props}>
			<Card className="bg-black/40 shadow-2xl shadow-indigo-800/40 backdrop-blur-md p-0 border border-indigo-900 overflow-hidden">
				<CardContent className="gap-0 grid md:grid-cols-2 p-0">
					<div className="space-y-6 p-6 md:p-8">
						<FieldGroup>
							<div className="flex flex-col items-center gap-2 mb-2 text-center">
								<h1 className="bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500 font-bold text-transparent text-3xl">
									Welcome back
								</h1>
								<p className="text-gray-400 text-sm">
									Login to your <span className="text-indigo-400">Acme Inc</span> account
								</p>
							</div>
							<Field>
								<FieldLabel htmlFor="email" className="text-indigo-300">Email</FieldLabel>
								<Input
									id="email"
									type="email"
									placeholder="m@example.com"
									required
									className="bg-black/40 border-indigo-800 focus:border-indigo-600 text-white placeholder:text-gray-500"
									onChange={(e) => setFormData({ ...formData, email: e.target.value })}
									value={formData.email}
								/>
							</Field>
							<Field>
								<div className="flex justify-between items-center">
									<FieldLabel htmlFor="password" className="text-indigo-300">Password</FieldLabel>
									<a
										href="#"
										className="text-indigo-400 hover:text-indigo-300 text-xs hover:underline"
									>
										Forgot password?
									</a>
								</div>
								<Input
									id="password"
									type="password"
									required
									className="bg-black/40 border-indigo-800 focus:border-indigo-600 text-white placeholder:text-gray-500"
									onChange={(e) => setFormData({ ...formData, password: e.target.value })}
									value={formData.password}
								/>
							</Field>
							<Field>
								<Button
									type="submit"
									className="bg-gradient-to-r from-indigo-600 hover:from-indigo-500 to-purple-600 hover:to-purple-500 shadow-indigo-700/40 shadow-lg w-full font-semibold hover:scale-105 transition-all hover:cursor-pointer"
									onClick={handleSubmit}
									disabled={loading}
								>
									{loading ? "Logging in..." : "Login"}
								</Button>
							</Field>
							<FieldSeparator className="bg-black w-full text-white text-xs text-center">
								Or continue with
							</FieldSeparator>
							<Field className="gap-3 grid grid-cols-3">
								<Button
									variant="outline"
									type="button"
									className="bg-black/40 hover:bg-indigo-800/40 border-indigo-800 text-white hover:scale-105 transition-all"
									disabled
								>
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
										<path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
									</svg>
									<span className="sr-only">Login with Apple</span>
								</Button>
								<Button
									variant="outline"
									type="button"
									className="bg-black/40 hover:bg-indigo-800/40 border-indigo-800 text-white hover:scale-105 transition-all hover:cursor-pointer"
									disabled={loading}
									onClick={handleGoogleSignIn}
								>
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
										<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
										<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
										<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
										<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
									</svg>
									<span className="sr-only">Login with Google</span>
								</Button>
								<Button
									variant="outline"
									type="button"
									className="bg-black/40 hover:bg-indigo-800/40 border-indigo-800 text-white hover:scale-105 transition-all"
									disabled
								>
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
										<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
									</svg>
									<span className="sr-only">Login with Facebook</span>
								</Button>
							</Field>
							<FieldDescription className="text-gray-400 text-xs text-center">
								Don&apos;t have an account?{" "}
								<Link href="/register" className="font-medium text-indigo-400 hover:underline">Sign up</Link>
							</FieldDescription>
						</FieldGroup>
					</div>
					{/* Right side image */}
					<div className="hidden md:block relative bg-black min-h-[500px]">
						<Image
							src="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=1200&auto=format&fit=crop"
							width={500}
							height={500}
							alt="Galaxy Background"
							className="absolute inset-0 opacity-70 w-full h-full object-cover"
						/>
						<div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/60"></div>
					</div>
				</CardContent>
			</Card>
			<FieldDescription className="px-6 text-gray-400 text-xs text-center">
				By clicking continue, you agree to our{" "}
				<a href="#" className="text-indigo-400 hover:underline">Terms of Service</a>{" "}
				and{" "}
				<a href="#" className="text-indigo-400 hover:underline">Privacy Policy</a>.
			</FieldDescription>
		</div>
	)
}