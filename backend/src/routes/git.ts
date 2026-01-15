import { Hono } from "hono";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const gitRouter = new Hono();

// Get git status
gitRouter.get("/status", async (c) => {
  const directory = c.req.query("directory") || process.cwd();

  try {
    const { stdout } = await execAsync(`git -C "${directory}" status --porcelain`);
    const changes = parseGitStatus(stdout);

    const { stdout: branchOutput } = await execAsync(
      `git -C "${directory}" branch --show-current`
    );
    const branch = branchOutput.trim();

    return c.json({
      branch,
      changes,
      uncommittedCount: changes.length,
    });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

// Get branches
gitRouter.get("/branches", async (c) => {
  const directory = c.req.query("directory") || process.cwd();

  try {
    const { stdout } = await execAsync(
      `git -C "${directory}" branch -a --format="%(refname:short)"`
    );
    const branches = stdout.trim().split("\n").filter(Boolean);

    const { stdout: currentOutput } = await execAsync(
      `git -C "${directory}" branch --show-current`
    );
    const current = currentOutput.trim();

    return c.json({
      current,
      branches,
    });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

// Get commit log
gitRouter.get("/log", async (c) => {
  const directory = c.req.query("directory") || process.cwd();
  const limit = c.req.query("limit") || "20";

  try {
    const { stdout } = await execAsync(
      `git -C "${directory}" log --pretty=format:"%H|%h|%an|%ae|%s|%ai" -n ${limit}`
    );

    const commits = stdout
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [hash, shortHash, author, email, message, date] = line.split("|");
        return { hash, shortHash, author, email, message, date };
      });

    return c.json(commits);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

// Get diff
gitRouter.get("/diff", async (c) => {
  const directory = c.req.query("directory") || process.cwd();
  const file = c.req.query("file");
  const staged = c.req.query("staged") === "true";

  try {
    const stagedFlag = staged ? "--staged" : "";
    const fileArg = file ? `-- "${file}"` : "";

    const { stdout } = await execAsync(
      `git -C "${directory}" diff ${stagedFlag} ${fileArg}`
    );

    return c.json({ diff: stdout });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

// Execute git command
gitRouter.post("/command", async (c) => {
  const body = await c.req.json<{ directory?: string; command: string }>();
  const directory = body.directory || process.cwd();

  // Validate it's a git command
  if (!body.command.trim().startsWith("git ")) {
    return c.json({ error: "Only git commands are allowed" }, 400);
  }

  // Block dangerous commands
  const dangerous = ["push --force", "reset --hard", "clean -fd"];
  if (dangerous.some((d) => body.command.includes(d))) {
    return c.json({ error: "This command is blocked for safety" }, 400);
  }

  try {
    const { stdout, stderr } = await execAsync(body.command, { cwd: directory });
    return c.json({ stdout, stderr });
  } catch (error: any) {
    return c.json({
      error: error.message,
      stdout: error.stdout,
      stderr: error.stderr,
    }, 500);
  }
});

// Helper to parse git status output
function parseGitStatus(output: string): Array<{
  status: string;
  file: string;
  staged: boolean;
}> {
  const lines = output.trim().split("\n").filter(Boolean);

  return lines.map((line) => {
    const statusCode = line.substring(0, 2);
    const file = line.substring(3);

    let status = "modified";
    let staged = false;

    const indexStatus = statusCode[0];
    const workingStatus = statusCode[1];

    if (indexStatus === "A" || workingStatus === "A") status = "added";
    if (indexStatus === "D" || workingStatus === "D") status = "deleted";
    if (indexStatus === "R" || workingStatus === "R") status = "renamed";
    if (indexStatus === "?" && workingStatus === "?") status = "untracked";

    if (indexStatus !== " " && indexStatus !== "?") staged = true;

    return { status, file, staged };
  });
}
