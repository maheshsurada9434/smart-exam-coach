import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './Layout'
import { NAV } from './nav'
import { Skeleton } from './components/ui'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Planned = lazy(() => import('./pages/Planned'))

// Sections that are built; every other NAV entry shows the honest "not built yet" page.
const BUILT: Record<string, LazyExoticComponent<ComponentType>> = {
  '/syllabus': lazy(() => import('./pages/Syllabus')),
  '/settings': lazy(() => import('./pages/Settings')),
}

const Loading = () => (
  <div className="space-y-3" aria-busy="true" aria-label="Loading">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-32 w-full" />
  </div>
)

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          {NAV.filter((n) => n.to !== '/').map((n) => {
            const Page = BUILT[n.to]
            return <Route key={n.to} path={n.to.slice(1)} element={Page ? <Page /> : <Planned path={n.to} />} />
          })}
          <Route path="*" element={<Planned path="*" />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
