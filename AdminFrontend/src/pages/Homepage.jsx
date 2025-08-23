import { useState, useEffect } from "react"
import { NavLink } from "react-router-dom"

const Homepage = () => {
    const [isVisible, setIsVisible] = useState(false)
    const [currentFeature, setCurrentFeature] = useState(0)

    useEffect(() => {
        setIsVisible(true)
        const interval = setInterval(() => {
            setCurrentFeature((prev) => (prev + 1) % 4)
        }, 3000)
        return () => clearInterval(interval)
    }, [])

    const features = [
        { icon: "🏥", title: "Hospitals", desc: "Patient navigation & info" },
        { icon: "🏛️", title: "Institutes", desc: "Campus guidance & resources" },
        { icon: "🏢", title: "Offices", desc: "Visitor assistance & directions" },
        { icon: "🗺️", title: "Tourist Places", desc: "Interactive exploration guides" },
    ]

    const stats = [
        { number: "500+", label: "Active Venues" },
        { number: "50K+", label: "Daily Interactions" },
        { number: "99.9%", label: "Uptime" },
        { number: "24/7", label: "AI Support" },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-blue-900 text-white overflow-hidden">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
                <div
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-2xl opacity-10 animate-spin"
                    style={{ animationDuration: "20s" }}
                ></div>
            </div>

            {/* Navigation */}
            <nav
                className={`relative z-10 p-6 transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0"}`}
            >
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-gray-400 rounded-lg flex items-center justify-center">
                            <span className="text-xl font-bold">🤖</span>
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-gray-300 bg-clip-text text-transparent">
                            NaviQ
                        </span>
                    </div>
                    <div className="hidden md:flex space-x-8">
                        <a href="#features" className="hover:text-blue-400 transition-colors">
                            Features
                        </a>
                        <a href="#pricing" className="hover:text-blue-400 transition-colors">
                            Pricing
                        </a>
                        <a href="#demo" className="hover:text-blue-400 transition-colors">
                            Demo
                        </a>
                    </div>
                    <div className="flex justify-center items-center space-x-4">
                        {localStorage.getItem('user') ? (
                            // If user exists, show the "Dashboard" link
                            <NavLink
                                to="/dashboard"
                                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-6 py-2 rounded-lg transition-all duration-300 transform hover:scale-105"
                            >
                                Dashboard
                            </NavLink>
                        ) : (
                            // If user is null, show the "Get Started" link
                            <NavLink
                                to="/login"
                                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-6 py-2 rounded-lg transition-all duration-300 transform hover:scale-105"
                            >
                                Get Started
                            </NavLink>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 px-6 py-20">
                <div className="max-w-7xl mx-auto text-center">
                    <div
                        className={`transition-all duration-1500 delay-300 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
                    >
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                            <span className="bg-gradient-to-r from-blue-400 via-gray-300 to-blue-500 bg-clip-text text-transparent">
                                Transform Any Venue
                            </span>
                            <br />
                            <span className="text-white">Into an AI-Powered</span>
                            <br />
                            <span className="bg-gradient-to-r from-gray-300 to-blue-400 bg-clip-text text-transparent">
                                Smart Assistant
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
                            Revolutionize visitor experience with intelligent QR-based AI assistants that provide
                            <span className="text-blue-400 font-semibold"> real-time navigation</span>,
                            <span className="text-gray-300 font-semibold"> instant information</span>, and
                            <span className="text-blue-400 font-semibold"> personalized guidance</span> for any location.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                            <button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-2xl">
                                🚀 Start Free Trial - ₹500 Credit
                            </button>
                            <button className="border-2 border-gray-400 hover:border-blue-400 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:bg-blue-900/20">
                                📱 Watch Demo
                            </button>
                        </div>
                    </div>

                    {/* Rotating Feature Showcase */}
                    <div
                        className={`transition-all duration-1500 delay-600 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
                    >
                        <div className="bg-gradient-to-r from-gray-900/50 to-blue-900/50 backdrop-blur-lg rounded-2xl p-8 max-w-2xl mx-auto border border-gray-700">
                            <div className="text-6xl mb-4 transition-all duration-500">{features[currentFeature].icon}</div>
                            <h3 className="text-2xl font-bold text-blue-400 mb-2">{features[currentFeature].title}</h3>
                            <p className="text-gray-300 text-lg">{features[currentFeature].desc}</p>
                            <div className="flex justify-center mt-4 space-x-2">
                                {features.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentFeature ? "bg-blue-400 w-8" : "bg-gray-600"
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="relative z-10 px-6 py-16">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div
                                key={index}
                                className={`text-center transition-all duration-1000 delay-${(index + 1) * 200} ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                                    }`}
                            >
                                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-gray-300 bg-clip-text text-transparent mb-2">
                                    {stat.number}
                                </div>
                                <div className="text-gray-400 text-lg">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="relative z-10 px-6 py-20">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
                        <span className="bg-gradient-to-r from-blue-400 to-gray-300 bg-clip-text text-transparent">
                            Powerful Features
                        </span>
                    </h2>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: "📱",
                                title: "QR Code Integration",
                                desc: "Instant access via QR scan at venue entrances",
                            },
                            {
                                icon: "🗺️",
                                title: "Real-time Navigation",
                                desc: "Indoor & outdoor pathfinding with live updates",
                            },
                            {
                                icon: "🤖",
                                title: "AI-Powered Responses",
                                desc: "Natural language processing for any query",
                            },
                            {
                                icon: "📊",
                                title: "Live Data Sync",
                                desc: "Daily updated information and venue changes",
                            },
                            {
                                icon: "🎯",
                                title: "Personalized Experience",
                                desc: "Tailored recommendations based on user needs",
                            },
                            {
                                icon: "⚡",
                                title: "Lightning Fast",
                                desc: "Sub-second response times for all queries",
                            },
                        ].map((feature, index) => (
                            <div
                                key={index}
                                className={`bg-gradient-to-br from-gray-900/50 to-blue-900/30 backdrop-blur-lg rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                                    }`}
                                style={{ transitionDelay: `${index * 100}ms` }}
                            >
                                <div className="text-4xl mb-4">{feature.icon}</div>
                                <h3 className="text-xl font-bold text-blue-400 mb-3">{feature.title}</h3>
                                <p className="text-gray-300">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="relative z-10 px-6 py-20">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-8">
                        <span className="bg-gradient-to-r from-blue-400 to-gray-300 bg-clip-text text-transparent">
                            Simple Pay-As-You-Go
                        </span>
                    </h2>
                    <p className="text-xl text-gray-300 mb-12">No monthly fees, no commitments. Pay only for what you use.</p>

                    <div className="bg-gradient-to-br from-gray-900/70 to-blue-900/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700 max-w-md mx-auto">
                        <div className="text-6xl mb-6">💳</div>
                        <h3 className="text-3xl font-bold text-blue-400 mb-4">Pay Per Use</h3>
                        <div className="text-5xl font-bold mb-2">₹0.50</div>
                        <div className="text-gray-400 mb-6">per AI interaction</div>

                        <div className="bg-gradient-to-r from-blue-600/20 to-gray-600/20 rounded-lg p-4 mb-6">
                            <div className="text-2xl font-bold text-green-400 mb-2">₹500 Free Credit</div>
                            <div className="text-gray-300">Get started with 1000 free interactions</div>
                        </div>

                        <ul className="text-left space-y-3 mb-8">
                            <li className="flex items-center">
                                <span className="text-green-400 mr-3">✓</span>
                                Unlimited venues
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-3">✓</span>
                                Real-time data sync
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-3">✓</span>
                                24/7 AI support
                            </li>
                            <li className="flex items-center">
                                <span className="text-green-400 mr-3">✓</span>
                                Custom QR codes
                            </li>
                        </ul>

                        <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105">
                            Start Building Now
                        </button>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative z-10 px-6 py-20">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="bg-gradient-to-r from-blue-900/50 to-gray-900/50 backdrop-blur-lg rounded-2xl p-12 border border-gray-700">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            <span className="bg-gradient-to-r from-blue-400 to-gray-300 bg-clip-text text-transparent">
                                Ready to Transform Your Venue?
                            </span>
                        </h2>
                        <p className="text-xl text-gray-300 mb-8">
                            Join hundreds of venues already using NaviQ to enhance visitor experience
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-2xl">
                                🚀 Get ₹500 Free Credit
                            </button>
                            <button className="border-2 border-gray-400 hover:border-blue-400 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:bg-blue-900/20">
                                📞 Schedule Demo
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 px-6 py-12 border-t border-gray-800">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="flex items-center justify-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-gray-400 rounded-lg flex items-center justify-center">
                            <span className="text-xl font-bold">🤖</span>
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-gray-300 bg-clip-text text-transparent">
                            NaviQ
                        </span>
                    </div>
                    <p className="text-gray-400 mb-4">Empowering venues with intelligent AI assistants</p>
                    <div className="flex justify-center space-x-6 text-gray-400">
                        <a href="#" className="hover:text-blue-400 transition-colors">
                            Privacy
                        </a>
                        <a href="#" className="hover:text-blue-400 transition-colors">
                            Terms
                        </a>
                        <a href="#" className="hover:text-blue-400 transition-colors">
                            Support
                        </a>
                        <a href="#" className="hover:text-blue-400 transition-colors">
                            Contact
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Homepage
