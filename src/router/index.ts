import { Router } from "express";

import { squareSectionDesign, flangedSectionDesign } from "./section-design";

const router = Router();

export default (): Router => {
  squareSectionDesign(router);
  flangedSectionDesign(router);
  return router;
};
