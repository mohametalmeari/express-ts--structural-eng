import { Request, Response } from "express";

export const square = async (req: Request, res: Response) => {
  try {
    const {
      moment: m,
      width: b,
      height: h,
      concrete_cover,
      concrete_compressive_strength: fc,
      steel_yield_strength: fy,
      reinforcement_bars_diameter: d,
      draft = false,
    } = req.body;

    // Check if required fields are present
    if (!m || !b || !h || !fc || !fy) {
      return res.sendStatus(400);
    }

    const a = concrete_cover || 0.1 * h;

    const depth = h - a;

    const areaCo = m / (0.9 * 0.85 * fc * b * depth ** 2);

    const alphaCo = 1 - (1 - 2 * areaCo) ** 0.5;
    const alphaMaxCo = 267.75 / (630 + fy);

    let gamaCo = 1 - 0.5 * alphaCo;
    let reinforcementArea = m / (0.9 * gamaCo * depth * fy);
    if (alphaCo > alphaMaxCo) {
      gamaCo = 1 - 0.5 * alphaMaxCo;
      const yMax = depth * alphaMaxCo;
      const areaMaxCo = alphaMaxCo * (1 - 0.5 * alphaMaxCo);
      const mMax = 0.9 * 0.85 * fc * areaMaxCo * b * depth ** 2;
      const mComp = m - mMax;
      const fs = Math.min((630 * (yMax - 0.85 * a)) / yMax, fy);
      const compReinforcementArea = mComp / (0.9 * fs * (depth - a));
      reinforcementArea =
        mMax / (0.9 * gamaCo * depth * fy) + (compReinforcementArea * fs) / fy;
    }

    const barsCount = Math.max(
      Math.ceil(reinforcementArea / (Math.PI * (d / 2) ** 2)),
      2
    );

    const barsArea = barsCount * (Math.PI * (d / 2) ** 2);

    const result = {
      area: reinforcementArea,
      unit: "mm2",
      ...(d && { bars: { number: barsCount, diameter: d, area: barsArea } }),
    };

    return res
      .status(200)
      .json({
        result,
        ...(draft
          ? {
              draft: {
                a,
                depth,
                areaCo,
                alphaCo,
                alphaMaxCo,
                gamaCo,
                reinforcementArea,
                barsCount,
                barsArea,
              },
            }
          : {}),
      })
      .end();
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

export const flanged = async (req: Request, res: Response) => {
  try {
    const {
      moment,
      flange_width: bf,
      web_width: bw,
      flange_thickness: tf,
      height: h,
      concrete_cover: a,
      concrete_compressive_strength: fc,
      steel_yield_strength: fy,
      reinforcement_bars_diameter: d,
      negative_moment: isNegative = false,
    } = req.body;

    // Check if required fields are present
    if (!moment || !bf || !bw || !tf || !h || !fc || !fy) {
      return res.sendStatus(400);
    }

    const depth = h - (a || 0.1 * h);

    const inFlange = moment < 0.9 * 0.85 * fc * tf * bf * (depth - 0.5 * tf);

    const m =
      isNegative || inFlange
        ? moment
        : moment - 0.9 * 0.85 * fc * tf * (bf - bw) * (depth - 0.5 * tf);

    const b = isNegative || !inFlange ? bw : bf;

    const areaCo = m / (0.9 * 0.85 * fc * b * depth ** 2);
    const alphaCo = 1 - (1 - 2 * areaCo) ** 0.5;
    const alphaMaxCo = 267.75 / (630 + fy);

    if (alphaCo > alphaMaxCo) {
      return res.status(400).json({ error: "Invalid section" }).end();
    }

    const gamaCo = 1 - 0.5 * alphaCo;

    const reinforcementArea =
      m / (0.9 * gamaCo * depth * fy) +
      (isNegative || inFlange ? 0 : 0.85 * (fc / fy) * tf * (bf - bw));

    const barsCount = Math.max(
      Math.ceil(reinforcementArea / (Math.PI * (d / 2) ** 2)),
      2
    );

    const barsArea = barsCount * (Math.PI * (d / 2) ** 2);

    const result = {
      area: reinforcementArea,
      unit: "mm2",
      ...(d && { bars: { number: barsCount, diameter: d, area: barsArea } }),
    };

    return res.status(200).json({ result }).end();
  } catch (error) {
    console.log(error);
    return res.sendStatus(400);
  }
};

export const flangedUnits = async (req: Request, res: Response) => {
  try {
    const units = {
      moment: "N.mm",
      flange_width: "mm",
      web_width: "mm",
      flange_thickness: "mm",
      height: "mm",
      concrete_cover: "mm (default: 10% of height)",
      concrete_compressive_strength: "MPa",
      steel_yield_strength: "MPa",
      reinforcement_bars_diameter: "mm (optional)",
      negative_moment: "boolean (optional)",
    };

    return res.status(200).json({ units }).end();
  } catch (error) {
    console.log(error);
    return res.sendStatus(400);
  }
};
