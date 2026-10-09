import { Hono } from "hono";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const runGit = (directory: string, args: string[]) =>
  execFileAsync("git", ["-C", directory, ...args], { timeout: 30000, maxBuffer: 10 * 1024 * 1024 });

export const gitRouter = new Hono();

// Get git status
gitRouter.get("/status", async (c) => {
  const directory = c.req.query("directory") || process.cwd();

  try {
    const { stdout } = await runGit(directory, ["status", "--porcelain"]);
    const changes = parseGitStatus(stdout);

    const { stdout: branchOutput } = await runGit(directory, ["branch", "--show-current"]);
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
    const { stdout } = await runGit(directory, ["branch", "-a", "--format=%(refname:short)"]);
    const branches = stdout.trim().split("\n").filter(Boolean);

    const { stdout: currentOutput } = await runGit(directory, ["branch", "--show-current"]);
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
  if (!/^\d+$/.test(limit) || Number(limit) < 1 || Number(limit) > 100) {
    return c.json({ error: "Limit must be an integer between 1 and 100" }, 400);
  }

  try {
    const { stdout } = await runGit(directory, ["log", "--pretty=format:%H|%h|%an|%ae|%s|%ai", "-n", limit]);

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
    const args = ["diff", ...(staged ? ["--staged"] : []), "--", ...(file ? [file] : [])];
    const { stdout } = await runGit(directory, args);

    return c.json({ diff: stdout });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

// Execute git command
gitRouter.post("/command", async (c) => {
  const body = await c.req.json<{ directory?: string; command: string }>();
  const directory = body.directory || process.cwd();

  const commands: Record<string, string[]> = {
    "git status": ["status"],
    "git pull": ["pull"],
    "git fetch": ["fetch"],
    "git add .": ["add", "."],
    "git stash": ["stash"],
    "git stash pop": ["stash", "pop"],
  };
  const args = typeof body.command === "string" ? commands[body.command.trim()] : undefined;
  if (!args || !Array.isArray(args)) {
    return c.json({ error: "Only dashboard quick commands are allowed" }, 400);
  }

  try {
    const { stdout, stderr } = await runGit(directory, args);
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
  const lines = output.split(/\r?\n/).filter(Boolean);

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
