'use client'

import { useState } from 'react'
import axios from 'axios'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import {
	MapPin,
	Calendar as CalendarIcon,
	Clock,
	Satellite,
	Cloud,
	AlertTriangle,
	CheckCircle2,
	Info,
	Navigation,
	Thermometer,
	Droplets,
	Wind
} from 'lucide-react'

interface AnalysisResult {
	status: string
	location: string
	date: string
	time: string
	verdict: string
	predicted_weather: Array<Record<string, unknown>>
}

interface Location {
	name: string
	coords: { lat: number; lng: number }
}

function normalizeString(s: string) {
	return s.trim().toLowerCase().replace(/,/g, '').replace(/\s+/g, ' ')
}

function formatLocationString(s: string) {
	if (!s) return ''
	const normalized = normalizeString(s)
	return normalized
		.split(' ')
		.map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : ''))
		.join(' ')
}

function getVerdictStyle(verdict: string) {
	const lower = verdict.toLowerCase()
	if (lower.includes('safe') || lower.includes('good') || lower.includes('favorable')) {
		return {
			icon: CheckCircle2,
			color: 'text-emerald-400',
			bg: 'bg-emerald-500/10',
			border: 'border-emerald-500/50',
		}
	}
	if (lower.includes('caution') || lower.includes('moderate') || lower.includes('warning')) {
		return {
			icon: AlertTriangle,
			color: 'text-amber-400',
			bg: 'bg-amber-500/10',
			border: 'border-amber-500/50',
		}
	}
	if (lower.includes('danger') || lower.includes('unsafe') || lower.includes('high risk')) {
		return {
			icon: AlertTriangle,
			color: 'text-rose-400',
			bg: 'bg-rose-500/10',
			border: 'border-rose-500/50',
		}
	}
	return {
		icon: Info,
		color: 'text-blue-400',
		bg: 'bg-blue-500/10',
		border: 'border-blue-500/50',
	}
}

// Generate hour options (00:00 to 23:00)
const hours = Array.from({ length: 24 }, (_, i) => {
	const hour = i.toString().padStart(2, '0')
	return { value: `${hour}:00`, label: `${hour}:00` }
})

export default function Dashboard() {
	const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
	const [city, setCity] = useState('')
	const [country, setCountry] = useState('')
	const [date, setDate] = useState<Date>()
	const [time, setTime] = useState('')
	const [loading, setLoading] = useState(false)
	const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
	const [error, setError] = useState<string | null>(null)

	const analyzeWeatherRisks = async (locationString: string) => {
		try {
			const formattedDate = date ? format(date, 'yyyy-MM-dd') : ''
			const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/weather-verdict`, {
				city,
				country,
				date: formattedDate,
				time
			})
			if (res?.data) {
				setAnalysisResult(res.data as AnalysisResult)
			} else {
				setError('Analysis returned no data')
			}
		} catch (err) {
			console.error(err)
			setError('Failed to run analysis on server')
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)
		setLoading(true)
		setAnalysisResult(null)

		const formattedCity = formatLocationString(city)
		const formattedCountry = formatLocationString(country)
		const locationString = `${formattedCity}, ${formattedCountry}`

		try {
			const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
				locationString
			)}&count=1`
			const res = await axios.get(url)

			if (res.data.results && res.data.results.length > 0) {
				const first = res.data.results[0]
				const coords = {
					lat: first.latitude,
					lng: first.longitude,
				}
				setSelectedLocation({
					name: locationString,
					coords,
				})

				console.log('✅ Location found:', locationString, coords)
				await analyzeWeatherRisks(locationString)
			} else {
				setSelectedLocation(null)
				setError('Location not found. Please try another.')
			}
		} catch (err) {
			console.error(err)
			setError('Failed to fetch coordinates. Please try again later.')
			setSelectedLocation(null)
		} finally {
			setLoading(false)
		}
	}

	const verdictStyle = analysisResult ? getVerdictStyle(analysisResult.verdict) : null
	const VerdictIcon = verdictStyle?.icon

	return (
		<div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6 lg:p-8 min-h-screen">
			{/* Header */}
			<div className="mx-auto mb-8 max-w-7xl">
				<div className="flex sm:flex-row flex-col sm:items-center gap-3 mb-3">
					<div className="bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20 p-2.5 rounded-xl">
						<Satellite className="w-7 h-7 text-white" />
					</div>
					<div>
						<h1 className="font-bold text-white text-3xl sm:text-4xl">Weather Intelligence</h1>
						<p className="mt-1 text-slate-400 text-sm sm:text-base">
							Plan your outdoor activities with confidence using NASA Earth observation data
						</p>
					</div>
				</div>
			</div>

			{/* Main Grid */}
			<div className="gap-6 grid lg:grid-cols-12 mx-auto max-w-7xl">
				{/* Input Section */}
				<div className="lg:col-span-4">
					<Card className="bg-slate-900/50 shadow-xl backdrop-blur-sm border-slate-800">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-white">
								<Navigation className="w-5 h-5" />
								Mission Parameters
							</CardTitle>
							<CardDescription className="text-slate-400">
								Enter your event details for analysis
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSubmit} className="space-y-5">
								{/* City Input */}
								<div className="space-y-2">
									<Label htmlFor="city" className="flex items-center gap-2 font-medium text-slate-300">
										<MapPin className="w-4 h-4" />
										City
									</Label>
									<Input
										id="city"
										placeholder="e.g., New York"
										value={city}
										onChange={(e) => setCity(e.target.value)}
										className="bg-slate-950/50 border-slate-700 focus:border-violet-500 text-white transition-colors"
										required
									/>
								</div>

								{/* Country Input */}
								<div className="space-y-2">
									<Label htmlFor="country" className="flex items-center gap-2 font-medium text-slate-300">
										<MapPin className="w-4 h-4" />
										Country
									</Label>
									<Input
										id="country"
										placeholder="e.g., United States"
										value={country}
										onChange={(e) => setCountry(e.target.value)}
										className="bg-slate-950/50 border-slate-700 focus:border-violet-500 text-white transition-colors"
										required
									/>
								</div>

								{/* Location Coordinates Display */}
								{selectedLocation && (
									<Alert className="bg-slate-950/50 border-slate-700">
										<Navigation className="w-4 h-4 text-violet-400" />
										<AlertDescription className="space-y-1.5 mt-2">
											<div className="flex justify-between items-center">
												<span className="text-slate-400 text-sm">Latitude:</span>
												<Badge variant="outline" className="border-slate-700 font-mono text-slate-300">
													{selectedLocation.coords.lat.toFixed(4)}°
												</Badge>
											</div>
											<div className="flex justify-between items-center">
												<span className="text-slate-400 text-sm">Longitude:</span>
												<Badge variant="outline" className="border-slate-700 font-mono text-slate-300">
													{selectedLocation.coords.lng.toFixed(4)}°
												</Badge>
											</div>
										</AlertDescription>
									</Alert>
								)}

								{/* Error Display */}
								{error && (
									<Alert className="bg-rose-500/10 border-rose-500/50">
										<AlertTriangle className="w-4 h-4 text-rose-400" />
										<AlertDescription className="text-rose-400">
											{error}
										</AlertDescription>
									</Alert>
								)}

								<Separator className="bg-slate-800" />

								{/* Date Picker */}
								<div className="space-y-2">
									<Label className="flex items-center gap-2 font-medium text-slate-300">
										<CalendarIcon className="w-4 h-4" />
										Date
									</Label>
									<Popover>
										<PopoverTrigger asChild>
											<Button
												variant="outline"
												className={cn(
													"justify-start bg-slate-950/50 hover:bg-slate-900 border-slate-700 hover:border-violet-500 w-full font-normal text-white text-left transition-colors",
													!date && "text-slate-400"
												)}
											>
												<CalendarIcon className="mr-2 w-4 h-4" />
												{date ? format(date, "PPP") : "Pick a date"}
											</Button>
										</PopoverTrigger>
										<PopoverContent className="bg-slate-900 p-0 border-slate-700 w-auto" align="start">
											<Calendar
												mode="single"
												selected={date}
												onSelect={setDate}
												initialFocus
												className="bg-slate-900 text-white"
												classNames={{
													day_selected: "bg-violet-600 text-white hover:bg-violet-600 hover:text-white focus:bg-violet-600 focus:text-white",
													day_today: "bg-slate-800 text-white",
													day: "hover:bg-slate-800 text-white",
													head_cell: "text-slate-400",
													caption: "text-white",
													nav_button: "hover:bg-slate-800 text-white",
													nav_button_previous: "hover:bg-slate-800",
													nav_button_next: "hover:bg-slate-800",
												}}
											/>
										</PopoverContent>
									</Popover>
								</div>

								{/* Time Select */}
								<div className="space-y-2">
									<Label htmlFor="time" className="flex items-center gap-2 font-medium text-slate-300">
										<Clock className="w-4 h-4" />
										Time
									</Label>
									<Select value={time} onValueChange={setTime}>
										<SelectTrigger
											className="bg-slate-950/50 border-slate-700 focus:border-violet-500 text-white transition-colors"
										>
											<SelectValue placeholder="Select time" />
										</SelectTrigger>
										<SelectContent className="bg-slate-900 border-slate-700 max-h-[300px]">
											{hours.map((hour) => (
												<SelectItem
													key={hour.value}
													value={hour.value}
													className="hover:bg-slate-800 focus:bg-slate-800 text-white focus:text-white"
												>
													{hour.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<Button
									type="submit"
									disabled={loading || !city || !country || !date || !time}
									className="bg-gradient-to-r from-violet-600 hover:from-violet-500 to-purple-600 hover:to-purple-500 shadow-lg shadow-violet-500/20 hover:shadow-xl w-full font-semibold transition-all"
								>
									{loading ? (
										<div className="flex items-center gap-2">
											<div className="border-2 border-white/20 border-t-white rounded-full w-4 h-4 animate-spin" />
											Analyzing Weather Data...
										</div>
									) : (
										<>
											<Cloud className="mr-2 w-4 h-4" />
											Analyze Weather Risks
										</>
									)}
								</Button>
							</form>
						</CardContent>
					</Card>
				</div>

				{/* Results Section */}
				<div className="lg:col-span-8">
					<div className="space-y-4">
						{analysisResult ? (
							<>
								{/* Verdict Card */}
								<Card className={`bg-slate-900/50 backdrop-blur-sm shadow-xl border-2 ${verdictStyle?.border}`}>
									<CardHeader>
										<div className="flex justify-between items-start">
											<div className="flex items-start gap-3">
												<div className={`p-2 rounded-lg ${verdictStyle?.bg}`}>
													{VerdictIcon && <VerdictIcon className={`w-6 h-6 ${verdictStyle?.color}`} />}
												</div>
												<div>
													<CardTitle className="text-white text-xl">Weather Analysis</CardTitle>
													<CardDescription className="mt-1 text-slate-400">
														{analysisResult.location} • {analysisResult.date} at {analysisResult.time}
													</CardDescription>
												</div>
											</div>
											<Badge className={`${verdictStyle?.bg} ${verdictStyle?.color} border-0`}>
												{analysisResult.status}
											</Badge>
										</div>
									</CardHeader>
									<CardContent>
										<div className={`p-4 rounded-lg ${verdictStyle?.bg}`}>
											<p className={`font-medium leading-relaxed ${verdictStyle?.color}`}>
												{analysisResult.verdict}
											</p>
										</div>
									</CardContent>
								</Card>

								{/* Weather Data Card */}
								<Card className="bg-slate-900/50 shadow-xl backdrop-blur-sm border-slate-800">
									<CardHeader>
										<div className="flex items-center gap-2">
											<Thermometer className="w-5 h-5 text-violet-400" />
											<CardTitle className="text-white">Detailed Weather Forecast</CardTitle>
										</div>
										<CardDescription className="text-slate-400">
											Comprehensive meteorological data from NASA satellites
										</CardDescription>
									</CardHeader>
									<CardContent>
										{analysisResult.predicted_weather.length > 0 ? (
											<div className="gap-3 grid">
												{analysisResult.predicted_weather.map((item, idx) => (
													<div
														key={idx}
														className="relative bg-slate-950/50 hover:bg-slate-950/80 p-4 border border-slate-800 hover:border-slate-700 rounded-lg transition-all"
													>
														<div className="flex items-start gap-3">
															<div className="bg-violet-500/10 p-2 rounded-lg">
																<Cloud className="w-5 h-5 text-violet-400" />
															</div>
															<div className="flex-1 overflow-hidden">
																<h4 className="mb-2 font-semibold text-slate-300 text-sm">
																	Data Point {idx + 1}
																</h4>
																<div className="bg-slate-900/50 p-3 border border-slate-800 rounded-md overflow-x-auto">
																	<pre className="font-mono text-slate-300 text-xs whitespace-pre-wrap">
																		{JSON.stringify(item, null, 2)}
																	</pre>
																</div>
															</div>
														</div>
													</div>
												))}
											</div>
										) : (
											<Alert className="bg-slate-950/50 border-slate-700">
												<Info className="w-4 h-4 text-slate-400" />
												<AlertDescription className="text-slate-400">
													No detailed weather data available for this analysis.
												</AlertDescription>
											</Alert>
										)}
									</CardContent>
								</Card>
							</>
						) : (
							<Card className="bg-slate-900/50 shadow-xl backdrop-blur-sm border-slate-800">
								<CardContent className="py-20">
									<div className="text-center">
										<div className="inline-flex relative bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/20 shadow-xl mb-6 p-5 rounded-2xl">
											<Satellite className="w-14 h-14 text-white" />
											<div className="top-0 right-0 absolute bg-emerald-500 rounded-full w-4 h-4 animate-pulse" />
										</div>
										<h3 className="mb-3 font-bold text-white text-2xl">Ready for Analysis</h3>
										<p className="mx-auto mb-6 max-w-md text-slate-400 leading-relaxed">
											Enter your event location, date, and time to receive a comprehensive weather
											risk assessment powered by NASA Earth observation data.
										</p>
										<div className="flex justify-center items-center gap-8 mx-auto max-w-2xl">
											<div className="flex items-center gap-2 text-slate-500 text-sm">
												<Droplets className="w-4 h-4" />
												<span>Precipitation</span>
											</div>
											<div className="flex items-center gap-2 text-slate-500 text-sm">
												<Thermometer className="w-4 h-4" />
												<span>Temperature</span>
											</div>
											<div className="flex items-center gap-2 text-slate-500 text-sm">
												<Wind className="w-4 h-4" />
												<span>Wind Speed</span>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}