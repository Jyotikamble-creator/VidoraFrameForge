import Link from 'next/link';
import Image from 'next/image';
import { Upload, User } from 'lucide-react';

export default function Header() {
  const isLoggedIn = false;

  return (
    <header className="container mx-auto px-4 pt-6">
      <nav className="flex justify-around items-center">

        <div className="flex items-center">
          <div className="relative w-12 h-12 md:w-16 md:h-16">
            <Image
              src="/images/logo.png"
              alt="VidoraFrameForge Logo"
              fill
              priority
              loading="eager"
              sizes="(max-width: 768px) 48px, 64px"
              className="rounded-full object-cover"
            />
          </div>
        </div>

        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">VIDORA FRAMEFORGE</h1>
        </div>

        <div className="flex items-center">
          {isLoggedIn ? (
            <div className="w-8 h-8 md:w-10 md:h-10 bg-linear-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
          ) : (
            <Link href="/auth/signup">
              <button className="bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2 px-3 md:px-4 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 text-sm md:text-base flex items-center">
                <User className="w-4 h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Sign Up</span>
                <span className="sm:hidden">Join</span>
              </button>
            </Link>
          )}
        </div>

      </nav>
    </header>
  );
}