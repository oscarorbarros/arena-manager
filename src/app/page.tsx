"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useAudit } from "@/lib/audit-context";
import { useTournament } from "@/lib/context";
import { NewsStory } from "@/lib/news-engine";
import { GeStyleDashboard } from "@/components/GeStyleDashboard";
import { NewsSlider } from "@/components/NewsSlider";
import { LogOut, Clock, LayoutDashboard, Newspaper, User as UserIcon, Lock, X, Trash2, Edit, PlusCircle, ChevronRight, Trophy, Plus } from "lucide-react";

export default function HomePage() {
    const router = useRouter();
    const { user: authUser, login, logout } = useAuth();
    const { logAction } = useAudit();
    const { config, news, setNews } = useTournament();
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [loginData, setLoginData] = useState({ email: "", password: "" });
    const [error, setError] = useState("");

    // News Modal State
    const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
    const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
    const [newsForm, setNewsForm] = useState({ headline: "", body: "", tags: "", imageUrls: [] as string[] });
    const [newImageUrl, setNewImageUrl] = useState("");

    // Reading Modal State
    const [readingNewsItem, setReadingNewsItem] = useState<NewsStory | null>(null);

    // TABS: "news" or "championship"
    const [activeTab, setActiveTab] = useState<"news" | "championship">("news");

    // Ticker Force Update
    const [, setTick] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 30000);
        return () => clearInterval(interval);
    }, []);

    const liveMatches = config.matches.filter(m => m.status === "live" || m.status === "paused");

    const getMatchStatus = (m: any) => {
        switch (m.period) {
            case "half_time": return "INTERVALO";
            case "extra_first": return "PRORROG (1ºT)";
            case "extra_half_time": return "INTERVALO PRORR.";
            case "extra_second": return "PRORROG (2ºT)";
            case "penalties": return "PÊNALTIS";
            case "full_time": return "FIM DE JOGO";
            default: return "AO VIVO";
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        return `${mins}'`;
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (loginData.password === "123456") {
            if (loginData.email === "admin@arena.com") {
                login("admin", "123456", "Admin");
                logAction("LOGIN", `Usuário admin@arena.com entrou no sistema`);
                setIsLoginOpen(false);
                router.push("/admin");
                return;
            }
            if (loginData.email === "press@arena.com") {
                login("journalist", "123456", "Jornalista");
                logAction("LOGIN", `Usuário press@arena.com entrou no sistema`);
                setIsLoginOpen(false);
                router.push("/admin");
                return;
            }
        }

        const userFound = config.users?.find(u => u.email === loginData.email && u.password === loginData.password);

        if (userFound) {
            login(userFound.role, loginData.password, userFound.name);
            logAction("LOGIN", `Usuário ${userFound.email} entrou no sistema`);
            setIsLoginOpen(false);
            if (["admin", "organization_member", "journalist"].includes(userFound.role || "")) router.push("/admin");
            else if (userFound.role === "delegate") router.push("/delegate");
        } else {
            setError("Credenciais inválidas.");
        }
    };

    const canManageNews = authUser?.role === "admin" || authUser?.role === "journalist";

    const handleOpenNewsModal = (newsItem?: NewsStory) => {
        if (newsItem) {
            setEditingNewsId(newsItem.id);
            setNewsForm({ headline: newsItem.headline, body: newsItem.body, tags: newsItem.tags?.join(", ") || "", imageUrls: newsItem.imageUrls || (newsItem.imageUrl ? [newsItem.imageUrl] : []) });
        } else {
            setEditingNewsId(null);
            setNewsForm({ headline: "", body: "", tags: "", imageUrls: [] });
        }
        setNewImageUrl("");
        setIsNewsModalOpen(true);
    };

    const handleSaveNews = () => {
        if (!newsForm.headline || !newsForm.body) return alert("Preencha título e corpo.");

        const tagsArray = newsForm.tags.split(",").map(t => t.trim()).filter(t => t);

        if (editingNewsId) {
            setNews(prev => prev.map(n => n.id === editingNewsId ? { ...n, ...newsForm, tags: tagsArray, timestamp: Date.now() } : n));
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
        }
        setIsNewsModalOpen(false);
    };

    const handleDeleteNews = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Apagar esta notícia permanentemente?")) {
            setNews(prev => prev.filter(n => n.id !== id));
        }
    };

    return (
        <div className="min-h-screen bg-white pb-20 md:pb-0 text-black font-sans relative">
            {authUser && (
                <div className="bg-emerald-950 border-b border-emerald-200/60 text-white px-6 py-2 text-xs font-medium flex justify-between items-center shadow-lg relative z-50">
                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-2 text-white font-mono tracking-tighter border-r border-emerald-200/60/50 pr-4">
                            <span className="flex items-center gap-2"><Clock className="w-3 h-3 text-white" /> {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "short" })}</span>
                        </div>

                        <Link
                            href={["admin", "organization_member", "journalist"].includes(authUser.role as string) ? "/admin" : authUser.role === "delegate" ? "/delegate" : "/public"}
                            className="flex items-center gap-2 text-white hover:text-white transition-colors uppercase font-bold tracking-wider hover:bg-[#059669] px-3 py-1 rounded"
                        >
                            <LayoutDashboard className="w-3 h-3" />
                            Acessar Painel
                        </Link>
                    </div>

                    <div className="flex items-center gap-6 ml-auto w-auto justify-end">
                        <div className="flex items-center gap-2 group cursor-default">
                            <span className="hidden sm:inline text-[10px] uppercase font-bold text-white tracking-widest group-hover:text-white transition-colors">Logado como</span>

                            <div className="flex items-center gap-2 bg-emerald-900 text-white shadow-md px-3 py-1 rounded-full border border-emerald-200/60/50 group-hover:border-emerald-500/30 transition-colors">
                                <UserIcon className="w-3 h-3 text-white" />
                                <span className="text-white font-bold tracking-wide">{authUser.name}</span>
                                {authUser.role !== "organization_member" && <span className="hidden sm:inline bg-emerald-200/40 text-[10px] px-1.5 rounded text-white/80 uppercase">{authUser.role}</span>}
                            </div>
                        </div>

                        <div className="h-4 w-px bg-emerald-200/40 mx-1"></div>

                        <button
                            onClick={logout}
                            className="group flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors uppercase text-[10px] font-bold tracking-wider hover:bg-red-500/10 px-3 py-1.5 rounded-lg border border-transparent hover:border-red-500/20"
                        >
                            SAIR <LogOut className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                </div>
            )}

            <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xl sticky top-0 z-40 border-b border-emerald-500/20">
                <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-white font-black italic shadow-md px-2 py-0.5 rounded rounded-lg shadow-inner text-sm md:text-xl">
                            <span className="tracking-tighter font-black text-2xl text-black">O2R</span><span className="font-thin tracking-widest text-emerald-700 ml-1">SPORTS</span>
                        </div>
                    </div>
                    <div className="text-xs md:text-sm font-medium opacity-90 hidden md:block">
                        O seu portal de esportes em tempo real
                    </div>
                    {!authUser && (
                        <button
                            onClick={() => setIsLoginOpen(true)}
                            className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition flex items-center gap-2 font-bold"
                        >
                            <UserIcon className="w-4 h-4" />
                            LOGIN
                        </button>
                    )}
                </div>
            </header>

            {/* Ticker */}
            {liveMatches.length > 0 && (
                <div className="bg-[#042f2e] text-white overflow-x-auto shadow-inner">
                    <div className="max-w-7xl mx-auto flex gap-4 p-4">
                        {liveMatches.map(match => {
                            const teamA = config.teams.find(t => t.id === match.teamAId);
                            const teamB = config.teams.find(t => t.id === match.teamBId);
                            const timer = match.startTime ? Math.floor((Date.now() - match.startTime) / 1000) + (match.elapsedSeconds || 0) : (match.elapsedSeconds || 0);

                            return (
                                <Link key={match.id} href={`/match/${match.id}`} className="flex-shrink-0 w-64 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 group hover:bg-white/10 transition-all relative overflow-hidden group hover:border-emerald-500 transition-colors block">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-[#059669] text-white animate-pulse" />
                                    <div className="flex justify-between items-center mb-2 text-xs text-emerald-400 font-mono">
                                        <span className="text-red-500 font-bold flex items-center gap-1">
                                            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" /> {getMatchStatus(match)}
                                        </span>
                                        <span>{formatTime(timer)}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-2"><span className="font-bold text-lg">{match.scoreA}</span>{(match.period === "penalties" || match.penaltiesA !== undefined) && <span className="ml-1 px-1.5 py-0.5 bg-yellow-900/30 text-yellow-500 text-[10px] font-mono rounded">({match.penaltiesA || 0})</span>}</div>
                                            <span className="text-sm truncate max-w-[80px]">{teamA?.name}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-2"><span className="font-bold text-lg">{match.scoreB}</span>{(match.period === "penalties" || match.penaltiesB !== undefined) && <span className="ml-1 px-1.5 py-0.5 bg-yellow-900/30 text-yellow-500 text-[10px] font-mono rounded">({match.penaltiesB || 0})</span>}</div>
                                            <span className="text-sm truncate max-w-[80px]">{teamB?.name}</span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            <main className="mx-auto px-4 py-8 max-w-7xl">
                <div className="flex items-center gap-6 border-b border-emerald-200/60 mb-8">
                    <button
                        onClick={() => setActiveTab("news")}
                        className={`pb-4 px-2 font-bold text-lg transition-colors border-b-2 ${activeTab === "news" ? "border-emerald-500 text-black" : "border-transparent text-black hover:text-black"}`}
                    >
                        <div className="flex items-center gap-2"><Newspaper className="w-5 h-5" /> Notícias</div>
                    </button>
                    <button
                        onClick={() => setActiveTab("championship")}
                        className={`pb-4 px-2 font-bold text-lg transition-colors border-b-2 ${activeTab === "championship" ? "border-emerald-500 text-black" : "border-transparent text-black hover:text-black"}`}
                    >
                        <div className="flex items-center gap-2"><Trophy className="w-5 h-5" /> Campeonato (Tabela & Jogos)</div>
                    </button>
                </div>

                {activeTab === "news" ? (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center border-l-4 border-emerald-500 pl-3">
                            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-black">
                                <Newspaper className="w-6 h-6" /> Últimas Notícias
                            </h2>
                            {canManageNews && (
                                <button onClick={() => handleOpenNewsModal()} className="px-3 py-1 bg-[#059669] text-black rounded text-sm font-bold flex items-center gap-2 hover:bg-[#059669] text-black">
                                    <PlusCircle className="w-4 h-4" /> Nova Notícia
                                </button>
                            )}
                        </div>

                        {news.length === 0 ? (
                            <div className="p-12 text-center bg-white rounded-xl border border-emerald-200/60 shadow-sm">
                                <Newspaper className="w-12 h-12 mx-auto text-black mb-4" />
                                <p className="text-lg text-black">Ainda não há notícias publicadas.</p>
                                {canManageNews && <p className="text-sm text-black mt-2 cursor-pointer hover:underline" onClick={() => handleOpenNewsModal()}>Clique para criar a primeira notícia</p>}
                            </div>
                        ) : (
                            <div className="grid gap-6">
                                {news.map((story, i) => (
                                    <article key={story.id} className={`group bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-emerald-100 hover:shadow-xl transition-all border border-emerald-200/60 relative ${i === 0 ? "md:grid md:grid-cols-2" : "flex flex-col"}`}>

                                        {canManageNews && (
                                            <div className="absolute top-2 right-2 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={(e) => { e.stopPropagation(); handleOpenNewsModal(story); }} className="p-2 bg-[#059669]/90 text-black rounded-full hover:bg-[#059669] text-black shadow-lg">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={(e) => handleDeleteNews(story.id, e)} className="p-2 bg-red-600/90 text-black rounded-full hover:bg-red-700 shadow-lg">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}

                                        <div className={`bg-gradient-to-br from-emerald-50 to-teal-50 relative overflow-hidden ${i === 0 ? "h-full min-h-[250px]" : "h-48"}`}>
                                            {(story.imageUrls && story.imageUrls.length > 0) || story.imageUrl ? (
                                                <NewsSlider images={story.imageUrls || (story.imageUrl ? [story.imageUrl] : [])} />
                                            ) : (
                                                <div className="absolute inset-0 bg-gradient-to-br from-[#06aa48]/10 to-blue-500/10" />
                                            )}
                                            
                                            <div className="absolute bottom-2 left-2 flex gap-1 flex-wrap z-30">
                                                {story.tags?.map(tag => (
                                                    <span key={tag} className="text-[10px] uppercase font-bold bg-emerald-950/40 backdrop-blur-md text-black bg-emerald-900 text-black/40 backdrop-blur-md px-3 py-1 rounded-full text-[9px] border border-white/20">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="p-6 flex flex-col justify-between">
                                            <div>
                                                <div className="text-xs text-black font-bold uppercase mb-2 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(story.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                </div>
                                                <h3 className={`font-bold text-black group-hover:text-black transition-colors ${i === 0 ? "text-2xl md:text-3xl leading-tight" : "text-xl"}`}>
                                                    {story.headline}
                                                </h3>
                                                <p className="mt-3 text-black leading-relaxed text-sm line-clamp-3 whitespace-pre-wrap">
                                                    {story.body}
                                                </p>
                                            </div>
                                            <div onClick={() => setReadingNewsItem(story)} className="mt-4 flex items-center text-black font-bold text-sm group/link cursor-pointer">
                                                Ler matéria completa <ChevronRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-full">
                        <GeStyleDashboard config={config} />
                    </div>
                )}
            </main>

            {/* LOGIN MODAL */}
            {isLoginOpen && (
                <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 overflow-hidden">
                        <div className="bg-[#059669] p-6 text-black text-center relative">
                            <button onClick={() => setIsLoginOpen(false)} className="absolute top-4 right-4 text-black/80 hover:text-black"><X className="w-5 h-5" /></button>
                            <h2 className="text-2xl font-black italic"><span className="tracking-tighter font-black text-2xl text-black">O2R</span><span className="font-thin tracking-widest text-emerald-700 ml-1">SPORTS</span></h2>
                            <p className="text-xs opacity-80 mt-1">Acesse sua área restrita</p>
                        </div>

                        <form onSubmit={handleLogin} className="p-6 space-y-4">
                            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2"><Lock className="w-4 h-4" /> {error}</div>}
                            <div>
                                <label className="block text-xs font-bold text-black uppercase mb-1">Email</label>
                                <input type="email" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06aa48] outline-none" placeholder="press@arena.com" value={loginData.email} onChange={e => setLoginData({ ...loginData, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-black uppercase mb-1">Senha</label>
                                <input type="password" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06aa48] outline-none" placeholder="••••••" value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} />
                            </div>
                            <button type="submit" className="w-full py-3 bg-[#059669] hover:bg-[#047857] text-black font-bold rounded-lg shadow-lg">Entrar</button>
                        </form>
                    </div>
                </div>
            )}

            {/* NEWS MODAL */}
            {isNewsModalOpen && (
                <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-[#059669] p-4 text-black flex justify-between items-center">
                            <h3 className="font-bold flex items-center gap-2"><Newspaper className="w-5 h-5" /> {editingNewsId ? "Editar Notícia" : "Nova Notícia"}</h3>
                            <button onClick={() => setIsNewsModalOpen(false)} className="hover:bg-white/20 p-1 rounded"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto flex-1">
                            <div>
                                <label className="block text-sm font-bold text-black mb-1">Manchete</label>
                                <input value={newsForm.headline} onChange={e => setNewsForm({ ...newsForm, headline: e.target.value })} className="w-full p-2 border border-gray-300 rounded focus:border-emerald-300 outline-none font-bold text-lg" placeholder="Título chamativo..." />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-1">Corpo da Notícia</label>
                                <textarea value={newsForm.body} onChange={e => setNewsForm({ ...newsForm, body: e.target.value })} className="w-full h-40 p-2 border border-gray-300 rounded focus:border-emerald-300 outline-none resize-none" placeholder="O que aconteceu?" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-1">Tags (separadas por vírgula)</label>
                                <input value={newsForm.tags} onChange={e => setNewsForm({ ...newsForm, tags: e.target.value })} className="w-full p-2 border border-gray-300 rounded focus:border-emerald-300 outline-none text-sm" placeholder="ex: rodada 1, goleada, destaque" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-2">Imagens da Notícia</label>
                                <div className="flex gap-2 mb-3">
                                    <input 
                                        value={newImageUrl} 
                                        onChange={e => setNewImageUrl(e.target.value)} 
                                        className="flex-1 p-2 border border-gray-300 rounded focus:border-emerald-300 outline-none text-sm text-black" 
                                        placeholder="https://suasite.com/foto.jpg" 
                                        onKeyPress={e => {
                                            if (e.key === "Enter" && newImageUrl.trim()) {
                                                setNewsForm(prev => ({ ...prev, imageUrls: [...prev.imageUrls, newImageUrl.trim()] }));
                                                setNewImageUrl("");
                                                e.preventDefault();
                                            }
                                        }}
                                    />
                                    <button 
                                        onClick={() => {
                                            if (newImageUrl.trim()) {
                                                setNewsForm(prev => ({ ...prev, imageUrls: [...prev.imageUrls, newImageUrl.trim()] }));
                                                setNewImageUrl("");
                                            }
                                        }}
                                        className="px-3 py-2 bg-[#059669] text-white rounded font-bold hover:bg-[#047857] transition-colors flex items-center gap-1"
                                    >
                                        <Plus className="w-4 h-4" /> Adicionar
                                    </button>
                                </div>
                                {newsForm.imageUrls.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                                        {newsForm.imageUrls.map((url, i) => (
                                            <div key={i} className="relative group rounded-lg overflow-hidden border border-gray-300 aspect-video">
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
                        <div className="p-4 border-t bg-white flex justify-end gap-2">
                            <button onClick={() => setIsNewsModalOpen(false)} className="px-4 py-2 text-black hover:text-black">Cancelar</button>
                            <button onClick={handleSaveNews} className="px-6 py-2 bg-[#059669] hover:bg-[#059669] text-black font-bold rounded">Salvar Notícia</button>
                        </div>
                    </div>
                </div>
            )}
            {/* READING MODAL */}
            {readingNewsItem && (
                <div className="fixed inset-0 bg-emerald-950/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl animate-in zoom-in-95 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 flex justify-between items-center border-b border-gray-100 bg-emerald-50 text-emerald-900 border-l-4 border-l-emerald-600">
                            <span className="text-sm font-bold tracking-widest uppercase flex items-center gap-1"><Newspaper className="w-4 h-4"/> Matéria Completa</span>
                            <button onClick={() => setReadingNewsItem(null)} className="hover:bg-black/10 p-2 rounded-full transition-colors"><X className="w-5 h-5 text-black" /></button>
                        </div>
                        <div className="overflow-y-auto w-full custom-scrollbar">
                            <div className="p-6 md:p-10">
                                <h1 className="text-3xl md:text-5xl font-black text-black leading-tight tracking-tight mb-4">{readingNewsItem.headline}</h1>
                                <div className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-8 flex items-center gap-2">
                                    Publicado em {new Date(readingNewsItem.timestamp).toLocaleDateString([], { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </div>

                                <div className="prose prose-lg prose-emerald text-black max-w-none mb-10 whitespace-pre-wrap leading-relaxed">
                                    {readingNewsItem.body}
                                </div>

                                {readingNewsItem.imageUrls && readingNewsItem.imageUrls.length > 0 && (
                                    <div className="mt-8">
                                        <h3 className="text-lg font-bold text-black border-l-4 border-emerald-500 pl-3 uppercase tracking-wider mb-6">Galeria de Imagens</h3>
                                        <div className="flex flex-col gap-8">
                                            {readingNewsItem.imageUrls.map((url, i) => (
                                                <div key={i} className="rounded-xl overflow-hidden bg-gray-100/50 shadow-inner border border-gray-200">
                                                    <img src={url} alt={`News pic ${i}`} className="w-full h-auto max-h-[70vh] object-contain shadow-sm" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}