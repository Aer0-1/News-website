import * as React from "react"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Share2, Clock, ArrowLeft, Sparkles } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { BookmarkButton } from "@/components/ui/BookmarkButton"
import { checkIsBookmarked } from "@/app/actions/bookmarks"
import { logReadingHistory } from "@/app/actions/history"
import { ArticleDetail, sanitizeHtml, calculateReadTime, getImageUrl, getName } from "@/lib/sanitize"

export default async function ArticleDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  
  const { data: fetchedArticle, error } = await supabase
    .from('articles')
    .select(`
      *,
      sources (name),
      categories (name)
    `)
    .eq('id', params.id)
    .single()

  if (error || !fetchedArticle) {
    notFound()
  }

  const article = fetchedArticle as ArticleDetail

  const isBookmarked = await checkIsBookmarked(article.id)

  // Log reading history with error tracking
  try {
    await logReadingHistory(article.id)
  } catch (err) {
    console.error('Failed to log reading history:', err)
  }

  // Sentiment analysis — using static Tailwind classes (dynamic classes don't compile)
  let sentimentLabel = 'Neutral'
  let sentimentClasses = 'bg-gray-100 text-gray-700'
  
  if (article.sentiment_score && article.sentiment_score > 0.1) {
    sentimentLabel = 'Positive'
    sentimentClasses = 'bg-green-100 text-green-700'
  } else if (article.sentiment_score && article.sentiment_score < -0.1) {
    sentimentLabel = 'Negative'
    sentimentClasses = 'bg-red-100 text-red-700'
  }

  // Calculate read time from content
  const readTime = calculateReadTime(article.content || article.summary)

  // Sanitize HTML content for safe rendering
  const safeContent = sanitizeHtml(article.content || `<p>${article.summary}</p>`)

  return (
    <article className="min-h-screen pb-20">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        
        <Link href="/" className="inline-flex items-center text-sm font-medium text-foreground/60 hover:text-primary-blue mb-8 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        <header className="space-y-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge className="bg-primary-blue text-white hover:bg-primary-blue/90">{getName(article.categories) || 'News'}</Badge>
              {article.sentiment_score !== null && (
                <Badge variant="outline" className={`${sentimentClasses} border-transparent flex items-center gap-1`}>
                  <Sparkles className="h-3 w-3" />
                  {sentimentLabel} ({article.sentiment_score.toFixed(2)})
                </Badge>
              )}
            </div>
            <div className="flex space-x-2">
              <BookmarkButton articleId={article.id} initialIsBookmarked={isBookmarked} variant="secondary" />
              <Button variant="secondary" size="icon" className="rounded-full">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-foreground/60">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-light-gray flex items-center justify-center font-bold text-primary-blue">
                {article.author ? article.author.charAt(0) : 'A'}
              </div>
              <span className="font-medium text-foreground">{article.author || 'Anonymous'}</span>
            </div>
            <span>•</span>
            <span className="font-medium text-primary-blue">{getName(article.sources) || 'Unknown'}</span>
            <span>•</span>
            <span>{new Date(article.published_at).toLocaleDateString()}</span>
            <span>•</span>
            <span className="flex items-center"><Clock className="mr-1 h-3 w-3" /> {readTime}</span>
          </div>
        </header>

        <figure className="mb-10 rounded-2xl overflow-hidden shadow-sm border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={getImageUrl(article.image_url)} 
            alt={article.title}
            loading="lazy"
            className="w-full h-auto max-h-[500px] object-cover"
          />
        </figure>

        <div 
          className="prose prose-lg md:prose-xl max-w-none prose-headings:font-bold prose-headings:text-primary-blue prose-p:text-foreground/80 prose-a:text-primary-blue prose-blockquote:border-primary-blue prose-blockquote:bg-light-gray prose-blockquote:p-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:font-medium"
          dangerouslySetInnerHTML={{ __html: safeContent }}
        />

        <div className="mt-16 pt-8 border-t flex items-center justify-between">
          <div className="flex space-x-4">
            <BookmarkButton articleId={article.id} initialIsBookmarked={isBookmarked} variant="secondary" showText={true} />
            <Button variant="secondary">
              <Share2 className="mr-2 h-4 w-4" /> Share Article
            </Button>
          </div>
        </div>

      </div>
    </article>
  )
}
