import { useLaunch } from '@tarojs/taro'

function App({ children }: { children: React.ReactNode }) {
  useLaunch(() => {
    console.log('App launched')
  })

  return children
}

export default App
