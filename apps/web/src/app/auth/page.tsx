'use client'

import { useState } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
    const { login } = useAuth()
    const router = useRouter()
    const [isLogin, setIsLogin] = useState(true)
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
    })
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')

        try {
            const endpoint = isLogin ? 'login' : 'register'
            const response = await axios.post(`http://localhost:3001/auth/${endpoint}`, formData)

            if (isLogin) {
                // Extract user data from response (adjust based on your auth service response)
                const userData = {
                    id: response.data.user?.id || 'user-1',
                    email: response.data.user?.email || formData.email,
                    username: response.data.user?.username || formData.username || 'user'
                }

                login(response.data.token, userData)
                setMessage('Login successful! Redirecting...')

                // Redirect to home page after successful login
                setTimeout(() => {
                    router.push('/')
                }, 1000)
            } else {
                setMessage('Registration successful! You can now login.')
                setIsLogin(true)
            }
        } catch (error: any) {
            setMessage(error.response?.data?.message || 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        })
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {isLogin ? 'Sign In' : 'Sign Up'}
                    </h1>
                    <p className="text-gray-600">
                        {isLogin
                            ? 'Welcome back to Microservices Blog'
                            : 'Join Microservices Blog'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                Username
                            </label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                                required
                            />
                        </div>
                    )}

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                            required
                        />
                    </div>

                    {message && (
                        <div
                            className={`p-3 rounded-lg ${message.includes('successful')
                                ? 'bg-green-50 text-green-800'
                                : 'bg-red-50 text-red-800'
                                }`}
                        >
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
                    >
                        {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin)
                            setMessage('')
                        }}
                        className="text-indigo-600 hover:text-indigo-700"
                    >
                        {isLogin
                            ? "Don't have an account? Sign up"
                            : 'Already have an account? Sign in'}
                    </button>
                </div>

                <div className="mt-6 text-center">
                    <Link href="/" className="text-gray-600 hover:text-gray-800">
                        ← Back to Posts
                    </Link>
                </div>
            </div>
        </main>
    )
}


