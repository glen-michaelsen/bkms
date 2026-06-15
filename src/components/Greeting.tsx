"use client"

import { useState, useEffect } from "react"

function getGreeting(hour: number, studyDirection: string): string {
  if (studyDirection === "to_english") {
    if (hour >= 5  && hour < 12) return "Good morning"
    if (hour >= 12 && hour < 18) return "Good afternoon"
    if (hour >= 18 && hour < 22) return "Good evening"
    return "Good night"
  }
  if (hour >= 5  && hour < 12) return "Dobro jutro"
  if (hour >= 12 && hour < 18) return "Dobar dan"
  if (hour >= 18 && hour < 22) return "Dobro veče"
  return "Laku noć"
}

export function Greeting({ firstName, studyDirection = "to_slavic" }: { firstName: string; studyDirection?: string }) {
  const [greeting, setGreeting] = useState<string | null>(null)

  useEffect(() => {
    setGreeting(getGreeting(new Date().getHours(), studyDirection))
  }, [studyDirection])

  if (!greeting) return null

  return (
    <>
      {greeting}, {firstName}
    </>
  )
}
