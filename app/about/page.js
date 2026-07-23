export default function About() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-20 max-w-xl mx-auto min-h-[70vh]">
      <h1 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
        Shahbaz
      </h1>
      <p className="text-white/70 leading-relaxed">
        This site was built as a personal learning project to practice full-stack
        development with Next.js, real-time communication, and modern UI design.
        It is purely educational and not intended for commercial use.
      </p>
    </div>
  );
}