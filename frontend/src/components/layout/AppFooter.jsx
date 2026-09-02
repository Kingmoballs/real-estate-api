import { Building2 } from 'lucide-react'
import { Link } from 'react-router-dom'

function AppFooter() {
  return (
    <footer className="mt-20 bg-emerald-950 text-emerald-50">
      <div className="page-shell grid gap-10 py-12 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="mb-4 flex items-center gap-2.5 text-xl font-black">
            <Building2 size={23} /> Haven
          </div>
          <p className="max-w-sm text-sm leading-6 text-emerald-100/70">
            A trusted marketplace for verified homes to buy, rent, or book for a short stay.
          </p>
        </div>
        <div>
          <p className="mb-3 text-sm font-extrabold">Explore</p>
          <div className="flex flex-col gap-2 text-sm text-emerald-100/70">
            <Link to="/properties?listingType=sale">Properties for sale</Link>
            <Link to="/properties?listingType=rent">Homes for rent</Link>
            <Link to="/properties?listingType=shortlet">Shortlets</Link>
          </div>
        </div>
        <div>
          <p className="mb-3 text-sm font-extrabold">Account</p>
          <div className="flex flex-col gap-2 text-sm text-emerald-100/70">
            <Link to="/register">Create an account</Link>
            <Link to="/agent-application">Become an agent</Link>
            <Link to="/login">Agent and admin login</Link>
            <Link to="/account">My dashboard</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-emerald-800/60 py-5 text-center text-xs text-emerald-100/55">
        © {new Date().getFullYear()} Haven. All rights reserved.
      </div>
    </footer>
  )
}

export default AppFooter
