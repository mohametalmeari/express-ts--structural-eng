import { Request, Response } from "express";

type result = {
  area: number;
  unit: string;
  bars?: { number: number; diameter: number; area: number };
};

export const square = async (req: Request, res: Response) => {
  try {
    const {
      moment: m,
      width: b,
      height: h,
      concrete_cover: a,
      concrete_compressive_strength: fc,
      steel_yield_strength: fy,
      reinforcement_bars_diameter: d,
    } = req.body;

    // Check if required fields are present
    if (!m || !b || !h || !fc || !fy) {
      return res.sendStatus(400);
    }

    const depth = h - (a || 0.1 * h);

    const areaCo = m / (0.9 * 0.85 * fc * b * depth ** 2);

    const alphaCo = 1 - (1 - 2 * areaCo) ** 0.5;
    const alphaMaxCo = 267.75 / (630 + fy);

    if (alphaCo > alphaMaxCo) {
      return res.status(400).json({ error: "Invalid section" }).end();
    }

    const gamaCo = 1 - 0.5 * alphaCo;

    const reinforcementArea = m / (0.9 * gamaCo * depth * fy);

    const barsCount = Math.max(
      Math.ceil(reinforcementArea / (Math.PI * (d / 2) ** 2)),
      2
    );

    const barsArea = barsCount * (Math.PI * (d / 2) ** 2);

    const result: result = { area: reinforcementArea, unit: "mm2" };

    d && (result.bars = { number: barsCount, diameter: d, area: barsArea });

    return res.status(200).json({ result }).end();
  } catch (error) {
    console.log(error);
    return res.sendStatus(400);
  }
};

export const squareUnits = async (req: Request, res: Response) => {
  try {
    const units = {
      moment: "N.mm",
      width: "mm",
      height: "mm",
      concrete_cover: "mm (default: 10% of height)",
      concrete_compressive_strength: "MPa",
      steel_yield_strength: "MPa",
      reinforcement_bars_diameter: "mm (optional)",
    };

    return res.status(200).json({ units }).end();
  } catch (error) {
    console.log(error);
    return res.sendStatus(400);
  }
};
