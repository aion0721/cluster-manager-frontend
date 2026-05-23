import { Layout } from './components/Layout'
import { UserConnectionGuide } from './components/UserConnectionGuide'
import './App.css'

function App() {
  return (
    <Layout>
      <div className="single-page">
        <UserConnectionGuide />
      </div>
    </Layout>
  )
}

export default App
