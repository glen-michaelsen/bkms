"use client"

import { useState, useEffect } from "react"

function getSrGreeting(hour: number): string {
  if (hour >= 5  && hour < 12) return "Dobro jutro"
  if (hour >= 12 && hour < 18) return "Dobar dan"
  if (hour >= 18 && hour < 22) return "Dobro veče"
  return "Laku noć"
}

export function Greeting({ firstName }: { firstName: string }) {
  const [greeting, setGreeting] = useState<string | null>(null)

  useEffect(() => {
    setGreeting(getSrGreeting(new Date().getHours()))
  }, [])

  if (!greeting) return null

  return (
    <>
      {greeting}, {firstName}
    </>
  )
}
