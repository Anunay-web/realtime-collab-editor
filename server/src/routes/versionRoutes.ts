import express from "express";

import {
  getVersions,
} from "../controllers/versionController";

const router =
  express.Router();

router.get(
  "/:roomId",
  getVersions
);

export default router;