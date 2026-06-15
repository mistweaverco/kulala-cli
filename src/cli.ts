import pkg from './../package.json';
import { Command } from 'commander';
import { run } from './lib/runner';

const program = new Command();

program
  .name('kulala')
  .description('A fully-featured HTTP/GraphQL/gRPC/WebSocket client for your command-line.')
  .version(pkg.version);

program
  .command('run')
  .description('Run .http or .rest files')
  .argument('<path>', 'file or directory to run')
  .option('--json', 'print raw kulala-core JSON output')
  .option('--report', 'print a summary report')
  .option('--no-color', 'disable syntax highlighting and colors')
  .option('-q, --quiet', 'only print output when errors occur')
  .option('--halt', 'stop after the first failing request or file')
  .option('--shuffle', 'shuffle files when running a directory')
  .option('--env <name>', 'environment name for variable resolution')
  .option('--name <name>', 'run a single request by block name')
  .option('--line <line>', 'run request at 1-based line number', (value) =>
    Number.parseInt(value, 10),
  )
  .option('--column <column>', '1-based column for --line (default: 1)', (value) =>
    Number.parseInt(value, 10),
  )
  .action(async (inputPath, options) => {
    await run(inputPath, options);
  });

program.parse();
