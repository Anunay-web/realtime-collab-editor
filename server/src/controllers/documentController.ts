import { Request, Response } from "express";

import Document from "../models/Document";

import { v4 as uuidv4 } from "uuid";

// create document

export const createDocument =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const { title } = req.body;

      const newDocument =
        await Document.create({
          title,
          roomId: uuidv4(),
        });

      res.status(201).json(
        newDocument
      );

    } catch (error) {

      res.status(500).json({
        message:
          "Failed to create document",
      });
    }
  };

    // get all documents

export const getDocuments =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const documents =
        await Document.find().sort({
          createdAt: -1,
        });

      res.json(documents);

    } catch (error) {

      res.status(500).json({
        message:
          "Failed to fetch documents",
      });
    }
  };

  //delete document

export const deleteDocument =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      await Document.findByIdAndDelete(
        req.params.id
      );

      res.json({
        message:
          "Document deleted",
      });

    } catch (error) {

      res.status(500).json({
        message:
          "Failed to delete document",
      });
    }
  };