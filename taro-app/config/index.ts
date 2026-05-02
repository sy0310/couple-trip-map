import { defineConfig, UserConfig } from '@tarojs/cli'
import * as path from 'path'

export default defineConfig({
  projectName: 'yuting-taro',
  date: '2026-5-2',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2,
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: ['@tarojs/plugin-html'],
  defineConstants: {},
  copy: {
    patterns: [],
    options: {},
  },
  framework: 'react',
  compiler: 'webpack5',
  mini: {
    webpackChain(chain) {
      chain.resolve.alias.set('@shared', path.resolve(__dirname, '../../shared'))
    },
    postcss: {
      pxtransform: {
        enable: true,
        config: {},
      },
      url: {
        enable: true,
        config: {
          limit: 1024,
        },
      },
    },
  },
  h5: {
    webpackChain(chain) {
      chain.resolve.alias.set('@shared', path.resolve(__dirname, '../../shared'))
    },
    publicPath: '/',
    staticDirectory: 'static',
    postcss: {
      autoprefixer: {
        enable: true,
      },
    },
  },
} as UserConfig)
