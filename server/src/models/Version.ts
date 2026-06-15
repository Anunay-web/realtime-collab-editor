import mongoose from "mongoose";

const versionSchema =
  new mongoose.Schema(
    {
      roomId: {
        type: String,
        required: true,
      },

      content: {
        type: String,
        required: true,
      },
    },
    {
      timestamps: true,
    }
  );

export default mongoose.model(
  "Version",
  versionSchema
);