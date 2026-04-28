import * as React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card"
import { Clock, Bookmark } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { BookmarkButton } from "@/components/ui/BookmarkButton"
import { createClient } from "@/utils/supabase/server"

export default async function HomePage() {
  const supabase = createClient()
  
  const { data: articles, error } = await supabase
    .from('articles')
    .select(`
      id,
      title,
      summary,
      image_url,
      published_at,
      sources (name),
      categories (name)
    `)
    .order('published_at', { ascending: false })
    .limit(10)

  // Fetch current user bookmarks to pass initial state
  const { data: { user } } = await supabase.auth.getUser()
  let bookmarkedIds = new Set<string>()
  if (user) {
    const { data: bookmarks } = await supabase
      .from('bookmarks')
      .select('article_id')
      .eq('user_id', user.id)
    if (bookmarks) {
      bookmarkedIds = new Set(bookmarks.map((b: any) => b.article_id))
    }
  }

  // Use real data if available, fallback to empty arrays to prevent crashes before seed
  const featuredArticle = articles && articles.length > 0 ? articles[0] : null;
  const trendingArticles = articles && articles.length > 1 ? articles.slice(1, 4) : [];
  const latestArticles = articles && articles.length > 4 ? articles.slice(4) : [];
  return (
    <div className="p-6 md:p-8 space-y-10 pb-20">
      
      {/* Featured Article Section */}
      {featuredArticle && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Top Story</h2>
          </div>
          <div className="group relative rounded-2xl overflow-hidden border bg-white shadow-sm transition-all hover:shadow-md cursor-pointer">
            <div className="aspect-[21/9] w-full bg-light-gray relative overflow-hidden">
              {/* Using a regular img tag for mock purposes, should be next/image in prod */}
              <img 
                src={featuredArticle.image_url || `https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200`} 
                alt={featuredArticle.title}
                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 md:p-8 space-y-3 w-full max-w-3xl">
                <Badge className="bg-primary-blue border-transparent">{featuredArticle.categories?.name || 'News'}</Badge>
                <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight">
                  {featuredArticle.title}
                </h1>
                <p className="text-gray-200 line-clamp-2 md:text-lg">
                  {featuredArticle.summary}
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-300">
                  <span className="font-semibold text-white">{featuredArticle.sources?.name || 'Unknown'}</span>
                  <span className="flex items-center"><Clock className="mr-1 h-3 w-3" /> {new Date(featuredArticle.published_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <BookmarkButton 
                  articleId={featuredArticle.id} 
                  initialIsBookmarked={bookmarkedIds.has(featuredArticle.id)}
                  variant="secondary" 
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Trending & Latest Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Latest Articles (Left 2 columns) */}
        <section className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold tracking-tight border-b pb-2">Latest News</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {latestArticles.map((article: any) => (
              <Card key={article.id} className="flex flex-col h-full cursor-pointer group">
                <div className="aspect-video w-full bg-light-gray overflow-hidden">
                  <img 
                    src={article.image_url || `https://images.unsplash.com/photo-${1500000000000 + (Math.random() * 100)}?auto=format&fit=crop&w=600&q=80`} 
                    alt="Article thumbnail"
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <CardHeader className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">{article.categories?.name || 'News'}</Badge>
                    <div className="-mr-2 text-foreground/50 hover:text-primary-blue rounded-full">
                      <BookmarkButton 
                        articleId={article.id} 
                        initialIsBookmarked={bookmarkedIds.has(article.id)}
                        variant="ghost" 
                      />
                    </div>
                  </div>
                  <CardTitle className="group-hover:text-primary-blue transition-colors">
                    {article.title}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {article.summary}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex items-center justify-between border-t pt-4">
                  <span className="font-medium text-primary-blue">{article.sources?.name || 'Unknown'}</span>
                  <span className="flex items-center text-xs"><Clock className="mr-1 h-3 w-3" /> {new Date(article.published_at).toLocaleDateString()}</span>
                </CardFooter>
              </Card>
            ))}
          </div>
          <div className="pt-4 flex justify-center">
            <Button variant="secondary" className="w-full sm:w-auto">Load More Articles</Button>
          </div>
        </section>

        {/* Trending Sidebar (Right 1 column) */}
        <aside className="space-y-6">
          <h2 className="text-xl font-bold tracking-tight border-b pb-2 flex items-center">
            <span className="w-2 h-2 rounded-full bg-danger-red mr-2 animate-pulse" />
            Trending Now
          </h2>
          <div className="flex flex-col space-y-4">
            {trendingArticles.map((article: any, index: number) => (
              <div key={article.id} className="flex space-x-4 group cursor-pointer">
                <div className="text-3xl font-bold text-light-gray group-hover:text-primary-blue/20 transition-colors">
                  0{index + 1}
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold leading-tight group-hover:text-primary-blue transition-colors line-clamp-2">
                    {article.title}
                  </h4>
                  <div className="flex items-center text-xs text-foreground/60 space-x-2">
                    <span className="text-primary-blue font-medium">{article.sources?.name || 'Unknown'}</span>
                    <span>•</span>
                    <span>{new Date(article.published_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-light-gray rounded-xl mt-8">
            <h3 className="font-bold mb-2">Subscribe to Newsletter</h3>
            <p className="text-sm text-foreground/70 mb-4">Get the latest news delivered directly to your inbox daily.</p>
            <div className="space-y-2">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="flex h-10 w-full rounded-md border border-foreground/20 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
              <Button className="w-full">Subscribe</Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
