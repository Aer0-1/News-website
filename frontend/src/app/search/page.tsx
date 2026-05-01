import * as React from "react"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Search, SlidersHorizontal, Clock } from "lucide-react"
import { createClient } from "@/utils/supabase/server"
import { BookmarkButton } from "@/components/ui/BookmarkButton"
import Link from "next/link"
import { Article, getImageUrl, getName } from "@/lib/sanitize"

const ITEMS_PER_PAGE = 10

export default async function SearchResultsPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; page?: string }
}) {
  const query = searchParams.q || ""
  const category = searchParams.category || ""
  const currentPage = Math.max(1, parseInt(searchParams.page || "1", 10))
  const offset = (currentPage - 1) * ITEMS_PER_PAGE

  const supabase = createClient()
  
  let supabaseQuery = supabase
    .from('articles')
    .select(`
      id,
      title,
      summary,
      image_url,
      published_at,
      sources (name),
      categories!inner (name)
    `, { count: 'exact' })
    .order('published_at', { ascending: false })

  if (query) {
    supabaseQuery = supabaseQuery.or(`title.ilike.%${query}%,summary.ilike.%${query}%`)
  }
  
  if (category && category !== 'All') {
    supabaseQuery = supabaseQuery.eq('categories.name', category)
  }

  const { data: results, count, error } = await supabaseQuery.range(offset, offset + ITEMS_PER_PAGE - 1)
  
  if (error) {
    console.error('Error fetching search results:', error)
  }

  const displayResults: Article[] = (results as Article[]) || []
  const totalCount = count || 0
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE))

  // Fetch current user bookmarks to pass initial state
  const { data: { user } } = await supabase.auth.getUser()
  let bookmarkedIds = new Set<string>()
  if (user) {
    const { data: bookmarks } = await supabase
      .from('bookmarks')
      .select('article_id')
      .eq('user_id', user.id)
    if (bookmarks) {
      bookmarkedIds = new Set(bookmarks.map((b: { article_id: string }) => b.article_id))
    }
  }

  // Build pagination URL helper
  function pageUrl(page: number): string {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (category) params.set('category', category)
    params.set('page', String(page))
    return `/search?${params.toString()}`
  }

  return (
    <div className="p-6 md:p-8 space-y-8 pb-20">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Search Results</h1>
        
        <form className="flex flex-col sm:flex-row gap-4 max-w-2xl" action="/search" method="get">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
            <Input 
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search for topics, sources, or keywords..." 
              className="pl-9 h-12 text-base shadow-sm"
            />
          </div>
          <Button type="submit" className="h-12 px-8">Search</Button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Filters Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-lg font-semibold flex items-center">
              <SlidersHorizontal className="mr-2 h-4 w-4" /> Filters
            </h2>
            <Link href="/search" className="text-xs text-foreground/60 hover:text-primary-blue">Clear all</Link>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-3 text-sm text-foreground/70 uppercase tracking-wider">Date Range</h3>
              <div className="space-y-2">
                {["Past 24 hours", "Past week", "Past month", "Past year"].map(range => (
                  <label key={range} className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="date" className="h-4 w-4 text-primary-blue focus:ring-primary-blue" />
                    <span className="text-sm text-foreground/80">{range}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-medium mb-3 text-sm text-foreground/70 uppercase tracking-wider">Categories</h3>
              <div className="space-y-2">
                {["Technology", "Business", "Politics", "Science", "Health"].map(cat => (
                  <Link 
                    key={cat} 
                    href={`/search?q=${query}&category=${cat}`}
                    className={`flex items-center space-x-2 cursor-pointer text-sm py-1 px-2 rounded-md transition-colors ${
                      category.toLowerCase() === cat.toLowerCase() 
                        ? 'bg-primary-blue/10 text-primary-blue font-medium' 
                        : 'text-foreground/80 hover:bg-light-gray'
                    }`}
                  >
                    <span>{cat}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Results List */}
        <section className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground/60">
              Showing <span className="font-medium text-foreground">{displayResults.length}</span> of{' '}
              <span className="font-medium text-foreground">{totalCount}</span> results
              {(query || category) && <span> for <span className="font-medium text-foreground">&quot;{query || category}&quot;</span></span>}
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-foreground/60">Sort by:</span>
              <select className="text-sm bg-transparent border-none font-medium focus:ring-0 text-foreground">
                <option>Relevance</option>
                <option>Newest first</option>
                <option>Oldest first</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {displayResults.map((result: Article) => (
              <Link key={result.id} href={`/article/${result.id}`}>
                <Card className="flex flex-col sm:flex-row overflow-hidden hover:shadow-md transition-shadow group cursor-pointer">
                  <div className="sm:w-64 bg-light-gray flex-shrink-0 aspect-video sm:aspect-auto relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={getImageUrl(result.image_url)} 
                      alt={result.title}
                      loading="lazy"
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-col flex-1">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start mb-1">
                        <Badge variant="secondary" className="mb-2">{getName(result.categories) || 'News'}</Badge>
                        <div className="-mr-2 -mt-2 text-foreground/40 hover:text-primary-blue rounded-full">
                          <BookmarkButton 
                            articleId={result.id} 
                            initialIsBookmarked={bookmarkedIds.has(result.id)}
                            variant="tertiary" 
                          />
                        </div>
                      </div>
                      <CardTitle className="text-xl group-hover:text-primary-blue transition-colors">
                        {result.title}
                      </CardTitle>
                      <CardDescription className="mt-2 line-clamp-2">
                        {result.summary}
                      </CardDescription>
                    </CardHeader>
                    <div className="flex-1" />
                    <CardFooter className="pt-2 pb-4 text-xs">
                      <span className="font-medium text-primary-blue mr-4">{getName(result.sources) || 'Unknown'}</span>
                      <span className="flex items-center text-foreground/60"><Clock className="mr-1 h-3 w-3" /> {new Date(result.published_at).toLocaleDateString()}</span>
                    </CardFooter>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
          
          {/* Real Pagination */}
          {totalPages > 1 && (
            <div className="pt-8 flex justify-center">
              <div className="flex items-center space-x-1">
                {currentPage > 1 && (
                  <Link href={pageUrl(currentPage - 1)}>
                    <Button variant="secondary" size="sm">← Previous</Button>
                  </Link>
                )}
                
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  return (
                    <Link key={pageNum} href={pageUrl(pageNum)}>
                      <Button 
                        variant={pageNum === currentPage ? "primary" : "secondary"} 
                        size="icon" 
                        className="w-10 h-10"
                      >
                        {pageNum}
                      </Button>
                    </Link>
                  )
                })}

                {currentPage < totalPages && (
                  <Link href={pageUrl(currentPage + 1)}>
                    <Button variant="secondary" size="sm">Next →</Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
