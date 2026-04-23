import Link from "next/link"
import EmailForm from "@/components/EmailForm"

const FEATURES = [
  {
    icon: "✍️",
    title: "AI Script Writer",
    description: "Generate full course scripts in seconds. Hook, sections, examples, and CTA — all structured by AI.",
    badge: "2 credits",
    color: "from-indigo-500/20 to-violet-500/20",
    border: "border-indigo-500/20",
    badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  },
  {
    icon: "🎨",
    title: "AI Thumbnail Generator",
    description: "Create eye-catching 16:9 thumbnails using DALL-E 3. Choose style and mood, get a professional result.",
    badge: "3 credits",
    color: "from-violet-500/20 to-pink-500/20",
    border: "border-violet-500/20",
    badgeColor: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  },
  {
    icon: "🗺️",
    title: "Course Outline Generator",
    description: "Plan a full course with modules, topics, and estimated times. Go from idea to curriculum in one click.",
    badge: "1 credit",
    color: "from-cyan-500/20 to-blue-500/20",
    border: "border-cyan-500/20",
    badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  },
]

const STEPS = [
  {
    number: "01",
    title: "Choose your topic",
    description: "Enter what you want to teach. The AI understands context, audience, and learning objectives.",
  },
  {
    number: "02",
    title: "AI generates content",
    description: "Scripts, thumbnails, and course outlines are created in seconds using state-of-the-art models.",
  },
  {
    number: "03",
    title: "Publish and track",
    description: "Upload your content, track learner progress, quizzes auto-generate from your transcripts.",
  },
]

const CATEGORIES = [
  { label: "Web Development", icon: "💻", count: "120+ courses" },
  { label: "AI & Machine Learning", icon: "🤖", count: "85+ courses" },
  { label: "Data Science", icon: "📊", count: "94+ courses" },
  { label: "Business Strategy", icon: "📈", count: "67+ courses" },
  { label: "UI/UX Design", icon: "🎨", count: "53+ courses" },
  { label: "Cloud & DevOps", icon: "☁️", count: "48+ courses" },
]

const STATS = [
  { value: "12,000+", label: "Active Learners" },
  { value: "500+", label: "Courses Available" },
  { value: "4.9★", label: "Average Rating" },
  { value: "94%", label: "Completion Rate" },
]

const FAQ_ITEMS = [
  {
    q: "What is StreamAI?",
    a: "StreamAI is an AI-powered learning platform where creators build courses using AI tools — script writer, thumbnail generator, and course outline AI — and learners access structured, interactive content with quizzes and progress tracking.",
  },
  {
    q: "How do AI credits work?",
    a: "Every account starts with 10 free credits. Generating a script costs 2 credits, a thumbnail costs 3, and a course outline costs 1. You can buy more credits or earn them through platform milestones.",
  },
  {
    q: "What AI models does StreamAI use?",
    a: "We use Groq's llama-3.3-70b-versatile for fast text generation (scripts, outlines) and OpenAI DALL-E 3 for thumbnail image generation. All AI features run server-side — your data is never sent to third parties.",
  },
  {
    q: "Can I upload my own videos?",
    a: "Yes. Creators upload videos directly to S3 storage. The AI automatically transcribes, summarizes, and generates chapter markers and quiz questions from your video content.",
  },
]

export default function LandingPage() {
  return (
    <div className="bg-[#050508] min-h-screen text-white overflow-x-hidden">

      {/* Navbar */}
      <nav className="absolute top-0 w-full z-50 flex items-center justify-between px-6 md:px-12 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center glow-indigo-sm">
            <span className="text-white font-black text-base">S</span>
          </div>
          <span className="text-white font-black text-2xl tracking-tight">
            Stream<span className="gradient-text">AI</span>
          </span>
        </div>
        <Link
          href="/login"
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm glow-indigo-sm"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-40 pb-28 overflow-hidden">
        {/* Background orbs */}
        <div className="orb w-96 h-96 bg-indigo-600 top-10 left-1/4 animate-float" />
        <div className="orb w-80 h-80 bg-violet-600 top-20 right-1/4 animate-float-delayed" />
        <div className="orb w-64 h-64 bg-cyan-600 bottom-0 left-1/3" />

        <div className="relative z-10 max-w-4xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            Powered by Groq & DALL-E 3
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6 tracking-tight">
            Build Real Skills<br />
            <span className="gradient-text">with AI</span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-400 mb-4 max-w-2xl mx-auto leading-relaxed">
            The platform where creators generate courses with AI and learners track real progress.
          </p>
          <p className="text-slate-500 mb-10 text-base">
            Start free with 10 AI credits. No credit card required.
          </p>

          <EmailForm />

          {/* Trust line */}
          <p className="text-slate-600 text-sm mt-6">
            Join 12,000+ learners already building skills on StreamAI
          </p>
        </div>
      </section>

      {/* Stats bar */}
      <div className="border-y border-white/5 bg-white/2 px-6 py-10">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <p className="text-3xl font-black gradient-text mb-1">{value}</p>
              <p className="text-slate-500 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Features */}
      <section className="px-6 py-24 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-3">AI Tools</p>
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Create content in minutes,<br />not weeks
          </h2>
          <p className="text-slate-400 text-xl max-w-2xl mx-auto">
            Every creator tool you need, powered by the best AI models available.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={`glass-card rounded-2xl p-8 hover:border-indigo-500/30 transition-all hover:-translate-y-1 group`}
            >
              <div className={`w-14 h-14 rounded-2xl bg-linear-to-br ${f.color} border ${f.border} flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform`}>
                {f.icon}
              </div>
              <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${f.badgeColor} mb-4`}>
                {f.badge}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
              <p className="text-slate-400 leading-relaxed text-sm">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-linear-to-r from-transparent via-indigo-500/20 to-transparent mx-12" />

      {/* How it works */}
      <section className="px-6 py-24 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">How It Works</p>
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            From idea to live course
          </h2>
          <p className="text-slate-400 text-xl">Three steps is all it takes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <div key={step.number} className="relative">
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-8 left-full w-full h-px bg-linear-to-r from-indigo-500/30 to-transparent z-0" />
              )}
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-indigo-600/30 to-violet-600/30 border border-indigo-500/25 flex items-center justify-center mb-6">
                  <span className="text-indigo-400 font-black text-lg">{step.number}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-linear-to-r from-transparent via-violet-500/20 to-transparent mx-12" />

      {/* Categories */}
      <section className="px-6 py-24 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-cyan-400 text-sm font-semibold uppercase tracking-widest mb-3">Categories</p>
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Learn anything
          </h2>
          <p className="text-slate-400 text-xl">500+ courses across 6 major tracks.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              href="/browse"
              className="glass-card rounded-2xl p-6 flex items-center gap-4 hover:border-indigo-500/30 hover:-translate-y-0.5 transition-all group"
            >
              <span className="text-3xl">{cat.icon}</span>
              <div>
                <p className="text-white font-semibold text-sm group-hover:text-indigo-300 transition-colors">{cat.label}</p>
                <p className="text-slate-500 text-xs mt-0.5">{cat.count}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-linear-to-r from-transparent via-cyan-500/20 to-transparent mx-12" />

      {/* FAQ */}
      <section className="px-6 py-24 max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Questions? We have answers.
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {FAQ_ITEMS.map((item, i) => (
            <FAQItem key={i} question={item.q} answer={item.a} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-20">
          <h3 className="text-2xl font-black mb-3">Ready to start learning?</h3>
          <p className="text-slate-400 mb-8">Get 10 free AI credits when you sign up today.</p>
          <EmailForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 md:px-12 py-12 text-slate-600 text-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <span className="text-white font-black text-xs">S</span>
            </div>
            <span className="text-slate-400 font-bold">StreamAI</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {["Privacy", "Terms", "Help Centre", "Contact", "Careers"].map((link) => (
              <a key={link} href="#" className="hover:text-slate-300 transition-colors">
                {link}
              </a>
            ))}
          </div>
          <p className="text-slate-700">© 2026 StreamAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function FAQItem({ question, answer }) {
  return (
    <div className="glass-card rounded-xl p-6 hover:border-indigo-500/20 transition-all cursor-pointer">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-base font-semibold text-white">{question}</h3>
        <span className="text-indigo-400 text-xl shrink-0">+</span>
      </div>
      <p className="text-slate-400 mt-3 text-sm leading-relaxed">{answer}</p>
    </div>
  )
}
