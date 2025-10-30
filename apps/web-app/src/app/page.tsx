'use client'

import { useState } from 'react'
import Link from 'next/link'
import PostList from '../components/PostList'
import CreatePostForm from '../components/CreatePostForm'
import { useAuth } from '../contexts/AuthContext'

export default function Home() {
    const { isAuthenticated, user, logout } = useAuth()
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    const handlePostCreated = () => {
        setRefreshTrigger(prev => prev + 1)
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
            <div className="container mx-auto px-4 py-8">
                <header className="mb-12">
                    <h1 className="text-5xl font-bold text-gray-900 mb-4">
                        Microservices Blog
                    </h1>
                    <p className="text-xl text-gray-600">
                        A blog application built with microservices architecture
                    </p>
                </header>

                <div className="flex justify-between items-center mb-8">
                    {isAuthenticated ? (
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700">
                                Welcome, <span className="font-medium">{user?.username}</span>!
                            </span>
                            <button
                                onClick={logout}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <Link
                            href="/auth"
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Sign In / Register
                        </Link>
                    )}
                </div>

                {/* Post creation form - only for logged-in users */}
                <CreatePostForm onPostCreated={handlePostCreated} />

                <PostList refreshTrigger={refreshTrigger} />
            </div>
        </main>
    )
}


