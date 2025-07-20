"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Upload, ImageIcon, Loader2 } from "lucide-react"

interface UploadAreaProps {
  folderName: string
  onUploadComplete: (upload: any) => void
  disabled: boolean
}

export default function UploadArea({ folderName, onUploadComplete, disabled }: UploadAreaProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled || acceptedFiles.length === 0) return

      const file = acceptedFiles[0]
      setIsUploading(true)
      setUploadProgress(0)

      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("folderName", folderName)

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90))
        }, 200)

        const response = await fetch("/api/upload-image", {
          method: "POST",
          body: formData,
        })

        clearInterval(progressInterval)
        setUploadProgress(100)

        const data = await response.json()

        if (response.ok) {
          onUploadComplete(data)
        } else {
          throw new Error(data.error || "Upload failed")
        }
      } catch (error) {
        console.error("Upload error:", error)
      } finally {
        setIsUploading(false)
        setUploadProgress(0)
      }
    },
    [folderName, onUploadComplete, disabled],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    maxFiles: 1,
    disabled: disabled || isUploading,
  })

  return (
    <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
      <h2 className="text-xl font-semibold text-white mb-6">Upload Image</h2>

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 cursor-pointer
          ${isDragActive ? "border-white bg-gray-800" : "border-gray-600 hover:border-gray-500 hover:bg-gray-800/50"}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} />

        {isUploading ? (
          <div className="space-y-4">
            <Loader2 className="h-12 w-12 text-white mx-auto animate-spin" />
            <div className="space-y-2">
              <p className="text-white font-medium">Uploading and analyzing...</p>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-gray-400 text-sm">{uploadProgress}%</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              {isDragActive ? (
                <Upload className="h-12 w-12 text-white" />
              ) : (
                <ImageIcon className="h-12 w-12 text-gray-400" />
              )}
            </div>

            <div className="space-y-2">
              <p className="text-white font-medium">
                {isDragActive ? "Drop your image here" : "Drag & drop an image here"}
              </p>
              <p className="text-gray-400">or</p>
              <Button
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent"
                disabled={disabled}
              >
                Choose File
              </Button>
            </div>

            <p className="text-gray-500 text-sm">Supports JPG, PNG, GIF, WebP (max 10MB)</p>
          </div>
        )}
      </div>
    </div>
  )
}
