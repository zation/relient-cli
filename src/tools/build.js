import run from './run';
import clean from './clean';
import copy from './copy';
import bundle from './bundle';
import exportRoutes from './exportRoutes';

/**
 * Compiles the project from source files into a distributable
 * format and copies it to the output (build) folder.
 */
async function build() {
  await run(clean);
  await run(copy);
  await run(bundle);

  if (process.argv.includes('--static')) {
    await run(exportRoutes);
  }
}

export default build;
