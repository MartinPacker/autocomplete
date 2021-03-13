import * as fs from 'fs';
import * as ts from 'typescript';
import * as path from 'path';
import { variableNameTransformer } from './transformer';
import SpecLogger, { Level } from './log';
import * as ProgressBar from 'progress';

// The options for the TypeScript compiler
const options: ts.TranspileOptions = {
    compilerOptions: {
        module: ts.ModuleKind.ESNext,
    },
    transformers: {
        before: [variableNameTransformer],
    },
};

/**
 * Process a spec by transpiling it with the TypeScript
 * compiler.
 *
 * @param file The file to process
 */
const processSpec = (file: string) => {

    const source = fs.readFileSync(file).toString();
    const result = ts.transpileModule(source, options);

    let newName = path.basename(file, '.ts');

    if(!newName.endsWith('.js'))
        newName += '.js';

    const outFilePath = path.resolve('dist', newName);
    const outDirname = path.dirname(outFilePath);

    if(!fs.existsSync(outDirname))
        fs.mkdirSync(outDirname);

    fs.writeFileSync(outFilePath, result.outputText);
};

// Process all the files in the specs directory
fs.readdir('specs', (err, files) => {

    if(err) {

        SpecLogger.loc('Could not find specs folder', Level.ERROR);
        return;
    }

    const specs = files.filter(file => file !== '.DS_STORE');
    SpecLogger.log(`Processing ${specs.length} specs...`);

    const bar = new ProgressBar(':bar :percent', {
        total: specs.length,
        complete: '=',
        head: '>',
        incomplete: ' ',
    });

    specs.forEach(spec => {

        processSpec( path.join('specs', spec));
        bar.tick({ spec });
    });

    SpecLogger.log('Specs compiled successfully to /dist folder!', Level.SUCCESS);
});