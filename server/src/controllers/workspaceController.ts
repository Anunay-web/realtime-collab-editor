import { Request, Response }
from "express";

import WorkspaceData
from "../models/WorkspaceData";

export const saveWorkspaceData =
async (
  req: Request,
  res: Response
) => {

  const {
    roomId,
    reviewNotes,
    patientName,
    patientAge,
    diagnosis,
    assignment,
  } = req.body;

  const data =
    await WorkspaceData.findOneAndUpdate(
      { roomId },

      {
        roomId,
        reviewNotes,
        patientName,
        patientAge,
        diagnosis,
        assignment,
      },

      {
        upsert: true,
        new: true,
      }
    );

  res.json(data);
};

export const getWorkspaceData =
async (
  req: Request,
  res: Response
) => {

  const data =
    await WorkspaceData.findOne({
      roomId:
        req.params.roomId,
    });

  res.json(data);
};