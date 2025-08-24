"use client"

import { useState, useEffect, useContext } from "react"
import { Link, useNavigate } from "react-router-dom"
import AuthContext from "../context/AuthContext"
import Paybutton from "../PayButton"

const Dashboard = () => {
  const [orgData, setOrgData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [uploadStatus, setUploadStatus] = useState("")
  const [selectedFile, setSelectedFile] = useState(null)
  const navigate = useNavigate()
  const { jwtToken, logout } = useContext(AuthContext)
  if (!localStorage.getItem("user")) {
    navigate("/")
  }
  useEffect(() => {
    fetchOrgProfile()
  }, [jwtToken])
console.log(orgData)
  const fetchOrgProfile = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/org/orgProfile", {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      })
      const data = await response.json()
      setOrgData(data)
      console.log(orgData)
    } catch (error) {
      console.error("Error fetching org profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  const uploadFile = async () => {
    if (!orgData?.appwriteId) {
      setUploadStatus("Organization ID not available!")
      return
    }
    if (!selectedFile) {
      setUploadStatus("Please select a file first!")
      return
    }

    const formData = new FormData()
    formData.append("file", selectedFile)
    formData.append("organization_id", orgData.appwriteId)

    setUploadStatus("Uploading...")

    try {
      const res = await fetch("https://subhajit01-naviqrag.hf.space/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      setUploadStatus(data.message || "Upload done!")
      setSelectedFile(null)
      const fileInput = document.getElementById("fileInput")
      if (fileInput) fileInput.value = ""
    } catch (error) {
      setUploadStatus("Upload failed: " + error.message)
    }
  }

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0])
    setUploadStatus("")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-blue-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-400"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-blue-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-30 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          ></div>
        ))}
      </div>

      <div className="relative z-10 flex">
        <div
          className={`fixed inset-y-0 left-0 z-50 w-80 bg-black/30 backdrop-blur-xl border-r border-gray-700/50 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between h-16 px-6 border-b border-gray-700/50">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                NaviQ
              </h1>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 border-b border-gray-700/50">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{orgData?.username?.charAt(0) || "U"}</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold">{orgData?.username}</h3>
                  <p className="text-gray-400 text-sm">{orgData?.email}</p>
                  <p className="text-blue-400 text-xs">{orgData?.typeofuser}</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-b border-gray-700/50">
              <h4 className="text-white font-semibold mb-3">Subscription Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Plan:</span>
                  <span className="text-blue-400">{orgData?.subscription?.planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Credits Remaining:</span>
                  <span className="text-green-400">{orgData?.subscription?.remainingCredit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Credits Used:</span>
                  <span className="text-orange-400">{orgData?.subscription?.usedCredit}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 p-6">
              <nav className="space-y-4">
                <Link
                  to="/addmapdata"
                  className="flex items-center space-x-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg p-3 transition-all duration-300 group"
                >
                  <svg
                    className="w-5 h-5 group-hover:scale-110 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                  <span>Add Map Data</span>
                </Link>

                <button className="flex items-center space-x-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg p-3 transition-all duration-300 group w-full text-left">
                  <svg
                    className="w-5 h-5 group-hover:scale-110 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  <Paybutton />
                </button>
              </nav>
            </div>

            <div className="p-6 border-t border-gray-700/50">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg p-3 transition-all duration-300 group w-full"
              >
                <svg
                  className="w-5 h-5 group-hover:scale-110 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 lg:ml-0">
          <div className="bg-black/20 backdrop-blur-xl border-b border-gray-700/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <h2 className="text-2xl font-bold text-white">Dashboard</h2>

              <div className="flex items-center space-x-4">
                <div className="relative">
                  <button className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                    <span className="text-white font-bold">{orgData?.username?.charAt(0) || "U"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-black/30 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6 hover:bg-black/40 transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Credits Remaining</p>
                    <p className="text-2xl font-bold text-green-400">{orgData?.subscription?.remainingCredit}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6 hover:bg-black/40 transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Credits Used</p>
                    <p className="text-2xl font-bold text-orange-400">{orgData?.subscription?.usedCredit}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6 hover:bg-black/40 transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Current Plan</p>
                    <p className="text-2xl font-bold text-blue-400">{orgData?.subscription?.planName}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6 hover:bg-black/40 transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Visitors</p>
                    <p className="text-2xl font-bold text-purple-400">{orgData?.visitors?.length || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-black/30 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6 mb-8">
              <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  to="/addmapdata"
                  className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 bg-blue-500/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Add Map Data</h4>
                    <p className="text-gray-400 text-sm">Configure your venue's map information</p>
                  </div>
                </Link>

                <button className="flex items-center space-x-4 p-4 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-lg border border-green-500/30 hover:border-green-400/50 transition-all duration-300 group">
                  <div className="w-12 h-12 bg-green-500/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                  </div>
                  <div>
                    <Paybutton />
                    <p className="text-gray-400 text-sm">Purchase additional credits for your account</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-black/30 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-6">Upload Document</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Select File (PDF or Image)</label>
                  <input
                    id="fileInput"
                    type="file"
                    accept="image/*, application/pdf"
                    onChange={handleFileChange}
                    className="w-full p-3 bg-black/50 border border-gray-600/50 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-all duration-300"
                  />
                </div>

                <button
                  onClick={uploadFile}
                  disabled={!selectedFile}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 disabled:cursor-not-allowed"
                >
                  Upload Document
                </button>

                {uploadStatus && (
                  <div
                    className={`p-3 rounded-lg text-sm ${
                      uploadStatus.includes("done") || uploadStatus.includes("success")
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : uploadStatus.includes("failed") || uploadStatus.includes("error")
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    }`}
                  >
                    {uploadStatus}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-10px) rotate(1deg); }
          66% { transform: translateY(5px) rotate(-1deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

export default Dashboard
