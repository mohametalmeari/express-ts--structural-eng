import { Router } from "express";

import {
  square,
  squareUnits,
  flanged,
  flangedUnits,
} from "../controllers/section-design";

export const squareSectionDesign = (router: Router) => {
  router.post("/section-design/square", square);
  router.get("/section-design/square", squareUnits);
};

export const flangedSectionDesign = (router: Router) => {
  router.post("/section-design/flanged", flanged);
  router.get("/section-design/flanged", flangedUnits);
};
