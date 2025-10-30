'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'

interface Post {
    id: string
    title: string
    content: string
    authorId: string
    published: boolean
    createdAt: string
    comments: Comment[]
}

interface PostListProps {
    refreshTrigger?: number
}

export default function PostList({ refreshTrigger }: PostListProps) {
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchPosts()
    }, [refreshTrigger])

    const fetchPosts = async () => {
        try {
            setLoading(true)
            const response = await axios.get('http://localhost:3005/query/posts')
            setPosts(response.data)
        } catch (err) {
            console.error('Error fetching posts:', err)
            setError('Failed to load posts')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-xl text-gray-600">Loading posts...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-xl text-red-600">{error}</div>
            </div>
        )
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
                <Link
                    key={post.id}
                    href={`/post/${post.id}`}
                    className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200"
                >
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        {post.title}
                    </h2>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                        {post.content.substring(0, 150)}...
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>
                            {post.comments?.length || 0} comments
                        </span>
                        <span>
                            {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </Link>
            ))}
        </div>
    )
}


