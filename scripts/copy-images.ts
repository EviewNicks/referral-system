import * as fs from "fs";
import * as path from "path";

const srcDir = "C:\\Users\\MODERN 14\\.gemini\\antigravity-cli\\brain\\6953a201-bc10-4666-8571-4ab779a0e664";
const destDir = "D:\\2-Project\\referral-system\\public\\images";

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const mappings = [
  { prefix: "slide_mars9", destName: "slide-mars9.png" },
  { prefix: "thumbnail_iceskating", destName: "thumbnail-iceskating.png" },
  { prefix: "thumbnail_mars9", destName: "thumbnail-mars9.png" },
  { prefix: "thumbnail_sharingtime", destName: "thumbnail-sharingtime.png" },
  { prefix: "thumbnail_prologfest", destName: "thumbnail-prologfest.png" },
  { prefix: "thumbnail_berpesta", destName: "thumbnail-berpesta.png" }
];

console.log("Locating and copying generated images to public/images/...");

try {
  const files = fs.readdirSync(srcDir);
  
  for (const mapping of mappings) {
    // Find the latest file matching the prefix
    const matchingFiles = files.filter(f => f.startsWith(mapping.prefix) && f.endsWith(".jpg"));
    
    if (matchingFiles.length > 0) {
      // Sort to get the latest (usually by timestamp in name)
      matchingFiles.sort();
      const latestFile = matchingFiles[matchingFiles.length - 1];
      const srcPath = path.join(srcDir, latestFile);
      const destPath = path.join(destDir, mapping.destName);
      
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ Copied ${latestFile} -> public/images/${mapping.destName}`);
    } else {
      console.warn(`⚠️ Warning: No file found with prefix ${mapping.prefix}`);
    }
  }
  
  console.log("All image copies finished!");
} catch (error) {
  console.error("❌ Error copying images:", error);
}
