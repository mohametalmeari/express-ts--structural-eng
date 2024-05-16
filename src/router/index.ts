import { Router } from "express";

import {
  rectangularSectionDesign,
  flangedSectionDesign,
} from "./section-design";

const router = Router();

export default (): Router => {
  rectangularSectionDesign(router);
  flangedSectionDesign(router);
  return router;
};
