import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500 selection:text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed w-full z-50 top-0 start-0 border-b border-white/10 bg-black/50 backdrop-blur-lg">
        <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
          <Link href="/" className="flex items-center space-x-3 rtl:space-x-reverse">
            <span className="self-center text-2xl font-bold whitespace-nowrap tracking-tighter">Miyabi</span>
          </Link>
          <div className="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
            <button type="button" className="text-white bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-900 font-medium rounded-lg text-sm px-4 py-2 text-center transition-all duration-200 ease-in-out transform hover:scale-105">
              Get Access
            </button>
          </div>
          <div className="items-center justify-between hidden w-full md:flex md:w-auto md:order-1">
            <ul className="flex flex-col p-4 md:p-0 mt-4 font-medium border border-gray-800 rounded-lg md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0">
              <li>
                <Link href="#" className="block py-2 px-3 text-white bg-purple-700 rounded md:bg-transparent md:text-purple-500 md:p-0" aria-current="page">Home</Link>
              </li>
              <li>
                <Link href="#features" className="block py-2 px-3 text-gray-400 rounded hover:bg-gray-800 md:hover:bg-transparent md:hover:text-purple-500 md:p-0 transition-colors">Features</Link>
              </li>
              <li>
                <Link href="#architecture" className="block py-2 px-3 text-gray-400 rounded hover:bg-gray-800 md:hover:bg-transparent md:hover:text-purple-500 md:p-0 transition-colors">Architecture</Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 py-32 lg:py-48 overflow-hidden">
         {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] -z-10 pointer-events-none mix-blend-screen"></div>
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] -z-10 pointer-events-none mix-blend-screen"></div>

        <div className="px-4 mx-auto max-w-screen-xl text-center relative">
          <div className="inline-flex items-center justify-center px-4 py-1.5 mb-8 text-sm text-purple-300 bg-purple-900/30 rounded-full border border-purple-500/30 backdrop-blur-sm">
            <span className="flex w-2 h-2 bg-purple-500 rounded-full me-2 animate-pulse"></span>
            v2.0 Alpha Release is Live
          </div>
          <h1 className="mb-6 text-5xl font-extrabold tracking-tight leading-none text-white md:text-7xl lg:text-8xl bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
            The OS for <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">AI-Driven Development</span>
          </h1>
          <p className="mb-8 text-lg font-normal text-gray-400 lg:text-xl sm:px-16 lg:px-48 max-w-4xl mx-auto">
            Miyabi automates the entire software lifecycle—from issue creation to deployment. 
            Orchestrate 250M+ virtual agents to build, test, and deploy your vision.
          </p>
          <div className="flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4">
            <a href="#" className="inline-flex justify-center items-center py-3 px-6 text-base font-medium text-center text-white rounded-lg bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:ring-purple-900 transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25">
              Deploy Your First Agent
              <svg className="w-3.5 h-3.5 ms-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
              </svg>
            </a>
            <a href="#" className="inline-flex justify-center items-center py-3 px-6 text-base font-medium text-center text-gray-300 rounded-lg border border-gray-700 hover:text-white hover:bg-gray-800 focus:ring-4 focus:ring-gray-800 backdrop-blur-sm transition-all">
              Read the Manifesto
            </a>
          </div>
          
          {/* Mock Terminal */}
          <div className="mt-16 mx-auto max-w-4xl text-left shadow-2xl rounded-xl overflow-hidden border border-gray-800 bg-[#0c0c0c]">
            <div className="flex items-center px-4 py-2 bg-[#1a1a1a] border-b border-gray-800">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="flex-1 text-center text-xs text-gray-500 font-mono">miyabi-cli — zsh</div>
            </div>
            <div className="p-6 font-mono text-sm md:text-base overflow-x-auto">
                <div className="mb-2">
                    <span className="text-green-400">user@miyabi</span>:<span className="text-blue-400">~</span>$ miyabi create project "Neural-Net-v5"
                </div>
                <div className="mb-2 text-gray-400">
                    &gt; Initializing project structure... <span className="text-green-500">Done</span><br/>
                    &gt; Summoning Agent [Architect]... <span className="text-green-500">Done</span><br/>
                    &gt; Summoning Agent [Engineer]... <span className="text-green-500">Done</span><br/>
                    &gt; Analyzing requirements...
                </div>
                <div className="mb-2">
                    <span className="text-purple-400">[Miyabi]</span> Blueprint generated. 4 services identified. Starting implementation.
                </div>
                <div className="animate-pulse">
                    <span className="text-green-400">user@miyabi</span>:<span className="text-blue-400">~</span>$ <span className="inline-block w-2 h-4 bg-gray-500 align-middle"></span>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-black relative">
        <div className="py-8 px-4 mx-auto max-w-screen-xl sm:py-16 lg:px-6">
          <div className="max-w-screen-md mb-12 lg:mb-16">
            <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-white">Designed for the <span className="text-purple-500">Post-Human</span> Era</h2>
            <p className="text-gray-400 sm:text-xl">Miyabi isn't just a tool; it's a complete ecosystem. Replace your entire DevOps pipeline with a swarm of intelligent, autonomous agents.</p>
          </div>
          <div className="space-y-8 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-12 md:space-y-0">
            {[
              {
                title: "Autonomous Swarms",
                desc: "Spin up specialized agents for coding, testing, security, and deployment. They communicate, collaborate, and execute without human intervention.",
                icon: (
                  <svg className="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path></svg>
                )
              },
              {
                title: "GitHub as OS",
                desc: "Seamlessly integrated with GitHub. Issues become prompts, PRs become deliverables. The repository is the file system for your AI workforce.",
                icon: (
                  <svg className="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                )
              },
              {
                title: "Infinite Scaling",
                desc: "From a single script to a global enterprise architecture. Miyabi scales its agent workforce dynamically based on project complexity.",
                icon: (
                  <svg className="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm14 1a1 1 0 11-2 0 1 1 0 012 0zM2 13a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2zm14 1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd"></path></svg>
                )
              }
            ].map((feature, index) => (
               <div key={index} className="p-8 border border-gray-800 rounded-xl bg-[#0c0c0c] hover:bg-[#111] transition-colors group">
                <div className="flex justify-center items-center mb-4 w-12 h-12 rounded-lg bg-gray-800 group-hover:bg-purple-900/30 group-hover:text-white transition-colors">
                    {feature.icon}
                </div>
                <h3 className="mb-2 text-xl font-bold text-white">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

       {/* Footer */}
       <footer className="p-4 bg-black border-t border-white/10 md:p-8 lg:p-10">
        <div className="mx-auto max-w-screen-xl text-center">
            <a href="#" className="flex justify-center items-center text-2xl font-semibold text-white">
                Miyabi
            </a>
            <p className="my-6 text-gray-400">Open-source AI orchestration for the next generation of builders.</p>
            <ul className="flex flex-wrap justify-center items-center mb-6 text-white">
                <li><a href="#" className="mr-4 hover:underline md:mr-6 ">About</a></li>
                <li><a href="#" className="mr-4 hover:underline md:mr-6">Premium</a></li>
                <li><a href="#" className="mr-4 hover:underline md:mr-6 ">Campaigns</a></li>
                <li><a href="#" className="mr-4 hover:underline md:mr-6">Blog</a></li>
                <li><a href="#" className="mr-4 hover:underline md:mr-6">Affiliate Program</a></li>
                <li><a href="#" className="hover:underline">FAQs</a></li>
            </ul>
            <span className="text-sm text-gray-500 sm:text-center">© 2025 <a href="#" className="hover:underline">Miyabi™</a>. All Rights Reserved.</span>
        </div>
      </footer>
    </div>
  );
}