import * as React from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Bookmark, Clock, Settings, LogOut, Trash2 } from "lucide-react"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { BookmarkButton } from "@/components/ui/BookmarkButton"
import Link from "next/link"

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const currentTab = searchParams.tab || "bookmarks"
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch Bookmarks
  const { data: bookmarksData } = await supabase
    .from('bookmarks')
    .select(`
      article_id,
      created_at,
      articles (
        id,
        title,
        sources (name),
        categories (name)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const savedArticles = bookmarksData?.map(b => ({
    id: b.articles?.id,
    title: b.articles?.title,
    category: b.articles?.categories?.name || 'News',
    source: b.articles?.sources?.name || 'Unknown',
    savedDate: new Date(b.created_at).toLocaleDateString()
  })) || []

  // Fetch History (assuming reading_history table exists, otherwise empty for now)
  const { data: historyData } = await supabase
    .from('reading_history')
    .select(`
      article_id,
      read_at,
      articles (
        id,
        title,
        sources (name),
        categories (name)
      )
    `)
    .eq('user_id', user.id)
    .order('read_at', { ascending: false })
    .limit(20)

  const historyArticles = historyData?.map(h => ({
    id: h.articles?.id,
    title: h.articles?.title,
    category: h.articles?.categories?.name || 'News',
    source: h.articles?.sources?.name || 'Unknown',
    readDate: new Date(h.read_at).toLocaleString()
  })) || []

  const tabs = [
    { id: "bookmarks", label: "Bookmarks", icon: Bookmark },
    { id: "history", label: "Reading History", icon: Clock },
    { id: "preferences", label: "Preferences", icon: Settings },
  ]

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto pb-20">
      
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6 mb-12 p-6 bg-white rounded-2xl border shadow-sm">
        <div className="h-24 w-24 rounded-full bg-primary-blue flex items-center justify-center text-3xl font-bold text-white shadow-inner">
          {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
        </div>
        <div className="flex-1 text-center md:text-left space-y-1">
          <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
          <p className="text-foreground/60">{user.email}</p>
          <p className="text-sm text-foreground/40">Member since {new Date(user.created_at).toLocaleDateString()}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="secondary" size="sm">
            Edit Profile
          </Button>
          <form action="/auth/signout" method="post">
            <Button variant="danger" size="sm" type="submit" className="bg-transparent text-danger-red border-danger-red hover:bg-danger-red/10">
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </form>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b mb-8 overflow-x-auto pb-px">
        {tabs.map(tab => {
          const isActive = currentTab === tab.id
          return (
            <Link 
              key={tab.id}
              href={`/profile?tab=${tab.id}`}
              className={`flex items-center space-x-2 px-6 py-3 font-medium text-sm transition-colors whitespace-nowrap ${
                isActive 
                  ? 'border-b-2 border-primary-blue text-primary-blue' 
                  : 'text-foreground/60 hover:text-foreground hover:bg-light-gray rounded-t-lg'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        
        {currentTab === "bookmarks" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Your Saved Articles</h2>
              <span className="text-sm text-foreground/60">{savedArticles.length} articles</span>
            </div>
            {savedArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {savedArticles.map((article: Record<string, unknown> & { id: string; title: string; category: string; source: string; savedDate: string }) => (
                  <Link key={article.id} href={`/article/${article.id}`}>
                    <Card className="flex flex-col h-full group cursor-pointer hover:border-primary-blue/30">
                      <CardHeader>
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="secondary">{article.category}</Badge>
                          <div className="-mt-2 -mr-2 transition-colors">
                            <BookmarkButton articleId={article.id} initialIsBookmarked={true} variant="ghost" />
                          </div>
                        </div>
                        <CardTitle className="text-lg group-hover:text-primary-blue transition-colors leading-snug">
                          {article.title}
                        </CardTitle>
                      </CardHeader>
                      <div className="flex-1" />
                      <CardFooter className="text-xs text-foreground/60 justify-between border-t pt-4">
                        <span className="text-primary-blue font-medium">{article.source}</span>
                        <span>Saved {article.savedDate}</span>
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-light-gray rounded-xl">
                <Bookmark className="h-12 w-12 mx-auto text-foreground/20 mb-4" />
                <h3 className="text-lg font-medium text-foreground">No bookmarks yet</h3>
                <p className="text-foreground/60 mt-2 mb-6">Save articles you want to read later.</p>
                <Link href="/">
                  <Button>Discover Articles</Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {currentTab === "history" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Reading History</h2>
              <Button variant="tertiary" size="sm" className="text-danger-red hover:bg-danger-red/10">
                <Trash2 className="h-4 w-4 mr-2" /> Clear History
              </Button>
            </div>
            <div className="space-y-4">
              {historyArticles.length > 0 ? historyArticles.map((article: Record<string, unknown> & { id: string; title: string; source: string; readDate: string; duration: string }) => (
                <Link key={`${article.id}-${article.readDate}`} href={`/article/${article.id}`}>
                  <div className="flex items-center justify-between p-4 bg-white border rounded-xl hover:shadow-sm cursor-pointer transition-shadow">
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 rounded-full bg-light-gray" />
                      <div>
                        <h4 className="font-semibold text-foreground hover:text-primary-blue transition-colors line-clamp-1">{article.title}</h4>
                        <div className="flex items-center text-xs text-foreground/50 mt-1 space-x-2">
                          <span className="text-primary-blue font-medium">{article.source}</span>
                          <span>•</span>
                          <span>{article.category}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-foreground/40 whitespace-nowrap ml-4">
                      {article.readDate}
                    </div>
                  </div>
                </Link>
              )) : (
                <div className="text-center py-10 text-foreground/60">No reading history yet.</div>
              )}
            </div>
          </div>
        )}

        {currentTab === "preferences" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
            <div className="space-y-4">
              <h2 className="text-xl font-bold">News Preferences</h2>
              <p className="text-foreground/60">Customize your news feed by selecting your favorite topics.</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
                {["Technology", "Business", "Politics", "Science", "Health", "Sports", "Entertainment", "World", "Design"].map(topic => (
                  <label key={topic} className="flex items-center justify-center p-4 border rounded-xl cursor-pointer hover:border-primary-blue transition-colors group relative overflow-hidden">
                    <input type="checkbox" className="sr-only" defaultChecked={["Technology", "Science", "Design"].includes(topic)} />
                    <div className="absolute inset-0 bg-primary-blue/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="font-medium text-foreground group-hover:text-primary-blue z-10">{topic}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-8 border-t">
              <h2 className="text-xl font-bold">Email Notifications</h2>
              
              <div className="space-y-4">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="mt-1 h-4 w-4 text-primary-blue rounded border-gray-300" />
                  <div>
                    <span className="block font-medium text-foreground">Daily Digest</span>
                    <span className="block text-sm text-foreground/60">Receive a daily summary of top stories in your favorite categories.</span>
                  </div>
                </label>
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input type="checkbox" className="mt-1 h-4 w-4 text-primary-blue rounded border-gray-300" />
                  <div>
                    <span className="block font-medium text-foreground">Breaking News Alerts</span>
                    <span className="block text-sm text-foreground/60">Get notified immediately when major news breaks.</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-6">
              <Button>Save Preferences</Button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
