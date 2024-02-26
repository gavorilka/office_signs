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
}