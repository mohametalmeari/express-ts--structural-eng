import { Router } from "express";

import {
  rectangular,
  rectangularUnits,
  flanged,
  flangedUnits,
} from "../controllers/section-design";

export const rectangularSectionDesign = (router: Router) => {
  router.post("/section-design/rectangular", rectangular);
  router.get("/section-design/rectangular", rectangularUnits);
};

export const flangedSectionDesign = (router: Router) => {
  router.post("/section-design/flanged", flanged);
  router.get("/section-design/flanged", flangedUnits);
};
