"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const [folderName, setFolderName] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!folderName.trim()) return

    setIsLoading(true)
    setError("")

    try {
      // Check if profile exists in Firestore
      const response = await fetch("/api/check-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderName: folderName.trim() }),
      })

      const data = await response.json()

      if (data.exists) {
        // Store folder name in localStorage and redirect
        localStorage.setItem("folderName", folderName.trim())
        router.push("/game")
      } else {
        setError("Profile not found.")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Mystery Animal</h1>
          <p className="text-gray-400 text-lg">Upload images and guess the secret animal</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8 shadow-2xl border border-gray-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="folderName" className="text-white font-medium text-sm">
                Enter your folder name
              </label>
              <Input
                id="folderName"
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="student_folder_name"
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-white focus:ring-white h-12 text-lg"
                disabled={isLoading}
              />
            </div>

            {error && (
              <Alert className="bg-gray-800 border-gray-700">
                <AlertDescription className="text-gray-300">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={!folderName.trim() || isLoading}
              className="w-full bg-white text-black hover:bg-gray-200 h-12 text-lg font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Checking...
                </>
              ) : (
                "Start Playing"
              )}
            </Button>
          </form>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">Make sure you have the correct folder name from your instructor</p>
        </div>
      </div>
    </div>
  )
}
