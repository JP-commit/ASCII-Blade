import fs from 'node:fs';
import path from 'node:path';
import { parseSprite } from '../src/sprites/sprite-parser';

function findSpriteFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findSpriteFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.ascii') || entry.name.endsWith('.txt'))) {
      results.push(fullPath);
    }
  }
  return results;
}

function runLint() {
  const spritesDir = path.resolve(process.cwd(), 'assets/sprites');
  const files = findSpriteFiles(spritesDir);

  console.log(`[LINT] Scanning ${files.length} sprite files in ${spritesDir}...\n`);

  if (files.length === 0) {
    console.warn(`[LINT] Warning: No .ascii sprite files found in ${spritesDir}`);
    process.exit(0);
  }

  let totalErrors = 0;
  let passedFiles = 0;

  for (const file of files) {
    const relPath = path.relative(process.cwd(), file);
    const content = fs.readFileSync(file, 'utf-8');
    const { sprite, errors } = parseSprite(content, relPath);

    if (errors.length > 0) {
      console.error(`FAIL: ${relPath}`);
      for (const err of errors) {
        console.error(`  - ${err}`);
      }
      totalErrors += errors.length;
    } else if (sprite) {
      console.log(`PASS: ${relPath} (${sprite.name}: ${sprite.width}x${sprite.height}, ${sprite.frames.size} frames, ${sprite.animations.size} animations)`);
      passedFiles++;
    }
  }

  console.log(`\n========================================`);
  if (totalErrors > 0) {
    console.error(`FAILED: ${totalErrors} error(s) found across ${files.length} sprite file(s).`);
    process.exit(1);
  } else {
    console.log(`SUCCESS: All ${passedFiles} sprite file(s) passed validation!`);
    process.exit(0);
  }
}

runLint();
