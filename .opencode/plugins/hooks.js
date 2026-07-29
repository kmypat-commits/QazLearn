export const HooksPlugin = async ({ project, client, $, directory, worktree }) => {
  return {
    "tool.execute.before": async (input, output) => {
      if (input.tool === "read") {
        const filePath = output.args.filePath || "";
        if (filePath.includes(".env")) {
          throw new Error("Blocked: reading .env files is not allowed");
        }
      }

      if (input.tool === "edit" || input.tool === "write") {
        const filePath = output.args.filePath || "";
        const protected = [".env", "package-lock.json", ".git/", "node_modules/"];
        for (const pattern of protected) {
          if (filePath.replace(/\\/g, "/").includes(pattern)) {
            throw new Error("Blocked: " + filePath + " is protected");
          }
        }
      }
    },

    "tool.execute.after": async (input) => {
      if (input.tool === "edit" || input.tool === "write") {
        const filePath = input.args?.filePath || "";

        if (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) {
          try {
            await $`npm run lint 2> nul`;
          } catch {
            // lint may fail — not blocking
          }
        }
      }
    },

    event: async ({ event }) => {
      if (event.type === "session.idle") {
        try {
          const ps = "[System.Console]::Beep(800,200); Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('Готово', 'opencode')";
          await $`powershell -NoProfile -Command ${ps}`;
        } catch {
          // notification failed silently
        }
      }
    },
  };
};
