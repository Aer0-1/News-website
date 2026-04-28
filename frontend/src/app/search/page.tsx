import * as React from "react"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Search, SlidersHorizontal, Clock, Bookmark } from "lucide-react"
import { createClient } from "@/utils/supabase/server"
import { BookmarkButton } from "@/components/ui/BookmarkButton"

export default async function SearchResultsPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string }
}) {
  const query = searchParams.q || ""
  const category = searchParams.category || ""

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
    `)
    .order('published_at', { ascending: false })

  if (query) {
    supabaseQuery = supabaseQuery.or(`title.ilike.%${query}%,summary.ilike.%${query}%`)
  }
  
  if (category && category !== 'All') {
    supabaseQuery = supabaseQuery.eq('categories.name', category)
  }

  const { data: results, error } = await supabaseQuery.limit(20)
  const displayResults = results || []

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

  return (
    <div className="p-6 md:p-8 space-y-8 pb-20">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Search Results</h1>
        
        <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
            <Input 
              type="search" 
              defaultValue={query}
              placeholder="Search for topics, sources, or keywords..." 
              className="pl-9 h-12 text-base shadow-sm"
            />
          </div>
          <Button className="h-12 px-8">Search</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Filters Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-lg font-semibold flex items-center">
              <SlidersHorizontal className="mr-2 h-4 w-4" /> Filters
            </h2>
            <Button variant="tertiary" size="sm" className="h-auto p-0 text-xs">Clear all</Button>
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
                  <label key={cat} className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" defaultChecked={category.toLowerCase() === cat.toLowerCase()} className="h-4 w-4 text-primary-blue rounded border-gray-300 focus:ring-primary-blue" />
                    <span className="text-sm text-foreground/80">{cat}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Results List */}
        <section className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground/60">
              Showing <span className="font-medium text-foreground">{displayResults.length}</span> results
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
            {displayResults.map((result: any) => (
              <Card key={result.id} className="flex flex-col sm:flex-row overflow-hidden hover:shadow-md transition-shadow group cursor-pointer">
                <div className="sm:w-64 bg-light-gray flex-shrink-0 aspect-video sm:aspect-auto relative overflow-hidden">
                   <img 
                    src={result.image_url || `https://images.unsplash.com/photo-${1500000000000 + (Math.random() * 100)}?auto=format&fit=crop&w=600&q=80`} 
                    alt="Thumbnail"
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-col flex-1">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start mb-1">
                      <Badge variant="secondary" className="mb-2">{result.categories?.name || 'News'}</Badge>
                      <div className="-mr-2 -mt-2 text-foreground/40 hover:text-primary-blue rounded-full">
                        <BookmarkButton 
                          articleId={result.id} 
                          initialIsBookmarked={bookmarkedIds.has(result.id)}
                          variant="ghost" 
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
                    <span className="font-medium text-primary-blue mr-4">{result.sources?.name || 'Unknown'}</span>
                    <span className="flex items-center text-foreground/60"><Clock className="mr-1 h-3 w-3" /> {new Date(result.published_at).toLocaleDateString()}</span>
                  </CardFooter>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="pt-8 flex justify-center">
             <div className="flex space-x-1">
               {[1, 2, 3, 4, 5].map(page => (
                 <Button key={page} variant={page === 1 ? "primary" : "secondary"} size="icon" className="w-10 h-10">
                   {page}
                 </Button>
               ))}
               <span className="flex items-center justify-center w-10 h-10 text-foreground/50">...</span>
               <Button variant="secondary" size="icon" className="w-10 h-10">10</Button>
             </div>
          </div>
        </section>
      </div>
    </div>
  )
}
