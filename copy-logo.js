import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourcePath = "C:/Users/Maminiriana_Alain/.gemini/antigravity-ide/brain/2e31aa3b-7667-4ae3-b9c5-7fa0a0d46ac2/media__1785775969155.jpg";
const destDir = path.join(__dirname, "src", "assets");
const destPath = path.join(destDir, "eray.jpg");

try {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log("SUCCESS: Logo copied to " + destPath);
  } else {
    console.error("ERROR: Source logo file not found at " + sourcePath);
  }
} catch (err) {
  console.error("ERROR: Failed to copy logo: ", err);
}
