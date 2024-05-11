import { Router } from "express";

import { squareSectionDesign } from "./section-design";

const router = Router();

export default (): Router => {
  squareSectionDesign(router);
  return router;
};
