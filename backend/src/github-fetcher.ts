export interface FileContent {
  path: string;
  content: string;
}

export async function fetchGithubRepo(
  url: string,
  token?: string,
): Promise<FileContent[]> {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) {
    throw new Error("Invalid GitHub URL");
  }
  const [_, owner, repo] = match;

  const headers: HeadersInit = {
    "User-Agent": "EdgeInsight-Worker",
    Accept: "application/vnd.github.v3+json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // 1. Fetch the git tree (recursive) to get all files
  // Using the defaults branch (usually main or master)
  // To be more robust we could fetch /repos/{owner}/{repo} to get default_branch first
  const repoInfoRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    { headers },
  );
  if (!repoInfoRes.ok) {
    throw new Error(
      `Failed to fetch repo info: ${repoInfoRes.status} ${repoInfoRes.statusText}`,
    );
  }
  const repoInfo = await repoInfoRes.json();
  const defaultBranch = (repoInfo as any).default_branch || "main";

  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`;
  const treeRes = await fetch(treeUrl, { headers });
  if (!treeRes.ok) {
    throw new Error(
      `Failed to fetch repo tree: ${treeRes.status} ${treeRes.statusText}`,
    );
  }

  const treeData = await treeRes.json();
  const tree = (treeData as any).tree as Array<{
    path: string;
    type: string;
    url: string;
  }>;

  // 2. Filter files
  const textExtensions = [
    ".ts",
    ".js",
    ".jsx",
    ".tsx",
    ".go",
    ".rs",
    ".py",
    ".java",
    ".c",
    ".cpp",
    ".h",
    ".md",
    ".json",
    ".toml",
    ".yaml",
    ".yml",
    ".css",
    ".html",
  ];

  const filesToFetch = tree.filter((node) => {
    if (node.type !== "blob") return false;
    // Skip lockfiles, images, etc.
    if (
      node.path.includes("package-lock.json") ||
      node.path.includes("yarn.lock")
    )
      return false;
    // Skip node_modules (though recursive tree might not include them if not committed)
    if (node.path.includes("node_modules/")) return false;

    return textExtensions.some((ext) => node.path.endsWith(ext));
  });

  // Cap the number of files to prevent blowing up the worker
  const limitedFiles = filesToFetch.slice(0, 50);

  // 3. Fetch content (blobs)
  // We can use the 'url' from the tree which points to the blob API,
  // but that returns base64 encoded content.
  // Alternatively, fetch raw content via: https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}
  // The Blob API is more reliable for specific sha, but requires decoding.

  const results: FileContent[] = [];

  // Batch requests to avoid hitting rate limits too hard or overwhelming the runtime
  const BATCH_SIZE = 5;
  for (let i = 0; i < limitedFiles.length; i += BATCH_SIZE) {
    const batch = limitedFiles.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (node) => {
      const blobRes = await fetch(node.url, { headers });
      if (!blobRes.ok) return null;
      const blobData = await blobRes.json();
      // content is base64 encoded
      const content = atob((blobData as any).content.replace(/\n/g, ""));
      return { path: node.path, content };
    });

    const batchResults = await Promise.all(promises);
    batchResults.forEach((r) => {
      if (r) results.push(r);
    });
  }

  return results;
}
