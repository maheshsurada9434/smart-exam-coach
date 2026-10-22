import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './Layout'
import { NAV } from './nav'
import { Skeleton, ToastProvider } from './components/ui'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Planned = lazy(() => import('./pages/Planned'))
const QuestionBank = lazy(() => import('./pages/QuestionBank'))
const PracticeSession = lazy(() => import('./pages/PracticeSession'))
const MockRun = lazy(() => import('./pages/MockRun'))

// Sections that are built; every other NAV entry shows the honest "not built yet" page.
const BUILT: Record<string, LazyExoticComponent<ComponentType>> = {
  '/syllabus': lazy(() => import('./pages/Syllabus')),
  '/settings': lazy(() => import('./pages/Settings')),
  '/practice': lazy(() => import('./pages/Practice')),
  '/bookmarks': lazy(() => import('./pages/Bookmarks')),
  '/mock-tests': lazy(() => import('./pages/MockTests')),
  '/planner': lazy(() => import('./pages/Planner')),
  '/revision': lazy(() => import('./pages/Revision')),
}

const Loading = () => (
  <div className="space-y-3" aria-busy="true" aria-label="Loading">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-32 w-full" />
  </div>
)

export default function App() {
  return (
    <ToastProvider>
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          {NAV.filter((n) => n.to !== '/').map((n) => {
            const Page = BUILT[n.to]
            return <Route key={n.to} path={n.to.slice(1)} element={Page ? <Page /> : <Planned path={n.to} />} />
          })}
          <Route path="question-bank" element={<QuestionBank />} />
          <Route path="practice/session/:id" element={<PracticeSession />} />
          <Route path="mock-tests/run/:id" element={<MockRun />} />
          <Route path="*" element={<Planned path="*" />} />
        </Route>
      </Routes>
    </Suspense>
    </ToastProvider>
  )
}
