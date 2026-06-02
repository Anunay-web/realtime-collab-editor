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
          updatedAt: -1,
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

// save document content

export const saveDocument =
async (
req: Request,
res: Response
) => {

try {

  const {
    roomId,
    content,
  } = req.body;

  await Document.findOneAndUpdate(
    { roomId },

    {
      content,
    }
  );

  res.json({
    message:
      "Document saved",
  });

} catch (error) {

  res.status(500).json({
    message:
      "Save failed",
  });
}

};

export const getDocumentByRoomId =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const document =
        await Document.findOne({
          roomId:
            req.params.roomId,
        });

      if (!document) {

        return res.status(404).json({
          message:
            "Document not found",
        });
      }

      res.json(document);

    } catch (error) {

      res.status(500).json({
        message:
          "Failed to fetch document",
      });
    }
  };

  export const updateDocumentTitle =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const { title } = req.body;

      const document =
        await Document.findByIdAndUpdate(
          req.params.id,
          { title },
          { new: true }
        );

      res.json(document);

    } catch (error) {

      res.status(500).json({
        message:
          "Failed to update title",
      });
    }
  };

  export const toggleFavorite =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const document =
        await Document.findById(
          req.params.id
        );

      if (!document) {

        return res.status(404).json({
          message:
            "Document not found",
        });
      }

      document.favorite =
        !document.favorite;

      await document.save();

      res.json(document);

    } catch (error) {

      res.status(500).json({
        message:
          "Failed to update favorite",
      });
    }
  };