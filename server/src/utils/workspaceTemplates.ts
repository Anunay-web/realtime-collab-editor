export const getWorkspaceTemplate = (
  workspaceType: string
) => {

  switch (workspaceType) {

    case "developer":
      return `// Welcome to Dev Workspace

function main() {
  console.log("Start coding...");
}

main();
`;

    case "medical":
      return `# Patient Case File

Patient Name:

Age:

Symptoms:

Diagnosis:

Prescription:

Doctor Notes:
`;

    case "classroom":
      return `# Lesson Plan

Topic:

Objectives:

Lecture Notes:

Homework:

Questions:
`;

    default:
      return "";
  }
};