import axios from "axios";
import { Request, Response }
from "express";

export const runCode =
  async (req: Request,
     res: Response) => {
    try {

      const {
        language,
        code,
      } = req.body;

      const response =
        await axios.post(
          "https://emkc.org/api/v2/piston/execute",
          {
            language,
            version: "*",
            files: [
              {
                content: code,
              },
            ],
          }
        );

      res.json(
        response.data
      );

    } catch (error: any) {

  console.error(
    "COMPILER ERROR:",
    error.response?.data || error
  );

  res.status(500).json({
    message: "Execution failed",
    error:
      error.response?.data ||
      error.message,
  });
}
  };