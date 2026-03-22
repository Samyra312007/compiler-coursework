import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';

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
    
    const compiler = spawn('node', [compilerPath, testFile, '--debug'], {
      cwd: path.dirname(__dirname),
      stdio: 'pipe'
    });
    
    let output = '';
    
    compiler.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);
    });
    
    compiler.stderr.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stderr.write(text);
    });
    
    await new Promise((resolve, reject) => {
      compiler.on('close', (code) => {
        if (code === 0) {
          resolve(true);
        } else {
          reject(new Error(`Compiler exited with code ${code}`));
        }
      });
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('Test passed!');
    console.log('='.repeat(80) + '\n');
    
  } catch (error: any) {
    console.log('\nTest failed!');
    if (error.message) console.log('Error:', error.message);
    console.log('='.repeat(80) + '\n');
  }
}

const testFile = process.argv[2];

if (!testFile) {
  console.error('Please provide a test file');
  console.log('Usage: npm run test:file tests/test1.js');
  process.exit(1);
}

runTest(testFile).catch(console.error);