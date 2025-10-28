'use client'

import { useState } from 'react'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

interface Comment {
    id: string
    postId: string
    content: string
    authorId: string
    createdAt: string
}

export default function CommentSection({ postId, comments }: { postId: string, comments: Comment[] }) {
    const { user, isAuthenticated } = useAuth()
    const [newComment, setNewComment] = useState('')
    const [commentList, setCommentList] = useState(comments)
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!newComment.trim()) return

        if (!isAuthenticated || !user) {
            alert('You must be logged in to comment')
            return
        }

        try {
            setSubmitting(true)
            const response = await axios.post('http://localhost:3003/comments', {
                postId,
                content: newComment,
                authorId: user.id,
            })
            setCommentList([...commentList, response.data])
            setNewComment('')
        } catch (error) {
            console.error('Error submitting comment:', error)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Comments ({commentList.length})</h3>

            {/* Comment form - only for logged-in users */}
            {isAuthenticated ? (
                <form onSubmit={handleSubmit} className="mb-8">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                        rows={4}
                    />
                    <button
                        type="submit"
                        disabled={submitting}
                        className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {submitting ? 'Posting...' : 'Post Comment'}
                    </button>
                </form>
            ) : (
                <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-600 mb-3">You need to be logged in to comment</p>
                    <a
                        href="/auth"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        Sign In / Register
                    </a>
                </div>
            )}

            <div className="space-y-4">
                {commentList.map((comment) => (
                    <div key={comment.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="text-sm text-gray-500 mb-2">
                            {new Date(comment.createdAt).toLocaleDateString()}
                        </div>
                        <p className="text-gray-700">{comment.content}</p>
                    </div>
                ))}

                {commentList.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
                )}
            </div>
        </div>
    )
}


