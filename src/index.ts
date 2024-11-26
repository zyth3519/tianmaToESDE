import { basename, extname, join } from "path";
import {
  copyFileSync,
  createReadStream,
  existsSync,
  mkdirSync,
  readdirSync,
  writeFileSync,
} from "fs";
import { parseMetadata } from "./metadata";
import { createInterface } from "readline";
import { Builder } from "xml2js";

const __dirname = process.cwd();
const respath = join(__dirname, "res");
const outputpath = join(__dirname, "output");
if (!existsSync(outputpath)) {
  mkdirSync(outputpath, { recursive: true });
}
const gamespath = join(respath, "games");
const meta = join(respath, "metadata");

function save(dir: string, fileName: string, data: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(join(dir, fileName), data, "utf-8");
}

function transformMetadata() {
  const metadatas = readdirSync(meta);
  metadatas.forEach(async (metadataFile) => {
    const fileStream = createReadStream(join(meta, metadataFile));
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });
    const res = await parseMetadata(rl);
    const xml = new Builder().buildObject({
      gameList: [
        ...res.map((meta) => {
          return {
            game: {
              name: meta.name,
              desc: meta.description,
              developer: meta.developer,
              path: `./${meta.file}`,
            },
          };
        }),
      ],
    });
    const gamelistpath = join(
      outputpath,
      "gamelist",
      basename(metadataFile, extname(metadataFile))
    );
    save(gamelistpath, `gamelist.xml`, xml);
    rl.close();
    fileStream.close();
  });
}

function transformMedia() {
  const gametype = readdirSync(gamespath);

  gametype.forEach((type) => {
    const output = join(outputpath, "downloaded_media", type);
    const covers = join(output, "covers");
    const marquees = join(output, "marquees");
    const videos = join(output, "videos");
    if (!existsSync(output)) {
      mkdirSync(output, { recursive: true });
    }
    if (!existsSync(covers)) {
      mkdirSync(covers, { recursive: true });
    }
    if (!existsSync(marquees)) {
      mkdirSync(marquees, { recursive: true });
    }
    if (!existsSync(videos)) {
      mkdirSync(videos, { recursive: true });
    }
    const mediums = join(gamespath, type, "media");
    const mediaDirs = readdirSync(mediums);
    mediaDirs.forEach((mediaDir) => {
      const mediaFiles = readdirSync(join(mediums, mediaDir));
      mediaFiles.forEach((mediaFile) => {
        const sourcePath = join(mediums, mediaDir, mediaFile);
        if (mediaFile.startsWith("boxFront")) {
          copyFileSync(sourcePath, join(covers, mediaDir + extname(mediaFile)));
        } else if (mediaFile.startsWith("logo")) {
          copyFileSync(
            sourcePath,
            join(marquees, mediaDir + extname(mediaFile))
          );
        } else if (mediaFile.startsWith("video")) {
          copyFileSync(sourcePath, join(videos, mediaDir + extname(mediaFile)));
        }
      });
    });
  });
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--metadata")) {
    transformMetadata();
  } else if (args.includes("--media")) {
    transformMedia();
  } else {
    transformMedia();
    transformMetadata();
  }
}
main();
