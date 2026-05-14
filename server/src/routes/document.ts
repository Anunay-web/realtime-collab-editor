import express from "express";

import {
  createDocument,
  getDocuments,
  deleteDocument,
  saveDocument,
  getDocumentByRoomId
} from "../controllers/documentController";

const router =
  express.Router();

router.post(
  "/",
  createDocument
);

router.get(
  "/",
  getDocuments
);

router.delete(
  "/:id",
  deleteDocument
);

router.post(
  "/save",
  saveDocument
);

router.get(
"/room/:roomId",
getDocumentByRoomId
);

export default router;