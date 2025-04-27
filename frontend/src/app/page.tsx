import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="card max-w-lg w-full">
        <h1 className="text-4xl font-bold text-blue-600 mb-8">TeleHealth</h1>
        <p className="text-gray-600 mb-10">
          Telemedicine for low-bandwidth areas with advanced AI features
        </p>
        
        <h2 className="text-lg font-semibold mb-6">I am a...</h2>
        
        <div className="flex flex-col gap-4">
          <Link 
            href="/doctor" 
            className="btn-primary"
          >
            Doctor
          </Link>
          
          <Link 
            href="/patient" 
            className="btn-secondary"
          >
            Patient
          </Link>
        </div>
      </div>
    </main>
  );
}
