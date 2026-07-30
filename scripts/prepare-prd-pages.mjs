import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const outputRoot = path.join(
  repositoryRoot,
  "dist",
  "prd",
  "equipment-location",
);

const files = [
  {
    source: "prd-设备位置管理-最新版.html",
    destination: "index.html",
  },
  {
    source: "prd-设备位置管理-最新版.md",
    destination: "prd-设备位置管理-最新版.md",
  },
  {
    source: "prd-assets/prd-annotations.css",
    destination: "prd-assets/prd-annotations.css",
  },
  {
    source: "scripts/prd-annotations.js",
    destination: "scripts/prd-annotations.js",
  },
  ...[
    "01-page-overview.png",
    "02-device-tree.png",
    "03-floor-plan.png",
    "04-auto-group.png",
    "05-position-edit.png",
    "06-marker-realtime.png",
  ].map((fileName) => ({
    source: `prd-assets/device-location/${fileName}`,
    destination: `prd-assets/device-location/${fileName}`,
  })),
];

const ensureRepositoryPath = (targetPath) => {
  const absolutePath = path.resolve(targetPath);
  const repositoryPrefix = `${repositoryRoot}${path.sep}`;
  if (!absolutePath.startsWith(repositoryPrefix)) {
    throw new Error(`Unsafe repository path: ${absolutePath}`);
  }
  return absolutePath;
};

ensureRepositoryPath(outputRoot);

for (const file of files) {
  const sourcePath = ensureRepositoryPath(
    path.join(repositoryRoot, file.source),
  );
  const destinationPath = ensureRepositoryPath(
    path.join(outputRoot, file.destination),
  );

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing PRD deployment source: ${file.source}`);
  }

  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.copyFileSync(sourcePath, destinationPath);
}

console.log(
  JSON.stringify(
    {
      route: "/prd/equipment-location/",
      outputRoot,
      files: files.map((file) => file.destination),
    },
    null,
    2,
  ),
);
