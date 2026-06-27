import mongoose from "mongoose";

const workspaceDataSchema =
  new mongoose.Schema(
    {
      roomId: {
        type: String,
        required: true,
        unique: true,
      },

      reviewNotes: {
        type: String,
        default: "",
      },

      patientName: {
        type: String,
        default: "",
      },

      patientAge: {
        type: String,
        default: "",
      },

      diagnosis: {
        type: String,
        default: "",
      },

      assignment: {
        type: String,
        default: "",
      },
    },
    {
      timestamps: true,
    }
  );

export default mongoose.model(
  "WorkspaceData",
  workspaceDataSchema
);