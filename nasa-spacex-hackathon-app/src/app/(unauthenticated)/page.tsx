'use client'

import React, { useState, useEffect } from 'react';
import { Wind, Droplets, Thermometer, MapPin, Calendar, ArrowRight, Satellite, Zap, Globe } from 'lucide-react';
import Link from 'next/link';

interface Star {
	x: number;
	y: number;
	size: number;
	opacity: number;
	delay: number;
}

export default function WeatherLandingPage() {
	const [scrollY, setScrollY] = useState(0);
	const [activeFeature, setActiveFeature] = useState(0);
	const [stars, setStars] = useState<Star[]>([]);

	useEffect(() => {
		const handleScroll = () => setScrollY(window.scrollY);
		window.addEventListener('scroll', handleScroll);

		// Generate random stars
		const newStars = Array.from({ length: 100 }, () => ({
			x: Math.random() * 100,
			y: Math.random() * 100,
			size: Math.random() * 2 + 1,
			opacity: Math.random() * 0.5 + 0.5,
			delay: Math.random() * 3
		}));
		setStars(newStars);

		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	useEffect(() => {
		const interval = setInterval(() => {
			setActiveFeature((prev) => (prev + 1) % 5);
		}, 3000);
		return () => clearInterval(interval);
	}, []);

	const weatherConditions = [
		{ icon: Thermometer, label: 'Very Hot', color: 'text-orange-400', bg: 'bg-orange-500/20', glow: 'shadow-orange-500/50' },
		{ icon: Thermometer, label: 'Very Cold', color: 'text-blue-400', bg: 'bg-blue-500/20', glow: 'shadow-blue-500/50' },
		{ icon: Wind, label: 'Very Windy', color: 'text-cyan-400', bg: 'bg-cyan-500/20', glow: 'shadow-cyan-500/50' },
		{ icon: Droplets, label: 'Very Wet', color: 'text-indigo-400', bg: 'bg-indigo-500/20', glow: 'shadow-indigo-500/50' },
		{ icon: Zap, label: 'Very Uncomfortable', color: 'text-yellow-400', bg: 'bg-yellow-500/20', glow: 'shadow-yellow-500/50' }
	];

	const features = [
		{
			icon: Satellite,
			title: 'Satellite Data Integration',
			desc: 'Leveraging NASA Earth observation satellites and advanced space technology for real-time weather monitoring.'
		},
		{
			icon: Globe,
			title: 'Global Coverage',
			desc: 'Access weather risk data from anywhere on Earth using cutting-edge orbital monitoring systems.'
		},
		{
			icon: Calendar,
			title: 'Precision Forecasting',
			desc: 'AI-powered predictions combining historical data with current atmospheric conditions for accurate planning.'
		}
	];

	const useCases = [
		{ title: 'Mountain Expeditions', icon: '⛰️', desc: 'Navigate challenging terrain with confidence using real-time weather intelligence' },
		{ title: 'Maritime Adventures', icon: '⚓', desc: 'Plan fishing trips and water activities with oceanic condition forecasts' },
		{ title: 'Space Tourism', icon: '🚀', desc: 'Optimal launch window planning for the next generation of travelers' },
		{ title: 'Outdoor Events', icon: '🎯', desc: 'Ensure perfect conditions for gatherings, camps, and expeditions' }
	];

	return (
		<div className="bg-black min-h-screen overflow-x-hidden text-white">
			{/* Starfield Background */}
			<div className="z-0 fixed inset-0">
				{stars.map((star, idx) => (
					<div
						key={idx}
						className="absolute bg-white rounded-full animate-pulse"
						style={{
							left: `${star.x}%`,
							top: `${star.y}%`,
							width: `${star.size}px`,
							height: `${star.size}px`,
							opacity: star.opacity,
							animationDelay: `${star.delay}s`,
							animationDuration: '2s'
						}}
					/>
				))}
			</div>

			{/* Nebula Effect */}
			<div className="z-0 fixed inset-0">
				<div className="top-0 left-1/4 absolute bg-purple-600/20 blur-3xl rounded-full w-96 h-96 animate-pulse"
					style={{ animationDuration: '8s' }}></div>
				<div className="right-1/4 bottom-1/4 absolute bg-blue-600/20 blur-3xl rounded-full w-[500px] h-[500px] animate-pulse"
					style={{ animationDuration: '10s', animationDelay: '2s' }}></div>
				<div className="top-1/2 left-1/2 absolute bg-indigo-600/15 blur-3xl rounded-full w-72 h-72 animate-pulse"
					style={{ animationDuration: '6s', animationDelay: '4s' }}></div>
			</div>

			<div className="z-10 relative">
				{/* Navigation */}
				<nav className="flex justify-between items-center backdrop-blur-sm mx-auto px-6 py-6 border-gray-800/50 border-b container">
					<div className="flex items-center space-x-4">
						<Satellite className="w-10 h-10 text-blue-400 animate-pulse" />
						<div>
							<div className="font-bold text-2xl tracking-wider">WEATHERWISE</div>
							<div className="text-gray-400 text-xs tracking-widest">NASA × SPACEX CHALLENGE</div>
						</div>
					</div>
					<Link href={'/login'} className="bg-gradient-to-r from-blue-600 hover:from-blue-500 to-purple-600 hover:to-purple-500 shadow-blue-500/30 shadow-lg px-6 py-2 border border-blue-400/30 rounded font-semibold hover:scale-105 transition-all transform">
						LAUNCH APP
					</Link>
				</nav>

				{/* Hero Section */}
				<div className="mx-auto px-6 py-20 md:py-32 container">
					<div className="mx-auto max-w-5xl text-center">
						{/* NASA x SpaceX Badge */}
						<div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm mb-8 px-4 py-2 border border-blue-400/30 rounded-full">
							<Satellite className="w-4 h-4 text-blue-400" />
							<span className="font-semibold text-sm tracking-wide">POWERED BY EARTH OBSERVATION DATA</span>
						</div>

						<h1 className="mb-6 font-bold text-6xl md:text-8xl leading-tight tracking-tight"
							style={{ transform: `translateY(${scrollY * 0.15}px)` }}>
							<span className="bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent">
								Mission Weather
							</span>
						</h1>
						<p className="mb-4 text-gray-300 text-xl md:text-2xl tracking-wide">
							REAL-TIME ATMOSPHERIC RISK ASSESSMENT
						</p>
						<p className="mx-auto mb-12 max-w-3xl text-gray-400 text-lg">
							Plan your outdoor missions with confidence using advanced satellite technology and AI-powered weather intelligence from orbit
						</p>

						{/* Interactive Weather Conditions Display */}
						<div className="flex flex-wrap justify-center gap-3 mb-12">
							{weatherConditions.map((condition, idx) => {
								const Icon = condition.icon;
								return (
									<div
										key={idx}
										className={`flex items-center space-x-2 px-5 py-3 rounded-lg border transition-all duration-500 backdrop-blur-sm ${activeFeature === idx
											? `${condition.bg} border-current ${condition.color} scale-110 shadow-lg ${condition.glow}`
											: 'bg-gray-900/50 border-gray-700 text-gray-500'
											}`}
									>
										<Icon className="w-5 h-5" />
										<span className="font-semibold text-sm uppercase tracking-wide">{condition.label}</span>
									</div>
								);
							})}
						</div>

						<button className="group flex items-center space-x-3 bg-gradient-to-r from-blue-600 hover:from-blue-500 to-purple-600 hover:to-purple-500 shadow-blue-500/50 shadow-lg mx-auto px-10 py-4 border border-blue-400/30 rounded-lg font-bold text-lg hover:scale-105 transition-all transform">
							<span className="tracking-wide">INITIATE PLANNING</span>
							<ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
						</button>
					</div>
				</div>

				{/* Features Section */}
				<div className="py-20 border-gray-800/50 border-t">
					<div className="mx-auto px-6 container">
						<div className="mb-16 text-center">
							<div className="inline-block bg-blue-500/10 mb-4 px-4 py-1 border border-blue-400/30 rounded-full">
								<span className="font-semibold text-blue-400 text-sm tracking-widest">CORE CAPABILITIES</span>
							</div>
							<h2 className="mb-4 font-bold text-4xl md:text-6xl tracking-tight">Advanced Systems</h2>
							<p className="text-gray-400 text-xl">Space-grade technology for Earth-based decisions</p>
						</div>

						<div className="gap-8 grid md:grid-cols-3 mx-auto max-w-6xl">
							{features.map((feature, idx) => {
								const Icon = feature.icon;
								return (
									<div
										key={idx}
										className="group bg-gradient-to-br from-gray-900/80 to-black hover:shadow-blue-500/20 hover:shadow-xl backdrop-blur-sm p-8 border border-gray-800 hover:border-blue-500/50 rounded-xl hover:scale-105 transition-all duration-300 hover:transform"
									>
										<div className="flex justify-center items-center bg-gradient-to-br from-blue-600 to-purple-600 shadow-blue-500/30 shadow-lg mb-6 rounded-lg w-16 h-16 group-hover:rotate-12 transition-transform">
											<Icon className="w-8 h-8" />
										</div>
										<h3 className="mb-3 font-bold text-2xl tracking-wide">{feature.title}</h3>
										<p className="text-gray-400 leading-relaxed">{feature.desc}</p>
									</div>
								);
							})}
						</div>
					</div>
				</div>

				{/* Use Cases Section */}
				<div className="py-20 border-gray-800/50 border-t">
					<div className="mx-auto px-6 container">
						<div className="mb-16 text-center">
							<div className="inline-block bg-purple-500/10 mb-4 px-4 py-1 border border-purple-400/30 rounded-full">
								<span className="font-semibold text-purple-400 text-sm tracking-widest">MISSION PROFILES</span>
							</div>
							<h2 className="mb-4 font-bold text-4xl md:text-6xl tracking-tight">Deployment Scenarios</h2>
							<p className="text-gray-400 text-xl">Optimized for every type of expedition</p>
						</div>

						<div className="gap-6 grid md:grid-cols-2 lg:grid-cols-4 mx-auto max-w-6xl">
							{useCases.map((useCase, idx) => (
								<div
									key={idx}
									className="bg-gradient-to-br from-gray-900/90 to-black hover:shadow-purple-500/20 hover:shadow-xl backdrop-blur-sm p-6 border border-gray-800 hover:border-purple-500/50 rounded-xl transition-all hover:-translate-y-2 duration-300 hover:transform"
								>
									<div className="mb-4 text-5xl">{useCase.icon}</div>
									<h3 className="mb-2 font-bold text-xl tracking-wide">{useCase.title}</h3>
									<p className="text-gray-400 text-sm leading-relaxed">{useCase.desc}</p>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* How It Works Section */}
				<div className="py-20 border-gray-800/50 border-t">
					<div className="mx-auto px-6 container">
						<div className="mb-16 text-center">
							<div className="inline-block bg-cyan-500/10 mb-4 px-4 py-1 border border-cyan-400/30 rounded-full">
								<span className="font-semibold text-cyan-400 text-sm tracking-widest">OPERATION PROTOCOL</span>
							</div>
							<h2 className="mb-4 font-bold text-4xl md:text-6xl tracking-tight">Mission Sequence</h2>
							<p className="text-gray-400 text-xl">Three-phase deployment process</p>
						</div>

						<div className="mx-auto max-w-4xl">
							<div className="space-y-6">
								{[
									{ step: 'PHASE 01', title: 'TARGET COORDINATES', desc: 'Input precise geographic coordinates or select location via interactive orbital map interface', icon: MapPin },
									{ step: 'PHASE 02', title: 'TEMPORAL PARAMETERS', desc: 'Define mission window with date and time specifications for accurate atmospheric modeling', icon: Calendar },
									{ step: 'PHASE 03', title: 'RISK ANALYSIS', desc: 'Receive comprehensive weather threat assessment with probability metrics and recommendations', icon: Satellite }
								].map((item, idx) => {
									const Icon = item.icon;
									return (
										<div key={idx} className="group flex items-start space-x-6">
											<div className="flex flex-col flex-shrink-0 justify-center items-center bg-gradient-to-br from-blue-600 to-purple-600 shadow-blue-500/30 shadow-lg border border-blue-400/30 rounded-lg w-20 h-20 font-bold group-hover:scale-110 transition-transform">
												<Icon className="mb-1 w-6 h-6" />
												<span className="text-xs tracking-wider">{item.step}</span>
											</div>
											<div className="flex-1 bg-gradient-to-r from-gray-900/80 to-black backdrop-blur-sm p-6 border border-gray-800 group-hover:border-blue-500/50 rounded-xl transition-all">
												<h3 className="mb-2 font-bold text-2xl tracking-wide">{item.title}</h3>
												<p className="text-gray-400 leading-relaxed">{item.desc}</p>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					</div>
				</div>

				{/* CTA Section */}
				<div className="py-20 border-gray-800/50 border-t">
					<div className="mx-auto px-6 container">
						<div className="bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 shadow-2xl shadow-blue-500/20 backdrop-blur-sm mx-auto p-12 border border-blue-400/30 rounded-2xl max-w-4xl text-center">
							<Satellite className="mx-auto mb-6 w-24 h-24 text-blue-400 animate-pulse" />
							<h2 className="mb-6 font-bold text-4xl md:text-6xl tracking-tight">
								<span className="bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent">
									Ready for Launch?
								</span>
							</h2>
							<p className="mb-8 text-gray-300 text-xl leading-relaxed">
								Join the next generation of explorers using orbital intelligence for terrestrial adventures
							</p>
							<button className="group flex items-center space-x-3 bg-gradient-to-r from-blue-600 hover:from-blue-500 to-purple-600 hover:to-purple-500 shadow-blue-500/50 shadow-lg mx-auto px-12 py-5 border border-blue-400/30 rounded-lg font-bold text-xl hover:scale-105 transition-all transform">
								<span className="tracking-wide">BEGIN MISSION</span>
								<ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
							</button>
						</div>
					</div>
				</div>

				{/* Footer */}
				<footer className="backdrop-blur-sm py-12 border-gray-800/50 border-t">
					<div className="mx-auto px-6 container">
						<div className="flex md:flex-row flex-col justify-between items-center">
							<div className="flex items-center space-x-3 mb-4 md:mb-0">
								<Satellite className="w-6 h-6 text-blue-400" />
								<div>
									<div className="font-bold text-lg tracking-wider">WEATHERWISE</div>
									<div className="text-gray-500 text-xs tracking-widest">NASA × SPACEX</div>
								</div>
							</div>
							<p className="text-gray-500 text-sm tracking-wide">
								EARTH OBSERVATION SYSTEMS © 2025
							</p>
						</div>
					</div>
				</footer>
			</div>
		</div>
	);
}