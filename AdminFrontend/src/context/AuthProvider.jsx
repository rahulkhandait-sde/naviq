"use client"

import { useState, useEffect, useRef } from "react"
import { Client, Account } from "appwrite"
import AuthContext from "./AuthContext"

const client = new Client().setEndpoint("https://fra.cloud.appwrite.io/v1").setProject("689b5787003b4e752196")

const account = new Account(client)

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [jwtToken, setJwtToken] = useState(null)
  const refreshTimer = useRef(null)

  const generateAndScheduleJWT = async () => {
    try {
      const jwtResponse = await account.createJWT()
      setJwtToken(jwtResponse.jwt)

      const payload = JSON.parse(atob(jwtResponse.jwt.split(".")[1]))
      const expiresAt = payload.exp * 1000

      const refreshTime = expiresAt - Date.now() - 60000 // refresh 1 min before expiry
      if (refreshTimer.current) clearTimeout(refreshTimer.current)
      refreshTimer.current = setTimeout(generateAndScheduleJWT, refreshTime)
    } catch (err) {
      console.error("Failed to refresh JWT:", err.message)
      logout()
    }
  }

  const login = async (email, password) => {
    await account.createEmailPasswordSession(email, password)
    const userData = await account.get()
    setUser(userData)
    localStorage.setItem("user", JSON.stringify(userData))
    await generateAndScheduleJWT()
  }

  const logout = async () => {
    try {
      await account.deleteSession("current")
    } catch (err) {
      console.warn("Error logging out:", err.message)
    }
    setUser(null)
    setJwtToken(null)
    localStorage.removeItem("user")
    if (refreshTimer.current) clearTimeout(refreshTimer.current)
  }

  useEffect(() => {
    const initAuth = async () => {
      try {
        const userData = await account.get()
        setUser(userData)
        await generateAndScheduleJWT()
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    initAuth()

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current)
    }
  }, [])

  return <AuthContext.Provider value={{ user, login, logout, loading, jwtToken }}>{children}</AuthContext.Provider>
}

export default AuthProvider
