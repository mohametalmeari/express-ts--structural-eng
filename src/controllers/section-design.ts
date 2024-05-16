import { Request, Response } from "express";

export const square = async (req: Request, res: Response) => {
  try {
    const {
      moment,
      width: b,
      height,
      concrete_cover,
      concrete_compressive_strength: fc,
      steel_yield_strength: fy,
      reinforcement_bars_diameter: diameter,
      draft = false,
    } = req.body;

    // Check if required fields are present
    if (!moment || !b || !height || !fc || !fy) {
      return res.sendStatus(400);
    }

    // Assume default value for concrete cover if not provided
    const a = concrete_cover || 0.1 * height;

    // Convert moment to N.mm
    const m = moment * 10 ** 6;

    // Calculate depth of reinforcement bars from top
    const depth = height - a;

    const areaCo = m / (0.9 * 0.85 * fc * b * depth ** 2);
    if (areaCo > 0.5) {
      return res.status(400).json({ error: "Invalid section" }).end();
    }

    const alphaCo = 1 - (1 - 2 * areaCo) ** 0.5;
    const alphaMaxCo = 267.75 / (630 + fy);

    let gamaCo, reinforcementArea, compReinforcementArea;

    if (alphaCo < alphaMaxCo) {
      gamaCo = 1 - 0.5 * alphaCo;
      reinforcementArea = m / (0.9 * gamaCo * depth * fy);
    } else {
      const yMax = depth * alphaMaxCo;
      const areaMaxCo = alphaMaxCo * (1 - 0.5 * alphaMaxCo);
      const mMax = 0.9 * 0.85 * fc * areaMaxCo * b * depth ** 2;
      const mComp = m - mMax;
      const fs = Math.min((630 * (yMax - 0.85 * a)) / yMax, fy);
      compReinforcementArea = mComp / (0.9 * fs * (depth - a));

      gamaCo = 1 - 0.5 * alphaMaxCo;
      reinforcementArea =
        mMax / (0.9 * gamaCo * depth * fy) + (compReinforcementArea * fs) / fy;
    }

    // Compare reinforcement area with minimum value
    const minReinforcementArea = (0.9 / fy) * b * depth;
    reinforcementArea = Math.max(reinforcementArea, minReinforcementArea);

    // Compare reinforcement area with maximum value
    const maxReinforcementArea =
      0.75 * (455 / (630 + fy)) * (fc / fy) * b * depth;
    if (reinforcementArea > maxReinforcementArea) {
      return res.status(400).json({ error: "Invalid section" }).end();
    }

    // Calculate bars number and area for tension reinforcement
    const bottomBarsCount = Math.max(
      Math.ceil(reinforcementArea / (Math.PI * (diameter / 2) ** 2)),
      2
    );
    const bottomBarsArea = bottomBarsCount * (Math.PI * (diameter / 2) ** 2);

    // Calculate bars number and area for compression reinforcement
    const topBarsCount = Math.max(
      Math.ceil(compReinforcementArea / (Math.PI * (diameter / 2) ** 2)),
      2
    );
    const topBarsArea = topBarsCount * (Math.PI * (diameter / 2) ** 2);

    // Prepare response
    const result = {
      "Bottom Reinforcement": {
        area: reinforcementArea,
        ...(diameter && {
          bars: { number: bottomBarsCount, diameter, area: bottomBarsArea },
        }),
      },
      ...(compReinforcementArea && {
        "Top Reinforcement": {
          area: compReinforcementArea,
          ...(diameter && {
            bars: { number: topBarsCount, diameter, area: topBarsArea },
          }),
        },
      }),
      unit: "mm2",
    };

    return res
      .status(200)
      .json({
        result,
        ...(draft
          ? {
              draft: {
                "Concrete Cover": a,
                "Depth of Reinforcement": depth,
                Coefficients: {
                  Area: areaCo,
                  Alpha: alphaCo,
                  "Alpha Max": alphaMaxCo,
                  Gama: gamaCo,
                },
                "Minimum Reinforcement Area": minReinforcementArea,
                "Maximum Reinforcement Area": maxReinforcementArea,
                "Bottom Reinforcement Area": reinforcementArea,
                "Top Reinforcement Area": compReinforcementArea,
                "Reinforcement Type": !compReinforcementArea
                  ? "Tension"
                  : "Tension + Compression",
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
      moment: "kN.m",
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
