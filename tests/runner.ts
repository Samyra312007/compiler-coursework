import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { Lexer } from '../src/lexer/lexer.js';
import { Parser } from '../src/parser/parser.js';
import { TypeChecker } from '../src/semantic/type-checker.js';
import { TACGenerator } from '../src/ir/tac.js';
import { XSMGenerator } from '../src/codegen/xsm-generator.js';
import { JavaScriptRuntime } from '../src/runtime/runtime.js';

class SimpleTestRunner {
    private testFile: string;
    
    constructor(testFile: string) {
        this.testFile = testFile;
    }
    
    async run(): Promise<void> {
        console.log('\n' + '='.repeat(80));
        console.log(`Testing: ${path.basename(this.testFile)}`);
        console.log('='.repeat(80));
        
        const sourceCode = fs.readFileSync(this.testFile, 'utf-8');
        console.log('\nSource Code:');
        console.log('-'.repeat(40));
        console.log(sourceCode);
        
        try {
            await this.runLexer(sourceCode);
            
            const ast = await this.runParser(sourceCode);
            
            const symbolTable = await this.runSemantic(ast);
            
            const tac = await this.runIR(ast);
            
            const xsmCode = await this.runCodeGen(tac, symbolTable);
            
            await this.runRuntime(sourceCode);
            
            console.log('\n' + '='.repeat(80));
            console.log('All phases completed successfully!');
            console.log('='.repeat(80) + '\n');
            
        } catch (error) {
            console.error('\nCompilation failed:', error.message);
            console.log('='.repeat(80) + '\n');
        }
    }
    
    private async runLexer(sourceCode: string): Promise<void> {
        console.log('\nPhase 1: Lexical Analysis (Tokens)');
        console.log('-'.repeat(40));
        
        const lexer = new Lexer(sourceCode);
        const tokens = lexer.scanTokens();
        
        console.log(`Total tokens: ${tokens.length}\n`);
        
        console.log('Index | Type'.padEnd(20) + '| Lexeme'.padEnd(20) + '| Line:Col');
        console.log('-'.repeat(60));
        
        tokens.forEach((token, index) => {
            const typeStr = token.type.padEnd(20);
            const lexemeStr = (token.lexeme || '').padEnd(20);
            const location = `${token.line}:${token.column}`;
            console.log(`${String(index).padEnd(5)} | ${typeStr} | ${lexemeStr} | ${location}`);
        });
    }
    
    private async runParser(sourceCode: string): Promise<any> {
        console.log('\nPhase 2: Syntax Analysis (AST)');
        console.log('-'.repeat(40));
        
        const lexer = new Lexer(sourceCode);
        const tokens = lexer.scanTokens();
        const parser = new Parser(tokens);
        const ast = parser.parse();
        
        console.log('Abstract Syntax Tree:');
        console.log(JSON.stringify(ast, null, 2));
        
        return ast;
    }
    
    private async runSemantic(ast: any): Promise<any> {
        console.log('\nPhase 3: Semantic Analysis');
        console.log('-'.repeat(40));
        
        const typeChecker = new TypeChecker();
        const isValid = typeChecker.check(ast);
        const errors = typeChecker.getErrors();
        
        if (!isValid) {
            console.log('Semantic errors found:');
            errors.forEach(err => {
                console.log(`  - ${err.message}`);
            });
            throw new Error('Semantic analysis failed');
        }
        
        console.log('Semantic analysis passed');
        console.log('No errors found');
        
        const symbolTable = typeChecker.getSymbolTable();
        console.log('\nSymbol Table:');
        console.log('Name'.padEnd(15) + '| Type'.padEnd(15) + '| Scope'.padEnd(10) + '| Initialized');
        console.log('-'.repeat(55));
        
        return symbolTable;
    }
    
    private async runIR(ast: any): Promise<any> {
        console.log('\nPhase 4: Intermediate Representation (TAC)');
        console.log('-'.repeat(40));
        
        const tacGen = new TACGenerator();
        const tac = tacGen.generate(ast);
        
        console.log('Three-Address Code:');
        console.log('Index | Instruction');
        console.log('-'.repeat(40));
        
        tac.forEach((inst: any, index: number) => {
            const instStr = this.tacToString(inst);
            console.log(`${String(index).padEnd(5)} | ${instStr}`);
        });
        
        return tac;
    }
    
    private async runCodeGen(tac: any, symbolTable: any): Promise<string> {
        console.log('\nPhase 5: Code Generation (XSM Assembly)');
        console.log('-'.repeat(40));
        
        const xsmGen = new XSMGenerator(symbolTable);
        const xsmCode = xsmGen.generate(tac);
        
        console.log('Generated XSM Code:');
        console.log('Address | Instruction');
        console.log('-'.repeat(40));
        
        const lines = xsmCode.split('\n');
        let address = 2056;
        
        lines.forEach((line, index) => {
            if (line.trim() && !line.includes(':')) {
                console.log(`${address.toString().padEnd(7)} | ${line}`);
                address += 2;
            } else {
                console.log(`${' '.padEnd(7)} | ${line}`);
            }
        });
        
        return xsmCode;
    }
    
    private async runRuntime(sourceCode: string): Promise<void> {
        console.log('\nPhase 6: Runtime Execution');
        console.log('-'.repeat(40));
        
        const outputs: string[] = [];
        const originalLog = console.log;
        
        console.log = (...args: any[]) => {
            const output = args.map(String).join(' ');
            outputs.push(output);
            originalLog(output);
        };
        
        try {
            const runtime = new JavaScriptRuntime();
            const preparedCode = this.prepareForRuntime(sourceCode, runtime);
            
            console.log('Executing code...\n');
            eval(preparedCode);
            
            console.log('\nProgram Output:');
            if (outputs.length === 0) {
                console.log('  (No output)');
            } else {
                outputs.forEach((output, i) => {
                    console.log(`  ${i + 1}. ${output}`);
                });
            }
            
        } finally {
            console.log = originalLog;
        }
    }
    
    private tacToString(inst: any): string {
        if (inst.op === 'LABEL') return `LABEL L${inst.label}`;
        if (inst.op === 'JUMP') return `JUMP L${inst.label}`;
        if (inst.op === 'COND_JUMP') return `IF ${inst.arg1} ${inst.arg2} JUMP L${inst.label}`;
        if (inst.op === 'RETURN') return `RETURN ${inst.arg1 || ''}`;
        if (inst.op === 'CALL') return `CALL ${inst.arg1}`;
        if (inst.result && inst.arg1 && inst.arg2) {
            return `${inst.result} = ${inst.arg1} ${inst.op} ${inst.arg2}`;
        }
        if (inst.result && inst.arg1) {
            return `${inst.result} = ${inst.arg1}`;
        }
        return inst.op;
    }
    
    private prepareForRuntime(source: string, runtime: JavaScriptRuntime): string {
        return `
            (function() {
                const __runtime = arguments[0];
                const __globalContext = __runtime.getGlobalContext();
                
                function __get(name) {
                    return __globalContext.get(name).value;
                }
                
                function __set(name, value) {
                    __globalContext.set(name, __runtime.convertToRuntimeValue(value));
                }
                
                const console = {
                    log: function(...args) {
                        const output = args.map(arg => {
                            if (arg && typeof arg === 'object' && arg.toArray) {
                                return JSON.stringify(arg.toArray());
                            }
                            return String(arg);
                        }).join(' ');
                        globalThis.console.log(output);
                    }
                };
                
                ${source}
            }).call(null, ${runtime});
        `;
    }
}

const testFile = process.argv[2];

if (!testFile) {
    console.error('Please provide a test file');
    console.log('Example Usage: npm run test tests/test1.js');
    process.exit(1);
}

const runner = new SimpleTestRunner(testFile);
runner.run().catch(console.error);