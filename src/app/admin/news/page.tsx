"use client";
import React, { useState } from "react";
import { useTournament } from "@/lib/context";
import { NewsStory } from "@/lib/news-engine";
import { useAudit } from "@/lib/audit-context";
import { Newspaper, Plus, Edit, Trash2, X, AlertTriangle, Image as ImageIcon } from "lucide-react";
import { formatGoogleDriveUrl } from "@/lib/utils";

export default function AdminNewsPage() {
  const { news, setNews, deleteNews, deleteAllNews } = useTournament();
  const { logAction } = useAudit();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [newsForm, setNewsForm] = useState({ headline: "", body: "", tags: "", imageUrls: [] as string[] });
  const [newImageUrl, setNewImageUrl] = useState("");

  const handleOpenModal = (newsItem?: NewsStory) => {
      if (newsItem) {
          setEditingNewsId(newsItem.id);
          setNewsForm({ 
              headline: newsItem.headline, 
              body: newsItem.body, 
              tags: newsItem.tags?.join(", ") || "",
              imageUrls: newsItem.imageUrls || (newsItem.imageUrl ? [newsItem.imageUrl] : [])
          });
      } else {
          setEditingNewsId(null);
          setNewsForm({ headline: "", body: "", tags: "", imageUrls: [] });
      }
      setNewImageUrl("");
      setIsModalOpen(true);
  };

  const handleSave = () => {
      if (!newsForm.headline || !newsForm.body) return alert("Preencha titulo e corpo.");

      const tagsArray = newsForm.tags.split(",").map(t => t.trim()).filter(t => t);
      
      if (editingNewsId) {
          setNews(prev => prev.map(n => 
              n.id === editingNewsId 
                  ? { ...n, ...newsForm, tags: tagsArray, timestamp: Date.now() } 
                  : n
          ));
          logAction("edit_news", `Editou notícia: ${newsForm.headline}`);
          alert("Noticia atualizada!");
      } else {
          const newStory: NewsStory = {
              id: crypto.randomUUID(),
              matchId: "manual",
              timestamp: Date.now(),
              headline: newsForm.headline,
              body: newsForm.body,
              tags: tagsArray,
              imageUrls: newsForm.imageUrls
          };
          setNews(prev => [newStory, ...prev]);
          logAction("create_news", `Publicou notícia: ${newsForm.headline}`);
          alert("Noticia criada!");
      }
      setIsModalOpen(false);
  };

  const handleDelete = (story: NewsStory) => {
      if(confirm("Apagar esta noticia permanentemente?")) {
          deleteNews(story.id);
          logAction("delete_news", `Apagou notícia: ${story.headline}`);
      }
  };

  const handleDeleteAll = () => {
      if(confirm(`ATENÇÃO: Você está prestes a apagar TODAS as ${news.length} notícias.\n\nEsta ação NÃO pode ser desfeita.\n\nDeseja continuar?`)) {
          deleteAllNews();
          logAction("clear_news", `Apagou todas as ${news.length} notícias em massa.`);
          alert("Todas as notícias foram apagadas com sucesso.");
      }
  };

  return (
    <div className="text-black max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-2 text-black">
                <Newspaper className="w-8 h-8 text-emerald-600" />
                Gerenciar Noticias
            </h1>
            <div className="flex gap-2">
                {news.length > 0 && (
                    <button 
                        onClick={handleDeleteAll}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded font-bold flex items-center gap-2 transition-colors"
                    >
                        <AlertTriangle className="w-5 h-5" /> Apagar Tudo ({news.length})
                    </button>
                )}
                <button 
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 bg-green-600 text-white hover:bg-green-500 rounded font-bold flex items-center gap-2 transition-colors"
                >
                    <Plus className="w-5 h-5" /> Nova Noticia
                </button>
            </div>
        </div>

        <div className="space-y-4">
            {news.length === 0 && (
                <div className="p-8 text-center border-2 border-dashed border-emerald-200 bg-emerald-50/50 rounded-xl">
                    <Newspaper className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma noticia publicada ainda.</p>
                </div>
            )}
            
            {news.map(story => (
                <div key={story.id} className="bg-white p-6 rounded-xl border border-emerald-100 shadow-premium group transition-all hover:border-emerald-300 group hover:border-gray-600 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs text-emerald-400 font-mono font-bold">
                                    {new Date(story.timestamp).toLocaleString('pt-BR')}
                                </span>
                                {story.tags && story.tags.length > 0 && (
                                    <div className="flex gap-1 flex-wrap">
                                        {story.tags.map(tag => (
                                            <span key={tag} className="text-[10px] uppercase font-bold bg-emerald-100 text-black px-2 py-0.5 rounded border border-emerald-200">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <h3 className="text-xl font-bold text-black mb-2 font-black">
                                {story.headline}
                            </h3>
                            <p className="text-black text-sm line-clamp-2 whitespace-pre-wrap">
                                {story.body}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => handleOpenModal(story)} 
                                className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors"
                                title="Editar"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => handleDelete(story)} 
                                className="p-2 bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
                                title="Excluir"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-emerald-100 flex flex-col max-h-[90vh]">
                    <div className="bg-emerald-800 p-5 text-white flex justify-between items-center rounded-t-xl">
                        <h3 className="font-bold flex items-center gap-2">
                            <Newspaper className="w-5 h-5" /> 
                            {editingNewsId ? 'Editar Noticia' : 'Nova Noticia'}
                        </h3>
                        <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-1 rounded">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-6 space-y-4 overflow-y-auto flex-1">
                        <div>
                            <label className="block text-sm font-bold text-black mb-1">Manchete</label>
                            <input 
                                value={newsForm.headline} 
                                onChange={e => setNewsForm({...newsForm, headline: e.target.value})} 
                                className="w-full p-3 bg-white border border-emerald-200 rounded focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none font-bold text-lg text-black" 
                                placeholder="Digite um titulo chamativo..." 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-black mb-1">Corpo da Notícia</label>
                            <textarea 
                                value={newsForm.body} 
                                onChange={e => setNewsForm({...newsForm, body: e.target.value})} 
                                className="w-full h-40 p-3 bg-white border border-emerald-200 rounded focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none resize-none text-black" 
                                placeholder="Escreva o conteudo completo da noticia..." 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-black mb-1">Tags (separadas por vírgula)</label>
                            <input 
                                value={newsForm.tags} 
                                onChange={e => setNewsForm({...newsForm, tags: e.target.value})} 
                                className="w-full p-2 bg-white border border-emerald-200 rounded focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm text-black" 
                                placeholder="ex: rodada 1, goleada, destaque" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-black mb-2">Imagens e Fotos (Drive, Imgur, etc)</label>
                            
                            <div className="flex gap-2 mb-3">
                                <input 
                                    value={newImageUrl} 
                                    onChange={e => setNewImageUrl(e.target.value)} 
                                    className="flex-1 p-3 bg-white border border-emerald-200 rounded focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-black text-sm" 
                                    placeholder="https://suasite.com/foto.jpg ou link do Google Drive" 
                                    onKeyPress={e => {
                                        if (e.key === "Enter" && newImageUrl.trim()) {
                                            const formattedUrl = formatGoogleDriveUrl(newImageUrl.trim());
                                            setNewsForm(prev => ({ ...prev, imageUrls: [...prev.imageUrls, formattedUrl] }));
                                            setNewImageUrl("");
                                            e.preventDefault();
                                        }
                                    }}
                                />
                                <button 
                                    onClick={() => {
                                        if (newImageUrl.trim()) {
                                            const formattedUrl = formatGoogleDriveUrl(newImageUrl.trim());
                                            setNewsForm(prev => ({ ...prev, imageUrls: [...prev.imageUrls, formattedUrl] }));
                                            setNewImageUrl("");
                                        }
                                    }}
                                    className="px-4 py-2 bg-[#059669] text-white rounded font-bold hover:bg-emerald-600 border border-emerald-500 transition-colors flex items-center gap-1"
                                >
                                    <Plus className="w-4 h-4" /> Adicionar
                                </button>
                            </div>

                            {newsForm.imageUrls.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                                    {newsForm.imageUrls.map((url, i) => (
                                        <div key={i} className="relative group rounded-lg overflow-hidden border border-emerald-700/50 aspect-video">
                                            <img src={url} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button 
                                                    onClick={() => setNewsForm(prev => ({ ...prev, imageUrls: prev.imageUrls.filter((_, idx) => idx !== i) }))}
                                                    className="p-1.5 bg-red-600 rounded-full text-white hover:bg-red-500"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="p-4 border-t border-emerald-100 bg-emerald-50/30 flex justify-end p-4 border-t border-emerald-100 rounded-b-2xl gap-2 rounded-b-xl">
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-black hover:bg-emerald-100 border border-emerald-500 rounded font-bold transition-colors">
                            Cancelar
                        </button>
                        <button onClick={handleSave} className="px-6 py-2 bg-[#059669] hover:bg-emerald-800 text-white font-bold rounded transition-colors shadow-lg">
                            {editingNewsId ? 'Atualizar' : 'Publicar'} Noticia
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}
