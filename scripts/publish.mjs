// Copies the Vite build to the repo root so GitHub Pages (main branch, root folder) serves it.
import { cpSync, rmSync, renameSync, existsSync } from 'node:fs';

rmSync('assets', { recursive: true, force: true });
cpSync('dist/assets', 'assets', { recursive: true });
if (existsSync('dist/dev.html')) renameSync('dist/dev.html', 'dist/index.html');
cpSync('dist/index.html', 'index.html');
