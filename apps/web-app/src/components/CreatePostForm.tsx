'use client'

import { useState } from 'react'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

interface CreatePostFormProps {
    onPostCreated?: () => void
}

export default function CreatePostForm({ onPostCreated }: CreatePostFormProps) {
    const { user, isAuthenticated } = useAuth()
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        published: true
    })
    const [submitting, setSubmitting] = useState(false)
    const [message, setMessage] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!isAuthenticated || !user) {
            setMessage('You must be logged in to create posts')
            return
        }

        try {
            setSubmitting(true)
            setMessage('')

            await axios.post('http://localhost:3006/posts', {
                title: formData.title,
                content: formData.content,
                published: formData.published,
                authorId: user.id
            })

            setFormData({ title: '', content: '', published: true })
            setMessage('Post created successfully!')

            if (onPostCreated) {
                onPostCreated()
            }
        } catch (error: any) {
            console.error('Error creating post:', error)
            setMessage(error.response?.data?.message || 'Failed to create post')
        } finally {
            setSubmitting(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }))
    }

    if (!isAuthenticated) {
        return (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Create a New Post</h3>
                    <p className="text-gray-600 mb-4">You need to be logged in to create posts</p>
                    <a
                        href="/auth"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        Sign In / Register
                    </a>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create a New Post</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                        placeholder="Enter post title..."
                        required
                    />
                </div>

                <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                        Content
                    </label>
                    <textarea
                        id="content"
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                        placeholder="Write your post content..."
                        rows={6}
                        required
                    />
                </div>

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="published"
                        name="published"
                        checked={formData.published}
                        onChange={handleChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="published" className="ml-2 block text-sm text-gray-900">
                        Publish immediately
                    </label>
                </div>

                {message && (
                    <div className={`p-3 rounded-lg ${message.includes('successfully')
                        ? 'bg-green-50 text-green-800'
                        : 'bg-red-50 text-red-800'
                        }`}>
                        {message}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
                >
                    {submitting ? 'Creating Post...' : 'Create Post'}
                </button>
            </form>
        </div>
    )
}
