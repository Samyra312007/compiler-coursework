import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TestResult {
    name: string;
    passed: boolean;
    duration: number;
    output: string[];
    error?: string;
}

class TestRunner {
    private testFile: string;
    
    constructor(testFile: string) {
        this.testFile = testFile;
    }
    
    async run(): Promise<TestResult> {
        const startTime = Date.now();
        const result: TestResult = {
            name: path.basename(this.testFile),
            passed: false,
            duration: 0,
            output: []
        };
        
        console.log('\n' + '='.repeat(80));
        console.log(`Testing: ${path.basename(this.testFile)}`);
        console.log('='.repeat(80));
        
        const sourceCode = fs.readFileSync(this.testFile, 'utf-8');
        console.log('\nSource Code:');
        console.log('-'.repeat(40));
        console.log(sourceCode);
        
        try {
            const compilerPath = path.join(__dirname, '../dist/cli.js');
            
            if (!fs.existsSync(compilerPath)) {
                throw new Error('Compiler not built. Run `npm run build` first.');
            }
            
            const output = execSync(
                `node ${compilerPath} ${this.testFile} --debug`,
                { encoding: 'utf-8', stdio: 'pipe' }
            );
            
            result.output = output.split('\n');
            result.passed = true;
            
            console.log('\nTest passed!');
            
        } catch (error: any) {
            result.error = error.message;
            result.passed = false;
            console.log('\nTest failed!');
            console.log('Error:', error.message);
            if (error.stdout) console.log('Output:', error.stdout);
            if (error.stderr) console.log('Stderr:', error.stderr);
        }
        
        result.duration = Date.now() - startTime;
        console.log(`\n⏱️ Duration: ${result.duration}ms`);
        console.log('='.repeat(80) + '\n');
        
        return result;
    }
}

const testFile = process.argv[2];

if (!testFile) {
    console.error('Please provide a test file');
    console.log('Usage: npm run test:file tests/test1.js');
    process.exit(1);
}

const runner = new TestRunner(testFile);
runner.run().catch(console.error);