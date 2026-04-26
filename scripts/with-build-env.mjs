import { spawn } from "node:child_process";

const [, , command, ...args] = process.argv;

if (!command) {
  console.error("Usage: node scripts/with-build-env.mjs <command> [...args]");
  process.exit(1);
}

const buildEnvDefaults = {
  DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/footballfomo",
  DIRECT_URL: "postgresql://postgres:postgres@localhost:5432/footballfomo",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "build-placeholder",
  SUPABASE_SERVICE_ROLE_KEY: "build-placeholder",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  NEXT_PUBLIC_DEFAULT_LOCALE: "fr",
};

const hasRealSupabaseEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const resolvedCommand =
  process.platform === "win32" && command === "npm" ? "npm.cmd" : command;

function quoteWindowsArg(arg) {
  if (/^[A-Za-z0-9_./:=@-]+$/.test(arg)) return arg;
  return `"${arg.replace(/"/g, '\\"')}"`;
}

const env = {
  ...buildEnvDefaults,
  ...process.env,
  SUPABASE_BUILD_PLACEHOLDER:
    process.env.SUPABASE_BUILD_PLACEHOLDER ?? (hasRealSupabaseEnv ? "0" : "1"),
};

const child =
  process.platform === "win32"
    ? spawn(
        process.env.ComSpec ?? "cmd.exe",
        [
          "/d",
          "/s",
          "/c",
          [resolvedCommand, ...args].map(quoteWindowsArg).join(" "),
        ],
        { stdio: "inherit", env }
      )
    : spawn(resolvedCommand, args, {
        stdio: "inherit",
        env,
      });

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
