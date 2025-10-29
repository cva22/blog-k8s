import CommentSection from './CommentSection'

interface Comment {
    id: string
    postId: string
    content: string
    authorId: string
    createdAt: string
}

interface Post {
    id: string
    title: string
    content: string
    authorId: string
    published: boolean
    createdAt: string
    comments: Comment[]
}

export default function PostDetail({ post }: { post: Post }) {
    return (
        <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {post.title}
            </h1>

            <div className="text-sm text-gray-500 mb-6">
                Published on {new Date(post.createdAt).toLocaleDateString()}
            </div>

            <div className="prose max-w-none mb-8">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {post.content}
                </p>
            </div>

            <div className="border-t border-gray-200 pt-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    Comments ({post.comments?.length || 0})
                </h2>
                <CommentSection postId={post.id} comments={post.comments || []} />
            </div>
        </div>
    )
}


