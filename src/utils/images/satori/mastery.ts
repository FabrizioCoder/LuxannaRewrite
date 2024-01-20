import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { ChartConfiguration } from "chart.js";

export async function makeMasteryGraphic(values: ProfileGraphicValue[]) {
	const width = 840;
	const height = 320;
	const configuration: ChartConfiguration = {
		type: "bar",
		data: {
			labels: values.map((x) => `${x.champion} (${x.score.toLocaleString()})`),
			datasets: [
				{
					label: "Points",
					data: values.map((x) => x.score),
					backgroundColor: [
						"rgba(54, 162, 235, 0.2)",
						"rgba(255, 99, 132, 0.2)",
						"rgba(255, 206, 86, 0.2)",
						"rgba(75, 192, 192, 0.2)",
						"rgba(153, 102, 255, 0.2)",
					],
					borderColor: [
						"rgba(54, 162, 235, 0.8)",
						"rgba(255, 99, 132, 0.8)",
						"rgba(255, 206, 86, 0.8)",
						"rgba(75, 192, 192, 0.8)",
						"rgba(153, 102, 255, 0.8)",
					],
					borderWidth: 1,
					borderRadius: 3,
					borderSkipped: false,
				},
			],
		},
		options: {
			plugins: {
				title: {
					display: false,
				},
				legend: {
					display: false,
				},
			},
		},
		plugins: [
			{
				id: "background-colour",
				beforeDraw: (chart) => {
					const ctx = chart.ctx;
					ctx.save();
					ctx.fillStyle = "#303135";
					ctx.fillRect(0, 0, width, height);
					ctx.restore();
				},
			},
		],
	};
	const chartJSNodeCanvas = new ChartJSNodeCanvas({
		width,
		height,
		chartCallback: (ChartJS) => {
			ChartJS.defaults.responsive = true;
			ChartJS.defaults.maintainAspectRatio = false;
			// ChartJS.defaults.font.family = '"Helvetica"';
			ChartJS.defaults.color = "#d6d6d6";
			ChartJS.defaults.font.size = 15;
		},
	});

	const buffer = await chartJSNodeCanvas.renderToBuffer(configuration);
	return buffer;
}

interface ProfileGraphicValue {
	champion: string;
	score: number;
}
