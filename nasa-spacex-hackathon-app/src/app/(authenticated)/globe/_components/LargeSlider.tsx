import React from 'react';

export default function LargeSlider({ value = 0 }: { value?: number }) {
	const pct = Math.min(100, Math.max(0, value));
	return (
		<div className="bg-gradient-to-b from-white/6 to-white/3 shadow-lg backdrop-blur-md p-4 border border-white/6 rounded-2xl">
			<div className="relative bg-muted/60 rounded-full w-full h-8">
				<div className="top-0 bottom-0 left-0 absolute bg-gradient-to-r from-yellow-400 via-sky-400 to-indigo-600 rounded-full" style={{ width: `${pct}%` }} />
			</div>
			<div className="flex justify-between items-center mt-3 font-semibold text-base">
				<div className="text-yellow-300 text-lg">☀️ Sunny</div>
				<div className="text-sky-300 text-lg">🌥️ Gloomy</div>
				<div className="text-indigo-300 text-lg">🌧️ Rainy</div>
			</div>
		</div>
	);
}