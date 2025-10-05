/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useEffect, useState } from 'react';
import InteractiveGlobe, { TargetLocation } from './_components/InteractiveGlobe';
import LocationForm from './_components/LocationForm';
import { Card } from '@/components/ui/card';
import AnalysisCard from './_components/AnalysisCard';
import LargeSlider from './_components/LargeSlider';
import ClimatologyCharts from './_components/ClimatologyCharts';
import imgCloudy1 from '@/assets/cloudy (1).png';
import imgCloudy from '@/assets/cloudy.png';
import imgStorm from '@/assets/storm.png';
import imgSun from '@/assets/sun.png';
import Image from 'next/image';

const Index = () => {
	const [targetLocation, setTargetLocation] = useState<TargetLocation | undefined>();
	const [analysis, setAnalysis] = useState<any>(null);
	const [analyzing, setAnalyzing] = useState(false);
	const [pendingAnalyze, setPendingAnalyze] = useState<{ lat: number; lon: number; date?: string } | null>(null);
	const [month, setMonth] = useState<number>(1);
	const [day, setDay] = useState<number>(1);
	const [year, setYear] = useState<number>(2025);
	const frames = [imgCloudy1, imgCloudy, imgStorm, imgSun];
	const [frameIdx, setFrameIdx] = useState(0);

	useEffect(() => {
		if (!analyzing) return;
		setFrameIdx(0);
		const id = setInterval(() => {
			setFrameIdx((i) => (i + 1) % frames.length);
		}, 700);
		return () => clearInterval(id);
	}, [analyzing, frames.length]);

	const runAnalysis = async (lat?: number, lon?: number, selectedDate?: string) => {
		if (lat == null || lon == null) return;
		setAnalysis(null);
		setAnalyzing(true);
		try {
			const dateToSend =
				selectedDate ||
				`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
			const endYear = Number((dateToSend || '').slice(0, 4)) || new Date().getFullYear();
			const res = await fetch('/api/forecast', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					lat,
					lon,
					start: 2000,
					end: endYear,
					days: 14,
					date: dateToSend,
					forecast_start: dateToSend,
					forecastStart: dateToSend,
				}),
			});
			const contentType = res.headers.get('content-type') || '';
			if (!res.ok) {
				const text = await res.text().catch(() => '');
				setAnalysis({ error: `Server returned ${res.status}`, status: res.status, body: text });
			} else if (contentType.includes('application/json')) {
				const data = await res.json();
				setAnalysis(data?.data || data);
			} else {
				const text = await res.text().catch(() => '');
				setAnalysis({ error: 'Non-JSON response from /api/analyze', body: text });
			}
		} catch (e) {
			setAnalysis({ error: String(e) });
		} finally {
			setAnalyzing(false);
		}
	};

	return (
		<div className="relative flex flex-col justify-start items-start px-2 sm:px-4 pt-4 pb-12 min-h-screen overflow-hidden">
			{analyzing && (
				<div>
					<Image
						src={frames[frameIdx]}
						alt="Analyzing..."
						className="drop-shadow w-40 md:w-56 h-40 md:h-56 object-contain animate-pulse"
						width={224}
						height={224}
						priority
					/>
					<div className="mt-4 font-medium text-gray-700 tracking-wide">Analyzing…</div>
				</div>
			)}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="top-20 left-20 absolute bg-primary/10 blur-3xl rounded-full w-64 h-64" />
				<div className="right-20 bottom-20 absolute bg-accent/10 blur-3xl rounded-full w-96 h-96" />
			</div>
			<div className="z-10 relative mr-0 ml-0 w-full max-w-none">
				<div className="mb-8 text-center">
					<h1 className="bg-clip-text bg-gradient-to-r from-primary via-accent to-primary mb-4 font-bold text-transparent text-5xl md:text-7xl">
						Will it Rain on My Parade ?
					</h1>
					<p className="mx-auto max-w-2xl text-muted-foreground text-lg md:text-xl">
						Explore climate signals across the globe. Click a city or locate a place to get a quick climate snapshot.
					</p>
				</div>
				<div className="flex justify-center mb-6">
					<LocationForm
						onLocate={(lat, lon, label) => {
							setTargetLocation({ lat, lon, label });
						}}
						onAnalyze={(lat, lon, label, date) => {
							if (lat == null || lon == null) return;
							const approxEq = (a?: number, b?: number, eps: number = 1e-4) =>
								typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) < eps;
							const alreadyFocused =
								approxEq(targetLocation?.lat, lat) && approxEq(targetLocation?.lon, lon);
							setTargetLocation({ lat, lon, label });
							if (alreadyFocused) {
								setPendingAnalyze(null);
								setTimeout(() => {
									runAnalysis(lat, lon, date);
								}, 2000);
							} else {
								setPendingAnalyze({ lat, lon, date });
							}
						}}
					/>
				</div>
				<div className="relative items-start gap-6 grid grid-cols-1 lg:grid-cols-12 mb-8">
					<div className="flex justify-start col-span-12 lg:col-span-3">
						<AnalysisCard analysis={analysis} analyzing={analyzing} />
					</div>
					<div className="flex justify-center col-span-12 lg:col-span-7">
						<div className="w-full">
							<Card className="bg-card/30 backdrop-blur-sm border-border/50 overflow-hidden">
								<div className="flex justify-center items-center w-full h-[680px] lg:h-[820px]">
									<InteractiveGlobe
										targetLocation={targetLocation}
										onFocusComplete={() => {
											if (pendingAnalyze) {
												const { lat, lon, date } = pendingAnalyze;
												setPendingAnalyze(null);
												setTimeout(() => {
													runAnalysis(lat, lon, date);
												}, 2000);
											}
										}}
									/>
								</div>
							</Card>
						</div>
					</div>
				</div>
				<div className="mt-12">
					<div className="gap-4 grid grid-cols-1 lg:grid-cols-12">
						<div className="hidden lg:block lg:col-span-3" />
						<div className="flex justify-center col-span-1 lg:col-span-7">
							{analysis ? (
								<div className="bg-card/90 shadow-md p-4 border border-border rounded w-full text-left"></div>
							) : (
								<div className="bg-card/80 p-4 border border-border rounded w-full text-sm text-center">
									Enter a location to see a compact forecast.
								</div>
							)}
						</div>
					</div>
				</div>
				<div className="mt-8 w-full">
					<div className="grid grid-cols-1 lg:grid-cols-12">
						<div className="hidden lg:block lg:col-span-3" />
						<div className="flex items-center col-span-1 lg:col-span-7">
							<div className="bg-card/90 shadow-md p-4 border border-border rounded w-full">
								<LargeSlider value={analysis?.climate_risk_score ?? 0} />
							</div>
						</div>
						<div className="hidden lg:block lg:col-span-2" />
					</div>
				</div>
				<div className="mt-6 w-full">
					<div className="gap-6 grid grid-cols-1 lg:grid-cols-12">
						<div className="col-span-1 lg:col-span-3" />
						<div className="col-span-1 lg:col-span-7">
							<div className="bg-card/90 shadow-sm p-4 border border-border rounded-lg">
								<ClimatologyCharts
									lat={targetLocation?.lat}
									lon={targetLocation?.lon}
									targetDate={analysis?.forecast_date}
									buffer={3}
									startYear={2000}
									endYear={new Date().getFullYear()}
									param={'PRECTOT'}
								/>
							</div>
						</div>
						<div className="col-span-1 lg:col-span-2"></div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Index;
