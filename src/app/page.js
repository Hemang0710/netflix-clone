import Link from "next/link"
import EmailForm from "@/components/EmailForm"

const FAQ_ITEMS = [
  {
    q: "What is Netflix?",
    a: "Netflix is a streaming service that offers a wide variety of award-winning TV shows, movies, anime, documentaries, and more on thousands of internet-connected devices.",
  },
  {
    q: "How much does Netflix cost?",
    a: "Watch Netflix on your smartphone, tablet, Smart TV, laptop, or streaming device, all for one fixed monthly fee. Plans range from $6.99 to 22.99 a month.",
  },
  {
    q: "Where can I watch?",
    a: "Watch anywhere, anytime. Sign in with your Netflix account to watch instantly on the web at netflix.com from your personal computer or on any internet-connected device.",
  },
  {
    q: "How do I cancel?",
    a: "Netflix is flexible. There are no pesky contracts and no commitments. You can easily cancel your account online in two clicks.",
  },
]

export default function LandingPage() {
  return (
    <div className="bg-black min-h-screen text-white">

      {/* Navbar */}
      <nav className="absolute top-0 w-full z-50 flex items-center justify-between px-12 py-6">
        <span className="text-red-600 text-4xl font-black tracking-tighter">
          NETFLIX
        </span>
        <Link 
          href="/login"
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2 rounded transition-colors text-sm"
          >
            Sign In
          </Link>
      </nav>

      {/* Hero Section */}
      <section
        className="relative flex flex-col itmes-center justify-center text-center px-6 py-60"
        style={{
          backgroundImage: `url('https://assets.nflxext.com/ffe/siteui/vlv3/9d3533b2-0e2b-40b2-95e0-ecd7979cc88b/web/IN-en-20250303-TRIFECTA-perspective_5cebc697-7bf1-4c90-9c6e-08e8b6f77614_large.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        >
          {/* Overlays */}
          <div className="absolute inset-0 bg-black/60"/>
          <div className="absolute inset-0 bg-linear-to-b form-black/20 via-transparent to-black"/>

          {/* Content */}
          <div className="relative z-10 max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
              Unlimited movies, Tv shows, and more
            </h1>
            <p className="text-xl md:text-2xl mb-4 text-zinc-200">
              Starts at $6.99. Cancel anytime.
            </p>
            <p className="text-lg mb-8 text-zinc-300">
              Ready to watch? Enter your email to create or restart your membership.
            </p>
           <EmailForm/> 
          </div>
        </section>

        {/* Divider */}
        <div className="h-2 bg-zinc-800"/>

        {/* Feature 1 */}
        <section className="flex flex-col md:flex-row items-center justify-between px-12 py-20 max-w-6xl mx-auto gap-12">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
              Enjoy on your TV
            </h2>
            <p className="text-xl text-zinc-400 leading-relaxed">
              Watch on Smart TVs, PlayStation, Xbox, Chromecast, Apple TV,
              Blu-ray players, and more .
            </p>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="w-72 h-48 bg-zinc-800 rounded-xl flex itmes-center justify-center border border-zinc-700">
              <span className="text-6xl">📺</span>
            </div>
          </div>
        </section>
        
        <div className="h-2 bg-zinc-800"/>

        {/* Feature 2 */}
        <section className="flex flex-col md:flex-row-reverse items-center justify-between px-12 py-20 max-w-6xl mx-auto gap-12">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
              Download your shows to watch offline
            </h2>
            <p className="text-xl text-zinc-400 leading-relaxed">
              Save your favourites easily and always have something to watch.
            </p>
          </div>
          <div className="flex-1 justify-center">
            <div className="w-72 h-48 bg-zinc-800 rounded-xl flex items-center justify-center border border-zinc-700">
              <span className="text-6xl">📱</span>
            </div>
          </div>
        </section>

        <div className="h-2 bg-zinc-800" />

        {/* FAQ Section */}
        <section className="px-6 py-20 max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="flex flex-col gap-2">
          {FAQ_ITEMS.map((item, index) => (
            <FAQItem key={index} question={item.q} answer={item.a} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-lg mb-6 text-zinc-300">
            Ready to watch? Enter your email to create or restart your membership.
          </p>
          <EmailForm/>
        </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-zinc-800 px-12 py-12 text-zinc-500 text-sm max-w-6xl mx-auto">
          <p className="mb-6">Questions? Call 1-844-505-2993</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["FAQ","Help Centre","Account", "Media Centre",
              "Investor Relations", "Jobs", "Cookie Preferences",
              "Privacy", "Terms of Use", "Contact Us"].map(link => (
                <a key={link} href="#" className="hover:underline">{link}</a>
              ))}
          </div>
          <p className="mt-8">Netflix Clone - Built for learning</p>
        </footer>
    </div>
  )
}

//FAQ Item - this is a Server Component too (no interactivity needed)
function FAQItem ({question, answer}){
  return (
    <div className="bg-zinc-800  hover:bg-zinc-700 transition-colors p-6 cursor-pointer">
    <div className="flex items-center justify-between">
      <h3 className="text-xl font-semibold">{question}</h3>
      <span className="text-3xl text-zinc-400">+</span>
    </div>
    <p className="text-zinc-400 mt-4 text-base leading-relaxed">{answer}</p>
    </div>  
  )
}