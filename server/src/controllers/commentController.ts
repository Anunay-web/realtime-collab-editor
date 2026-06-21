import { Request, Response } from "express";

import Comment from "../models/Comment";
import { error } from "console";

export const getComments =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const comments =
        await Comment.find({
          roomId:
            req.params.roomId,
        }).sort({
          createdAt: -1,
        });

      res.json(comments);

    } catch {

      res.status(500).json({
        message:
          "Failed to fetch comments",
      });
    }
  };

export const addComment =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      console.log(
        "COMMENT BODY:",
        req.body
      );

      const comment =
        await Comment.create(
          req.body
        );
        console.error(
  "COMMENT ERROR:",
  error
);

      console.log(
        "COMMENT SAVED:",
        comment
      );
      console.log({
  roomId: req.body.roomId,
  username: req.body.username,
  text: req.body.text,
});

      res.status(201).json(
        comment
      );

    } catch (error) {

      console.error(
        "COMMENT ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Failed to add comment",
      });
    }
  };