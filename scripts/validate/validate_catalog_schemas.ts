// Schema-checks the hand-maintained catalog sources. Run via tsx so the schemas are
// shared with the app rather than duplicated in a .mjs script.
import fs from 'node:fs';
import path from 'node:path';
import { CATALOG_SCHEMAS } from '../../src/lib/catalog/schemas';

const catalogDir = path.join(process.cwd(), 'data', 'catalog');
let failed = false;

for (const { file, schema } of CATALOG_SCHEMAS) {
    const filePath = path.join(catalogDir, file);
    if (!fs.existsSync(filePath)) {
        console.error(`${file}: missing`);
        failed = true;
        continue;
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        console.error(`${file}: not valid JSON — ${(error as Error).message}`);
        failed = true;
        continue;
    }

    const result = schema.safeParse(parsed);
    if (!result.success) {
        failed = true;
        console.error(`${file}: ${result.error.issues.length} schema issue(s)`);
        // Path first: in a file of hundreds of entries, the location is the useful part.
        for (const issue of result.error.issues.slice(0, 10)) {
            console.error(`  - ${issue.path.join('.') || '(root)'}: ${issue.message}`);
        }
        if (result.error.issues.length > 10) {
            console.error(`  ... and ${result.error.issues.length - 10} more`);
        }
        continue;
    }

    console.log(`${file}: ok`);
}

if (failed) {
    console.error('\nCatalog schema validation failed.');
    process.exit(1);
}

console.log('All catalog sources match their schemas.');
