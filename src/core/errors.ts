interface ApsrtUserErrorOptions {
  title: string;
  locations?: string[];
  hint?: string;
}

export class ApsrtUserError extends Error {
  title: string;
  locations: string[];
  hint?: string;

  constructor(options: ApsrtUserErrorOptions) {
    super(buildPlainMessage(options));
    this.name = "ApsrtUserError";
    this.title = options.title;
    this.locations = options.locations ?? [];
    this.hint = options.hint;
    this.stack = undefined;
  }
}

export function isApsrtUserError(error: unknown): error is ApsrtUserError {
  return error instanceof ApsrtUserError;
}

export function formatApsrtUserError(error: ApsrtUserError, useColor: boolean) {
  if (!useColor) {
    return buildPlainMessage({
      title: error.title,
      locations: error.locations,
      hint: error.hint,
    });
  }

  const red = "\u001B[31m";
  const cyan = "\u001B[36m";
  const gray = "\u001B[90m";
  const bold = "\u001B[1m";
  const reset = "\u001B[0m";
  const errorEmoji = "🚨";
  const locationEmoji = "📍";
  const hintEmoji = "💡";

  const lines = [`${errorEmoji} ${red}${bold}ERROR${reset} ${error.title}`];

  if (error.locations.length === 1) {
    lines.push(
      `${locationEmoji} ${gray}at${reset} ${cyan}${error.locations[0]}${reset}`
    );
  }

  if (error.locations.length > 1) {
    lines.push(`${locationEmoji} ${gray}at${reset}`);
    lines.push(
      ...error.locations.map((location) => `  ${cyan}${location}${reset}`)
    );
  }

  if (error.hint) {
    lines.push(`${hintEmoji} ${gray}tip${reset} ${error.hint}`);
  }

  return lines.join("\n");
}

export function createLikelyNondeterministicFunctionError(locations: string[]) {
  return new ApsrtUserError({
    title:
      locations.length === 1
        ? "Likely nondeterministic function detected."
        : "Likely nondeterministic functions detected.",
    locations,
    hint: "Add @apsrt-ignore annotation.",
  });
}

function buildPlainMessage(options: ApsrtUserErrorOptions) {
  const lines = [options.title];

  if (options.locations?.length) {
    lines.push(...options.locations);
  }

  if (options.hint) {
    lines.push(`Tip: ${options.hint}`);
  }

  return lines.join("\n");
}
