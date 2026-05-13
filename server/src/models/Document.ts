import mongoose from "mongoose";

const documentSchema =
  new mongoose.Schema(
    {
      title: {
        type: String,
        default: "Untitled Document",
      },

      content: {
        type: String,
        default: "",
      },

      owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },

      roomId: {
        type: String,
        required: true,
      },
    },
    {
      timestamps: true,
    }
  );

export default mongoose.model(
  "Document",
  documentSchema
);