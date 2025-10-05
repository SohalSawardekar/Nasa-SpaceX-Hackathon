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
import { useState } from "react"
import { createClient } from "@/utils/client"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
	return (
		<div className="relative flex flex-col justify-center items-center bg-black p-4 min-h-screen overflow-hidden">
			{/* Background stars */}
			<div className="-z-10 absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_25%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.1),transparent_20%)]"></div>
			<div className="-z-20 absolute inset-0 bg-gradient-to-b from-black via-indigo-950 to-black"></div>

			{/* Glow effect */}
			<div className="-top-40 right-40 absolute bg-purple-600/20 blur-3xl rounded-full w-[500px] h-[500px] animate-pulse"></div>
			<div className="bottom-0 left-0 absolute bg-indigo-600/20 blur-3xl rounded-full w-[400px] h-[400px] animate-pulse"></div>

			<div className="z-10 w-full max-w-sm md:max-w-4xl">
				<RegisterForm />
			</div>
		</div>
	)
}

function RegisterForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	const [loading, setLoading] = useState(false)
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		password: "",
		confirmPassword: "",
	})
	const [error, setError] = useState("")
	const [success, setSuccess] = useState("")

	const supabase = createClient()
	const router = useRouter()

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData({ ...formData, [e.target.name]: e.target.value })
		setError("")
		setSuccess("")
	}

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError("")
		setSuccess("")

		// Validation
		if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
			setError("All fields are required")
			setLoading(false)
			return
		}
		if (formData.password !== formData.confirmPassword) {
			setError("Passwords do not match")
			setLoading(false)
			return
		}
		if (formData.password.length < 6) {
			setError("Password must be at least 6 characters long")
			setLoading(false)
			return
		}

		try {
			const { data, error } = await supabase.auth.signUp({
				email: formData.email,
				password: formData.password,
				options: {
					emailRedirectTo: `${window.location.origin}/login`,
					data: { full_name: formData.name },
				},
			})

			if (error) {
				setError(error.message)
			} else if (data.user && !data.session) {
				setSuccess("Please check your email to confirm your account.")
			} else {
				setSuccess("Account created successfully!")
				router.push("/dashboard")
			}
		} catch (err) {
			console.error("Registration error:", err)
			setError("An unexpected error occurred.")
		} finally {
			setLoading(false)
		}
	}

	const handleGoogleSignup = async () => {
		try {
			const { data, error } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: { redirectTo: `${window.location.origin}/api/auth/callback` },
			})
			if (error) setError(error.message)
		} catch (err) {
			console.error("Google signup error:", err)
			setError("Unable to sign up with Google right now.")
		}
	}

	return (
		<div className={cn("flex flex-col gap-6 text-white", className)} {...props}>
			<Card className="bg-black/40 shadow-2xl shadow-indigo-800/40 backdrop-blur-md border border-indigo-900 overflow-hidden">
				<CardContent className="gap-0 grid md:grid-cols-2 p-0">
					<div className="space-y-6 p-6 md:p-8">
						<form onSubmit={handleRegister}>
							<FieldGroup>
								<div className="flex flex-col items-center gap-2 mb-2 text-center">
									<h1 className="bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500 font-bold text-transparent text-3xl">
										Join WeatherWise
									</h1>
									<p className="text-gray-400 text-sm">
										Create your account to access weather intelligence
									</p>
								</div>

								{/* Error / Success Messages */}
								{error && <p className="text-red-500 text-sm text-center">{error}</p>}
								{success && <p className="text-green-400 text-sm text-center">{success}</p>}

								<Field>
									<FieldLabel htmlFor="name" className="text-indigo-300">Full Name</FieldLabel>
									<Input
										id="name"
										name="name"
										type="text"
										placeholder="John Doe"
										required
										className="bg-black/40 border-indigo-800 focus:border-indigo-600 text-white placeholder:text-gray-500"
										onChange={handleInputChange}
										value={formData.name}
									/>
								</Field>

								<Field>
									<FieldLabel htmlFor="email" className="text-indigo-300">Email</FieldLabel>
									<Input
										id="email"
										name="email"
										type="email"
										placeholder="m@example.com"
										required
										className="bg-black/40 border-indigo-800 focus:border-indigo-600 text-white placeholder:text-gray-500"
										onChange={handleInputChange}
										value={formData.email}
									/>
								</Field>

								<Field>
									<FieldLabel htmlFor="password" className="text-indigo-300">Password</FieldLabel>
									<Input
										id="password"
										name="password"
										type="password"
										required
										className="bg-black/40 border-indigo-800 focus:border-indigo-600 text-white placeholder:text-gray-500"
										onChange={handleInputChange}
										value={formData.password}
									/>
									<FieldDescription className="mt-1 text-gray-500 text-xs">
										Must be at least 6 characters long
									</FieldDescription>
								</Field>

								<Field>
									<FieldLabel htmlFor="confirmPassword" className="text-indigo-300">Confirm Password</FieldLabel>
									<Input
										id="confirmPassword"
										name="confirmPassword"
										type="password"
										required
										className="bg-black/40 border-indigo-800 focus:border-indigo-600 text-white placeholder:text-gray-500"
										onChange={handleInputChange}
										value={formData.confirmPassword}
									/>
								</Field>

								<Field>
									<Button
										type="submit"
										className="bg-gradient-to-r from-indigo-600 hover:from-indigo-500 to-purple-600 hover:to-purple-500 shadow-indigo-700/40 shadow-lg w-full font-semibold hover:scale-105 transition-all"
										disabled={loading}
									>
										{loading ? "Creating Account..." : "Create Account"}
									</Button>
								</Field>

								<FieldSeparator className="text-gray-400 text-xs text-center">
									Or continue with
								</FieldSeparator>

								<Field className="gap-3 grid grid-cols-3">
									<Button
										variant="outline"
										type="button"
										onClick={handleGoogleSignup}
										className="bg-black/40 hover:bg-indigo-800/40 border-indigo-800 text-white hover:scale-105 transition-all"
									>
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
											<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
											<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
											<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
											<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
										</svg>
										<span className="sr-only">Sign up with Google</span>
									</Button>
								</Field>

								<FieldDescription className="text-gray-400 text-xs text-center">
									Already have an account?{" "}
									<Link href="/login" className="font-medium text-indigo-400 hover:underline">
										Sign in
									</Link>
								</FieldDescription>
							</FieldGroup>
						</form>
					</div>

					{/* Right side image */}
					<div className="hidden md:block relative bg-black min-h-[500px]">
						<Image
							src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop"
							width={500}
							height={500}
							alt="Space Background"
							className="absolute inset-0 opacity-70 w-full h-full object-cover"
						/>
						<div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/60"></div>
					</div>
				</CardContent>
			</Card>

			<FieldDescription className="px-6 text-gray-400 text-xs text-center">
				By creating an account, you agree to our{" "}
				<Link href="#" className="text-indigo-400 hover:underline">Terms of Service</Link>{" "}
				and{" "}
				<Link href="#" className="text-indigo-400 hover:underline">Privacy Policy</Link>.
			</FieldDescription>
		</div>
	)
}
