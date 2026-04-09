export type SparklineDescriptor = {
  heights: string[];
  reliability: "none" | "low" | "normal";
  showBars: boolean;
};

export function getCompactSparkline(value: number): SparklineDescriptor {
  if (value <= 0) {
    return { heights: ["20%", "20%", "20%"], reliability: "none", showBars: false };
  }
  if (value < 4) {
    return { heights: ["24%", "28%", "32%"], reliability: "low", showBars: false };
  }
  if (value < 10) {
    return { heights: ["28%", "36%", "44%"], reliability: "low", showBars: true };
  }
  const scale = Math.min(1, Math.log10(value + 1) / 2);
  const bases = [34, 52, 70];
  return {
    heights: bases.map((base) => `${Math.round(base * (0.76 + scale * 0.24))}%`),
    reliability: "normal",
    showBars: true
  };
}
