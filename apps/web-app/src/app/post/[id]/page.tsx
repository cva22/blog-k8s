import Link from 'next/link'
import { notFound } from 'next/navigation'
import PostDetail from '../../../components/PostDetail'

export default async function PostPage({ params }: { params: { id: string } }) {
    let postData = null

    try {
        const res = await fetch(`http://localhost:3005/query/post/${params.id}`, {
            cache: 'no-store',
        })

        if (res.ok) {
            postData = await res.json()
        }
    } catch (error) {
        console.error('Error fetching post:', error)
    }

    if (!postData) {
        notFound()
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <Link
                    href="/"
                    className="mb-6 inline-flex items-center text-indigo-600 hover:text-indigo-800"
                >
                    ← Back to Posts
                </Link>
                <PostDetail post={postData} />
            </div>
        </main>
    )
}


