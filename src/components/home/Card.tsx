import { Play, Upload, Users, TrendingUp, Video, Share, Heart } from 'lucide-react';

const featureCardClasses = "bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300 transform hover:scale-105";
const iconContainerClasses = "w-12 h-12 rounded-xl flex items-center justify-center mb-4";
const statNumberClasses = "text-3xl font-bold text-white mb-2";

const features = [
  {
    icon: Upload,
    title: "Easy Upload",
    description: "Upload your videos with just a few clicks. Support for all major formats.",
    iconGradient: "bg-linear-to-r from-purple-500 to-purple-700"
  },
  {
    icon: Share,
    title: "Share Everywhere",
    description: "Share your content across all platforms and reach your audience.",
    iconGradient: "bg-linear-to-r from-pink-500 to-pink-700"
  },
  {
    icon: Users,
    title: "Build Community",
    description: "Connect with viewers, build your following, and grow your channel.",
    iconGradient: "bg-linear-to-r from-blue-500 to-blue-700"
  }
];


export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="container mx-auto px-4 py-20 w-full">
        <div className="text-center mb-20">
          
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Share Your <span className="bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Stories</span>
            <br />With The World
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join millions of creators sharing their passion through stunning videos.
            Upload, discover, and connect with content that inspires you.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="group bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-purple-500/25">
              <Upload className="w-5 h-5 inline mr-2" />
              Start Creating
            </button>
            <button className="group bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-8 rounded-xl border border-white/20 backdrop-blur-sm transition-all duration-300 transform hover:scale-105">
              <Play className="w-5 h-5 inline mr-2" />
              Explore Videos
            </button>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <div key={index} className={featureCardClasses}>
              <div className={`${iconContainerClasses} ${feature.iconGradient}`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>

        
      </div>
    </div>
  );
}

