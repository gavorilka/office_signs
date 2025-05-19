import { resolve } from 'path'

export default {
    root: resolve(__dirname, 'src'),
    envDir: resolve(__dirname),
    build: {
        outDir: '../dist'
    },
    resolve: {
        alias: {
          '@': resolve(__dirname, 'src'),
        },
    },
    /* npm i -D sass@1.77.6 --save-exact и строки ниже ненужны*/
/*    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern-compiler', // or "modern"
                silenceDeprecations: ['mixed-decls', 'color-functions', 'global-builtin', 'import']
            }
        }
    },*/
}