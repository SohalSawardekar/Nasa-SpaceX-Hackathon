import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "WeatherWise - NASA SpaceX Weather Intelligence",
	description: "Advanced weather forecasting and risk assessment powered by NASA Earth observation data and SpaceX technology.",
	keywords: ["weather", "NASA", "SpaceX", "satellite", "forecasting", "risk assessment"],
	authors: [{ name: "WeatherWise Team" }],
	openGraph: {
		title: "WeatherWise - NASA SpaceX Weather Intelligence",
		description: "Advanced weather forecasting and risk assessment powered by NASA Earth observation data.",
		type: "website",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" >
			<body className="min-h-screen font-sans antialiased">
				{children}
			</body>
		</html>
	);
}
