import { Request, Response } from "express";

import Version from "../models/Version";

export const getVersions =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const versions =
        await Version.find({
          roomId:
            req.params.roomId,
        })
          .sort({
            createdAt: -1,
          })
          .limit(20);

      res.json(versions);

    } catch {

      res.status(500).json({
        message:
          "Failed to fetch versions",
      });
    }
  };