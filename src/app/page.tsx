import HomePage from '@/components/home/Card';
import Header from '@/components/home/Header';
import Footer from '@/components/home/Footer';

export default function Page() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      <HomePage />
      <Footer />
    </div>
  );
}
