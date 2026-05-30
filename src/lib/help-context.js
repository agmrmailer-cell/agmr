'use client'
import { createContext, useContext, useState, useEffect } from 'react'

const HelpContext = createContext({ helpMode: false, setHelpMode: () => {} })

export function HelpProvider({ children }) {
  const [helpMode, setHelpModeState] = useState(false)

  useEffect(() => {
    try {
      setHelpModeState(localStorage.getItem('agmr_help_mode') === '1')
    } catch {}
  }, [])

  const setHelpMode = (val) => {
    setHelpModeState(val)
    try { localStorage.setItem('agmr_help_mode', val ? '1' : '0') } catch {}
  }

  return (
    <HelpContext.Provider value={{ helpMode, setHelpMode }}>
      {children}
    </HelpContext.Provider>
  )
}

export function useHelp() {
  return useContext(HelpContext)
}
