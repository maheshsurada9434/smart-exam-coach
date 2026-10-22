import {
  BarChart3,
  Bookmark,
  CalendarDays,
  LayoutDashboard,
  ListTree,
  PenLine,
  Repeat,
  Settings,
  Timer,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = { to: string; label: string; icon: LucideIcon; day: number; mobile?: boolean }

// `day` = the PLAN.md day that builds the screen; used for honest "not built yet" notices.
export const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, day: 7, mobile: true },
  { to: '/planner', label: 'Study Planner', icon: CalendarDays, day: 6 },
  { to: '/practice', label: 'Practice', icon: PenLine, day: 4, mobile: true },
  { to: '/mock-tests', label: 'Mock Tests', icon: Timer, day: 5, mobile: true },
  { to: '/revision', label: 'Revision', icon: Repeat, day: 6, mobile: true },
  { to: '/performance', label: 'Performance', icon: BarChart3, day: 7 },
  { to: '/syllabus', label: 'Syllabus', icon: ListTree, day: 2 },
  { to: '/bookmarks', label: 'Question Bookmarks', icon: Bookmark, day: 4 },
  { to: '/settings', label: 'Settings', icon: Settings, day: 2 },
]
