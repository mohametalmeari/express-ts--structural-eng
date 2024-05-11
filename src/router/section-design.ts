import { Router } from "express";

import { square, squareUnits } from "../controllers/section-design";

export const squareSectionDesign = (router: Router) => {
  router.post("/section-design/square", square);
  router.get("/section-design/square", squareUnits);
};
