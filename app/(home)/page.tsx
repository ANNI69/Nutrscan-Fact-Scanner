import Link from 'next/link';
import Image from 'next/image';
import Head from 'next/head';
import { Footer, Header } from './components';

export default function Home() {

  return (
    <div className="flex max-w-5xl mx-auto flex-col items-center justify-center min-h-screen">
      <main className="flex flex-1 w-full flex-col items-center justify-center text-center my-12 sm:mt-20">
        <nav className="w-full mb-12">
          <div className="flex justify-center items-start font-['Montserrat']">
            <h2 className="text-4xl font-bold text-white">NUTRISCAN</h2>
          </div>
        </nav>

        <h1 className="sm:text-6xl text-4xl max-w-[708px] font-bold text-green-700 font-['Montserrat']">Nutrition Facts Scanner</h1>
        <p className="text-xl mt-6 max-w-[600px] text-gray-600">
          Scan food product barcodes to instantly access detailed nutrition information including:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
          <div className="flex flex-col items-center p-4 bg-green-50 rounded-lg">
            <span className="text-3xl mb-2">🍎</span>
            <h3 className="font-semibold text-green-700">Calories</h3>
          </div>
          <div className="flex flex-col items-center p-4 bg-green-50 rounded-lg">
            <span className="text-3xl mb-2">🥩</span>
            <h3 className="font-semibold text-green-700">Protein</h3>
          </div>
          <div className="flex flex-col items-center p-4 bg-green-50 rounded-lg">
            <span className="text-3xl mb-2">🥖</span>
            <h3 className="font-semibold text-green-700">Carbs</h3>
          </div>
          <div className="flex flex-col items-center p-4 bg-green-50 rounded-lg">
            <span className="text-3xl mb-2">🥑</span>
            <h3 className="font-semibold text-green-700">Fats</h3>
          </div>
        </div>
        <Link href="/app" className="rounded-full no-underline font-medium py-4 px-10 sm:mt-10 mt-8 bg-green-600 text-cream hover:bg-green-700 hover:scale-105 transition duration-300 ease-in-out">Open Application</Link>
      </main>
    </div>
  );
}
