"use client";
import React from "react";
import Link from "next/link";
import { useTournament } from "@/lib/context";
import { ArrowLeft, Newspaper } from "lucide-react";

export default function NewsPage() {
  const { news } = useTournament();

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <header className="max-w-4xl mx-auto mb-8 flex items-center gap-4">
        <Link href="/public" className="p-2 bg-gray-900 rounded-full hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold flex items-center gap-2">
            <Newspaper className="text-blue-400" />
            Notícias do Torneio
        </h1>
      </header>

      <div className="max-w-4xl mx-auto grid gap-6">
        {news.length > 0 ? (
            news.map((story) => (
                <article key={story.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-all">
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-2">
                            <h2 className="text-xl font-bold text-blue-100">{story.headline}</h2>
                            <span className="text-xs text-gray-500 font-mono">
                                {new Date(story.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <p className="text-gray-400 leading-relaxed text-sm md:text-base">
                            {story.body}
                        </p>
                    </div>
                </article>
            ))
        ) : (
            <div className="text-center py-20 bg-gray-900 rounded-xl border border-dashed border-gray-800">
                <Newspaper className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma notícia gerada ainda.</p>
                <p className="text-xs text-gray-600 mt-2">As notícias aparecerão aqui quando as partidas terminarem.</p>
            </div>
        )}
      </div>
    </div>
  );
}
