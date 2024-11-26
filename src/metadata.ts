import { basename, extname } from "path";
import { Interface } from "readline";

interface Metadata {
  name: string;
  description: string;
  developer: string;
  file: string;
}

function parseInfo(str: string) {
  const lines = str.trim().split("\n");
  const metadata: Metadata = {
    name: "",
    description: "",
    developer: "",
    file: "",
  };

  let isFiles = false;
  const files: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.includes(":") && isFiles) {
      files.push(line.trim());
      continue;
    }
    const [key, value] = line.split(":");
    if (key === "game") {
      metadata.name = value.trim();
    } else if (key === "description") {
      metadata.description = value.trim();
    } else if (key === "developer") {
      metadata.developer = value.trim();
    } else if (key === "file") {
      metadata.file = value.trim();
    } else if (key === "files") {
      isFiles = true;
    }
  }
  const filesMetadata: Metadata[] = [];
  if (isFiles) {
    files.forEach((file, idx) => {
      if (idx === 0) {
        metadata.file = file;
        return;
      }
      filesMetadata.push({
        ...metadata,
        file: file,
        name: basename(file, extname(file)),
      });
    });
  }

  return [metadata, ...filesMetadata];
}

export function parseMetadata(stream: Interface) {
  return new Promise<Metadata[]>(async (resolve, reject) => {
    let start = 0;
    let strbuff = "";
    const gamesInfo = [];
    for await (const line of stream) {
      if (start < 4) {
        start++;
        continue;
      }
      if (line.trim() === "") {
        if (strbuff !== "") {
          gamesInfo.push(...parseInfo(strbuff));
          strbuff = "";
          continue;
        }
      }
      strbuff += line + "\n";
    }
    resolve(gamesInfo);
  });
}
