<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase" />
  <img src="https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
</p>

# 📰 NewsAggr — AI-Powered News Aggregation Platform

> A modern, full-stack news aggregation platform that automatically collects articles from RSS feeds, enriches them with AI-powered sentiment analysis & smart summarization, and presents them in a sleek, responsive web interface.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔄 **Automated Ingestion** | Background Python worker continuously fetches articles from configurable RSS sources |
| 🧠 **AI Summarization** | Uses Latent Semantic Analysis (Sumy) to extract the most important sentences |
| 💡 **Sentiment Analysis** | TextBlob-powered mood scoring classifies articles as Positive, Neutral, or Negative |
| 🔐 **Secure Auth** | Full authentication flow (Sign Up / Sign In / Sign Out) powered by Supabase Auth |
| 🔖 **Bookmarks** | Save articles for later reading with instant, optimistic UI updates |
| 📖 **Reading History** | Automatically tracks which articles you've read |
| 🔍 **Full-Text Search** | Search across all articles with category filtering |
| 👤 **User Dashboard** | Personal profile page with Bookmarks, Reading History, and Notification Preferences |
| 📱 **Responsive Design** | Beautiful, premium UI that works seamlessly on desktop, tablet, and mobile |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                     │
│              Next.js 14 · App Router · SSR              │
│         Tailwind CSS · Lucide Icons · Zustand           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌──────────┐  ┌──────────┐  ┌───────────────────┐    │
│   │ Homepage │  │  Search  │  │  Article Details   │    │
│   │          │  │  Results │  │  (with Sentiment)  │    │
│   └──────────┘  └──────────┘  └───────────────────┘    │
│   ┌──────────┐  ┌──────────┐                            │
│   │  Login   │  │ Profile  │                            │
│   │ Sign Up  │  │Dashboard │                            │
│   └──────────┘  └──────────┘                            │
│                                                         │
│         Server Actions (Bookmarks · History)             │
├─────────────────────────────────────────────────────────┤
│                  SUPABASE (Cloud)                        │
│     PostgreSQL · Auth · Row Level Security · REST API    │
├─────────────────────────────────────────────────────────┤
│              INGESTION SERVICE (Render)                  │
│       Python · feedparser · TextBlob · Sumy · NLTK      │
│          Automated hourly RSS polling loop               │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
news-website/
├── frontend/                    # Next.js 14 Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         # Homepage (featured + trending articles)
│   │   │   ├── search/          # Search results with filters
│   │   │   ├── article/[id]/    # Dynamic article detail page
│   │   │   ├── profile/         # User dashboard (bookmarks, history)
│   │   │   ├── login/           # Authentication page
│   │   │   └── actions/         # Server Actions (bookmarks, history)
│   │   ├── components/
│   │   │   ├── ui/              # Reusable UI components (Button, Card, Badge, etc.)
│   │   │   └── layout/          # Layout components (Sidebar, Header)
│   │   └── utils/
│   │       └── supabase/        # Supabase client (browser + server)
│   ├── middleware.ts             # Auth session refresh middleware
│   └── package.json
│
├── ingestion-service/           # Python Background Worker
│   ├── rss_parser.py            # Main ingestion script with AI processing
│   ├── requirements.txt         # Python dependencies
│   └── .env                     # Worker environment variables
│
├── supabase/                    # Database Configuration
│   ├── migrations/              # SQL migration files
│   │   └── initial_schema.sql   # Tables, RLS policies, seed data
│   ├── seed.sql                 # Category seed data
│   └── config.toml              # Supabase CLI config
│
├── render.yaml                  # Render deployment blueprint
└── README.md
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** [Next.js 14](https://nextjs.org/) with App Router & Server Components
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 3.4
- **Icons:** Lucide React
- **State:** Zustand + React Server Components
- **Auth Client:** @supabase/ssr

### Backend
- **Database:** [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentication:** Supabase Auth with SSR session management
- **Security:** Row Level Security (RLS) policies on all tables
- **API:** Supabase REST API (auto-generated from schema)

### AI / NLP
- **Sentiment Analysis:** [TextBlob](https://textblob.readthedocs.io/) — polarity scoring (-1.0 to 1.0)
- **Summarization:** [Sumy](https://github.com/miso-belica/sumy) — LSA-based extractive summarization
- **Tokenization:** NLTK

### Ingestion
- **Runtime:** Python 3.12
- **RSS Parsing:** feedparser
- **HTML Cleaning:** BeautifulSoup4
- **Scheduling:** Configurable polling loop (default: 1 hour)

---

## 🗄️ Database Schema

```sql
users          — User profiles (synced with Supabase Auth)
sources        — RSS feed sources (name, url, rss_url, category)
categories     — Article categories (Technology, Business, etc.)
articles       — Ingested articles (title, content, summary, sentiment_score)
bookmarks      — User-article bookmark relationships
reading_history — Tracks article views per user
```

All tables are protected by **Row Level Security (RLS)** — users can only access their own bookmarks and reading history, while articles, sources, and categories are publicly readable.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ & npm
- **Python** 3.10+
- A [Supabase](https://supabase.com/) project (free tier works)

### 1. Clone the Repository

```bash
git clone https://github.com/Aer0-1/News-website.git
cd News-website
```

### 2. Set Up the Database

Run the SQL migration in your Supabase Dashboard (SQL Editor), or use the Supabase CLI:

```bash
npx supabase link --project-ref <YOUR_PROJECT_REF>
npx supabase db push
```

### 3. Configure the Frontend

```bash
cd frontend
npm install
```

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Start the dev server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

### 4. Configure the Ingestion Service

```bash
cd ingestion-service
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
python -m textblob.download_corpora lite
```

Create a `.env` file:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
POLL_INTERVAL_SECONDS=3600
```

> ⚠️ **Important:** The ingestion service uses the **Service Role Key** (not the Anon Key) to bypass RLS for background inserts.

Add at least one RSS source to your `sources` table in Supabase, then start the worker:

```bash
python rss_parser.py
```

---

## ☁️ Deployment

### Frontend → Vercel

1. Import repository on [Vercel](https://vercel.com/new)
2. Set **Root Directory** to `frontend`
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

### Ingestion Worker → Render

1. Connect repository on [Render Blueprints](https://dashboard.render.com/)
2. Render auto-detects `render.yaml`
3. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_KEY` (Service Role Key)
4. Deploy!

---

## 📸 Screenshots

> _Coming soon — run the app locally and explore the UI!_

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/Aer0-1">Aer0-1</a>
</p>
