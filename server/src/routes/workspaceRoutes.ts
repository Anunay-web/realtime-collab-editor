import express
from "express";

import {
  saveWorkspaceData,
  getWorkspaceData,
}
from "../controllers/workspaceController";

const router =
  express.Router();

router.post(
  "/",
  saveWorkspaceData
);

router.get(
  "/:roomId",
  getWorkspaceData
);

export default router;