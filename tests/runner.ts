import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest(testFile: string) {
  console.log('\n' + '='.repeat(80));
  console.log(`Testing: ${path.basename(testFile)}`);
  console.log('='.repeat(80));
  
  const sourceCode = fs.readFileSync(testFile, 'utf-8');
  console.log('\nSource Code:');
  console.log('-'.repeat(40));
  console.log(sourceCode);
  
  try {
    console.log('\nBuilding compiler...');
    execSync('npm run build', { 
      stdio: 'pipe', 
      cwd: path.dirname(__dirname),
      encoding: 'utf-8'
    });
    console.log('Build complete');
    
    console.log('\nRunning compiler with debug output...\n');
    const compilerPath = path.join(__dirname, '../dist/cli.js');
    
    const output = execSync(
      `node ${compilerPath} ${testFile} --debug --dump-ast --dump-tac`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    
    console.log(output);
    
    console.log('\n' + '='.repeat(80));
    console.log('Test passed!');
    console.log('='.repeat(80) + '\n');
    
  } catch (error: any) {
    console.log('\nTest failed!');
    if (error.stdout) console.log('Output:\n', error.stdout);
    if (error.stderr) console.log('Error:\n', error.stderr);
    console.log('='.repeat(80) + '\n');
  }
}

const testFile = process.argv[2];

if (!testFile) {
  console.error('Please provide a test file');
  console.log('Usage: npm run test:runner tests/test1.js');
  process.exit(1);
}

runTest(testFile).catch(console.error);