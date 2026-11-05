import { build } from 'esbuild';
await build({ entryPoints: ['demo/main.jsx'], outfile: 'demo/bundle.js', bundle: true,
  format: 'esm', platform: 'browser', target: 'es2022', define: { 'process.env.NODE_ENV': '"development"' } });
await build({ entryPoints: ['demo/visuals.jsx'], outfile: 'demo/visuals.js', bundle: true,
  format: 'esm', platform: 'browser', target: 'es2022', define: { 'process.env.NODE_ENV': '"development"' } });
